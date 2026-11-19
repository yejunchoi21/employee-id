import { Employee } from '../models/index.js'
import type { Types } from 'mongoose'

export async function nextEmployeeCode(companyId: Types.ObjectId | string) {
  const latest = await Employee.find({ companyId })
    .select('employeeCode')
    .lean()

  let max = 2000
  for (const row of latest) {
    const match = row.employeeCode.match(/(\d+)/)
    if (!match) continue
    const value = Number(match[1])
    if (Number.isFinite(value) && value > max) max = value
  }

  return `EMP-${max + 1}`
}
