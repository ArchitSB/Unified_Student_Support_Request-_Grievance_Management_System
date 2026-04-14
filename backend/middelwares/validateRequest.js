import { ApiError } from '../utils/ApiError.js'

export const validateRequest = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  })

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))

    return next(new ApiError(400, 'Validation failed', errors))
  }

  req.validated = parsed.data
  return next()
}