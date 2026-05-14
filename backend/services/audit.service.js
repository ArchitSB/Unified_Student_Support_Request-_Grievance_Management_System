import { AuditLog } from '../models/AuditLog.js'

export const logAuditEvent = async ({ actorId, targetType, targetId = null, action, summary, metadata = {} }) => {
  if (!actorId || !action || !summary) return null

  return AuditLog.create({
    actorId,
    targetType,
    targetId,
    action,
    summary,
    metadata,
  })
}
