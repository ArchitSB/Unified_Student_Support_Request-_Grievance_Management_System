import { loginUser, registerStudent } from '../services/auth.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const register = async (req, res) => {
  const payload = req.validated.body
  const data = await registerStudent(payload)

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Student registered successfully',
    data,
  })
}

export const login = async (req, res) => {
  const payload = req.validated.body
  const data = await loginUser(payload)

  return sendSuccess(res, {
    message: 'Login successful',
    data,
  })
}

export const getMe = async (req, res) => {
  return sendSuccess(res, {
    message: 'Current user profile',
    data: { user: req.user },
  })
}