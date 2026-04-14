import { Router } from 'express'

import {
  adminDashboardStatsHandler,
  adminListRequestsHandler,
  assignRequestHandler,
  listAssignableAdminsHandler,
  updateRequestStatusHandler,
} from '../controllers/request.controller.js'
import {
  createDepartmentHandler,
  createWorkflowHandler,
  deleteDepartmentHandler,
  deleteWorkflowHandler,
  listDepartmentsHandler,
  listWorkflowsHandler,
  updateDepartmentHandler,
  updateWorkflowHandler,
} from '../controllers/adminConfig.controller.js'
import { requireAuth, requireRole } from '../middelwares/auth.js'
import { validateRequest } from '../middelwares/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  createDepartmentSchema,
  createWorkflowSchema,
  departmentIdParamsSchema,
  listDepartmentsSchema,
  listWorkflowsSchema,
  updateDepartmentSchema,
  updateWorkflowSchema,
  workflowIdParamsSchema,
} from '../validators/adminConfig.validators.js'
import {
  adminListRequestsSchema,
  assignRequestSchema,
  updateStatusSchema,
} from '../validators/request.validators.js'

const router = Router()

router.use(
  asyncHandler(requireAuth),
  asyncHandler(requireRole('HOD', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'ADMIN')),
)

router.get('/requests', validateRequest(adminListRequestsSchema), asyncHandler(adminListRequestsHandler))
router.patch('/requests/:id/status', validateRequest(updateStatusSchema), asyncHandler(updateRequestStatusHandler))
router.patch('/requests/:id/assign', validateRequest(assignRequestSchema), asyncHandler(assignRequestHandler))
router.get('/dashboard/stats', asyncHandler(adminDashboardStatsHandler))
router.get('/users', asyncHandler(listAssignableAdminsHandler))

router.get('/departments', validateRequest(listDepartmentsSchema), asyncHandler(listDepartmentsHandler))
router.post(
  '/departments',
  asyncHandler(requireRole('SUPER_ADMIN')),
  validateRequest(createDepartmentSchema),
  asyncHandler(createDepartmentHandler),
)
router.patch(
  '/departments/:id',
  asyncHandler(requireRole('SUPER_ADMIN')),
  validateRequest(updateDepartmentSchema),
  asyncHandler(updateDepartmentHandler),
)
router.delete(
  '/departments/:id',
  asyncHandler(requireRole('SUPER_ADMIN')),
  validateRequest(departmentIdParamsSchema),
  asyncHandler(deleteDepartmentHandler),
)

router.get('/workflows', validateRequest(listWorkflowsSchema), asyncHandler(listWorkflowsHandler))
router.post(
  '/workflows',
  asyncHandler(requireRole('DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'ADMIN')),
  validateRequest(createWorkflowSchema),
  asyncHandler(createWorkflowHandler),
)
router.patch(
  '/workflows/:id',
  asyncHandler(requireRole('DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'ADMIN')),
  validateRequest(updateWorkflowSchema),
  asyncHandler(updateWorkflowHandler),
)
router.delete(
  '/workflows/:id',
  asyncHandler(requireRole('DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'ADMIN')),
  validateRequest(workflowIdParamsSchema),
  asyncHandler(deleteWorkflowHandler),
)

export default router