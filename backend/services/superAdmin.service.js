import mongoose from 'mongoose'

import { AdminProfile } from '../models/AdminProfile.js'
import { Request } from '../models/Request.js'
import { RequestUpdate } from '../models/RequestUpdate.js'
import { SuperAdminProfile } from '../models/SuperAdminProfile.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'

const paginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
})

const overdueCutoff = (thresholdHours) => new Date(Date.now() - thresholdHours * 60 * 60 * 1000)
const adminHierarchyRoles = new Set(['ADMIN', 'HOD', 'DEPARTMENT_ADMIN'])

const designationByRole = {
  HOD: 'Professor',
  DEPARTMENT_ADMIN: 'Class Coordinator',
  ADMIN: 'Other',
}

const ensureRole = (actor) => {
  if (String(actor?.role || '').toUpperCase() !== 'SUPER_ADMIN') {
    throw new ApiError(403, 'Forbidden: SUPER_ADMIN access required')
  }
}

const syncRoleProfiles = async (user) => {
  const normalizedRole = String(user.role || '').toUpperCase()

  if (normalizedRole === 'SUPER_ADMIN') {
    await AdminProfile.deleteOne({ userId: user._id })
    await SuperAdminProfile.updateOne(
      { userId: user._id },
      {
        $setOnInsert: {
          scope: 'GLOBAL',
          accessLevel: 'ROOT',
          managedModules: ['USERS', 'WORKFLOWS', 'DEPARTMENTS', 'ESCALATIONS', 'REPORTS'],
        },
      },
      { upsert: true },
    )

    return
  }

  if (adminHierarchyRoles.has(normalizedRole)) {
    await SuperAdminProfile.deleteOne({ userId: user._id })
    await AdminProfile.updateOne(
      { userId: user._id },
      {
        $set: {
          department: user.department || 'Support',
          designation: designationByRole[normalizedRole] || 'Other',
          isSuperAdmin: false,
        },
        $setOnInsert: {
          permissions: ['REQUEST_REVIEW', 'REQUEST_ASSIGN', 'REQUEST_STATUS_UPDATE', 'DASHBOARD_VIEW'],
        },
      },
      { upsert: true },
    )

    return
  }

  await Promise.all([AdminProfile.deleteOne({ userId: user._id }), SuperAdminProfile.deleteOne({ userId: user._id })])
}

export const getSuperAdminDashboard = async ({ actor }) => {
  ensureRole(actor)

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const openFilter = { status: { $in: ['PENDING', 'IN_PROGRESS'] } }
  const overdueFilter = { ...openFilter, createdAt: { $lte: overdueCutoff(72) } }

  const [openTickets, unassigned, overdue, resolvedToday, urgentQueue, latestAlerts] = await Promise.all([
    Request.countDocuments(openFilter),
    Request.countDocuments({ ...openFilter, assignedTo: null }),
    Request.countDocuments(overdueFilter),
    Request.countDocuments({ status: 'RESOLVED', updatedAt: { $gte: startOfToday } }),
    Request.find({ ...openFilter, priority: { $in: ['HIGH', 'URGENT'] } })
      .sort({ priority: -1, createdAt: 1 })
      .limit(10)
      .populate('studentId', 'name email')
      .populate('departmentId', 'name code')
      .lean(),
    Request.find({
      $or: [
        { status: { $in: ['PENDING', 'IN_PROGRESS'] }, createdAt: { $lte: overdueCutoff(72) } },
        { priority: 'URGENT', status: { $in: ['PENDING', 'IN_PROGRESS'] } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('title status priority createdAt')
      .lean(),
  ])

  return {
    summary: {
      openTickets,
      unassigned,
      overdue,
      resolvedToday,
    },
    urgentQueue,
    latestAlerts,
  }
}

export const getSuperAdminAnalytics = async ({ actor }) => {
  ensureRole(actor)

  const monthlyTrend = await Request.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        total: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ])

  const [statusDistribution, departmentLoad, roleDistribution] = await Promise.all([
    Request.aggregate([{ $group: { _id: '$status', value: { $sum: 1 } } }, { $sort: { value: -1 } }]),
    Request.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'department',
        },
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$department.name', 'General'] },
          value: { $sum: 1 },
        },
      },
      { $sort: { value: -1 } },
      { $limit: 8 },
    ]),
    User.aggregate([{ $group: { _id: '$role', value: { $sum: 1 } } }, { $sort: { value: -1 } }]),
  ])

  return {
    monthlyTrend: monthlyTrend.map((item) => ({
      label: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      value: item.total,
    })),
    statusDistribution: statusDistribution.map((item) => ({ label: item._id, value: item.value })),
    departmentLoad: departmentLoad.map((item) => ({ label: item._id, value: item.value })),
    roleDistribution: roleDistribution.map((item) => ({ label: item._id, value: item.value })),
  }
}

export const listSystemUsers = async ({ actor, query }) => {
  ensureRole(actor)

  const { page, limit, role, isActive, search } = query
  const filter = {}

  if (role) filter.role = role
  if (isActive !== undefined) filter.isActive = isActive
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
    ]
  }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name email role department departmentId isActive createdAt')
      .populate('departmentId', 'name code')
      .lean(),
    User.countDocuments(filter),
  ])

  return { items, meta: paginationMeta({ page, limit, total }) }
}

export const changeUserRole = async ({ actor, userId, role }) => {
  ensureRole(actor)

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user id')
  }

  if (String(actor._id) === String(userId)) {
    throw new ApiError(400, 'You cannot change your own role')
  }

  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  user.role = role
  await user.save()
  await syncRoleProfiles(user)

  return User.findById(user._id)
    .select('name email role department departmentId isActive createdAt')
    .populate('departmentId', 'name code')
    .lean()
}

export const changeUserActiveState = async ({ actor, userId, isActive }) => {
  ensureRole(actor)

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user id')
  }

  if (String(actor._id) === String(userId) && !isActive) {
    throw new ApiError(400, 'You cannot deactivate your own account')
  }

  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  user.isActive = isActive
  await user.save()

  return User.findById(user._id)
    .select('name email role department departmentId isActive createdAt')
    .populate('departmentId', 'name code')
    .lean()
}

export const listOverdueEscalations = async ({ actor, query }) => {
  ensureRole(actor)

  const { page, limit, thresholdHours } = query
  const filter = {
    status: { $in: ['PENDING', 'IN_PROGRESS'] },
    createdAt: { $lte: overdueCutoff(thresholdHours) },
  }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Request.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('studentId', 'name email')
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

export const manuallyEscalateRequest = async ({ actor, requestId, remark }) => {
  ensureRole(actor)

  const request = await Request.findById(requestId)
  if (!request) {
    throw new ApiError(404, 'Request not found')
  }

  request.priority = 'URGENT'
  if (request.status === 'PENDING') {
    request.status = 'IN_PROGRESS'
  }

  await request.save()

  await RequestUpdate.create({
    requestId: request._id,
    actorId: actor._id,
    action: 'STATUS_CHANGED',
    meta: {
      workflowAction: 'MANUAL_ESCALATION',
      remark,
      priority: request.priority,
      status: request.status,
    },
  })

  return Request.findById(request._id)
    .populate('studentId', 'name email')
    .populate('assignedTo', 'name email role')
    .populate('departmentId', 'name code')
    .lean()
}

export const overrideRequest = async ({ actor, requestId, status, remark }) => {
  ensureRole(actor)

  const request = await Request.findById(requestId)
  if (!request) {
    throw new ApiError(404, 'Request not found')
  }

  const oldStatus = request.status
  request.status = status
  await request.save()

  await RequestUpdate.create({
    requestId: request._id,
    actorId: actor._id,
    action: 'STATUS_CHANGED',
    meta: {
      workflowAction: 'SUPER_ADMIN_OVERRIDE',
      oldStatus,
      newStatus: status,
      remark,
    },
  })

  return Request.findById(request._id)
    .populate('studentId', 'name email')
    .populate('assignedTo', 'name email role')
    .populate('departmentId', 'name code')
    .lean()
}

export const reassignRequestAsSuperAdmin = async ({ actor, requestId, assignedTo }) => {
  ensureRole(actor)

  const [request, assignee] = await Promise.all([Request.findById(requestId), User.findById(assignedTo)])

  if (!request) {
    throw new ApiError(404, 'Request not found')
  }

  if (!assignee || !assignee.isActive) {
    throw new ApiError(400, 'Assignee must be an active user')
  }

  request.assignedTo = assignee._id
  if (request.status === 'PENDING') {
    request.status = 'IN_PROGRESS'
  }

  await request.save()

  await RequestUpdate.create({
    requestId: request._id,
    actorId: actor._id,
    action: 'ASSIGNED',
    meta: {
      workflowAction: 'SUPER_ADMIN_REASSIGN',
      assignedTo: assignee._id,
    },
  })

  return Request.findById(request._id)
    .populate('studentId', 'name email')
    .populate('assignedTo', 'name email role')
    .populate('departmentId', 'name code')
    .lean()
}

export const getSuperAdminReports = async ({ actor }) => {
  ensureRole(actor)

  const [requestByType, requestByPriority, requestByStatus] = await Promise.all([
    Request.aggregate([{ $group: { _id: '$type', value: { $sum: 1 } } }, { $sort: { value: -1 } }]),
    Request.aggregate([{ $group: { _id: '$priority', value: { $sum: 1 } } }, { $sort: { value: -1 } }]),
    Request.aggregate([{ $group: { _id: '$status', value: { $sum: 1 } } }, { $sort: { value: -1 } }]),
  ])

  return {
    requestByType: requestByType.map((item) => ({ label: item._id, value: item.value })),
    requestByPriority: requestByPriority.map((item) => ({ label: item._id, value: item.value })),
    requestByStatus: requestByStatus.map((item) => ({ label: item._id, value: item.value })),
    generatedAt: new Date().toISOString(),
  }
}
