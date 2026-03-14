import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles = null }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const fallback = user?.role === 'student' ? '/' : user?.role === 'teacher' ? '/teacher' : '/admin'
    return <Navigate to={fallback} />
  }

  return children
}
