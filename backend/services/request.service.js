import mongoose from 'mongoose'

import { Request } from '../models/Request.js'
import { RequestUpdate } from '../models/RequestUpdate.js'
import { WorkflowConfig } from '../models/WorkflowConfig.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { applyRoleScopeFilter, assertRequestAccess } from './requestAccess.service.js'
import { logAuditEvent } from './audit.service.js'
import { createNotifications } from './notification.service.js'
import { emitToRequestRoom } from './realtime.service.js'
import { ensureOperationalFields, markResolvedOnRequest, maybeAutoEscalateRequest, resolveSlaConfig } from './sla.service.js'
import {
  canRoleActOnStep,
  normalizeUserRole,
  resolveDepartmentId,
  resolveInitialAssignee,
  resolveNextStepAssignment,
  resolveWorkflowOrFallback,
} from './workflow.service.js'

const paginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
})

const logRequestUpdate = async ({ requestId, actorId, action, meta = {} }) => {
  await RequestUpdate.create({ requestId, actorId, action, meta })
}

export const createRequest = async (payload, studentId) => {
  const studentUser = await User.findById(studentId).select('_id role departmentId').lean()
  if (!studentUser) {
    throw new ApiError(404, 'Student user not found')
  }

  const departmentId = await resolveDepartmentId({
    departmentId: payload.departmentId,
    studentUser,
  })
  const workflow = await resolveWorkflowOrFallback({
    requestType: payload.type,
    departmentId,
  })
  const assignment = await resolveInitialAssignee({
    workflow,
    taggedTeacherId: payload.taggedTeacherId,
    departmentId,
  })
  const slaConfig = await resolveSlaConfig({
    requestType: payload.type,
    priority: payload.priority,
    departmentId,
  })
  const now = new Date()

  const request = await Request.create({
    ...payload,
    studentId,
    departmentId,
    workflowId: workflow._id,
    currentStep: assignment.currentStep,
    assignedTo: assignment.assignedTo,
    status: 'PENDING',
    category: payload.category || payload.type,
    subcategory: payload.subcategory || null,
    slaTargetHours: slaConfig.targetHours,
    slaStartedAt: now,
    slaDueAt: new Date(now.getTime() + slaConfig.targetHours * 60 * 60 * 1000),
    nextEscalationAt: new Date(now.getTime() + slaConfig.escalationHours * 60 * 60 * 1000),
  })
  await ensureOperationalFields(request)

  await logRequestUpdate({
    requestId: request._id,
    actorId: studentId,
    action: 'CREATED',
    meta: { title: request.title, status: request.status, ticketId: request.ticketId },
  })

  await Promise.all([
    createNotifications([
      assignment.assignedTo
        ? {
            userId: assignment.assignedTo,
            requestId: request._id,
            type: 'REQUEST_ASSIGNED',
            title: 'New ticket assigned',
            message: `${request.ticketId || 'A ticket'} has been assigned to your queue.`,
            metadata: { priority: request.priority, status: request.status },
          }
        : null,
      {
        userId: studentId,
        requestId: request._id,
        type: 'REQUEST_ASSIGNED',
        title: 'Ticket submitted successfully',
        message: `${request.ticketId || 'Your request'} is now in the support workflow.`,
        metadata: { priority: request.priority, status: request.status },
      },
    ]),
    logAuditEvent({
      actorId: studentId,
      targetType: 'REQUEST',
      targetId: request._id,
      action: 'REQUEST_CREATED',
      summary: `Created ticket ${request.ticketId || request._id}.`,
      metadata: { type: request.type, priority: request.priority },
    }),
  ])

  emitToRequestRoom(request._id, 'request:updated', {
    requestId: String(request._id),
    status: request.status,
    ticketId: request.ticketId,
  })

  return request
}

export const listMyRequests = async ({ page, limit, status, type, search, sortBy }, studentId) => {
  const filter = { studentId }
  if (status) filter.status = status
  if (type) filter.type = type
  if (search) {
    filter.$or = [
      { ticketId: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ]
  }

  const skip = (page - 1) * limit
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest_priority: { priority: -1, createdAt: -1 },
    unresolved: { status: 1, createdAt: -1 },
    sla_risk: { nextEscalationAt: 1, createdAt: -1 },
  }
  const sort = sortMap[sortBy] || sortMap.newest

  const [items, total] = await Promise.all([
    Request.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email role')
      .populate('departmentId', 'name code')
      .lean(),
    Request.countDocuments(filter),
  ])

  return {
    items,
    meta: paginationMeta({ page, limit, total }),
  }
}

export const getRequestForStudent = async (requestId, studentId) => {
  const request = await Request.findById(requestId)
    .populate('assignedTo', 'name email role')
    .populate('departmentId', 'name code')
    .lean()

  if (!request) {
    throw new ApiError(404, 'Request not found')
  }

  assertRequestAccess(request, { _id: studentId, role: 'STUDENT' })

  return request
}

export const updateOwnRequest = async (requestId, studentId, updates) => {
  const request = await Request.findById(requestId)
  if (!request) {
    throw new ApiError(404, 'Request not found')
  }

  if (String(request.studentId) !== String(studentId)) {
    throw new ApiError(403, 'Forbidden: request does not belong to this student')
  }

  if (request.status !== 'PENDING') {
    throw new ApiError(400, 'Only pending requests can be edited by student')
  }

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      request[key] = value
    }
  })

  await request.save()

  await logRequestUpdate({
    requestId: request._id,
    actorId: studentId,
    action: 'UPDATED',
    meta: updates,
  })

  return request
}

export const listAdminRequests = async (query, actor) => {
  const { page, limit, status, type, priority, assignee, search, departmentId, stage, sortBy } = query
  const filter = {}

  if (status) filter.status = status
  if (type) filter.type = type
  if (priority) filter.priority = priority
  if (assignee) filter.assignedTo = assignee
  if (departmentId) filter.departmentId = departmentId
  if (stage) filter.currentStep = stage
  if (search) {
    const matchingStudents = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id').lean()
    filter.$or = [
      { ticketId: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { subcategory: { $regex: search, $options: 'i' } },
      ...(matchingStudents.length > 0 ? [{ studentId: { $in: matchingStudents.map((student) => student._id) } }] : []),
    ]
  }

  const scopedFilter = applyRoleScopeFilter({ baseFilter: filter, user: actor })
  const skip = (page - 1) * limit
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest_priority: { priority: -1, createdAt: -1 },
    sla_risk: { nextEscalationAt: 1, createdAt: -1 },
    unresolved: { status: 1, createdAt: -1 },
  }
  const sort = sortMap[sortBy] || sortMap.newest

  const [items, total] = await Promise.all([
    Request.find(scopedFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('studentId', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('departmentId', 'name code')
      .lean(),
    Request.countDocuments(scopedFilter),
  ])

  return {
    items,
    meta: paginationMeta({ page, limit, total }),
  }
}

export const updateRequestStatus = async (requestId, actor, status) => {
  const request = await Request.findById(requestId)
  if (!request) {
    throw new ApiError(404, 'Request not found')
  }

  await ensureOperationalFields(request)
  assertRequestAccess(request, actor)

  const oldStatus = request.status
  request.status = status
  if (status === 'RESOLVED') {
    markResolvedOnRequest(request)
  }
  await request.save()

  const updated = await logRequestUpdate({
    requestId: request._id,
    actorId: actor._id,
    action: 'STATUS_CHANGED',
    meta: { oldStatus, newStatus: status },
  })

  await Promise.all([
    createNotifications([
      {
        userId: request.studentId,
        requestId: request._id,
        type: status === 'RESOLVED' ? 'WORKFLOW_COMPLETED' : status === 'REJECTED' ? 'REQUEST_REJECTED' : 'REQUEST_ASSIGNED',
        title: `Ticket ${status.replace('_', ' ').toLowerCase()}`,
        message: `${request.ticketId || 'Your ticket'} is now ${status.replace('_', ' ').toLowerCase()}.`,
        metadata: { status },
      },
    ]),
    logAuditEvent({
      actorId: actor._id,
      targetType: 'REQUEST',
      targetId: request._id,
      action: 'REQUEST_STATUS_UPDATED',
      summary: `Updated ${request.ticketId || request._id} from ${oldStatus} to ${status}.`,
      metadata: { oldStatus, newStatus: status },
    }),
  ])

  emitToRequestRoom(request._id, 'request:updated', {
    requestId: String(request._id),
    status,
    timelineId: String(updated?._id || ''),
  })

  return request
}

export const assignRequest = async (requestId, actor, assignedTo) => {
  if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
    throw new ApiError(400, 'Invalid assignee id')
  }

  const [request, assignee] = await Promise.all([
    Request.findById(requestId),
    User.findById(assignedTo),
  ])

  if (!request) {
    throw new ApiError(404, 'Request not found')
  }

  await ensureOperationalFields(request)
  assertRequestAccess(request, actor)

  if (!assignee || !['TEACHER', 'HOD', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(assignee.role)) {
    throw new ApiError(400, 'Assignee must be an active workflow actor')
  }

  if (request.departmentId && assignee.departmentId && String(request.departmentId) !== String(assignee.departmentId)) {
    throw new ApiError(400, 'Assignee must belong to request department')
  }

  request.assignedTo = assignee._id
  if (request.status === 'PENDING') {
    request.status = 'IN_PROGRESS'
  }
  if (request.status === 'ESCALATED') {
    request.status = 'IN_PROGRESS'
  }
  request.nextEscalationAt = request.slaTargetHours
    ? new Date(Date.now() + Math.max(6, Math.floor(request.slaTargetHours / 2)) * 60 * 60 * 1000)
    : request.nextEscalationAt
  await request.save()

  const updated = await logRequestUpdate({
    requestId: request._id,
    actorId: actor._id,
    action: 'ASSIGNED',
    meta: { assignedTo: assignee._id },
  })

  await Promise.all([
    createNotifications([
      {
        userId: assignee._id,
        requestId: request._id,
        type: 'REQUEST_ASSIGNED',
        title: 'New ticket assigned',
        message: `${request.ticketId || 'A ticket'} has been assigned to you.`,
        metadata: { status: request.status },
      },
      {
        userId: request.studentId,
        requestId: request._id,
        type: 'REQUEST_ASSIGNED',
        title: 'Handler assigned',
        message: `${assignee.name} is now handling ${request.ticketId || 'your ticket'}.`,
        metadata: { assigneeId: assignee._id },
      },
    ]),
    logAuditEvent({
      actorId: actor._id,
      targetType: 'REQUEST',
      targetId: request._id,
      action: 'REQUEST_ASSIGNED',
      summary: `Assigned ${request.ticketId || request._id} to ${assignee.name}.`,
      metadata: { assigneeId: assignee._id, assigneeRole: assignee.role },
    }),
  ])

  emitToRequestRoom(request._id, 'request:updated', {
    requestId: String(request._id),
    assignedTo: String(assignee._id),
    status: request.status,
    timelineId: String(updated?._id || ''),
  })

  return request
}

export const getRequestUpdates = async (requestId) => {
  const request = await Request.findById(requestId)
  if (request) {
    await ensureOperationalFields(request)
    await maybeAutoEscalateRequest({ request })
  }

  const updates = await RequestUpdate.find({ requestId })
    .sort({ createdAt: -1 })
    .populate('actorId', 'name email role')
    .lean()

  return updates
}

export const getAdminDashboardStats = async (actor) => {
  const scopedOpenFilter = applyRoleScopeFilter({
    baseFilter: { status: { $in: ['PENDING', 'IN_PROGRESS', 'ESCALATED', 'REOPENED'] } },
    user: actor,
  })

  const scopedResolvedFilter = applyRoleScopeFilter({
    baseFilter: { status: 'RESOLVED', updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    user: actor,
  })

  const [openTickets, unassigned, slaBreaches, resolvedToday] = await Promise.all([
    Request.countDocuments(scopedOpenFilter),
    Request.countDocuments({ ...scopedOpenFilter, assignedTo: null }),
    Request.countDocuments({ ...scopedOpenFilter, createdAt: { $lte: new Date(Date.now() - 72 * 60 * 60 * 1000) } }),
    Request.countDocuments(scopedResolvedFilter),
  ])

  const scopedUrgentFilter = applyRoleScopeFilter({
    baseFilter: {
      status: { $in: ['PENDING', 'IN_PROGRESS', 'ESCALATED', 'REOPENED'] },
      priority: { $in: ['HIGH', 'URGENT'] },
    },
    user: actor,
  })

  const urgentQueue = await Request.find(scopedUrgentFilter)
    .sort({ priority: -1, createdAt: 1 })
    .limit(10)
    .populate('studentId', 'name email')
    .populate('departmentId', 'name code')
    .lean()

  return {
    summary: {
      openTickets,
      unassigned,
      slaBreaches,
      resolvedToday,
    },
    urgentQueue,
  }
}

export const listAssignableAdmins = async (actor) => {
  const actorRole = normalizeUserRole(actor.role)
  const query = {
    role: { $in: ['TEACHER', 'HOD', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'ADMIN'] },
    isActive: true,
  }

  if (actorRole !== 'SUPER_ADMIN') {
    query.departmentId = actor.departmentId || null
  }

  const admins = await User.find(query)
    .select('name email role department')
    .sort({ name: 1 })
    .lean()

  return admins
}

export const performRequestAction = async ({ requestId, actor, action, remark = '' }) => {
  const request = await Request.findById(requestId)
  if (!request) {
    throw new ApiError(404, 'Request not found')
  }

  await ensureOperationalFields(request)
  assertRequestAccess(request, actor)

  const workflow = request.workflowId
    ? await WorkflowConfig.findById(request.workflowId).lean()
    : await resolveWorkflowOrFallback({ requestType: request.type, departmentId: request.departmentId })

  const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order)
  const currentStep = sortedSteps.find((step) => step.order === request.currentStep)

  if (!currentStep) {
    throw new ApiError(400, 'Current workflow step is invalid')
  }

  if (!canRoleActOnStep({ userRole: actor.role, workflowStepRole: currentStep.role })) {
    throw new ApiError(403, 'Forbidden: your role cannot perform action on current workflow step')
  }

  const normalizedAction = String(action || '').toUpperCase()
  const oldStatus = request.status

  if (normalizedAction === 'REJECT') {
    request.status = 'REJECTED'
    request.nextEscalationAt = null
    request.approvalHistory.push({
      actorId: actor._id,
      role: normalizeUserRole(actor.role),
      action: 'REJECTED',
      remark,
      timestamp: new Date(),
    })

    await request.save()

    const timeline = await logRequestUpdate({
      requestId: request._id,
      actorId: actor._id,
      action: 'STATUS_CHANGED',
      meta: { oldStatus, newStatus: 'REJECTED', workflowAction: 'REJECT' },
    })

    await Promise.all([
      createNotifications([
        {
          userId: request.studentId,
          requestId: request._id,
          type: 'REQUEST_REJECTED',
          title: 'Ticket rejected',
          message: `${request.ticketId || 'Your ticket'} was rejected.${remark ? ` Note: ${remark}` : ''}`,
          metadata: { status: 'REJECTED' },
        },
      ]),
      logAuditEvent({
        actorId: actor._id,
        targetType: 'REQUEST',
        targetId: request._id,
        action: 'REQUEST_REJECTED',
        summary: `Rejected ${request.ticketId || request._id}.`,
        metadata: { remark },
      }),
    ])

    emitToRequestRoom(request._id, 'request:updated', {
      requestId: String(request._id),
      status: request.status,
      timelineId: String(timeline?._id || ''),
    })

    return request
  }

  const nextStepOrder = request.currentStep + 1
  const nextStep = sortedSteps.find((step) => step.order === nextStepOrder)

  if (normalizedAction === 'FORWARD' && !nextStep) {
    throw new ApiError(400, 'Cannot forward request from final workflow step')
  }

  request.approvalHistory.push({
    actorId: actor._id,
    role: normalizeUserRole(actor.role),
    action: normalizedAction === 'FORWARD' ? 'FORWARDED' : 'APPROVED',
    remark,
    timestamp: new Date(),
  })

  if (!nextStep) {
    request.status = 'RESOLVED'
    request.assignedTo = null
    markResolvedOnRequest(request)
    await request.save()

    const timeline = await logRequestUpdate({
      requestId: request._id,
      actorId: actor._id,
      action: 'STATUS_CHANGED',
      meta: { oldStatus, newStatus: 'RESOLVED', workflowAction: normalizedAction },
    })

    await Promise.all([
      createNotifications([
        {
          userId: request.studentId,
          requestId: request._id,
          type: 'WORKFLOW_COMPLETED',
          title: 'Ticket resolved',
          message: `${request.ticketId || 'Your ticket'} has been resolved.`,
          metadata: { status: 'RESOLVED' },
        },
      ]),
      logAuditEvent({
        actorId: actor._id,
        targetType: 'REQUEST',
        targetId: request._id,
        action: 'REQUEST_RESOLVED',
        summary: `Resolved ${request.ticketId || request._id}.`,
        metadata: { workflowAction: normalizedAction, remark },
      }),
    ])

    emitToRequestRoom(request._id, 'request:updated', {
      requestId: String(request._id),
      status: request.status,
      timelineId: String(timeline?._id || ''),
    })

    return request
  }

  const nextAssignment = await resolveNextStepAssignment({
    workflow,
    nextStepOrder,
    departmentId: request.departmentId,
  })

  if (!nextAssignment) {
    throw new ApiError(400, 'Unable to resolve next workflow step')
  }

  request.currentStep = nextStepOrder
  request.assignedTo = nextAssignment.assignedTo
  request.status = 'IN_PROGRESS'
  request.nextEscalationAt = request.slaTargetHours
    ? new Date(Date.now() + Math.max(6, Math.floor(request.slaTargetHours / 2)) * 60 * 60 * 1000)
    : request.nextEscalationAt
  await request.save()

  const timeline = await logRequestUpdate({
    requestId: request._id,
    actorId: actor._id,
    action: 'ASSIGNED',
    meta: {
      workflowAction: normalizedAction,
      nextStep: nextStepOrder,
      nextRole: nextAssignment.role,
      assignedTo: nextAssignment.assignedTo,
    },
  })

  await Promise.all([
    createNotifications([
      {
        userId: nextAssignment.assignedTo,
        requestId: request._id,
        type: 'REQUEST_ASSIGNED',
        title: 'Workflow action moved ticket to your queue',
        message: `${request.ticketId || 'A ticket'} advanced to your workflow stage.`,
        metadata: { nextStep: nextStepOrder, role: nextAssignment.role },
      },
      {
        userId: request.studentId,
        requestId: request._id,
        type: 'REQUEST_APPROVED',
        title: 'Ticket progressed',
        message: `${request.ticketId || 'Your ticket'} moved to the next workflow stage.`,
        metadata: { nextStep: nextStepOrder, role: nextAssignment.role },
      },
    ]),
    logAuditEvent({
      actorId: actor._id,
      targetType: 'REQUEST',
      targetId: request._id,
      action: 'REQUEST_WORKFLOW_ACTION',
      summary: `${normalizedAction} processed for ${request.ticketId || request._id}.`,
      metadata: { nextStep: nextStepOrder, nextAssigneeId: nextAssignment.assignedTo, remark },
    }),
  ])

  emitToRequestRoom(request._id, 'request:updated', {
    requestId: String(request._id),
    status: request.status,
    currentStep: request.currentStep,
    timelineId: String(timeline?._id || ''),
  })

  return request
}
