export interface SupabaseUser {
  id: string
  email?: string
  user_metadata: {
    username?: string
    [key: string]: any
  }
  role?: string
}

export interface AuthRequest extends Request {
  locals?: {
    user?: SupabaseUser
    userId?: string
  }
}
