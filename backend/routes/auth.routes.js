import { Router } from 'express'

import {
	getMe,
	getRegistrationBootstrapHandler,
	login,
	loginAdminHandler,
	logoutHandler,
	refreshSessionHandler,
	register,
	registerAdminHandler,
} from '../controllers/auth.controller.js'
import { requireAuth } from '../middelwares/auth.js'
import { validateRequest } from '../middelwares/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
	adminLoginSchema,
	adminRegisterSchema,
	loginSchema,
	logoutSchema,
	refreshSessionSchema,
	registerSchema,
} from '../validators/auth.validators.js'

const router = Router()

router.get('/bootstrap', asyncHandler(getRegistrationBootstrapHandler))
router.post('/register', validateRequest(registerSchema), asyncHandler(register))
router.post('/login', validateRequest(loginSchema), asyncHandler(login))
router.post('/admin/register', validateRequest(adminRegisterSchema), asyncHandler(registerAdminHandler))
router.post('/admin/login', validateRequest(adminLoginSchema), asyncHandler(loginAdminHandler))
router.post('/refresh', validateRequest(refreshSessionSchema), asyncHandler(refreshSessionHandler))
router.post('/logout', validateRequest(logoutSchema), asyncHandler(logoutHandler))
router.get('/me', asyncHandler(requireAuth), asyncHandler(getMe))

export default router
