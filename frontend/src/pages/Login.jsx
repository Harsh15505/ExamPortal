import { useNavigate } from 'react-router-dom'

const roles = [
  {
    key: 'student',
    path: '/login/student',
    icon: '🎓',
    title: 'Student',
    desc: 'Take exams and view your results',
    color: '#22c55e',
  },
  {
    key: 'teacher',
    path: '/login/teacher',
    icon: '👨‍🏫',
    title: 'Teacher',
    desc: 'Create exams and manage questions',
    color: '#38bdf8',
  },
  {
    key: 'admin',
    path: '/login/admin',
    icon: '⚙️',
    title: 'Admin',
    desc: 'Manage users and system settings',
    color: '#f59e0b',
  },
]

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="auth-bg">
      <div style={{ width: '100%', maxWidth: '480px', animation: 'fadeInUp 0.4s ease both' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(79,110,247,0.35)',
          }}>📝</div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '8px' }}>
            Welcome to <span className="gradient-text">ExamPortal</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Choose your role to continue
          </p>
        </div>

        {/* Role cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {roles.map((role) => (
            <button
              key={role.key}
              onClick={() => navigate(role.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '18px',
                padding: '20px 24px',
                background: 'rgba(17,24,39,0.85)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                width: '100%',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = role.color + '60'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = `0 8px 24px ${role.color}15`
                e.currentTarget.querySelector('.role-icon').style.background = `${role.color}20`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.querySelector('.role-icon').style.background = 'rgba(255,255,255,0.05)'
              }}
            >
              <div className="role-icon" style={{
                width: '48px', height: '48px', flexShrink: 0,
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', transition: 'background 0.2s ease',
              }}>
                {role.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px', fontSize: '0.95rem' }}>
                  {role.title} Login
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {role.desc}
                </div>
              </div>
              <svg style={{ color: 'var(--text-muted)', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          New student?{' '}
          <a href="/register" style={{ color: 'var(--primary-light)', fontWeight: 500 }}>
            Create an account →
          </a>
        </p>
      </div>
    </div>
  )
}
