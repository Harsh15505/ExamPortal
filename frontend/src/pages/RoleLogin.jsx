import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const HOME_BY_ROLE = {
  student: '/',
  teacher: '/teacher',
  admin: '/admin',
}

const roleConfig = {
  student: { icon: '🎓', color: '#22c55e', label: 'Student Portal' },
  teacher: { icon: '👨‍🏫', color: '#38bdf8', label: 'Teacher Portal' },
  admin:   { icon: '⚙️',  color: '#f59e0b', label: 'Admin Portal' },
}

const demoByRole = {
  student: { username: 'demo_student', password: 'Student@123', label: 'Student Demo' },
  teacher: { username: 'demo_teacher', password: 'Teacher@123', label: 'Teacher Demo' },
  admin:   { username: 'demo_admin',   password: 'Admin@123',   label: 'Admin Demo' },
}

export default function RoleLogin({ expectedRole, backTo = '/login' }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const cfg = roleConfig[expectedRole] || roleConfig.student
  const demo = demoByRole[expectedRole]

  const performLogin = async (u, p) => {
    const profile = await login(u, p)
    if (!profile || profile.role !== expectedRole) {
      logout()
      throw new Error(`This page is for ${expectedRole} login only. Please use the correct portal.`)
    }
    navigate(HOME_BY_ROLE[expectedRole] || '/')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await performLogin(username, password)
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    if (!demo) return
    setError('')
    setLoading(true)
    setUsername(demo.username)
    setPassword(demo.password)
    try {
      await performLogin(demo.username, demo.password)
    } catch (err) {
      setError(err.message || 'Demo login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card" style={{ maxWidth: '420px' }}>
        {/* Logo / Icon */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px', height: '54px', borderRadius: '14px',
            background: `linear-gradient(135deg, ${cfg.color}40, ${cfg.color}20)`,
            border: `1px solid ${cfg.color}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', margin: '0 auto 16px',
          }}>
            {cfg.icon}
          </div>
          <h2 style={{ fontWeight: 800, marginBottom: '6px' }}>{cfg.label}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Sign in to your account to continue
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 0, lineHeight: 1,
                }}
              >
                {showPassword
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 btn-lg"
            disabled={loading}
            style={{ marginBottom: '16px' }}
          >
            {loading
              ? <><span className="spinner-border spinner-border-sm" style={{ width: '14px', height: '14px', marginRight: '8px' }} />Signing in...</>
              : '→ Sign In'
            }
          </button>
        </form>

        {/* Demo credentials */}
        {demo && (
          <div style={{
            padding: '14px 16px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: '10px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Demo Credentials
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 14px',
                background: `${cfg.color}10`, border: `1px solid ${cfg.color}30`,
                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${cfg.color}1e`}
              onMouseLeave={e => e.currentTarget.style.background = `${cfg.color}10`}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: cfg.color, marginBottom: '2px' }}>
                  {demo.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {demo.username} / {demo.password}
                </div>
              </div>
              <svg width="14" height="14" style={{ color: cfg.color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        )}

        {/* Footer links */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href={backTo} style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </a>
          {expectedRole === 'student' && (
            <a href="/register" style={{ fontSize: '0.82rem', color: 'var(--primary-light)' }}>
              Create account →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
