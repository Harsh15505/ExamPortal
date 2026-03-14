import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navigation from './common/Navigation'

export default function Layout({ children }) {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!isAuthenticated) {
    return <>{children || <Outlet />}</>
  }

  return (
    <>
      <Navigation user={user} onLogout={handleLogout} />
      <div className="page-content">
        {children || <Outlet />}
      </div>
    </>
  )
}
