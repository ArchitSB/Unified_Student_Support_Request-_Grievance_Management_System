import bcrypt from 'bcryptjs'

import { env } from '../configs/env.js'
import { AdminProfile } from '../models/AdminProfile.js'
import { StudentProfile } from '../models/StudentProfile.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { signToken } from '../utils/jwt.js'

const userProjection = {
  _id: 1,
  name: 1,
  email: 1,
  role: 1,
  department: 1,
  isActive: 1,
  createdAt: 1,
}

const makeAuthResponse = (user) => {
  const token = signToken({ userId: user._id, role: user.role })

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  }
}

export const registerStudent = async ({
  name,
  email,
  password,
  department,
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
  const createdUser = await User.create({
    name,
    email,
    passwordHash,
    role: 'STUDENT',
  })

  await StudentProfile.create({
    userId: createdUser._id,
    department: department || null,
    universityId: universityId || undefined,
    batch: batch || null,
    program: program || null,
    semester: semester || null,
    isVerified: false,
  })

  const user = await User.findById(createdUser._id, userProjection)
  return makeAuthResponse(user)
}

export const registerAdmin = async ({ name, email, password, department, adminSignupKey }) => {
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
  const createdUser = await User.create({
    name,
    email,
    passwordHash,
    role: 'ADMIN',
    department,
  })

  await AdminProfile.create({
    userId: createdUser._id,
    department,
  })

  const user = await User.findById(createdUser._id, userProjection)
  return makeAuthResponse(user)
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

  return makeAuthResponse(user)
}

export const loginAdmin = async ({ email, password }) => {
  const authResponse = await loginUser({ email, password })

  if (authResponse.user.role !== 'ADMIN') {
    throw new ApiError(403, 'This account is not authorized for admin login')
  }

  return authResponse
}