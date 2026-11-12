import { Router } from 'express'
import mongoose from 'mongoose'

export const healthRouter = Router()

healthRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'employee-id-server',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})
