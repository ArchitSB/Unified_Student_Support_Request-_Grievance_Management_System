let ioInstance = null

export const registerIo = (io) => {
  ioInstance = io
}

export const getIo = () => ioInstance

export const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return
  ioInstance.to(`user:${String(userId)}`).emit(event, payload)
}

export const emitToRequestRoom = (requestId, event, payload) => {
  if (!ioInstance || !requestId) return
  ioInstance.to(`request:${String(requestId)}`).emit(event, payload)
}
