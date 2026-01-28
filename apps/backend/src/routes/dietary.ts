import { Router } from 'express'
import { asc, eq } from 'drizzle-orm'
import { db } from '../db'
import { dietaryRestrictionTypes, dietaryRestrictions } from '../db/schema'

const router = Router()

router.get('/restrictions', async (req, res, next) => {
  try {
    const type = typeof req.query.type === 'string' ? req.query.type : undefined

    const baseQuery = db
      .select({
        id: dietaryRestrictions.id,
        name: dietaryRestrictions.name,
        type: dietaryRestrictionTypes.name
      })
      .from(dietaryRestrictions)
      .innerJoin(
        dietaryRestrictionTypes,
        eq(dietaryRestrictions.restrictionTypeId, dietaryRestrictionTypes.id)
      )

    const restrictions = await (type
      ? baseQuery.where(eq(dietaryRestrictionTypes.name, type))
      : baseQuery
    ).orderBy(asc(dietaryRestrictions.name))

    return res.status(200).json({ restrictions })
  } catch (err) {
    next(err)
  }
})

export default router
