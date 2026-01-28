import type { Request, Response, NextFunction } from 'express'
import type { AuthRequest } from '../types/supabase'

type RateLimitOptions = {
  windowMs: number
  max: number
  keyGenerator?: (req: Request) => string
}

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const getClientIp = (req: Request) => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) {
      return first
    }
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    const first = forwarded[0]?.trim()
    if (first) {
      return first
    }
  }
  return req.ip || 'unknown'
}

const defaultKeyGenerator = (req: Request) => `ip:${getClientIp(req)}`

export const createRateLimiter = ({ windowMs, max, keyGenerator }: RateLimitOptions) => {
  const generator = keyGenerator ?? defaultKeyGenerator

  return (req: Request, res: Response, next: NextFunction) => {
    const key = generator(req)
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now >= entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      res.setHeader('X-RateLimit-Limit', String(max))
      res.setHeader('X-RateLimit-Remaining', String(max - 1))
      res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)))
      return next()
    }

    if (entry.count >= max) {
      res.setHeader('X-RateLimit-Limit', String(max))
      res.setHeader('X-RateLimit-Remaining', '0')
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)))
      return res.status(429).json({ error: 'Too many requests' })
    }

    entry.count += 1
    store.set(key, entry)

    res.setHeader('X-RateLimit-Limit', String(max))
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)))
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)))

    next()
  }
}

const userKey = (req: Request) => {
  const authRequest = req as AuthRequest
  const userId = authRequest.locals?.userId
  if (userId) {
    return `user:${userId}`
  }
  return defaultKeyGenerator(req)
}

export const rateLimitPublic = createRateLimiter({ windowMs: 60_000, max: 120 })
export const rateLimitUser = createRateLimiter({ windowMs: 60_000, max: 240, keyGenerator: userKey })
export const rateLimitSensitive = createRateLimiter({ windowMs: 60_000, max: 60, keyGenerator: userKey })
export const rateLimitAdmin = createRateLimiter({ windowMs: 60_000, max: 120, keyGenerator: userKey })
