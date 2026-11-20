import { Schema, model, type InferSchemaType, type Types } from 'mongoose'

export const equipmentCategories = [
  'laptop',
  'monitor',
  'headset',
  'other',
] as const
export type EquipmentCategory = (typeof equipmentCategories)[number]

export const equipmentItemStatuses = [
  'available',
  'assigned',
  'maintenance',
  'retired',
] as const
export type EquipmentItemStatus = (typeof equipmentItemStatuses)[number]

const equipmentItemSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    assetTag: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    category: {
      type: String,
      enum: equipmentCategories,
      required: true,
      index: true,
    },
    serialNumber: { type: String, trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: equipmentItemStatuses,
      required: true,
      default: 'available',
      index: true,
    },
  },
  { timestamps: true },
)

equipmentItemSchema.index({ companyId: 1, assetTag: 1 }, { unique: true })
equipmentItemSchema.index({ companyId: 1, status: 1, category: 1 })

export type EquipmentItemDocument = InferSchemaType<
  typeof equipmentItemSchema
> & {
  _id: Types.ObjectId
}

export const EquipmentItem = model('EquipmentItem', equipmentItemSchema)
