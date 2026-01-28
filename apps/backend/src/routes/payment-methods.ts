import { Router } from 'express'
import { and, desc, eq } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'
import { db } from '../db'
import { paymentMethods } from '../db/schema'
import type { AuthRequest } from '../types/supabase'

const router = Router()

router.get('/me/payment-methods', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const rows = await db
      .select({
        id: paymentMethods.id,
        type: paymentMethods.type,
        name: paymentMethods.name,
        lastFour: paymentMethods.lastFour,
        expiryMonth: paymentMethods.expiryMonth,
        expiryYear: paymentMethods.expiryYear,
        isDefault: paymentMethods.isDefault,
        createdAt: paymentMethods.createdAt
      })
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, userId))
      .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt))

    return res.status(200).json({ payment_methods: rows })
  } catch (err) {
    next(err)
  }
})

router.post('/me/payment-methods', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { type, name, last_four, expiry_month, expiry_year, is_default } = req.body ?? {}

    if (!type || !name) {
      return res.status(400).json({ error: 'type and name are required' })
    }

    const created = await db.transaction(async (tx) => {
      if (is_default) {
        await tx
          .update(paymentMethods)
          .set({ isDefault: false })
          .where(eq(paymentMethods.userId, userId))
      }

      const rows = await tx
        .insert(paymentMethods)
        .values({
          userId,
          type,
          name,
          lastFour: typeof last_four === 'string' ? last_four : null,
          expiryMonth: typeof expiry_month === 'number' ? expiry_month : null,
          expiryYear: typeof expiry_year === 'number' ? expiry_year : null,
          isDefault: Boolean(is_default)
        })
        .returning({ id: paymentMethods.id })

      return rows[0]?.id
    })

    return res.status(201).json({ payment_method_id: created })
  } catch (err) {
    next(err)
  }
})

router.put('/me/payment-methods/:id', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!id) {
      return res.status(400).json({ error: 'Invalid payment method id' })
    }

    const existing = await db
      .select({ id: paymentMethods.id })
      .from(paymentMethods)
      .where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.id, id)))
      .limit(1)

    if (!existing.length) {
      return res.status(404).json({ error: 'Payment method not found' })
    }

    const { type, name, last_four, expiry_month, expiry_year, is_default } = req.body ?? {}

    await db.transaction(async (tx) => {
      if (is_default) {
        await tx
          .update(paymentMethods)
          .set({ isDefault: false })
          .where(eq(paymentMethods.userId, userId))
      }

      const updateData: Record<string, unknown> = {}
      if (type) updateData.type = type
      if (name) updateData.name = name
      if (last_four !== undefined) updateData.lastFour = last_four
      if (expiry_month !== undefined) updateData.expiryMonth = expiry_month
      if (expiry_year !== undefined) updateData.expiryYear = expiry_year
      if (is_default !== undefined) updateData.isDefault = Boolean(is_default)

      if (Object.keys(updateData).length > 0) {
        await tx
          .update(paymentMethods)
          .set(updateData)
          .where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.id, id)))
      }
    })

    return res.status(200).json({ payment_method_id: id })
  } catch (err) {
    next(err)
  }
})

router.delete('/me/payment-methods/:id', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!id) {
      return res.status(400).json({ error: 'Invalid payment method id' })
    }

    await db
      .delete(paymentMethods)
      .where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.id, id)))

    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.patch('/me/payment-methods/:id/default', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!id) {
      return res.status(400).json({ error: 'Invalid payment method id' })
    }

    await db.transaction(async (tx) => {
      await tx
        .update(paymentMethods)
        .set({ isDefault: false })
        .where(eq(paymentMethods.userId, userId))

      await tx
        .update(paymentMethods)
        .set({ isDefault: true })
        .where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.id, id)))
    })

    return res.status(200).json({ payment_method_id: id })
  } catch (err) {
    next(err)
  }
})

export default router
