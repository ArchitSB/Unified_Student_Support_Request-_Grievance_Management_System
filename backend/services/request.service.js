import mongoose from 'mongoose'

import { Request } from '../models/Request.js'
import { RequestUpdate } from '../models/RequestUpdate.js'
import { WorkflowConfig } from '../models/WorkflowConfig.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { applyRoleScopeFilter, assertRequestAccess } from './requestAccess.service.js'
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

  const request = await Request.create({
    ...payload,
    studentId,
    departmentId,
    workflowId: workflow._id,
    currentStep: assignment.currentStep,
    assignedTo: assignment.assignedTo,
    status: 'IN_PROGRESS',
  })

  await logRequestUpdate({
    requestId: request._id,
    actorId: studentId,
    action: 'CREATED',
    meta: { title: request.title, status: request.status },
  })

  return request
}

export const listMyRequests = async ({ page, limit, status, type, search }, studentId) => {
  const filter = { studentId }
  if (status) filter.status = status
  if (type) filter.type = type
  if (search) filter.$text = { $search: search }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Request.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email role')
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
  const { page, limit, status, type, priority, assignee, search } = query
  const filter = {}

  if (status) filter.status = status
  if (type) filter.type = type
  if (priority) filter.priority = priority
  if (assignee) filter.assignedTo = assignee
  if (search) filter.$text = { $search: search }

  const scopedFilter = applyRoleScopeFilter({ baseFilter: filter, user: actor })
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Request.find(scopedFilter)
      .sort({ createdAt: -1 })
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

  assertRequestAccess(request, actor)

  const oldStatus = request.status
  request.status = status
  await request.save()

  await logRequestUpdate({
    requestId: request._id,
    actorId: actor._id,
    action: 'STATUS_CHANGED',
    meta: { oldStatus, newStatus: status },
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
  await request.save()

  await logRequestUpdate({
    requestId: request._id,
    actorId: actor._id,
    action: 'ASSIGNED',
    meta: { assignedTo: assignee._id },
  })

  return request
}

export const getRequestUpdates = async (requestId) => {
  const updates = await RequestUpdate.find({ requestId })
    .sort({ createdAt: -1 })
    .populate('actorId', 'name email role')
    .lean()

  return updates
}

export const getAdminDashboardStats = async (actor) => {
  const scopedOpenFilter = applyRoleScopeFilter({
    baseFilter: { status: { $in: ['PENDING', 'IN_PROGRESS'] } },
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
      status: { $in: ['PENDING', 'IN_PROGRESS'] },
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
    request.approvalHistory.push({
      actorId: actor._id,
      role: normalizeUserRole(actor.role),
      action: 'REJECTED',
      remark,
      timestamp: new Date(),
    })

    await request.save()

    await logRequestUpdate({
      requestId: request._id,
      actorId: actor._id,
      action: 'STATUS_CHANGED',
      meta: { oldStatus, newStatus: 'REJECTED', workflowAction: 'REJECT' },
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
    await request.save()

    await logRequestUpdate({
      requestId: request._id,
      actorId: actor._id,
      action: 'STATUS_CHANGED',
      meta: { oldStatus, newStatus: 'RESOLVED', workflowAction: normalizedAction },
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
  await request.save()

  await logRequestUpdate({
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

  return request
}