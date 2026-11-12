import mongoose from 'mongoose'
import { env } from '../config/env.js'

export async function connectMongo(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true)
  await mongoose.connect(env.MONGODB_URI)
  return mongoose
}
