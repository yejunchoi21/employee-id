import { Schema, model, type InferSchemaType, type Types } from 'mongoose'

export const membershipRoles = ['member', 'admin'] as const
export type MembershipRole = (typeof membershipRoles)[number]

/**
 * Authenticated company membership.
 * Company identity for directory/signup must come from this record,
 * never from an untrusted client form field.
 */
const membershipSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    displayName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: membershipRoles,
      required: true,
      default: 'member',
    },
    /** Stable subject id used inside signed session tokens. */
    authUserId: { type: String, required: true, trim: true, unique: true },
    /** bcrypt hash — never return this field from APIs. */
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
)

membershipSchema.index({ companyId: 1, email: 1 }, { unique: true })

export type MembershipDocument = InferSchemaType<typeof membershipSchema> & {
  _id: Types.ObjectId
}

export const Membership = model('Membership', membershipSchema)
