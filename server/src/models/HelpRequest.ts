import { Schema, model, type InferSchemaType, type Types } from 'mongoose'

export const helpRequestPriorities = ['low', 'normal', 'high'] as const
export type HelpRequestPriority = (typeof helpRequestPriorities)[number]

export const helpRequestStatuses = [
  'open',
  'accepted',
  'declined',
  'resolved',
  'cancelled',
] as const
export type HelpRequestStatus = (typeof helpRequestStatuses)[number]

const helpRequestSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    senderMembershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
      required: true,
      index: true,
    },
    recipientEmployeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    question: { type: String, required: true, trim: true, maxlength: 4000 },
    priority: {
      type: String,
      enum: helpRequestPriorities,
      required: true,
      default: 'normal',
    },
    status: {
      type: String,
      enum: helpRequestStatuses,
      required: true,
      default: 'open',
      index: true,
    },
    response: { type: String, trim: true, maxlength: 4000 },
    decidedAt: { type: Date },
    resolvedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true },
)

helpRequestSchema.index({ companyId: 1, senderMembershipId: 1, createdAt: -1 })
helpRequestSchema.index({ companyId: 1, recipientEmployeeId: 1, createdAt: -1 })
helpRequestSchema.index({ companyId: 1, status: 1, createdAt: -1 })

export type HelpRequestDocument = InferSchemaType<typeof helpRequestSchema> & {
  _id: Types.ObjectId
}

export const HelpRequest = model('HelpRequest', helpRequestSchema)
