import { Schema, model, type InferSchemaType, type Types } from 'mongoose'

export const equipmentReturnConditions = [
  'good',
  'damaged',
  'needs_maintenance',
] as const
export type EquipmentReturnCondition =
  (typeof equipmentReturnConditions)[number]

const equipmentAssignmentSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'EquipmentItem',
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'EquipmentRequest',
    },
    issuedAt: { type: Date, required: true },
    expectedReturnAt: { type: Date },
    returnedAt: { type: Date },
    returnCondition: {
      type: String,
      enum: equipmentReturnConditions,
    },
    returnNotes: { type: String, trim: true, maxlength: 2000 },
    issuedByMembershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
      required: true,
    },
    returnedByMembershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
    },
  },
  { timestamps: true },
)

equipmentAssignmentSchema.index(
  { itemId: 1 },
  {
    unique: true,
    partialFilterExpression: { returnedAt: null },
  },
)
equipmentAssignmentSchema.index({
  companyId: 1,
  employeeId: 1,
  returnedAt: 1,
  issuedAt: -1,
})

export type EquipmentAssignmentDocument = InferSchemaType<
  typeof equipmentAssignmentSchema
> & {
  _id: Types.ObjectId
}

export const EquipmentAssignment = model(
  'EquipmentAssignment',
  equipmentAssignmentSchema,
)
