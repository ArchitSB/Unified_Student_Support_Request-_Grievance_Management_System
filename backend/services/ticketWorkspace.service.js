import fs from 'fs/promises'
import path from 'path'

import mongoose from 'mongoose'

import { Attachment } from '../models/Attachment.js'
import { EscalationHistory } from '../models/EscalationHistory.js'
import { Request } from '../models/Request.js'
import { RequestComment } from '../models/RequestComment.js'
import { RequestUpdate } from '../models/RequestUpdate.js'
import { StudentProfile } from '../models/StudentProfile.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { assertRequestAccess } from './requestAccess.service.js'
import { logAuditEvent } from './audit.service.js'
import { createNotification, createNotifications, listNotificationsForUser, markNotificationAsRead } from './notification.service.js'
import { emitToRequestRoom } from './realtime.service.js'
import { computeSlaSnapshot, ensureOperationalFields, markResolvedOnRequest, maybeAutoEscalateRequest, resolveSlaConfig } from './sla.service.js'
import { normalizeUserRole } from './workflow.service.js'

const uploadsDirectory = path.resolve(process.cwd(), 'uploads', 'request-attachments')

const mapAvailableActions = ({ request, actor }) => {
  const role = normalizeUserRole(actor.role)
  const availableActions = {
    canComment: true,
    canUploadAttachment: true,
    canReopen: role === 'STUDENT' && request.status === 'RESOLVED',
    canAddInternalNote: role !== 'STUDENT',
  }

  return availableActions
}

const ensureRequestAccess = async (requestId, actor) => {
  const request = await Request.findById(requestId)
    .populate('studentId', 'name email role department')
    .populate('assignedTo', 'name email role department')
    .populate('departmentId', 'name code')
    .populate('workflowId')
    .populate('taggedTeacherId', 'name email role')
    .populate('approvalHistory.actorId', 'name email role')

  if (!request) {
    throw new ApiError(404, 'Request not found')
  }

  await ensureOperationalFields(request)
  await maybeAutoEscalateRequest({ request, actor })
  await request.populate([
    { path: 'studentId', select: 'name email role department' },
    { path: 'assignedTo', select: 'name email role department' },
    { path: 'departmentId', select: 'name code' },
    { path: 'workflowId' },
    { path: 'taggedTeacherId', select: 'name email role' },
    { path: 'approvalHistory.actorId', select: 'name email role' },
  ])

  assertRequestAccess(request, actor)

  return request
}

const buildWorkflowStages = (request) => {
  const stages = request.workflowId?.steps
    ? [...request.workflowId.steps].sort((a, b) => a.order - b.order)
    : []

  return [
    { label: 'STUDENT', order: 0, state: 'completed' },
    ...stages.map((stage) => ({
      label: stage.role,
      order: stage.order,
      state:
        stage.order < request.currentStep
          ? 'completed'
          : stage.order === request.currentStep
            ? 'current'
            : 'pending',
    })),
  ]
}

const serializeRequest = async (request) => {
  const studentProfile = await StudentProfile.findOne({ userId: request.studentId?._id }).lean()

  return {
    ...request.toObject(),
    workflowStages: buildWorkflowStages(request),
    studentProfile,
    sla: computeSlaSnapshot(request),
  }
}

const formatTimelineItems = ({ updates, comments, attachments, escalations }) => {
  const items = [
    ...updates.map((update) => ({
      id: `update-${update._id}`,
      type: update.action,
      actor: update.actorId,
      role: update.actorId?.role || 'SYSTEM',
      timestamp: update.createdAt,
      description:
        update.action === 'CREATED'
          ? 'Ticket created'
          : update.action === 'ASSIGNED'
            ? 'Request assigned'
            : update.action === 'ESCALATED'
              ? 'Ticket escalated'
              : update.action === 'COMMENT_ADDED'
                ? 'Comment added'
                : update.action === 'ATTACHMENT_UPLOADED'
                  ? 'Attachment uploaded'
                  : 'Status or request details updated',
      metadata: update.meta,
    })),
    ...comments.map((comment) => ({
      id: `comment-${comment._id}`,
      type: 'COMMENT_ADDED',
      actor: comment.senderId,
      role: comment.senderId?.role || 'USER',
      timestamp: comment.createdAt,
      description: comment.visibility === 'INTERNAL_ONLY' ? 'Internal note added' : 'Comment added',
      metadata: { message: comment.message, visibility: comment.visibility },
    })),
    ...attachments.map((attachment) => ({
      id: `attachment-${attachment._id}`,
      type: 'ATTACHMENT_UPLOADED',
      actor: attachment.uploaderId,
      role: attachment.uploaderId?.role || 'USER',
      timestamp: attachment.createdAt,
      description: `${attachment.originalName} uploaded`,
      metadata: { url: attachment.url, mimeType: attachment.mimeType },
    })),
    ...escalations.map((escalation) => ({
      id: `escalation-${escalation._id}`,
      type: 'ESCALATED',
      actor: escalation.escalatedById,
      role: escalation.escalatedById?.role || 'SYSTEM',
      timestamp: escalation.createdAt,
      description: escalation.reason,
      metadata: {
        fromStage: escalation.fromStage,
        toStage: escalation.toStage,
        mode: escalation.mode,
      },
    })),
  ]

  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export const getRequestWorkspace = async ({ requestId, actor }) => {
  const request = await ensureRequestAccess(requestId, actor)
  const commentsFilter = { requestId }

  if (normalizeUserRole(actor.role) === 'STUDENT') {
    commentsFilter.visibility = 'PUBLIC'
  }

  const [comments, attachments, updates, escalations] = await Promise.all([
    RequestComment.find(commentsFilter)
      .sort({ createdAt: 1 })
      .populate('senderId', 'name email role')
      .populate('parentCommentId', '_id message senderId visibility createdAt')
      .lean(),
    Attachment.find({ requestId }).sort({ createdAt: -1 }).populate('uploaderId', 'name email role').lean(),
    RequestUpdate.find({ requestId }).sort({ createdAt: -1 }).populate('actorId', 'name email role').lean(),
    EscalationHistory.find({ requestId })
      .sort({ createdAt: -1 })
      .populate('escalatedById', 'name email role')
      .populate('fromAssigneeId', 'name email role')
      .populate('toAssigneeId', 'name email role')
      .lean(),
  ])

  return {
    request: await serializeRequest(request),
    comments,
    attachments,
    activity: formatTimelineItems({ updates, comments, attachments, escalations }),
    escalationHistory: escalations,
    availableActions: mapAvailableActions({ request, actor }),
  }
}

export const createRequestComment = async ({ requestId, actor, message, visibility, parentCommentId = null }) => {
  const request = await ensureRequestAccess(requestId, actor)
  const actorRole = normalizeUserRole(actor.role)

  if (actorRole === 'STUDENT' && visibility === 'INTERNAL_ONLY') {
    throw new ApiError(403, 'Students cannot create internal-only notes')
  }

  if (parentCommentId && !mongoose.Types.ObjectId.isValid(parentCommentId)) {
    throw new ApiError(400, 'Invalid parent comment id')
  }

  const mentions = [...message.matchAll(/@([a-zA-Z0-9._-]+)/g)].map((entry) => entry[1])
  const comment = await RequestComment.create({
    requestId,
    senderId: actor._id,
    parentCommentId: parentCommentId || null,
    visibility,
    message,
    mentions,
  })

  await RequestUpdate.create({
    requestId,
    actorId: actor._id,
    action: 'COMMENT_ADDED',
    meta: { visibility, parentCommentId },
  })

  const recipients = new Set()
  recipients.add(String(request.studentId?._id || request.studentId))
  if (request.assignedTo?._id) recipients.add(String(request.assignedTo._id))
  if (request.taggedTeacherId?._id) recipients.add(String(request.taggedTeacherId._id))

  if (visibility === 'INTERNAL_ONLY') {
    recipients.delete(String(request.studentId?._id || request.studentId))
  }

  recipients.delete(String(actor._id))

  await Promise.all([
    createNotifications(
      [...recipients].map((userId) => ({
        userId,
        requestId: request._id,
        type: 'NEW_COMMENT',
        title: visibility === 'INTERNAL_ONLY' ? 'Internal note added' : 'New comment on your ticket',
        message:
          visibility === 'INTERNAL_ONLY'
            ? `${actor.name} added an internal note on ${request.ticketId || 'ticket'}.`
            : `${actor.name} commented on ${request.ticketId || 'ticket'}.`,
        metadata: { visibility },
      })),
    ),
    logAuditEvent({
      actorId: actor._id,
      targetType: 'REQUEST',
      targetId: request._id,
      action: 'REQUEST_COMMENT_CREATED',
      summary: `Comment added to ticket ${request.ticketId || request._id}.`,
      metadata: { visibility, parentCommentId },
    }),
  ])

  emitToRequestRoom(requestId, 'request:comment', {
    requestId: String(requestId),
    actorId: String(actor._id),
    visibility,
  })

  return RequestComment.findById(comment._id)
    .populate('senderId', 'name email role')
    .populate('parentCommentId', '_id message senderId visibility createdAt')
    .lean()
}

export const uploadRequestAttachment = async ({ requestId, actor, file }) => {
  const request = await ensureRequestAccess(requestId, actor)

  if (!file) {
    throw new ApiError(400, 'Attachment file is required')
  }

  await fs.mkdir(uploadsDirectory, { recursive: true })

  const attachment = await Attachment.create({
    requestId,
    uploaderId: actor._id,
    originalName: file.originalname,
    fileName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    url: `/uploads/request-attachments/${file.filename}`,
  })

  request.attachments = [...(request.attachments || []), attachment.url]
  await request.save()

  await Promise.all([
    RequestUpdate.create({
      requestId,
      actorId: actor._id,
      action: 'ATTACHMENT_UPLOADED',
      meta: { attachmentId: attachment._id, fileName: attachment.originalName },
    }),
    createNotifications([
      request.studentId?._id && String(request.studentId._id) !== String(actor._id)
        ? {
            userId: request.studentId._id,
            requestId: request._id,
            type: 'NEW_COMMENT',
            title: 'Attachment added to ticket',
            message: `${actor.name} uploaded ${attachment.originalName} to ${request.ticketId || 'your ticket'}.`,
            metadata: { attachmentId: attachment._id },
          }
        : null,
      request.assignedTo?._id && String(request.assignedTo._id) !== String(actor._id)
        ? {
            userId: request.assignedTo._id,
            requestId: request._id,
            type: 'NEW_COMMENT',
            title: 'New attachment received',
            message: `${actor.name} uploaded ${attachment.originalName} to ${request.ticketId || 'a ticket assigned to you'}.`,
            metadata: { attachmentId: attachment._id },
          }
        : null,
    ]),
    logAuditEvent({
      actorId: actor._id,
      targetType: 'REQUEST',
      targetId: request._id,
      action: 'REQUEST_ATTACHMENT_UPLOADED',
      summary: `Attachment uploaded to ticket ${request.ticketId || request._id}.`,
      metadata: { fileName: attachment.originalName, size: attachment.size },
    }),
  ])

  emitToRequestRoom(requestId, 'request:attachment', {
    requestId: String(requestId),
    attachmentId: String(attachment._id),
  })

  return Attachment.findById(attachment._id).populate('uploaderId', 'name email role').lean()
}

export const reopenRequestByStudent = async ({ requestId, actor, message }) => {
  const request = await ensureRequestAccess(requestId, actor)

  if (normalizeUserRole(actor.role) !== 'STUDENT') {
    throw new ApiError(403, 'Only students can reopen resolved tickets')
  }

  if (request.status !== 'RESOLVED') {
    throw new ApiError(400, 'Only resolved tickets can be reopened')
  }

  const workflow = request.workflowId
  const startingStage = workflow?.steps?.[0]?.order || 1
  const startingRole = workflow?.steps?.[0]?.role || 'TEACHER'
  const startingAssignee = workflow?.steps?.[0]
    ? await User.findOne({
        role: startingRole === 'DEPARTMENT_ADMIN' ? { $in: ['DEPARTMENT_ADMIN', 'ADMIN'] } : startingRole,
        departmentId: request.departmentId || null,
        isActive: true,
      })
        .select('_id')
        .lean()
    : null

  request.status = 'REOPENED'
  request.reopenedCount = (request.reopenedCount || 0) + 1
  request.currentStep = startingStage
  request.assignedTo = startingAssignee?._id || request.assignedTo
  request.resolvedAt = null

  const config = await resolveSlaConfig({
    requestType: request.type,
    priority: request.priority,
    departmentId: request.departmentId,
  })
  const now = new Date()
  request.slaStartedAt = now
  request.slaDueAt = new Date(now.getTime() + config.targetHours * 60 * 60 * 1000)
  request.nextEscalationAt = new Date(now.getTime() + config.escalationHours * 60 * 60 * 1000)
  request.approvalHistory.push({
    actorId: actor._id,
    role: normalizeUserRole(actor.role),
    action: 'REOPENED',
    remark: message || 'Student requested additional clarification after resolution.',
    timestamp: now,
  })
  await request.save()

  const comment = await RequestComment.create({
    requestId,
    senderId: actor._id,
    visibility: 'PUBLIC',
    message: message || 'Reopening this ticket for additional clarification.',
  })

  await Promise.all([
    RequestUpdate.create({
      requestId,
      actorId: actor._id,
      action: 'REOPENED',
      meta: { reopenedCount: request.reopenedCount },
    }),
    createNotifications([
      request.assignedTo
        ? {
            userId: request.assignedTo,
            requestId: request._id,
            type: 'REQUEST_REOPENED',
            title: 'Ticket reopened',
            message: `${request.ticketId || 'A ticket'} was reopened by the student.`,
            metadata: { status: request.status },
          }
        : null,
    ]),
    logAuditEvent({
      actorId: actor._id,
      targetType: 'REQUEST',
      targetId: request._id,
      action: 'REQUEST_REOPENED',
      summary: `Student reopened ticket ${request.ticketId || request._id}.`,
      metadata: { reopenedCount: request.reopenedCount },
    }),
  ])

  emitToRequestRoom(requestId, 'request:updated', {
    requestId: String(requestId),
    status: request.status,
    currentStep: request.currentStep,
  })

  return {
    request: await serializeRequest(
      await Request.findById(requestId)
        .populate('studentId', 'name email role department')
        .populate('assignedTo', 'name email role department')
        .populate('departmentId', 'name code')
        .populate('workflowId')
        .populate('taggedTeacherId', 'name email role')
        .populate('approvalHistory.actorId', 'name email role'),
    ),
    comment: await RequestComment.findById(comment._id).populate('senderId', 'name email role').lean(),
  }
}

export const submitResolutionFeedback = async ({ requestId, actor, rating, review = '' }) => {
  const request = await ensureRequestAccess(requestId, actor)

  if (normalizeUserRole(actor.role) !== 'STUDENT') {
    throw new ApiError(403, 'Only students can submit resolution feedback')
  }

  if (request.status !== 'RESOLVED') {
    throw new ApiError(400, 'Feedback can only be submitted for resolved tickets')
  }

  request.resolutionFeedback = {
    rating,
    review,
    submittedAt: new Date(),
  }
  await request.save()

  await Promise.all([
    RequestUpdate.create({
      requestId,
      actorId: actor._id,
      action: 'FEEDBACK_SUBMITTED',
      meta: { rating },
    }),
    request.assignedTo
      ? createNotification({
          userId: request.assignedTo,
          requestId: request._id,
          type: 'WORKFLOW_COMPLETED',
          title: 'Resolution feedback received',
          message: `${actor.name} rated ${request.ticketId || 'a resolved ticket'} ${rating}/5.`,
          metadata: { rating },
        })
      : null,
  ])

  return { rating, review, submittedAt: request.resolutionFeedback.submittedAt }
}

export const getUserNotifications = async ({ actor, limit }) => {
  return listNotificationsForUser(actor._id, { limit })
}

export const readNotification = async ({ actor, notificationId }) => {
  const notification = await markNotificationAsRead(notificationId, actor._id)
  if (!notification) {
    throw new ApiError(404, 'Notification not found')
  }

  return notification
}
