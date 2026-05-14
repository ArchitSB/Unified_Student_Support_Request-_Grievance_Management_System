import jwt from 'jsonwebtoken'

import { env } from '../configs/env.js'

export const signAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })
}

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  })
}

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET)
}

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET)
}

export const signToken = signAccessToken
export const verifyToken = verifyAccessToken
