import {
  getRegistrationBootstrap,
  loginAdmin,
  loginUser,
  logoutSession,
  refreshSession,
  registerAdmin,
  registerStudent,
} from '../services/auth.service.js'
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

export const registerAdminHandler = async (req, res) => {
  const payload = req.validated.body
  const data = await registerAdmin(payload)

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Admin registered successfully',
    data,
  })
}

export const loginAdminHandler = async (req, res) => {
  const payload = req.validated.body
  const data = await loginAdmin(payload)

  return sendSuccess(res, {
    message: 'Admin login successful',
    data,
  })
}

export const getMe = async (req, res) => {
  return sendSuccess(res, {
    message: 'Current user profile',
    data: { user: req.user },
  })
}

export const getRegistrationBootstrapHandler = async (_req, res) => {
  const data = await getRegistrationBootstrap()

  return sendSuccess(res, {
    message: 'Fetched registration bootstrap data',
    data,
  })
}

export const refreshSessionHandler = async (req, res) => {
  const data = await refreshSession(req.validated.body.refreshToken)

  return sendSuccess(res, {
    message: 'Session refreshed successfully',
    data,
  })
}

export const logoutHandler = async (req, res) => {
  const data = await logoutSession(req.validated.body.refreshToken)

  return sendSuccess(res, {
    message: 'Logged out successfully',
    data,
  })
}
