import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/auth'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    firstName: '', lastName: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pwStrength, setPwStrength] = useState(0)
  const [showPw, setShowPw] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === 'password') {
      let s = 0
      if (value.length >= 6) s++
      if (/[A-Z]/.test(value)) s++
      if (/[0-9]/.test(value)) s++
      if (/[^A-Za-z0-9]/.test(value)) s++
      setPwStrength(s)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.')
    if (formData.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        // role intentionally omitted — backend defaults to student
      })
      await login(formData.username, formData.password)
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const messages = Object.values(data).flat()
        setError(messages.join(' '))
      } else {
        setError(err.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['', '#ef4444', '#f59e0b', '#38bdf8', '#22c55e']

  return (
    <div className="auth-bg">
      <div className="auth-card" style={{ maxWidth: '460px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', margin: '0 auto 14px',
            boxShadow: '0 6px 24px rgba(79,110,247,0.3)',
          }}>🎓</div>
          <h2 style={{ fontWeight: 800, marginBottom: '6px' }}>Create Account</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Join ExamPortal as a Student
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label className="form-label">First Name</label>
              <input type="text" className="form-control" name="firstName"
                value={formData.firstName} onChange={handleChange} placeholder="First" />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input type="text" className="form-control" name="lastName"
                value={formData.lastName} onChange={handleChange} placeholder="Last" />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Username <span style={{ color: 'var(--danger)', marginLeft: '2px' }}>*</span></label>
            <input type="text" className="form-control" name="username"
              value={formData.username} onChange={handleChange}
              placeholder="Choose a username" required />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Email <span style={{ color: 'var(--danger)', marginLeft: '2px' }}>*</span></label>
            <input type="email" className="form-control" name="email"
              value={formData.email} onChange={handleChange}
              placeholder="your@email.com" required />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label className="form-label">Password <span style={{ color: 'var(--danger)', marginLeft: '2px' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} className="form-control" name="password"
                value={formData.password} onChange={handleChange}
                placeholder="Min 6 characters" required style={{ paddingRight: '44px' }}
              />
              <button type="button" onClick={() => setShowPw(p => !p)} style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
              }}>
                {showPw
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8"/><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Password strength */}
          {formData.password && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    height: '3px', flex: 1, borderRadius: '2px',
                    background: i <= pwStrength ? strengthColors[pwStrength] : 'var(--border)',
                    transition: 'background 0.3s ease',
                  }} />
                ))}
              </div>
              <div style={{ fontSize: '0.72rem', color: strengthColors[pwStrength] }}>
                {strengthLabels[pwStrength]}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label className="form-label">Confirm Password <span style={{ color: 'var(--danger)', marginLeft: '2px' }}>*</span></label>
            <input type="password" className="form-control" name="confirmPassword"
              value={formData.confirmPassword} onChange={handleChange}
              placeholder="Repeat password" required />
          </div>

          <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading}>
            {loading
              ? <><span className="spinner-border spinner-border-sm" style={{ width: '14px', height: '14px' }} /> Creating account...</>
              : '→ Create Account'
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: 'var(--primary-light)', fontWeight: 500 }}>Sign in</a>
        </p>
      </div>
    </div>
  )
}
