import { z } from 'zod'
import {
  equipmentCategories,
  equipmentItemStatuses,
} from '../models/EquipmentItem.js'
import { equipmentReturnConditions } from '../models/EquipmentAssignment.js'

export const createEquipmentItemSchema = z.object({
  assetTag: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(160),
  category: z.enum(equipmentCategories),
  serialNumber: z.string().trim().max(120).optional().nullable(),
  status: z.enum(equipmentItemStatuses).default('available'),
})

export const updateEquipmentItemSchema = createEquipmentItemSchema
  .partial()
  .extend({
    assetTag: z.string().trim().min(1).max(64).optional(),
    name: z.string().trim().min(1).max(160).optional(),
    category: z.enum(equipmentCategories).optional(),
  })

export const createEquipmentRequestSchema = z.object({
  category: z.enum(equipmentCategories),
  reason: z.string().trim().min(1).max(2000),
})

export const decideEquipmentRequestSchema = z.object({
  response: z.string().trim().max(2000).optional().nullable(),
})

export const assignEquipmentSchema = z.object({
  itemId: z.string().min(1),
  employeeId: z.string().min(1),
  requestId: z.string().min(1).optional().nullable(),
  issuedAt: z.string().min(1),
  expectedReturnAt: z.string().optional().nullable(),
})

export const fulfilEquipmentRequestSchema = z.object({
  itemId: z.string().min(1),
  issuedAt: z.string().min(1),
  expectedReturnAt: z.string().optional().nullable(),
})

export const returnEquipmentSchema = z.object({
  returnedAt: z.string().min(1),
  returnCondition: z.enum(equipmentReturnConditions),
  nextItemStatus: z.enum(['available', 'maintenance']),
  returnNotes: z.string().trim().max(2000).optional().nullable(),
})
