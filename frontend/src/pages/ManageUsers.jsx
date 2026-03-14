import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { examAPI } from '../api/exams'

const initialForm = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'teacher'
}

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    const q = search.trim().toLowerCase()
    const list = users.filter((u) => {
      const byRole = roleFilter === 'all' || u.role === roleFilter
      const bySearch =
        !q ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(q)
      return byRole && bySearch
    })
    setFilteredUsers(list)
  }, [users, search, roleFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await examAPI.listUsers()
      const data = response.data || response
      const list = Array.isArray(data) ? data : data.results || []
      setUsers(list)
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (!formData.username || !formData.email || !formData.password || !formData.role) {
      alert('Please fill required fields')
      return
    }

    setSubmitting(true)
    try {
      if (editingId) {
        const payload = {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          is_active: true
        }
        await examAPI.updateUser(editingId, payload)
        setError({ type: 'success', message: 'User updated successfully' })
      } else {
        await examAPI.createUser(formData)
        setError({ type: 'success', message: 'User created successfully' })
      }
      setFormData(initialForm)
      setEditingId(null)
      setShowForm(false)
      loadUsers()
    } catch (err) {
      console.error('Error creating user:', err)
      const data = err.response?.data
      const msg = data?.detail || (typeof data === 'object' ? Object.values(data)[0]?.[0] : null) || 'Failed to save user'
      setError({ type: 'danger', message: msg })
    } finally {
      setSubmitting(false)
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleEdit = (user) => {
    setEditingId(user.id)
    setFormData({
      username: user.username || '',
      email: user.email || '',
      password: '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role || 'student'
    })
    setShowForm(true)
  }

  const handleDelete = async (user) => {
    if (user.role === 'admin') {
      alert('Admin users cannot be deleted from this panel.')
      return
    }
    if (!window.confirm(`Delete user ${user.username}?`)) return

    try {
      await examAPI.deleteUser(user.id)
      alert('User deleted successfully')
      loadUsers()
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Failed to delete user')
    }
  }

  const handleToggleActive = async (user) => {
    try {
      await examAPI.updateUser(user.id, {
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: !user.is_active
      })
      loadUsers()
    } catch (err) {
      console.error('Error toggling status:', err)
      alert('Failed to update user status')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading users...</span>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mt-5">
        <div className="row mb-4">
          <div className="col-md-8">
            <h2>User Management</h2>
            <p className="text-muted">Admin can create teachers and students</p>
          </div>
          <div className="col-md-4 text-end">
            <button
              className="btn btn-primary"
              onClick={() => setShowForm((prev) => !prev)}
            >
              {showForm ? 'Close' : '+ Create User'}
            </button>
          </div>
        </div>

        {error && (
          <div className={`alert alert-${error.type || 'danger'} d-flex align-items-center justify-content-between`} style={{ marginBottom: '25px', borderRadius: '12px' }}>
            <span>{typeof error === 'string' ? error : error.message}</span>
            <button className="btn-close" style={{ filter: 'invert(1)' }} onClick={() => setError('')} />
          </div>
        )}

        {showForm && (
          <div className="card mb-5 border-0 shadow-sm" style={{ background: 'var(--bg-elevated)', borderRadius: '18px', overflow: 'hidden' }}>
            <div className="card-header border-0 py-3" style={{ background: 'var(--primary-glow)', color: 'var(--primary-light)' }}>
              <h5 className="mb-0 fw-bold">{editingId ? '📝 Edit User' : '👤 Create New User'}</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Username *</label>
                    <input className="form-control" name="username" value={formData.username} onChange={handleInputChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email *</label>
                    <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">First Name</label>
                    <input className="form-control" name="first_name" value={formData.first_name} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Last Name</label>
                    <input className="form-control" name="last_name" value={formData.last_name} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Password {editingId ? '(leave blank to keep unchanged)' : '*'}</label>
                    <input type="password" className="form-control" name="password" value={formData.password} onChange={handleInputChange} required={!editingId} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Role *</label>
                    <select className="form-select" name="role" value={formData.role} onChange={handleInputChange}>
                      <option value="teacher">Teacher</option>
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <button className="btn btn-success" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Update User' : 'Create User'}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">All Users ({filteredUsers.length})</h5>
              <div className="d-flex gap-2" style={{ minWidth: '420px' }}>
                <input
                  className="form-control form-control-sm"
                  placeholder="Search username/email/name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="form-select form-select-sm"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{ width: '150px' }}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover">
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>User</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Email</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Role</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="align-middle" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.username}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{[u.first_name, u.last_name].filter(Boolean).join(' ') || u.username}</div>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{u.email}</td>
                      <td style={{ padding: '16px' }}>
                        <span className="badge" style={{ 
                          background: u.role === 'admin' ? 'var(--danger-bg)' : u.role === 'teacher' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
                          color: u.role === 'admin' ? 'var(--danger)' : u.role === 'teacher' ? 'var(--primary-light)' : 'var(--text-secondary)',
                          padding: '6px 10px', fontWeight: 600, textTransform: 'capitalize', border: '1px solid transparent'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={u.is_active} 
                            onChange={() => handleToggleActive(u)}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(u)} style={{ padding: '4px 12px' }}>
                            Edit
                          </button>
                          {u.role !== 'admin' && (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u)} style={{ padding: '4px 8px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
