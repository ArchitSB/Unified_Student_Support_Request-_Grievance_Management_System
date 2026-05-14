import { EscalationHistory } from '../models/EscalationHistory.js'
import { Request } from '../models/Request.js'
import { SLAConfig } from '../models/SLAConfig.js'
import { ApiError } from '../utils/ApiError.js'
import { createNotification, createNotifications } from './notification.service.js'
import { logAuditEvent } from './audit.service.js'
import { emitToRequestRoom } from './realtime.service.js'
import { resolveNextStepAssignment, resolveWorkflowOrFallback } from './workflow.service.js'

const defaultSlaMatrix = {
  URGENT: { targetHours: 12, warningHours: 4, escalationHours: 12 },
  HIGH: { targetHours: 24, warningHours: 8, escalationHours: 24 },
  MEDIUM: { targetHours: 48, warningHours: 12, escalationHours: 24 },
  LOW: { targetHours: 72, warningHours: 18, escalationHours: 36 },
}

const hoursToMs = (hours) => hours * 60 * 60 * 1000

export const resolveSlaConfig = async ({ requestType, priority, departmentId }) => {
  const specificConfig = await SLAConfig.findOne({
    requestType,
    priority,
    departmentId: departmentId || null,
    isActive: true,
  }).lean()

  if (specificConfig) {
    return specificConfig
  }

  const globalConfig = await SLAConfig.findOne({
    requestType,
    priority,
    departmentId: null,
    isActive: true,
  }).lean()

  if (globalConfig) {
    return globalConfig
  }

  return {
    requestType,
    priority,
    departmentId: departmentId || null,
    ...defaultSlaMatrix[priority || 'MEDIUM'],
  }
}

export const computeSlaSnapshot = (request) => {
  const now = Date.now()
  const dueAt = request.slaDueAt ? new Date(request.slaDueAt).getTime() : null
  const nextEscalationAt = request.nextEscalationAt ? new Date(request.nextEscalationAt).getTime() : null
  const remainingMs = dueAt ? dueAt - now : null
  const nextEscalationRemainingMs = nextEscalationAt ? nextEscalationAt - now : null
  const targetHours = request.slaTargetHours || null
  const warningThresholdMs = targetHours ? hoursToMs(Math.max(2, Math.floor(targetHours / 3))) : null

  let level = 'normal'
  if (remainingMs !== null) {
    if (remainingMs <= 0) level = 'critical'
    else if (warningThresholdMs !== null && remainingMs <= warningThresholdMs) level = 'warning'
  }

  return {
    targetHours,
    dueAt: request.slaDueAt,
    nextEscalationAt: request.nextEscalationAt,
    remainingMs,
    nextEscalationRemainingMs,
    isBreached: remainingMs !== null ? remainingMs <= 0 : false,
    level,
  }
}

export const ensureOperationalFields = async (request) => {
  let hasChanges = false

  if (!request.ticketId) {
    const year = new Date(request.createdAt || Date.now()).getFullYear()
    const count = await Request.countDocuments({
      ticketId: { $regex: `^UNI-${year}-` },
      _id: { $ne: request._id },
    })
    request.ticketId = `UNI-${year}-${String(count + 1001).padStart(4, '0')}`
    hasChanges = true
  }

  if (!request.category) {
    request.category = request.type
    hasChanges = true
  }

  if (!request.slaDueAt || !request.slaTargetHours || !request.nextEscalationAt) {
    const config = await resolveSlaConfig({
      requestType: request.type,
      priority: request.priority,
      departmentId: request.departmentId,
    })
    const startedAt = request.slaStartedAt || request.createdAt || new Date()
    request.slaStartedAt = startedAt
    request.slaTargetHours = config.targetHours
    request.slaDueAt = new Date(new Date(startedAt).getTime() + hoursToMs(config.targetHours))
    request.nextEscalationAt = new Date(new Date(startedAt).getTime() + hoursToMs(config.escalationHours))
    hasChanges = true
  }

  if (hasChanges) {
    await request.save()
  }

  return request
}

export const maybeAutoEscalateRequest = async ({ request, actor = null }) => {
  if (!request || !request.nextEscalationAt) return request
  if (!['PENDING', 'IN_PROGRESS', 'REOPENED', 'ESCALATED'].includes(request.status)) return request
  if (new Date(request.nextEscalationAt).getTime() > Date.now()) return request

  const workflow = request.workflowId
    ? await resolveWorkflowOrFallback({ requestType: request.type, departmentId: request.departmentId })
    : await resolveWorkflowOrFallback({ requestType: request.type, departmentId: request.departmentId })

  const currentStep = workflow.steps.find((step) => step.order === request.currentStep)
  const nextStepOrder = currentStep ? currentStep.order + 1 : request.currentStep + 1
  const nextAssignment = await resolveNextStepAssignment({
    workflow,
    nextStepOrder,
    departmentId: request.departmentId,
  }).catch(() => null)

  if (!nextAssignment) {
    return request
  }

  const previousAssigneeId = request.assignedTo
  const previousStep = request.currentStep
  const previousStatus = request.status
  const now = new Date()
  const nextEscalationAt = new Date(now.getTime() + hoursToMs(Math.max(6, Math.floor((request.slaTargetHours || 24) / 2))))

  request.currentStep = nextStepOrder
  request.assignedTo = nextAssignment.assignedTo
  request.status = 'ESCALATED'
  request.escalationCount = (request.escalationCount || 0) + 1
  request.lastEscalatedAt = now
  request.nextEscalationAt = nextEscalationAt
  request.approvalHistory.push({
    actorId: actor?._id || nextAssignment.assignedTo,
    role: nextAssignment.role,
    action: 'ESCALATED',
    remark: 'Auto-escalated due to SLA threshold breach.',
    timestamp: now,
  })
  await request.save()

  const escalation = await EscalationHistory.create({
    requestId: request._id,
    escalatedById: actor?._id || null,
    fromAssigneeId: previousAssigneeId || null,
    toAssigneeId: nextAssignment.assignedTo,
    fromStage: previousStep,
    toStage: nextStepOrder,
    reason: 'Auto-escalated because the current stage exceeded its SLA threshold.',
    mode: 'AUTO',
  })

  await Promise.all([
    logAuditEvent({
      actorId: actor?._id || nextAssignment.assignedTo,
      targetType: 'REQUEST',
      targetId: request._id,
      action: 'REQUEST_AUTO_ESCALATED',
      summary: `Ticket ${request.ticketId || request._id} auto-escalated to step ${nextStepOrder}.`,
      metadata: { previousAssigneeId, nextAssigneeId: nextAssignment.assignedTo, previousStatus },
    }),
    createNotifications([
      previousAssigneeId
        ? {
            userId: previousAssigneeId,
            requestId: request._id,
            type: 'REQUEST_ESCALATED',
            title: 'Ticket escalated',
            message: `${request.ticketId || 'Request'} escalated beyond your current stage.`,
            metadata: { status: request.status },
          }
        : null,
      {
        userId: nextAssignment.assignedTo,
        requestId: request._id,
        type: 'REQUEST_ESCALATED',
        title: 'Escalated ticket assigned',
        message: `${request.ticketId || 'Request'} has been escalated to your queue.`,
        metadata: { status: request.status, currentStep: nextStepOrder },
      },
      {
        userId: request.studentId,
        requestId: request._id,
        type: 'SLA_BREACH',
        title: 'Your ticket was escalated',
        message: `${request.ticketId || 'Request'} exceeded the response threshold and has been escalated.`,
        metadata: { status: request.status },
      },
    ]),
  ])

  emitToRequestRoom(request._id, 'request:updated', {
    requestId: String(request._id),
    status: request.status,
    currentStep: request.currentStep,
    escalationId: String(escalation._id),
  })

  return request
}

export const markResolvedOnRequest = (request) => {
  request.resolvedAt = new Date()
  request.nextEscalationAt = null
}
