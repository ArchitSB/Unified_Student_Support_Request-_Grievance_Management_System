import { Router } from 'express'

import { getMe, login, register } from '../controllers/auth.controller.js'
import { requireAuth } from '../middelwares/auth.js'
import { validateRequest } from '../middelwares/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { loginSchema, registerSchema } from '../validators/auth.validators.js'

const router = Router()

router.post('/register', validateRequest(registerSchema), asyncHandler(register))
router.post('/login', validateRequest(loginSchema), asyncHandler(login))
router.get('/me', asyncHandler(requireAuth), asyncHandler(getMe))

export default router