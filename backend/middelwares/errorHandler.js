import { ApiError } from '../utils/ApiError.js'

export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`))
}

export const errorHandler = (err, _req, res, _next) => {
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate value violates unique constraint',
      errors: err.keyValue ? [{ field: Object.keys(err.keyValue)[0], value: Object.values(err.keyValue)[0] }] : [],
    })
  }

  const statusCode = err.statusCode || 500

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    errors: err.errors || [],
  })
}