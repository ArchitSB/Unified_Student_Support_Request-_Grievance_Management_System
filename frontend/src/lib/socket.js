import { io } from 'socket.io-client'
import { API_ORIGIN } from './api'

export const createAppSocket = (token) => {
  if (!token) return null

  return io(API_ORIGIN, {
    transports: ['websocket'],
    auth: {
      token,
    },
  })
}
