import { Router } from 'express'
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'
import { db } from '../db'
import { ingredients, profiles } from '../db/schema'
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
      return direction(ingredients.category)
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

const ensureAdmin = async (req: AuthRequest, res: any) => {
  const userId = req.locals?.userId
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }

  const rows = await db
    .select({ isAdmin: profiles.isAdmin })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  if (!rows[0]?.isAdmin) {
    res.status(403).json({ error: 'Forbidden' })
    return false
  }

  return true
}

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const search = normalizeText(req.query.search)
    const category = normalizeText(req.query.category)
    const isActiveRaw = parseBoolean(req.query.is_active)
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.page_size ?? '20'), 10) || 20)
    )

    const conditions = []
    if (search) {
      conditions.push(ilike(ingredients.name, `%${search}%`))
    }
    if (category) {
      conditions.push(eq(ingredients.category, category))
    }
    if (isActiveRaw !== null) {
      conditions.push(eq(ingredients.isActive, isActiveRaw))
    }

    const whereClause = conditions.length ? and(...conditions) : undefined

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(ingredients)

    const totalRows = whereClause
      ? await countQuery.where(whereClause)
      : await countQuery

    const total = Number(totalRows[0]?.count ?? 0)

    const baseQuery = db
      .select({
        id: ingredients.id,
        name: ingredients.name,
        category: ingredients.category,
        unit_price: ingredients.unitPrice,
        stock: ingredients.stock,
        is_active: ingredients.isActive,
        created_at: ingredients.createdAt,
        updated_at: ingredients.updatedAt
      })
      .from(ingredients)

    const items = await (whereClause ? baseQuery.where(whereClause) : baseQuery)
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

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = req.params.id
    if (!id) {
      return res.status(400).json({ error: 'Invalid ingredient id' })
    }
    const rows = await db
      .select({
        id: ingredients.id,
        name: ingredients.name,
        category: ingredients.category,
        unit_price: ingredients.unitPrice,
        stock: ingredients.stock,
        is_active: ingredients.isActive,
        created_at: ingredients.createdAt,
        updated_at: ingredients.updatedAt
      })
      .from(ingredients)
      .where(eq(ingredients.id, id))
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
    const isAdmin = await ensureAdmin(authRequest, res)
    if (!isAdmin) return

    const name = normalizeText(req.body?.name)
    const category = normalizeText(req.body?.category)
    const unitPrice = parseNumber(req.body?.unit_price)
    const stock = parseNumber(req.body?.stock ?? 0)
    const isActive = parseBoolean(req.body?.is_active) ?? true

    if (!name || !category || Number.isNaN(unitPrice) || Number.isNaN(stock)) {
      return res.status(400).json({ error: 'Invalid ingredient payload' })
    }
    if (unitPrice < 0 || stock < 0) {
      return res.status(400).json({ error: 'unit_price and stock must be >= 0' })
    }

    const rows = await db
      .insert(ingredients)
      .values({
        name,
        category,
        unitPrice: unitPrice.toString(),
        stock,
        isActive
      })
      .returning({
        id: ingredients.id,
        name: ingredients.name,
        category: ingredients.category,
        unit_price: ingredients.unitPrice,
        stock: ingredients.stock,
        is_active: ingredients.isActive,
        created_at: ingredients.createdAt,
        updated_at: ingredients.updatedAt
      })

    return res.status(201).json({ ingredient: rows[0] })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const isAdmin = await ensureAdmin(authRequest, res)
    if (!isAdmin) return

    const id = req.params.id
    if (!id) {
      return res.status(400).json({ error: 'Invalid ingredient id' })
    }
    const name = normalizeText(req.body?.name)
    const category = normalizeText(req.body?.category)
    const unitPrice = req.body?.unit_price !== undefined ? parseNumber(req.body?.unit_price) : null
    const stock = req.body?.stock !== undefined ? parseNumber(req.body?.stock) : null
    const isActive = parseBoolean(req.body?.is_active)

    const updates: Record<string, unknown> = {}
    if (name) updates.name = name
    if (category) updates.category = category
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

    const rows = await db
      .update(ingredients)
      .set(updates)
      .where(eq(ingredients.id, id))
      .returning({
        id: ingredients.id,
        name: ingredients.name,
        category: ingredients.category,
        unit_price: ingredients.unitPrice,
        stock: ingredients.stock,
        is_active: ingredients.isActive,
        created_at: ingredients.createdAt,
        updated_at: ingredients.updatedAt
      })

    if (!rows[0]) {
      return res.status(404).json({ error: 'Ingredient not found' })
    }

    return res.status(200).json({ ingredient: rows[0] })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const isAdmin = await ensureAdmin(authRequest, res)
    if (!isAdmin) return

    const id = req.params.id
    if (!id) {
      return res.status(400).json({ error: 'Invalid ingredient id' })
    }
    const rows = await db
      .update(ingredients)
      .set({ isActive: false })
      .where(eq(ingredients.id, id))
      .returning({
        id: ingredients.id,
        name: ingredients.name,
        category: ingredients.category,
        unit_price: ingredients.unitPrice,
        stock: ingredients.stock,
        is_active: ingredients.isActive,
        created_at: ingredients.createdAt,
        updated_at: ingredients.updatedAt
      })

    if (!rows[0]) {
      return res.status(404).json({ error: 'Ingredient not found' })
    }

    return res.status(200).json({ ingredient: rows[0] })
  } catch (err) {
    next(err)
  }
})

export default router
