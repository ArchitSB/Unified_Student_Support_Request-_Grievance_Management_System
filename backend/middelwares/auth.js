import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { verifyToken } from '../utils/jwt.js'

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

  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden: insufficient permission'))
  }

  return next()
}