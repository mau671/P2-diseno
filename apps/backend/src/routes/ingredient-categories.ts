import { Router } from 'express'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { ingredientCategories, ingredients } from '../db/schema'
import { rateLimitPublic } from '../middleware/rate-limit'

const router = Router()

router.get('/', rateLimitPublic, async (req, res, next) => {
  try {
    const restaurantId = typeof req.query.restaurant_id === 'string' ? req.query.restaurant_id.trim() : ''
    if (!restaurantId) {
      return res.status(400).json({ error: 'restaurant_id is required' })
    }

    const rows = await db
      .select({
        id: ingredientCategories.id,
        name: ingredientCategories.name,
        count: sql<number>`count(${ingredients.id})`
      })
      .from(ingredientCategories)
      .leftJoin(ingredients, eq(ingredientCategories.id, ingredients.categoryId))
      .where(and(eq(ingredients.restaurantId, restaurantId), eq(ingredients.isActive, true)))
      .groupBy(ingredientCategories.id, ingredientCategories.name)

    return res.status(200).json({ categories: rows })
  } catch (err) {
    next(err)
  }
})

export default router
