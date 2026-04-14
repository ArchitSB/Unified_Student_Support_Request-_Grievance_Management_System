import { Router } from 'express'

import {
  adminDashboardStatsHandler,
  adminListRequestsHandler,
  assignRequestHandler,
  updateRequestStatusHandler,
} from '../controllers/request.controller.js'
import { requireAuth, requireRole } from '../middelwares/auth.js'
import { validateRequest } from '../middelwares/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  adminListRequestsSchema,
  assignRequestSchema,
  updateStatusSchema,
} from '../validators/request.validators.js'

const router = Router()

router.use(asyncHandler(requireAuth), asyncHandler(requireRole('ADMIN')))

router.get('/requests', validateRequest(adminListRequestsSchema), asyncHandler(adminListRequestsHandler))
router.patch('/requests/:id/status', validateRequest(updateStatusSchema), asyncHandler(updateRequestStatusHandler))
router.patch('/requests/:id/assign', validateRequest(assignRequestSchema), asyncHandler(assignRequestHandler))
router.get('/dashboard/stats', asyncHandler(adminDashboardStatsHandler))

export default router