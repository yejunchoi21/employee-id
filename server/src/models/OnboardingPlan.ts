import { Schema, model, type InferSchemaType, type Types } from 'mongoose'
import { taskResponsibleRoles } from '../constants/defaultOnboardingTasks.js'

const onboardingTaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    instructions: { type: String, trim: true, maxlength: 2000 },
    dueDate: { type: Date },
    responsible: {
      type: String,
      enum: taskResponsibleRoles,
      required: true,
    },
    completedAt: { type: Date },
    completedByMembershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
    },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { _id: true },
)

const onboardingPlanSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    managerEmployeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    buddyEmployeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    keyContactEmployeeIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
      default: [],
    },
    startDate: { type: Date, required: true },
    createdByMembershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
      required: true,
    },
    tasks: { type: [onboardingTaskSchema], default: [] },
  },
  { timestamps: true },
)

onboardingPlanSchema.index({ companyId: 1, employeeId: 1 }, { unique: true })
onboardingPlanSchema.index({ companyId: 1, managerEmployeeId: 1, startDate: -1 })

export type OnboardingTaskDocument = InferSchemaType<
  typeof onboardingTaskSchema
> & {
  _id: Types.ObjectId
}

export type OnboardingPlanDocument = InferSchemaType<
  typeof onboardingPlanSchema
> & {
  _id: Types.ObjectId
}

export const OnboardingPlan = model('OnboardingPlan', onboardingPlanSchema)
