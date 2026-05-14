import { Router } from 'express'

import {
  createRequestCommentHandler,
  createRequestHandler,
  getRequestWorkspaceHandler,
  getRequestByIdHandler,
  getRequestUpdatesHandler,
  listMyRequestsHandler,
  listNotificationsHandler,
  readNotificationHandler,
  reopenRequestHandler,
  requestActionHandler,
  submitFeedbackHandler,
  uploadRequestAttachmentHandler,
  updateOwnRequestHandler,
} from '../controllers/request.controller.js'
import { requireAuth, requireRole } from '../middelwares/auth.js'
import { uploadRequestAttachmentMiddleware } from '../middelwares/upload.js'
import { validateRequest } from '../middelwares/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  createCommentSchema,
  createRequestSchema,
  feedbackSchema,
  getRequestByIdSchema,
  listMyRequestsSchema,
  listNotificationsSchema,
  notificationIdParamsSchema,
  reopenRequestSchema,
  requestActionSchema,
  updateOwnRequestSchema,
  workspaceParamsSchema,
} from '../validators/request.validators.js'

const router = Router()

router.use(asyncHandler(requireAuth))

router.get('/notifications', validateRequest(listNotificationsSchema), asyncHandler(listNotificationsHandler))
router.patch('/notifications/:id/read', validateRequest(notificationIdParamsSchema), asyncHandler(readNotificationHandler))

router.post(
  '/:id/action',
  asyncHandler(requireRole('TEACHER', 'HOD', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'ADMIN')),
  validateRequest(requestActionSchema),
  asyncHandler(requestActionHandler),
)

router.get('/:id/workspace', validateRequest(workspaceParamsSchema), asyncHandler(getRequestWorkspaceHandler))
router.post('/:id/comments', validateRequest(createCommentSchema), asyncHandler(createRequestCommentHandler))
router.post(
  '/:id/attachments',
  validateRequest(workspaceParamsSchema),
  uploadRequestAttachmentMiddleware.single('file'),
  asyncHandler(uploadRequestAttachmentHandler),
)
router.post(
  '/:id/reopen',
  asyncHandler(requireRole('STUDENT')),
  validateRequest(reopenRequestSchema),
  asyncHandler(reopenRequestHandler),
)
router.post(
  '/:id/feedback',
  asyncHandler(requireRole('STUDENT')),
  validateRequest(feedbackSchema),
  asyncHandler(submitFeedbackHandler),
)

router.post('/', asyncHandler(requireRole('STUDENT')), validateRequest(createRequestSchema), asyncHandler(createRequestHandler))
router.get('/my', asyncHandler(requireRole('STUDENT')), validateRequest(listMyRequestsSchema), asyncHandler(listMyRequestsHandler))
router.get('/:id', asyncHandler(requireRole('STUDENT')), validateRequest(getRequestByIdSchema), asyncHandler(getRequestByIdHandler))
router.patch(
  '/:id',
  asyncHandler(requireRole('STUDENT')),
  validateRequest(updateOwnRequestSchema),
  asyncHandler(updateOwnRequestHandler),
)
router.get(
  '/:id/updates',
  asyncHandler(requireRole('STUDENT')),
  validateRequest(getRequestByIdSchema),
  asyncHandler(getRequestUpdatesHandler),
)

export default router
