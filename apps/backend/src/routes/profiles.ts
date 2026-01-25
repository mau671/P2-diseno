import { Router } from 'express'
import { eq, inArray } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'
import { db } from '../db'
import { dietaryRestrictions, profiles, userDietaryRestrictions } from '../db/schema'
import type { AuthRequest } from '../types/supabase'

const router = Router()

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const profileRows = await db
      .select({
        id: profiles.id,
        full_name: profiles.fullName,
        is_admin: profiles.isAdmin,
        created_at: profiles.createdAt,
        updated_at: profiles.updatedAt
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1)

    const profile = profileRows[0] ?? null

    return res.status(200).json({
      profile: profile
        ? {
            ...profile,
            email: authRequest.locals?.user?.email ?? null
          }
        : null
    })
  } catch (err) {
    next(err)
  }
})

router.get('/me/dietary', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const rows = await db
      .select({ restrictionId: userDietaryRestrictions.restrictionId })
      .from(userDietaryRestrictions)
      .where(eq(userDietaryRestrictions.userId, userId))

    const restrictionIds = rows.map((row) => row.restrictionId)

    return res.status(200).json({ restriction_ids: restrictionIds })
  } catch (err) {
    next(err)
  }
})

router.put('/me/dietary', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { restriction_ids } = req.body ?? {}
    if (!Array.isArray(restriction_ids)) {
      return res.status(400).json({ error: 'restriction_ids must be an array' })
    }

    const normalizedIds = restriction_ids
      .filter((id): id is string => typeof id === 'string')
      .map((id) => id.trim())
      .filter((id) => id.length > 0)

    const uniqueIds = Array.from(new Set(normalizedIds))

    if (uniqueIds.length > 0) {
      const existing = await db
        .select({ id: dietaryRestrictions.id })
        .from(dietaryRestrictions)
        .where(inArray(dietaryRestrictions.id, uniqueIds))

      if (existing.length !== uniqueIds.length) {
        return res.status(400).json({ error: 'One or more restriction ids are invalid' })
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(userDietaryRestrictions)
        .where(eq(userDietaryRestrictions.userId, userId))

      if (uniqueIds.length > 0) {
        await tx.insert(userDietaryRestrictions).values(
          uniqueIds.map((restrictionId) => ({
            userId,
            restrictionId
          }))
        )
      }
    })

    return res.status(200).json({ restriction_ids: uniqueIds })
  } catch (err) {
    next(err)
  }
})

export default router
