import type { Request, Response, NextFunction } from "express";
import type { Request, Response, NextFunction } from 'express'
import { getSupabaseClient } from '../lib/supabase'
import type { AuthLocals, AuthRequest } from '../types/supabase'

const parseBearerToken = (authorization?: string) => {
  if (!authorization) return null
  const [scheme, token] = authorization.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = parseBearerToken(req.headers.authorization)
    if (!token) {
      return res.status(401).json({ error: 'Missing or invalid authorization token' })
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const authRequest = req as AuthRequest
    authRequest.locals = {
      user: data.user as AuthLocals['user'],
      userId: data.user.id
    }

    next()
  } catch (err) {
    next(err)
  }
}

export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = parseBearerToken(req.headers.authorization)
    if (!token) {
      return next()
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser(token)

    if (!error && data?.user) {
      const authRequest = req as AuthRequest
      authRequest.locals = {
        user: data.user as AuthLocals['user'],
        userId: data.user.id
      }
    }

    next()
  } catch (err) {
    next(err)
  }
}
