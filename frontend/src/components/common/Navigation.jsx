import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

export default function Navigation({ user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const isStudent = user?.role === 'student'
  const isStaff = user?.role === 'admin' || user?.role === 'teacher'
  const isAdmin = user?.role === 'admin'

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const StudentLinks = () => (
    <>
      <li className="nav-item">
        <a className={`nav-link ${isActive('/') && !isActive('/results') ? 'active' : ''}`} href="/">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Available Exams
        </a>
      </li>
      <li className="nav-item">
        <a className={`nav-link ${isActive('/results') ? 'active' : ''}`} href="/results">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          My Results
        </a>
      </li>
    </>
  )

  const StaffLinks = () => (
    <>
      <li className="nav-item">
        <a className={`nav-link ${isActive('/teacher/exams') ? 'active' : ''}`} href="/teacher/exams">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Exams
        </a>
      </li>
      <li className="nav-item">
        <a className={`nav-link ${isActive('/teacher/questions') ? 'active' : ''}`} href="/teacher/questions">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Questions
        </a>
      </li>
      <li className="nav-item">
        <a className={`nav-link ${isActive('/teacher/results') ? 'active' : ''}`} href="/teacher/results">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Results
        </a>
      </li>
      <li className="nav-item">
        <a className={`nav-link ${isActive('/teacher/subjects') ? 'active' : ''}`} href="/teacher/subjects">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          Subjects
        </a>
      </li>
      {isAdmin && (
        <>
          <li className="nav-item ms-lg-3" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '-5px', textTransform: 'uppercase' }}>Admin</span>
            <a className={`nav-link ${isActive('/admin/analytics') ? 'active' : ''}`} href="/admin/analytics">
              Analytics
            </a>
          </li>
          <li className="nav-item">
            <a className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`} href="/admin/users">
              Users
            </a>
          </li>
        </>
      )}
    </>
  )

  const roleColor = {
    student: '#22c55e',
    teacher: '#38bdf8',
    admin: '#f59e0b',
  }

  const portalName = isStudent ? 'STUDENT PORTAL' : 'STAFF PORTAL'
  const portalColor = isStudent ? 'var(--success)' : 'var(--primary-light)'

  return (
    <nav className="navbar navbar-expand-lg sticky-top" style={{ borderBottom: `2px solid ${portalColor}40` }}>
      <div className="container-fluid px-4">
        {/* Brand & Portal Indicator */}
        <div className="d-flex align-items-center gap-3">
          <button
            className="navbar-brand"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onClick={() => {
              if (user?.role === 'student') navigate('/')
              else if (user?.role === 'teacher') navigate('/teacher/exams')
              else if (user?.role === 'admin') navigate('/admin/analytics')
              else navigate('/login')
            }}
          >
            <div className="brand-icon">📝</div>
            ExamPortal
          </button>
          
          <div style={{
            fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px',
            borderRadius: '4px', background: `${portalColor}20`,
            color: portalColor, border: `1px solid ${portalColor}40`,
            letterSpacing: '0.05em'
          }}>
            {portalName}
          </div>
        </div>

        {/* Mobile toggler */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px' }}
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto gap-1">
            {isStudent && <StudentLinks />}
            {isStaff && <StaffLinks />}
          </ul>

          {/* Theme Toggle + User badge + logout */}
          <div className="d-flex align-items-center gap-3">
            <button 
              onClick={toggleTheme}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer',
                width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-primary)', transition: 'all 0.2s ease'
              }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '100px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${roleColor[user?.role] || '#4f6ef7'}, rgba(255,255,255,0.3))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: '#fff',
              }}>
                {user?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                {user?.username}
              </span>
              <span style={{
                fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px',
                borderRadius: '100px', background: `${roleColor[user?.role]}20`,
                color: roleColor[user?.role], border: `1px solid ${roleColor[user?.role]}40`,
                textTransform: 'capitalize',
              }}>
                {user?.role}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="nav-link text-danger logout-btn"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
