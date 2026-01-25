import { Router } from 'express'
import authRoutes from './auth'
import dietaryRoutes from './dietary'
import profilesRoutes from './profiles'
import { openapiSpec } from '../openapi'

const router = Router()

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

router.get('/openapi.json', (req, res) => {
  res.json(openapiSpec)
})

router.use('/auth', authRoutes)
router.use('/dietary', dietaryRoutes)
router.use('/profiles', profilesRoutes)

export default router
