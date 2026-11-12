import { Schema, model, type InferSchemaType, type Types } from 'mongoose'

/**
 * Stable department records scoped to a company.
 * Directory filters should key off `_id` (departmentId), not free-text names.
 */
const departmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
)

departmentSchema.index({ companyId: 1, name: 1 }, { unique: true })

export type DepartmentDocument = InferSchemaType<typeof departmentSchema> & {
  _id: Types.ObjectId
}

export const Department = model('Department', departmentSchema)
