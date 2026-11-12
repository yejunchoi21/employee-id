import { Schema, model, type InferSchemaType, type Types } from 'mongoose'

export const employeeApprovalStatuses = [
  'pending',
  'approved',
  'rejected',
] as const
export type EmployeeApprovalStatus = (typeof employeeApprovalStatuses)[number]

/**
 * Published directory cards are employees with approvalStatus === 'approved'.
 * Pending submissions must never appear in the rotating rack.
 */
const employeeSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: employeeApprovalStatuses,
      required: true,
      default: 'pending',
      index: true,
    },
    employeeCode: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    initials: { type: String, required: true, trim: true },
    office: { type: String, required: true, trim: true },
    joined: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    manager: { type: String, required: true, trim: true },
    bio: { type: String, required: true, trim: true },
    skills: { type: [String], required: true, default: [] },
    /** Optional portrait object storage key / URL managed by the server later. */
    portraitKey: { type: String, trim: true },
    submittedByMembershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
    },
    approvedByMembershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
    },
    approvedAt: { type: Date },
  },
  { timestamps: true },
)

employeeSchema.index({ companyId: 1, employeeCode: 1 }, { unique: true })
employeeSchema.index({ companyId: 1, email: 1 }, { unique: true })
employeeSchema.index({ companyId: 1, departmentId: 1, approvalStatus: 1 })

export type EmployeeDocument = InferSchemaType<typeof employeeSchema> & {
  _id: Types.ObjectId
}

export const Employee = model('Employee', employeeSchema)
