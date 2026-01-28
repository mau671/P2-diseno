import { Router } from 'express'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db'
import {
  ingredients,
  itemCustomizations,
  orderItems,
  orderStatusHistory,
  orders,
  restaurantUsers
} from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import { rateLimitAdmin } from '../middleware/rate-limit'
import type { AuthRequest } from '../types/supabase'

const router = Router()

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

router.get('/orders', authMiddleware, rateLimitAdmin, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const restaurantId = typeof req.query.restaurant_id === 'string' ? req.query.restaurant_id.trim() : ''
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : ''
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '25'), 10) || 25))

    let restaurantIds: string[] = []
    if (restaurantId) {
      const hasAccess = await ensureRestaurantAdmin(userId, restaurantId)
      if (!hasAccess) {
        return res.status(403).json({ error: 'Forbidden' })
      }
      restaurantIds = [restaurantId]
    } else {
      const rows = await db
        .select({ restaurantId: restaurantUsers.restaurantId })
        .from(restaurantUsers)
        .where(and(eq(restaurantUsers.userId, userId), inArray(sql`lower(${restaurantUsers.role})`, adminRoles)))

      restaurantIds = rows.map((row) => row.restaurantId)
    }

    if (!restaurantIds.length) {
      return res.status(200).json({ orders: [], pagination: { page, limit, total: 0 } })
    }

    const conditions = [inArray(orders.restaurantId, restaurantIds)]
    if (status) {
      conditions.push(eq(orders.status, status))
    }

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(...conditions))

    const total = Number(totalRows[0]?.count ?? 0)

    const rows = await db
      .select({
        id: orders.id,
        restaurantId: orders.restaurantId,
        status: orders.status,
        subtotal: orders.subtotal,
        total: orders.total,
        currencyCode: orders.currencyCode,
        createdAt: orders.createdAt
      })
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

    return res.status(200).json({
      orders: rows.map((row) => ({
        id: row.id,
        restaurant_id: row.restaurantId,
        status: row.status,
        subtotal: row.subtotal,
        total: row.total,
        currency_code: row.currencyCode,
        created_at: row.createdAt
      })),
      pagination: { page, limit, total }
    })
  } catch (err) {
    next(err)
  }
})

router.get('/orders/active', authMiddleware, rateLimitAdmin, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const restaurantId = typeof req.query.restaurant_id === 'string' ? req.query.restaurant_id.trim() : ''
    if (!restaurantId) {
      return res.status(400).json({ error: 'restaurant_id is required' })
    }

    const hasAccess = await ensureRestaurantAdmin(userId, restaurantId)
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const rows = await db
      .select({
        id: orders.id,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          inArray(orders.status, ['pending', 'confirmed', 'preparing', 'ready', 'delivering'])
        )
      )
      .orderBy(desc(orders.createdAt))

    return res.status(200).json({
      active_orders: rows.map((row) => ({
        id: row.id,
        status: row.status,
        total: row.total,
        created_at: row.createdAt
      }))
    })
  } catch (err) {
    next(err)
  }
})

router.get('/orders/:id', authMiddleware, rateLimitAdmin, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { id } = req.params
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!id) {
      return res.status(400).json({ error: 'Invalid order id' })
    }

    const orderRows = await db
      .select({
        id: orders.id,
        restaurantId: orders.restaurantId,
        status: orders.status,
        subtotal: orders.subtotal,
        tax: orders.tax,
        total: orders.total,
        currencyCode: orders.currencyCode,
        createdAt: orders.createdAt
      })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1)

    const order = orderRows[0]
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const hasAccess = await ensureRestaurantAdmin(userId, order.restaurantId)
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const itemRows = await db
      .select({
        id: orderItems.id,
        baseId: orderItems.baseId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        subtotal: orderItems.subtotal
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))

    const itemIds = itemRows.map((item) => item.id)
    const customizationRows = itemIds.length
      ? await db
          .select({
            orderItemId: itemCustomizations.orderItemId,
            ingredientId: itemCustomizations.ingredientId,
            ingredientName: ingredients.name,
            action: itemCustomizations.action,
            qty: itemCustomizations.qty,
            deltaPrice: itemCustomizations.deltaPrice
          })
          .from(itemCustomizations)
          .innerJoin(ingredients, eq(itemCustomizations.ingredientId, ingredients.id))
          .where(inArray(itemCustomizations.orderItemId, itemIds))
      : []

    const customizationByItem = customizationRows.reduce<Record<string, typeof customizationRows>>(
      (acc, row) => {
        const list = acc[row.orderItemId] ?? []
        list.push(row)
        acc[row.orderItemId] = list
        return acc
      },
      {}
    )

    const historyRows = await db
      .select({
        status: orderStatusHistory.status,
        changedAt: orderStatusHistory.changedAt,
        changedBy: orderStatusHistory.changedBy
      })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(desc(orderStatusHistory.changedAt))

    return res.status(200).json({
      order: {
        id: order.id,
        restaurant_id: order.restaurantId,
        status: order.status,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        currency_code: order.currencyCode,
        created_at: order.createdAt,
        items: itemRows.map((item) => ({
          id: item.id,
          base_id: item.baseId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
          customizations: (customizationByItem[item.id] ?? []).map((customization) => ({
            ingredient_id: customization.ingredientId,
            ingredient_name: customization.ingredientName,
            action: customization.action,
            qty: customization.qty,
            delta_price: customization.deltaPrice
          }))
        })),
        status_history: historyRows.map((row) => ({
          status: row.status,
          changed_at: row.changedAt,
          changed_by: row.changedBy
        }))
      }
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/orders/:id/status', authMiddleware, rateLimitAdmin, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { id } = req.params
    const { status } = req.body ?? {}

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!id) {
      return res.status(400).json({ error: 'Invalid order id' })
    }

    if (typeof status !== 'string' || status.trim().length === 0) {
      return res.status(400).json({ error: 'status is required' })
    }

    const orderRows = await db
      .select({ id: orders.id, restaurantId: orders.restaurantId })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1)

    const order = orderRows[0]
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const hasAccess = await ensureRestaurantAdmin(userId, order.restaurantId)
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const updated = await db.transaction(async (tx) => {
      const updatedRows = await tx
        .update(orders)
        .set({ status })
        .where(eq(orders.id, id))
        .returning({ id: orders.id, status: orders.status })

      const updatedOrder = updatedRows[0]
      if (!updatedOrder) {
        return null
      }

      await tx.insert(orderStatusHistory).values({
        orderId: updatedOrder.id,
        status,
        changedBy: userId
      })

      return updatedOrder
    })

    if (!updated) {
      return res.status(404).json({ error: 'Order not found' })
    }

    return res.status(200).json({ order: updated })
  } catch (err) {
    next(err)
  }
})

export default router
