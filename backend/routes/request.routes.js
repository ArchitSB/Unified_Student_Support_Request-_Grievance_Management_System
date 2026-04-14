import { Router } from 'express'

import {
  createRequestHandler,
  getRequestByIdHandler,
  getRequestUpdatesHandler,
  listMyRequestsHandler,
  requestActionHandler,
  updateOwnRequestHandler,
} from '../controllers/request.controller.js'
import { requireAuth, requireRole } from '../middelwares/auth.js'
import { validateRequest } from '../middelwares/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  createRequestSchema,
  getRequestByIdSchema,
  listMyRequestsSchema,
  requestActionSchema,
  updateOwnRequestSchema,
} from '../validators/request.validators.js'

const router = Router()

router.use(asyncHandler(requireAuth))

router.post(
  '/:id/action',
  asyncHandler(requireRole('TEACHER', 'HOD', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'ADMIN')),
  validateRequest(requestActionSchema),
  asyncHandler(requestActionHandler),
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