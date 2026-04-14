import { Router } from 'express'

import { getMe, login, loginAdminHandler, register, registerAdminHandler } from '../controllers/auth.controller.js'
import { requireAuth } from '../middelwares/auth.js'
import { validateRequest } from '../middelwares/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
	adminLoginSchema,
	adminRegisterSchema,
	loginSchema,
	registerSchema,
} from '../validators/auth.validators.js'

const router = Router()

router.post('/register', validateRequest(registerSchema), asyncHandler(register))
router.post('/login', validateRequest(loginSchema), asyncHandler(login))
router.post('/admin/register', validateRequest(adminRegisterSchema), asyncHandler(registerAdminHandler))
router.post('/admin/login', validateRequest(adminLoginSchema), asyncHandler(loginAdminHandler))
router.get('/me', asyncHandler(requireAuth), asyncHandler(getMe))

export default router