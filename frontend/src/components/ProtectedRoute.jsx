import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const normalizeRole = (role) => String(role || '').trim().toUpperCase()

function ProtectedRoute({ allowedRoles = [], children }) {
  const { isAuthenticated, user } = useAuth()
  const normalizedRole = normalizeRole(user?.role)
  const allowedNormalizedRoles = allowedRoles.map((role) => normalizeRole(role))

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedNormalizedRoles.length > 0 && !allowedNormalizedRoles.includes(normalizedRole)) {
    return <Navigate to={normalizedRole === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} replace />
  }

  return children
}

export default ProtectedRoute
