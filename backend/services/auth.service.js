import crypto from 'crypto'

import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

import { env } from '../configs/env.js'
import { AdminProfile } from '../models/AdminProfile.js'
import { AuthSession } from '../models/AuthSession.js'
import { Department } from '../models/Department.js'
import { StudentProfile } from '../models/StudentProfile.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'

const userProjection = {
  _id: 1,
  name: 1,
  email: 1,
  role: 1,
  departmentId: 1,
  department: 1,
  isActive: 1,
  createdAt: 1,
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

const resolveDurationMs = (value) => {
  if (typeof value === 'number') return value

  const normalized = String(value || '').trim()
  const match = normalized.match(/^(\d+)(ms|s|m|h|d)$/i)
  if (!match) {
    throw new Error(`Invalid duration value: ${value}`)
  }

  const amount = Number(match[1])
  const unit = match[2].toLowerCase()
  const multiplierByUnit = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  return amount * multiplierByUnit[unit]
}

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  departmentId: user.departmentId,
  department: user.department,
  isActive: user.isActive,
  createdAt: user.createdAt,
})

const createSessionTokens = async (user) => {
  const sessionId = new mongoose.Types.ObjectId().toString()
  const accessToken = signAccessToken({ userId: user._id, role: user.role })
  const refreshToken = signRefreshToken({ userId: user._id, sessionId })
  const expiresAt = new Date(Date.now() + resolveDurationMs(env.JWT_REFRESH_EXPIRES_IN))

  await AuthSession.create({
    _id: sessionId,
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  })

  return {
    token: accessToken,
    accessToken,
    refreshToken,
    user: buildUserPayload(user),
  }
}

const getResolvedDepartment = async ({ departmentId, department }) => {
  if (departmentId) {
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      throw new ApiError(400, 'Invalid department id')
    }

    const resolvedDepartment = await Department.findById(departmentId).select('_id name code').lean()
    if (!resolvedDepartment) {
      throw new ApiError(404, 'Department not found')
    }

    return resolvedDepartment
  }

  if (!department) {
    return null
  }

  const normalizedDepartment = department.trim()
  if (!normalizedDepartment) {
    return null
  }

  const resolvedDepartment = await Department.findOne({
    $or: [{ name: normalizedDepartment }, { code: normalizedDepartment.toUpperCase() }],
  })
    .select('_id name code')
    .lean()

  if (!resolvedDepartment) {
    throw new ApiError(400, 'Selected department is invalid or unavailable')
  }

  return resolvedDepartment
}

export const registerStudent = async ({
  name,
  email,
  password,
  department,
  departmentId,
  universityId,
  batch,
  program,
  semester,
}) => {
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new ApiError(409, 'Email is already registered')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const resolvedDepartment = await getResolvedDepartment({ departmentId, department })
  const createdUser = await User.create({
    name,
    email,
    passwordHash,
    role: 'STUDENT',
    departmentId: resolvedDepartment?._id || null,
    department: resolvedDepartment?.name || department?.trim() || null,
  })

  await StudentProfile.create({
    userId: createdUser._id,
    department: resolvedDepartment?.name || department?.trim() || null,
    universityId: universityId || undefined,
    batch: batch || null,
    program: program || null,
    semester: semester || null,
    isVerified: false,
  })

  const user = await User.findById(createdUser._id, userProjection)
  return createSessionTokens(user)
}

export const registerAdmin = async ({
  name,
  email,
  password,
  department,
  departmentId,
  designation,
  adminSignupKey,
}) => {
  if (!env.ADMIN_SIGNUP_KEY) {
    throw new ApiError(500, 'Admin signup is disabled. Missing ADMIN_SIGNUP_KEY configuration')
  }

  if (adminSignupKey !== env.ADMIN_SIGNUP_KEY) {
    throw new ApiError(401, 'Invalid admin signup key')
  }

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new ApiError(409, 'Email is already registered')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const resolvedDepartment = await getResolvedDepartment({ departmentId, department })
  const createdUser = await User.create({
    name,
    email,
    passwordHash,
    role: 'ADMIN',
    departmentId: resolvedDepartment?._id || null,
    department: resolvedDepartment?.name || department?.trim() || null,
  })

  const generatedEmployeeId = `ADM-${Date.now().toString(36).toUpperCase()}-${String(createdUser._id).slice(-6).toUpperCase()}`

  await AdminProfile.create({
    userId: createdUser._id,
    employeeId: generatedEmployeeId,
    department: resolvedDepartment?.name || department?.trim() || 'Support',
    designation,
  })

  const user = await User.findById(createdUser._id, userProjection)
  return createSessionTokens(user)
}

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email })
  if (!user) {
    throw new ApiError(401, 'Invalid email or password')
  }

  if (!user.isActive) {
    throw new ApiError(403, 'User account is disabled')
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password')
  }

  return createSessionTokens(user)
}

export const loginAdmin = async ({ email, password }) => {
  const authResponse = await loginUser({ email, password })

  if (!['ADMIN', 'DEPARTMENT_ADMIN', 'HOD', 'SUPER_ADMIN'].includes(authResponse.user.role)) {
    throw new ApiError(403, 'This account is not authorized for admin login')
  }

  return authResponse
}

export const getRegistrationBootstrap = async () => {
  const departments = await Department.find({})
    .sort({ name: 1 })
    .select('_id name code')
    .lean()

  return { departments }
}

export const refreshSession = async (refreshToken) => {
  let decoded

  try {
    decoded = verifyRefreshToken(refreshToken)
  } catch (_error) {
    throw new ApiError(401, 'Invalid or expired refresh token')
  }

  const session = await AuthSession.findById(decoded.sessionId)
  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(401, 'Session is no longer valid')
  }

  if (session.tokenHash !== hashToken(refreshToken)) {
    throw new ApiError(401, 'Refresh token does not match active session')
  }

  const user = await User.findById(decoded.userId, userProjection)
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User account is inactive or unavailable')
  }

  session.revokedAt = new Date()
  await session.save()

  return createSessionTokens(user)
}

export const logoutSession = async (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken)
    await AuthSession.findByIdAndUpdate(decoded.sessionId, { revokedAt: new Date(), lastUsedAt: new Date() })
  } catch (_error) {
    // Logout should remain idempotent from the client perspective.
  }

  return { loggedOut: true }
}
