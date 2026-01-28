import { Router } from 'express'
import { and, asc, desc, eq, ilike, inArray, sql } from 'drizzle-orm'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth'
import { rateLimitUser } from '../middleware/rate-limit'
import { db } from '../db'
import { ingredientCategories, ingredients, restaurantUsers } from '../db/schema'
import type { AuthRequest } from '../types/supabase'

const router = Router()

const parseNumber = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return NaN
}

const parseBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return null
}

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

const buildOrderBy = (sort?: string, order?: string) => {
  const sortKey = sort?.toLowerCase()
  const orderKey = order?.toLowerCase()
  const direction = orderKey === 'desc' ? desc : asc

  switch (sortKey) {
    case 'category':
      return direction(ingredientCategories.name)
    case 'unit_price':
      return direction(ingredients.unitPrice)
    case 'stock':
      return direction(ingredients.stock)
    case 'is_active':
      return direction(ingredients.isActive)
    case 'created_at':
      return direction(ingredients.createdAt)
    default:
      return direction(ingredients.name)
  }
}

const adminRoles = ['owner', 'admin']

const ensureRestaurantAdmin = async (userId: string, restaurantId: string) => {
  const rows = await db
    .select({ role: restaurantUsers.role })
    .from(restaurantUsers)
    .where(
      and(
        eq(restaurantUsers.userId, userId),
        eq(restaurantUsers.restaurantId, restaurantId),
        inArray(sql`lower(${restaurantUsers.role})`, adminRoles)
      )
    )

  return rows.length > 0
}

router.get('/', optionalAuthMiddleware, rateLimitUser, async (req, res, next) => {
  try {
    const search = normalizeText(req.query.search)
    const category = normalizeText(req.query.category)
    const restaurantId = normalizeText(req.query.restaurant_id)
    const isActiveRaw = parseBoolean(req.query.is_active)
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.page_size ?? '20'), 10) || 20)
    )

    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!restaurantId) {
      return res.status(400).json({ error: 'restaurant_id is required' })
    }

    const isAdmin = userId ? await ensureRestaurantAdmin(userId, restaurantId) : false

    const conditions = [eq(ingredients.restaurantId, restaurantId)]
    if (search) {
      conditions.push(ilike(ingredients.name, `%${search}%`))
    }
    if (category) {
      conditions.push(eq(ingredientCategories.name, category))
    }
    if (isActiveRaw !== null) {
      conditions.push(eq(ingredients.isActive, isActiveRaw))
    } else if (!isAdmin) {
      conditions.push(eq(ingredients.isActive, true))
    }

    const whereClause = and(...conditions)

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(ingredients)
      .innerJoin(ingredientCategories, eq(ingredients.categoryId, ingredientCategories.id))

    const totalRows = whereClause
      ? await countQuery.where(whereClause)
      : await countQuery

    const total = Number(totalRows[0]?.count ?? 0)

    const baseQuery = db
      .select({
        id: ingredients.id,
        name: ingredients.name,
        category_id: ingredientCategories.id,
        category_name: ingredientCategories.name,
        unit_price: ingredients.unitPrice,
        stock: ingredients.stock,
        is_active: ingredients.isActive,
        created_at: ingredients.createdAt,
        updated_at: ingredients.updatedAt
      })
      .from(ingredients)
      .innerJoin(ingredientCategories, eq(ingredients.categoryId, ingredientCategories.id))

    const items = await baseQuery
      .where(whereClause)
      .orderBy(buildOrderBy(String(req.query.sort ?? ''), String(req.query.order ?? '')))
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    return res.status(200).json({
      items,
      page,
      page_size: pageSize,
      total
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', optionalAuthMiddleware, rateLimitUser, async (req, res, next) => {
  try {
    const id = req.params.id
    const restaurantId = normalizeText(req.query.restaurant_id)
    if (!id) {
      return res.status(400).json({ error: 'Invalid ingredient id' })
    }
    if (!restaurantId) {
      return res.status(400).json({ error: 'restaurant_id is required' })
    }
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const isAdmin = userId ? await ensureRestaurantAdmin(userId, restaurantId) : false
    const detailConditions = [eq(ingredients.id, id), eq(ingredients.restaurantId, restaurantId)]
    if (!isAdmin) {
      detailConditions.push(eq(ingredients.isActive, true))
    }

    const rows = await db
      .select({
        id: ingredients.id,
        name: ingredients.name,
        category_id: ingredientCategories.id,
        category_name: ingredientCategories.name,
        unit_price: ingredients.unitPrice,
        stock: ingredients.stock,
        is_active: ingredients.isActive,
        created_at: ingredients.createdAt,
        updated_at: ingredients.updatedAt
      })
      .from(ingredients)
      .innerJoin(ingredientCategories, eq(ingredients.categoryId, ingredientCategories.id))
      .where(and(...detailConditions))
      .limit(1)

    if (!rows[0]) {
      return res.status(404).json({ error: 'Ingredient not found' })
    }

    return res.status(200).json({ ingredient: rows[0] })
  } catch (err) {
    next(err)
  }
})

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const name = normalizeText(req.body?.name)
    const categoryId = normalizeText(req.body?.category_id)
    const restaurantId = normalizeText(req.body?.restaurant_id)
    const unitPrice = parseNumber(req.body?.unit_price)
    const stock = parseNumber(req.body?.stock ?? 0)
    const isActive = parseBoolean(req.body?.is_active) ?? true

    if (!name || !categoryId || !restaurantId || Number.isNaN(unitPrice) || Number.isNaN(stock)) {
      return res.status(400).json({ error: 'Invalid ingredient payload' })
    }
    if (unitPrice < 0 || stock < 0) {
      return res.status(400).json({ error: 'unit_price and stock must be >= 0' })
    }

    const hasAccess = await ensureRestaurantAdmin(userId, restaurantId)
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const rows = await db
      .insert(ingredients)
      .values({
        name,
        categoryId,
        restaurantId,
        unitPrice: unitPrice.toString(),
        stock,
        isActive
      })
      .returning({ id: ingredients.id })

    const createdId = rows[0]?.id
    const createdRows = createdId
      ? await db
          .select({
            id: ingredients.id,
            name: ingredients.name,
            category_id: ingredientCategories.id,
            category_name: ingredientCategories.name,
            unit_price: ingredients.unitPrice,
            stock: ingredients.stock,
            is_active: ingredients.isActive,
            created_at: ingredients.createdAt,
            updated_at: ingredients.updatedAt
          })
          .from(ingredients)
          .innerJoin(ingredientCategories, eq(ingredients.categoryId, ingredientCategories.id))
          .where(eq(ingredients.id, createdId))
          .limit(1)
      : []

    return res.status(201).json({ ingredient: createdRows[0] })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const id = req.params.id
    if (!id) {
      return res.status(400).json({ error: 'Invalid ingredient id' })
    }
    const name = normalizeText(req.body?.name)
    const categoryId = normalizeText(req.body?.category_id)
    const unitPrice = req.body?.unit_price !== undefined ? parseNumber(req.body?.unit_price) : null
    const stock = req.body?.stock !== undefined ? parseNumber(req.body?.stock) : null
    const isActive = parseBoolean(req.body?.is_active)

    const updates: Record<string, unknown> = {}
    if (name) updates.name = name
    if (categoryId) updates.categoryId = categoryId
    if (unitPrice !== null) updates.unitPrice = unitPrice.toString()
    if (stock !== null) updates.stock = stock
    if (isActive !== null) updates.isActive = isActive

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    if (unitPrice !== null && (Number.isNaN(unitPrice) || unitPrice < 0)) {
      return res.status(400).json({ error: 'unit_price must be >= 0' })
    }

    if (stock !== null && (Number.isNaN(stock) || stock < 0)) {
      return res.status(400).json({ error: 'stock must be >= 0' })
    }

    const existingRows = await db
      .select({ restaurantId: ingredients.restaurantId })
      .from(ingredients)
      .where(eq(ingredients.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ error: 'Ingredient not found' })
    }

    const hasAccess = await ensureRestaurantAdmin(userId, existingRows[0].restaurantId)
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const rows = await db
      .update(ingredients)
      .set(updates)
      .where(eq(ingredients.id, id))
      .returning({ id: ingredients.id })

    if (!rows[0]) {
      return res.status(404).json({ error: 'Ingredient not found' })
    }

    const updatedRows = await db
      .select({
        id: ingredients.id,
        name: ingredients.name,
        category_id: ingredientCategories.id,
        category_name: ingredientCategories.name,
        unit_price: ingredients.unitPrice,
        stock: ingredients.stock,
        is_active: ingredients.isActive,
        created_at: ingredients.createdAt,
        updated_at: ingredients.updatedAt
      })
      .from(ingredients)
      .innerJoin(ingredientCategories, eq(ingredients.categoryId, ingredientCategories.id))
      .where(eq(ingredients.id, id))
      .limit(1)

    return res.status(200).json({ ingredient: updatedRows[0] })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const id = req.params.id
    if (!id) {
      return res.status(400).json({ error: 'Invalid ingredient id' })
    }
    const existingRows = await db
      .select({ restaurantId: ingredients.restaurantId })
      .from(ingredients)
      .where(eq(ingredients.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ error: 'Ingredient not found' })
    }

    const hasAccess = await ensureRestaurantAdmin(userId, existingRows[0].restaurantId)
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const rows = await db
      .update(ingredients)
      .set({ isActive: false })
      .where(eq(ingredients.id, id))
      .returning({ id: ingredients.id })

    if (!rows[0]) {
      return res.status(404).json({ error: 'Ingredient not found' })
    }

    const updatedRows = await db
      .select({
        id: ingredients.id,
        name: ingredients.name,
        category_id: ingredientCategories.id,
        category_name: ingredientCategories.name,
        unit_price: ingredients.unitPrice,
        stock: ingredients.stock,
        is_active: ingredients.isActive,
        created_at: ingredients.createdAt,
        updated_at: ingredients.updatedAt
      })
      .from(ingredients)
      .innerJoin(ingredientCategories, eq(ingredients.categoryId, ingredientCategories.id))
      .where(eq(ingredients.id, id))
      .limit(1)

    return res.status(200).json({ ingredient: updatedRows[0] })
  } catch (err) {
    next(err)
  }
})

export default router
