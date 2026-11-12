import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

loadEnv()

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .default('mongodb://127.0.0.1:27017/northline_employee_id'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /** Used to sign httpOnly session cookies. Keep on the server only. */
  AUTH_SECRET: z
    .string()
    .min(32, 'AUTH_SECRET must be at least 32 characters')
    .default('dev-only-change-me-northline-auth-secret!!'),
  AUTH_COOKIE_NAME: z.string().default('northline_session'),
  AUTH_TOKEN_TTL: z.string().default('7d'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid server environment:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
