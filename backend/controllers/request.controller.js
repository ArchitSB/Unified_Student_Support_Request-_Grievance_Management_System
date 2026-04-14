import {
  assignRequest,
  createRequest,
  getAdminDashboardStats,
  getRequestForStudent,
  getRequestUpdates,
  listAssignableAdmins,
  listAdminRequests,
  listMyRequests,
  updateOwnRequest,
  updateRequestStatus,
} from '../services/request.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const createRequestHandler = async (req, res) => {
  const data = await createRequest(req.validated.body, req.user._id)

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Request created successfully',
    data,
  })
}

export const listMyRequestsHandler = async (req, res) => {
  const data = await listMyRequests(req.validated.query, req.user._id)

  return sendSuccess(res, {
    message: 'Fetched student requests',
    data: data.items,
    meta: data.meta,
  })
}

export const getRequestByIdHandler = async (req, res) => {
  const data = await getRequestForStudent(req.validated.params.id, req.user._id)

  return sendSuccess(res, {
    message: 'Fetched request details',
    data,
  })
}

export const updateOwnRequestHandler = async (req, res) => {
  const data = await updateOwnRequest(req.validated.params.id, req.user._id, req.validated.body)

  return sendSuccess(res, {
    message: 'Request updated successfully',
    data,
  })
}

export const getRequestUpdatesHandler = async (req, res) => {
  const data = await getRequestUpdates(req.validated.params.id)

  return sendSuccess(res, {
    message: 'Fetched request activity timeline',
    data,
  })
}

export const adminListRequestsHandler = async (req, res) => {
  const data = await listAdminRequests(req.validated.query)

  return sendSuccess(res, {
    message: 'Fetched admin request list',
    data: data.items,
    meta: data.meta,
  })
}

export const updateRequestStatusHandler = async (req, res) => {
  const data = await updateRequestStatus(req.validated.params.id, req.user._id, req.validated.body.status)

  return sendSuccess(res, {
    message: 'Request status updated',
    data,
  })
}

export const assignRequestHandler = async (req, res) => {
  const data = await assignRequest(req.validated.params.id, req.user._id, req.validated.body.assignedTo)

  return sendSuccess(res, {
    message: 'Request assigned successfully',
    data,
  })
}

export const adminDashboardStatsHandler = async (_req, res) => {
  const data = await getAdminDashboardStats()

  return sendSuccess(res, {
    message: 'Fetched admin dashboard stats',
    data,
  })
}

export const listAssignableAdminsHandler = async (_req, res) => {
  const data = await listAssignableAdmins()

  return sendSuccess(res, {
    message: 'Fetched assignable admins',
    data,
  })
}