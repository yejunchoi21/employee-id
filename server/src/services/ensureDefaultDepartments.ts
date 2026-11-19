import type { Types } from 'mongoose'
import { DEFAULT_DEPARTMENT_NAMES } from '../constants/defaultDepartments.js'
import { Department } from '../models/index.js'

/**
 * Ensures the five default departments exist for a company.
 * Existing department documents keep their stable `_id`s so employee
 * assignments are never rewritten.
 */
export async function ensureDefaultDepartments(
  companyId: Types.ObjectId | string,
) {
  for (const name of DEFAULT_DEPARTMENT_NAMES) {
    await Department.updateOne(
      { companyId, name },
      { $setOnInsert: { companyId, name } },
      { upsert: true },
    )
  }

  return Department.find({ companyId }).sort({ name: 1 }).lean()
}
