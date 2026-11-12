import { SignJWT, jwtVerify } from 'jose'
import type { Response } from 'express'
import { Types } from 'mongoose'
import { env } from '../config/env.js'
import type { MembershipRole } from '../models/Membership.js'
import type { AuthenticatedMembership } from '../types/express.js'

interface SessionClaims {
  membershipId: string
  companyId: string
  email: string
  displayName: string
  role: MembershipRole
}

const secret = new TextEncoder().encode(env.AUTH_SECRET)

export async function createSessionToken(
  membership: AuthenticatedMembership,
): Promise<string> {
  return new SignJWT({
    membershipId: String(membership.membershipId),
    companyId: String(membership.companyId),
    email: membership.email,
    displayName: membership.displayName,
    role: membership.role,
  } satisfies SessionClaims)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(membership.membershipId))
    .setIssuedAt()
    .setExpirationTime(env.AUTH_TOKEN_TTL)
    .sign(secret)
}

export async function verifySessionToken(
  token: string,
): Promise<AuthenticatedMembership | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    const membershipId = String(payload.membershipId ?? '')
    const companyId = String(payload.companyId ?? '')
    const email = String(payload.email ?? '')
    const displayName = String(payload.displayName ?? '')
    const role = payload.role

    if (
      !Types.ObjectId.isValid(membershipId) ||
      !Types.ObjectId.isValid(companyId) ||
      !email ||
      !displayName ||
      (role !== 'admin' && role !== 'member')
    ) {
      return null
    }

    return {
      membershipId: new Types.ObjectId(membershipId),
      companyId: new Types.ObjectId(companyId),
      email,
      displayName,
      role,
    }
  } catch {
    return null
  }
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(env.AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  })
}

export function toPublicMembership(membership: AuthenticatedMembership) {
  return {
    membershipId: String(membership.membershipId),
    companyId: String(membership.companyId),
    email: membership.email,
    displayName: membership.displayName,
    role: membership.role,
  }
}
