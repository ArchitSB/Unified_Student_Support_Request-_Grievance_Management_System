import {
  assignRequest,
  createRequest,
  getAdminDashboardStats,
  getRequestForStudent,
  getRequestUpdates,
  listAssignableAdmins,
  listAdminRequests,
  listMyRequests,
  performRequestAction,
  updateOwnRequest,
  updateRequestStatus,
} from '../services/request.service.js'
import {
  createRequestComment,
  getRequestWorkspace,
  getUserNotifications,
  readNotification,
  reopenRequestByStudent,
  submitResolutionFeedback,
  uploadRequestAttachment,
} from '../services/ticketWorkspace.service.js'
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
  const data = await listAdminRequests(req.validated.query, req.user)

  return sendSuccess(res, {
    message: 'Fetched admin request list',
    data: data.items,
    meta: data.meta,
  })
}

export const updateRequestStatusHandler = async (req, res) => {
  const data = await updateRequestStatus(req.validated.params.id, req.user, req.validated.body.status)

  return sendSuccess(res, {
    message: 'Request status updated',
    data,
  })
}

export const assignRequestHandler = async (req, res) => {
  const data = await assignRequest(req.validated.params.id, req.user, req.validated.body.assignedTo)

  return sendSuccess(res, {
    message: 'Request assigned successfully',
    data,
  })
}

export const adminDashboardStatsHandler = async (req, res) => {
  const data = await getAdminDashboardStats(req.user)

  return sendSuccess(res, {
    message: 'Fetched admin dashboard stats',
    data,
  })
}

export const listAssignableAdminsHandler = async (req, res) => {
  const data = await listAssignableAdmins(req.user)

  return sendSuccess(res, {
    message: 'Fetched assignable admins',
    data,
  })
}

export const requestActionHandler = async (req, res) => {
  const data = await performRequestAction({
    requestId: req.validated.params.id,
    actor: req.user,
    action: req.validated.body.action,
    remark: req.validated.body.remark,
  })

  return sendSuccess(res, {
    message: 'Request action processed successfully',
    data,
  })
}

export const getRequestWorkspaceHandler = async (req, res) => {
  const data = await getRequestWorkspace({
    requestId: req.validated.params.id,
    actor: req.user,
  })

  return sendSuccess(res, {
    message: 'Fetched request workspace',
    data,
  })
}

export const createRequestCommentHandler = async (req, res) => {
  const data = await createRequestComment({
    requestId: req.validated.params.id,
    actor: req.user,
    message: req.validated.body.message,
    visibility: req.validated.body.visibility,
    parentCommentId: req.validated.body.parentCommentId,
  })

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Comment created successfully',
    data,
  })
}

export const uploadRequestAttachmentHandler = async (req, res) => {
  const data = await uploadRequestAttachment({
    requestId: req.validated.params.id,
    actor: req.user,
    file: req.file,
  })

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Attachment uploaded successfully',
    data,
  })
}

export const reopenRequestHandler = async (req, res) => {
  const data = await reopenRequestByStudent({
    requestId: req.validated.params.id,
    actor: req.user,
    message: req.validated.body.message,
  })

  return sendSuccess(res, {
    message: 'Request reopened successfully',
    data,
  })
}

export const submitFeedbackHandler = async (req, res) => {
  const data = await submitResolutionFeedback({
    requestId: req.validated.params.id,
    actor: req.user,
    rating: req.validated.body.rating,
    review: req.validated.body.review,
  })

  return sendSuccess(res, {
    message: 'Feedback submitted successfully',
    data,
  })
}

export const listNotificationsHandler = async (req, res) => {
  const data = await getUserNotifications({
    actor: req.user,
    limit: req.validated.query.limit,
  })

  return sendSuccess(res, {
    message: 'Fetched notifications',
    data: data.items,
    meta: { unreadCount: data.unreadCount },
  })
}

export const readNotificationHandler = async (req, res) => {
  const data = await readNotification({
    actor: req.user,
    notificationId: req.validated.params.id,
  })

  return sendSuccess(res, {
    message: 'Notification marked as read',
    data,
  })
}
