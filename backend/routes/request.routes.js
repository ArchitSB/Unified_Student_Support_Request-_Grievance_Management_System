import { Router } from 'express'

import {
  createRequestHandler,
  getRequestByIdHandler,
  getRequestUpdatesHandler,
  listMyRequestsHandler,
  updateOwnRequestHandler,
} from '../controllers/request.controller.js'
import { requireAuth, requireRole } from '../middelwares/auth.js'
import { validateRequest } from '../middelwares/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  createRequestSchema,
  getRequestByIdSchema,
  listMyRequestsSchema,
  updateOwnRequestSchema,
} from '../validators/request.validators.js'

const router = Router()

router.use(asyncHandler(requireAuth), asyncHandler(requireRole('STUDENT')))

router.post('/', validateRequest(createRequestSchema), asyncHandler(createRequestHandler))
router.get('/my', validateRequest(listMyRequestsSchema), asyncHandler(listMyRequestsHandler))
router.get('/:id', validateRequest(getRequestByIdSchema), asyncHandler(getRequestByIdHandler))
router.patch('/:id', validateRequest(updateOwnRequestSchema), asyncHandler(updateOwnRequestHandler))
router.get('/:id/updates', validateRequest(getRequestByIdSchema), asyncHandler(getRequestUpdatesHandler))

export default router