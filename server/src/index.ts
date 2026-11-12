import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { connectMongo } from './db/connect.js'
import { authRouter } from './routes/auth.js'
import { healthRouter } from './routes/health.js'
import { metaRouter } from './routes/meta.js'

async function main() {
  await connectMongo()

  const app = express()
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())
  app.use(healthRouter)
  app.use(metaRouter)
  app.use(authRouter)

  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      void next
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        typeof (error as { status?: unknown }).status === 'number'
      ) {
        const status = (error as { status: number; message?: string }).status
        res.status(status).json({
          ok: false,
          error:
            status === 400
              ? 'Invalid request body.'
              : ((error as { message?: string }).message ??
                'Request failed.'),
        })
        return
      }

      console.error(error)
      res.status(500).json({ ok: false, error: 'Internal server error.' })
    },
  )

  app.listen(env.PORT, () => {
    console.log(`employee-id-server listening on http://localhost:${env.PORT}`)
  })
}

main().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
