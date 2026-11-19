import type { Types } from 'mongoose'
import type {
  HelpRequestPriority,
  HelpRequestStatus,
} from '../models/HelpRequest.js'

type HelpRequestLean = {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  senderMembershipId: Types.ObjectId
  recipientEmployeeId: Types.ObjectId
  subject: string
  question: string
  priority: HelpRequestPriority
  status: HelpRequestStatus
  response?: string | null
  decidedAt?: Date | null
  resolvedAt?: Date | null
  cancelledAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export function presentHelpRequest(
  request: HelpRequestLean,
  extras?: {
    senderName?: string
    senderEmail?: string
    recipientName?: string
    recipientEmail?: string
  },
) {
  return {
    id: String(request._id),
    companyId: String(request.companyId),
    senderMembershipId: String(request.senderMembershipId),
    recipientEmployeeId: String(request.recipientEmployeeId),
    subject: request.subject,
    question: request.question,
    priority: request.priority,
    status: request.status,
    response: request.response?.trim() ? request.response : null,
    decidedAt: request.decidedAt?.toISOString() ?? null,
    resolvedAt: request.resolvedAt?.toISOString() ?? null,
    cancelledAt: request.cancelledAt?.toISOString() ?? null,
    createdAt: request.createdAt?.toISOString() ?? null,
    updatedAt: request.updatedAt?.toISOString() ?? null,
    senderName: extras?.senderName ?? null,
    senderEmail: extras?.senderEmail ?? null,
    recipientName: extras?.recipientName ?? null,
    recipientEmail: extras?.recipientEmail ?? null,
  }
}
