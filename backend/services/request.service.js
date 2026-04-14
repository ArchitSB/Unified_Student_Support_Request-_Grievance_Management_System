import mongoose from 'mongoose'

import { Request } from '../models/Request.js'
import { RequestUpdate } from '../models/RequestUpdate.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'

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
  const request = await Request.create({
    ...payload,
    studentId,
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

  if (String(request.studentId) !== String(studentId)) {
    throw new ApiError(403, 'Forbidden: request does not belong to this student')
  }

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

export const listAdminRequests = async (query) => {
  const { page, limit, status, type, priority, assignee, search } = query
  const filter = {}

  if (status) filter.status = status
  if (type) filter.type = type
  if (priority) filter.priority = priority
  if (assignee) filter.assignedTo = assignee
  if (search) filter.$text = { $search: search }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Request.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('studentId', 'name email')
      .populate('assignedTo', 'name email role')
      .lean(),
    Request.countDocuments(filter),
  ])

  return {
    items,
    meta: paginationMeta({ page, limit, total }),
  }
}

export const updateRequestStatus = async (requestId, adminId, status) => {
  const request = await Request.findById(requestId)
  if (!request) {
    throw new ApiError(404, 'Request not found')
  }

  const oldStatus = request.status
  request.status = status
  await request.save()

  await logRequestUpdate({
    requestId: request._id,
    actorId: adminId,
    action: 'STATUS_CHANGED',
    meta: { oldStatus, newStatus: status },
  })

  return request
}

export const assignRequest = async (requestId, adminId, assignedTo) => {
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

  if (!assignee || assignee.role !== 'ADMIN') {
    throw new ApiError(400, 'Assignee must be an active admin user')
  }

  request.assignedTo = assignee._id
  if (request.status === 'PENDING') {
    request.status = 'IN_PROGRESS'
  }
  await request.save()

  await logRequestUpdate({
    requestId: request._id,
    actorId: adminId,
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

export const getAdminDashboardStats = async () => {
  const [openTickets, unassigned, slaBreaches, resolvedToday] = await Promise.all([
    Request.countDocuments({ status: { $in: ['PENDING', 'IN_PROGRESS'] } }),
    Request.countDocuments({ assignedTo: null, status: { $in: ['PENDING', 'IN_PROGRESS'] } }),
    Request.countDocuments({
      status: { $in: ['PENDING', 'IN_PROGRESS'] },
      createdAt: { $lte: new Date(Date.now() - 72 * 60 * 60 * 1000) },
    }),
    Request.countDocuments({
      status: 'RESOLVED',
      updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ])

  const urgentQueue = await Request.find({
    status: { $in: ['PENDING', 'IN_PROGRESS'] },
    priority: { $in: ['HIGH', 'URGENT'] },
  })
    .sort({ priority: -1, createdAt: 1 })
    .limit(10)
    .populate('studentId', 'name email')
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

export const listAssignableAdmins = async () => {
  const admins = await User.find({ role: 'ADMIN', isActive: true })
    .select('name email role department')
    .sort({ name: 1 })
    .lean()

  return admins
}