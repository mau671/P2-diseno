import type { Request } from 'express'

export interface SupabaseUser {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
  role?: string
}

export interface AuthLocals {
  user?: SupabaseUser
  userId?: string
}

export interface AuthRequest extends Request {
  locals?: AuthLocals
}
