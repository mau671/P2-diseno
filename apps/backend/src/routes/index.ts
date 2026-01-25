import { Router } from 'express'
import authRoutes from './auth'
import { openapiSpec } from '../openapi'

const router = Router()

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

router.get('/openapi.json', (req, res) => {
  res.json(openapiSpec)
})

router.use('/auth', authRoutes)

export default router
