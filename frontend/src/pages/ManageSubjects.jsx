import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { examAPI } from '../api/exams'

const initialForm = {
  name: '',
  description: ''
}

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState([])
  const [filteredSubjects, setFilteredSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => {
    loadSubjects()
  }, [])

  useEffect(() => {
    const q = search.trim().toLowerCase()
    const list = subjects.filter((s) => !q || s.name?.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q))
    setFilteredSubjects(list)
  }, [subjects, search])

  const loadSubjects = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await examAPI.listSubjects()
      const data = response.data || response
      const list = Array.isArray(data) ? data : data.results || []
      setSubjects(list)
    } catch (err) {
      console.error('Error loading subjects:', err)
      setError('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData(initialForm)
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (!formData.name) {
      alert('Subject name is required')
      return
    }

    setSubmitting(true)
    try {
      if (editingId) {
        await examAPI.updateSubject(editingId, formData)
        alert('Subject updated')
      } else {
        await examAPI.createSubject(formData)
        alert('Subject created')
      }
      resetForm()
      setShowForm(false)
      loadSubjects()
    } catch (err) {
      console.error('Error saving subject:', err)
      const data = err.response?.data
      const msg = data?.detail || (typeof data === 'object' ? Object.values(data)[0]?.[0] : null) || 'Failed to save subject'
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (subject) => {
    setEditingId(subject.id)
    setFormData({
      name: subject.name || '',
      description: subject.description || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (subjectId) => {
    if (!window.confirm('Delete this subject?')) return
    try {
      await examAPI.deleteSubject(subjectId)
      alert('Subject deleted')
      loadSubjects()
    } catch (err) {
      console.error('Error deleting subject:', err)
      alert('Failed to delete subject')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading subjects...</span>
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
            <h2>Subject Management</h2>
            <p className="text-muted">Create and manage subjects</p>
          </div>
          <div className="col-md-4 text-end">
            <button
              className="btn btn-primary"
              onClick={() => {
                if (showForm) resetForm()
                setShowForm((prev) => !prev)
              }}
            >
              {showForm ? 'Close' : '+ Add Subject'}
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
              <h5 className="mb-0 fw-bold">{editingId ? '📝 Edit Subject' : '📚 Create New Subject'}</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Name *</label>
                  <input className="form-control" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="mb-4">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" name="description" value={formData.description} onChange={handleInputChange} rows="3" />
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary px-4" disabled={submitting}>
                    {submitting ? 'Saving...' : editingId ? 'Update Subject' : 'Create Subject'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={() => {
                      resetForm()
                      setShowForm(false)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">All Subjects ({filteredSubjects.length})</h5>
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: '320px' }}
                placeholder="Search by name or description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="table-responsive">
              <table className="table table-hover">
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Subject Name</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Description</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                <tbody>
                  {filteredSubjects.map((s) => (
                    <tr key={s.id} className="align-middle" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>{s.name}</div>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {s.description || <em className="text-muted">No description provided</em>}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(s)} style={{ padding: '4px 12px' }}>
                            Edit
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.id)} style={{ padding: '4px 8px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
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
