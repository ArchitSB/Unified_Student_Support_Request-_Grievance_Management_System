import { Router } from 'express'

import adminRoutes from './admin.routes.js'
import authRoutes from './auth.routes.js'
import requestRoutes from './request.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/requests', requestRoutes)
router.use('/admin', adminRoutes)

export default router