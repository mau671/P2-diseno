import { Router } from 'express'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { orderStatusHistory, orders, paymentMethods, payments } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import { rateLimitSensitive, rateLimitUser } from '../middleware/rate-limit'
import type { AuthRequest } from '../types/supabase'

const router = Router()

router.post('/process', authMiddleware, rateLimitSensitive, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { order_id, payment_method_id, amount, currency_code } = req.body ?? {}
    if (!order_id || !payment_method_id || typeof amount !== 'number' || !currency_code) {
      return res.status(400).json({ error: 'order_id, payment_method_id, amount, currency_code are required' })
    }

    const orderRows = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        total: orders.total,
        currencyCode: orders.currencyCode,
        status: orders.status
      })
      .from(orders)
      .where(eq(orders.id, order_id))
      .limit(1)

    const order = orderRows[0]
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (Number(order.total) !== Number(amount) || order.currencyCode !== currency_code) {
      return res.status(400).json({ error: 'Amount or currency mismatch' })
    }

    const methodRows = await db
      .select({ id: paymentMethods.id })
      .from(paymentMethods)
      .where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.id, payment_method_id)))
      .limit(1)

    if (!methodRows.length) {
      return res.status(404).json({ error: 'Payment method not found' })
    }

    const paymentId = await db.transaction(async (tx) => {
      const rows = await tx
        .insert(payments)
        .values({
          orderId: order.id,
          provider: 'mock',
          status: 'paid',
          currencyCode: currency_code,
          amount: amount.toFixed(2),
          transactionRef: `mock_${Date.now()}`
        })
        .returning({ id: payments.id })

      const nextStatus = order.status === 'pending' ? 'paid' : order.status
      await tx.update(orders).set({ status: nextStatus }).where(eq(orders.id, order.id))

      if (nextStatus !== order.status) {
        await tx.insert(orderStatusHistory).values({
          orderId: order.id,
          status: nextStatus,
          changedBy: userId
        })
      }

      return rows[0]?.id
    })

    return res.status(200).json({
      payment: {
        id: paymentId,
        status: 'paid',
        provider: 'mock'
      },
      order: { id: order.id, status: order.status === 'pending' ? 'paid' : order.status }
    })
  } catch (err) {
    next(err)
  }
})

router.get('/history', authMiddleware, rateLimitUser, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20))

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(eq(orders.userId, userId))

    const total = Number(totalRows[0]?.count ?? 0)

    const rows = await db
      .select({
        id: payments.id,
        orderId: payments.orderId,
        amount: payments.amount,
        currencyCode: payments.currencyCode,
        status: payments.status,
        provider: payments.provider,
        transactionRef: payments.transactionRef,
        createdAt: payments.createdAt
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

    return res.status(200).json({
      payments: rows.map((row) => ({
        id: row.id,
        order_id: row.orderId,
        amount: typeof row.amount === 'string' ? Number(row.amount) : row.amount,
        currency_code: row.currencyCode,
        status: row.status,
        provider: row.provider,
        transaction_ref: row.transactionRef,
        created_at: row.createdAt
      })),
      pagination: { page, limit, total }
    })
  } catch (err) {
    next(err)
  }
})

export default router
