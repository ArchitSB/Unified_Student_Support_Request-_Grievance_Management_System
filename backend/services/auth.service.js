import bcrypt from 'bcryptjs'

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

export const registerStudent = async ({ name, email, password }) => {
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