import {
  changeUserActiveState,
  changeUserRole,
  getSuperAdminAnalytics,
  getSuperAdminDashboard,
  getSuperAdminReports,
  listOverdueEscalations,
  listSystemUsers,
  manuallyEscalateRequest,
  overrideRequest,
  reassignRequestAsSuperAdmin,
} from '../services/superAdmin.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const superAdminDashboardHandler = async (req, res) => {
  const data = await getSuperAdminDashboard({ actor: req.user })

  return sendSuccess(res, {
    message: 'Fetched super admin dashboard data',
    data,
  })
}

export const superAdminAnalyticsHandler = async (req, res) => {
  const data = await getSuperAdminAnalytics({ actor: req.user })

  return sendSuccess(res, {
    message: 'Fetched system analytics',
    data,
  })
}

export const listSystemUsersHandler = async (req, res) => {
  const data = await listSystemUsers({ actor: req.user, query: req.validated.query })

  return sendSuccess(res, {
    message: 'Fetched users',
    data: data.items,
    meta: data.meta,
  })
}

export const updateUserRoleHandler = async (req, res) => {
  const data = await changeUserRole({
    actor: req.user,
    userId: req.validated.params.id,
    role: req.validated.body.role,
  })

  return sendSuccess(res, {
    message: 'User role updated',
    data,
  })
}

export const updateUserActiveHandler = async (req, res) => {
  const data = await changeUserActiveState({
    actor: req.user,
    userId: req.validated.params.id,
    isActive: req.validated.body.isActive,
  })

  return sendSuccess(res, {
    message: 'User active state updated',
    data,
  })
}

export const listEscalationsHandler = async (req, res) => {
  const data = await listOverdueEscalations({ actor: req.user, query: req.validated.query })

  return sendSuccess(res, {
    message: 'Fetched overdue escalations',
    data: data.items,
    meta: data.meta,
  })
}

export const manualEscalateHandler = async (req, res) => {
  const data = await manuallyEscalateRequest({
    actor: req.user,
    requestId: req.validated.params.id,
    remark: req.validated.body.remark,
  })

  return sendSuccess(res, {
    message: 'Request escalated successfully',
    data,
  })
}

export const overrideRequestHandler = async (req, res) => {
  const data = await overrideRequest({
    actor: req.user,
    requestId: req.validated.params.id,
    status: req.validated.body.status,
    remark: req.validated.body.remark,
  })

  return sendSuccess(res, {
    message: 'Request overridden successfully',
    data,
  })
}

export const reassignRequestHandler = async (req, res) => {
  const data = await reassignRequestAsSuperAdmin({
    actor: req.user,
    requestId: req.validated.params.id,
    assignedTo: req.validated.body.assignedTo,
  })

  return sendSuccess(res, {
    message: 'Request reassigned successfully',
    data,
  })
}

export const superAdminReportsHandler = async (req, res) => {
  const data = await getSuperAdminReports({ actor: req.user })

  return sendSuccess(res, {
    message: 'Fetched system reports',
    data,
  })
}
