import { Schema, model, type InferSchemaType, type Types } from 'mongoose'
import { equipmentCategories } from './EquipmentItem.js'

export const equipmentRequestStatuses = [
  'pending',
  'approved',
  'declined',
  'cancelled',
  'fulfilled',
] as const
export type EquipmentRequestStatus = (typeof equipmentRequestStatuses)[number]

const equipmentRequestSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    requesterEmployeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: equipmentCategories,
      required: true,
    },
    reason: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: equipmentRequestStatuses,
      required: true,
      default: 'pending',
      index: true,
    },
    adminResponse: { type: String, trim: true, maxlength: 2000 },
    decidedAt: { type: Date },
    decidedByMembershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
    },
    fulfilledAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'EquipmentAssignment',
    },
  },
  { timestamps: true },
)

equipmentRequestSchema.index({
  companyId: 1,
  requesterEmployeeId: 1,
  createdAt: -1,
})

export type EquipmentRequestDocument = InferSchemaType<
  typeof equipmentRequestSchema
> & {
  _id: Types.ObjectId
}

export const EquipmentRequest = model(
  'EquipmentRequest',
  equipmentRequestSchema,
)
