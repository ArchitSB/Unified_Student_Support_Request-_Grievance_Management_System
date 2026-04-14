import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { verifyToken } from '../utils/jwt.js'

const normalizeRole = (role) => String(role || '').trim().toUpperCase()

const roleAliases = {
  ADMIN: ['ADMIN', 'DEPARTMENT_ADMIN'],
}

const roleMatches = (userRole, requiredRole) => {
  const normalizedUserRole = normalizeRole(userRole)
  const normalizedRequiredRole = normalizeRole(requiredRole)

  if (normalizedUserRole === normalizedRequiredRole) {
    return true
  }

  const aliasedRoles = roleAliases[normalizedUserRole] || [normalizedUserRole]
  return aliasedRoles.includes(normalizedRequiredRole)
}

export const requireAuth = async (req, _res, next) => {
  const authHeader = req.headers.authorization || ''

  if (!authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Unauthorized: missing bearer token'))
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = verifyToken(token)
    const user = await User.findById(decoded.userId).select('-passwordHash')

    if (!user || !user.isActive) {
      return next(new ApiError(401, 'Unauthorized: user is inactive or not found'))
    }

    req.user = user
    return next()
  } catch (_error) {
    return next(new ApiError(401, 'Unauthorized: invalid or expired token'))
  }
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Unauthorized'))
  }

  if (!roles.some((role) => roleMatches(req.user.role, role))) {
    return next(new ApiError(403, 'Forbidden: insufficient permission'))
  }

  return next()
}