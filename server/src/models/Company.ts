import { Schema, model, type InferSchemaType, type Types } from 'mongoose'

const companySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
  },
  { timestamps: true },
)

export type CompanyDocument = InferSchemaType<typeof companySchema> & {
  _id: Types.ObjectId
}

export const Company = model('Company', companySchema)
