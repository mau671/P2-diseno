import { Router } from 'express'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'
import { db } from '../db'
import {
  itemCustomizations,
  orderItems,
  orders,
  recurringOrderCustomizations,
  recurringOrderItems,
  recurringOrders,
  savedMealCustomizations,
  savedMeals
} from '../db/schema'
import type { AuthRequest } from '../types/supabase'

const router = Router()

router.get('/me/recurring-orders', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const rows = await db
      .select({
        id: recurringOrders.id,
        status: recurringOrders.status,
        frequency: recurringOrders.frequency,
        nextRunAt: recurringOrders.nextRunAt,
        deliveryAddressId: recurringOrders.deliveryAddressId,
        paymentMethodId: recurringOrders.paymentMethodId,
        currencyCode: recurringOrders.currencyCode,
        restaurantId: recurringOrders.restaurantId,
        createdAt: recurringOrders.createdAt
      })
      .from(recurringOrders)
      .where(eq(recurringOrders.userId, userId))
      .orderBy(desc(recurringOrders.createdAt))

    const recurringIds = rows.map((row) => row.id)
    const items = recurringIds.length
        ? await db
          .select({
            id: recurringOrderItems.id,
            recurringOrderId: recurringOrderItems.recurringOrderId,
            baseId: recurringOrderItems.baseId,
            cookingMethodId: recurringOrderItems.cookingMethodId,
            quantity: recurringOrderItems.quantity,
            unitPrice: recurringOrderItems.unitPrice,
            subtotal: recurringOrderItems.subtotal
          })
          .from(recurringOrderItems)
          .where(inArray(recurringOrderItems.recurringOrderId, recurringIds))
      : []

    const itemsByRecurring = items.reduce<Record<string, typeof items>>((acc, item) => {
      const list = acc[item.recurringOrderId] ?? []
      list.push(item)
      acc[item.recurringOrderId] = list
      return acc
    }, {})

    const result = rows.map((row) => ({
      id: row.id,
      status: row.status,
      frequency: row.frequency,
      next_run_at: row.nextRunAt,
      delivery_address_id: row.deliveryAddressId,
      payment_method_id: row.paymentMethodId,
      currency_code: row.currencyCode,
      restaurant_id: row.restaurantId,
      items: (itemsByRecurring[row.id] ?? []).map((item) => ({
        id: item.id,
        recurring_order_id: item.recurringOrderId,
        base_id: item.baseId,
        cooking_method_id: item.cookingMethodId,
        quantity: item.quantity,
        unit_price: typeof item.unitPrice === 'string' ? Number(item.unitPrice) : item.unitPrice,
        subtotal: typeof item.subtotal === 'string' ? Number(item.subtotal) : item.subtotal
      }))
    }))

    return res.status(200).json({ recurring_orders: result })
  } catch (err) {
    next(err)
  }
})

router.post('/me/recurring-orders', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const {
      restaurant_id,
      currency_code,
      exchange_rate,
      status,
      frequency,
      next_run_at,
      delivery_address_id,
      payment_method_id,
      items,
      saved_meal_id,
      saved_meal_quantity,
      saved_meal_unit_price,
      saved_meal_subtotal
    } = req.body ?? {}

    if (!restaurant_id || !currency_code || !frequency || !next_run_at) {
      return res
        .status(400)
        .json({ error: 'restaurant_id, currency_code, frequency, next_run_at are required' })
    }

    let normalizedItems = Array.isArray(items) ? items : []

    if (!normalizedItems.length && saved_meal_id) {
      const savedMealRows = await db
        .select({ id: savedMeals.id, baseId: savedMeals.baseId, cookingMethodId: savedMeals.cookingMethodId })
        .from(savedMeals)
        .where(and(eq(savedMeals.userId, userId), eq(savedMeals.id, saved_meal_id)))
        .limit(1)

      const savedMeal = savedMealRows[0]
      if (!savedMeal) {
        return res.status(404).json({ error: 'Saved meal not found' })
      }

      if (typeof saved_meal_unit_price !== 'number' || typeof saved_meal_subtotal !== 'number') {
        return res.status(400).json({ error: 'saved_meal_unit_price and saved_meal_subtotal required' })
      }

      const savedMealCustomizationsRows = await db
        .select({
          ingredientId: savedMealCustomizations.ingredientId,
          action: savedMealCustomizations.action,
          qty: savedMealCustomizations.qty,
          deltaPrice: savedMealCustomizations.deltaPrice
        })
        .from(savedMealCustomizations)
        .where(eq(savedMealCustomizations.savedMealId, saved_meal_id))

      normalizedItems = [
        {
          base_id: savedMeal.baseId,
          cooking_method_id: savedMeal.cookingMethodId,
          quantity: typeof saved_meal_quantity === 'number' ? saved_meal_quantity : 1,
          unit_price: saved_meal_unit_price,
          subtotal: saved_meal_subtotal,
          customizations: savedMealCustomizationsRows.map((c) => ({
            ingredient_id: c.ingredientId,
            action: c.action,
            qty: c.qty,
            delta_price: c.deltaPrice
          }))
        }
      ]
    }

    if (!normalizedItems.length) {
      return res.status(400).json({ error: 'items are required' })
    }

    const createdId = await db.transaction(async (tx) => {
      const recurringRows = await tx
        .insert(recurringOrders)
        .values({
          userId,
          restaurantId: restaurant_id,
          currencyCode: currency_code,
          exchangeRate: typeof exchange_rate === 'number' ? exchange_rate.toFixed(6) : null,
          status: typeof status === 'string' ? status : 'active',
          frequency,
          nextRunAt: next_run_at,
          deliveryAddressId: delivery_address_id ?? null,
          paymentMethodId: payment_method_id ?? null
        })
        .returning({ id: recurringOrders.id })

      const recurringId = recurringRows[0]?.id
      if (!recurringId) {
        throw new Error('Failed to create recurring order')
      }

      for (const item of normalizedItems) {
        if (!item.base_id || item.unit_price === undefined || item.subtotal === undefined) {
          throw new Error('Each item must include base_id, unit_price, subtotal')
        }

        const itemRows = await tx
          .insert(recurringOrderItems)
          .values({
            recurringOrderId: recurringId,
            baseId: item.base_id,
            cookingMethodId: item.cooking_method_id ?? null,
            quantity: typeof item.quantity === 'number' ? item.quantity : 1,
            unitPrice: item.unit_price,
            subtotal: item.subtotal
          })
          .returning({ id: recurringOrderItems.id })

        const recurringItemId = itemRows[0]?.id
        if (recurringItemId && Array.isArray(item.customizations)) {
          const values = item.customizations
            .filter((c: { ingredient_id?: string; action?: string }) => c.ingredient_id && c.action)
            .map((c: { ingredient_id?: string; action?: string; qty?: number; delta_price?: number }) => ({
              recurringOrderItemId: recurringItemId,
              ingredientId: c.ingredient_id,
              action: c.action,
              qty: typeof c.qty === 'number' ? c.qty : 1,
              deltaPrice:
                typeof c.delta_price === 'number' ? c.delta_price.toFixed(2) : '0'
            }))

          if (values.length) {
            await tx.insert(recurringOrderCustomizations).values(values)
          }
        }
      }

      return recurringId
    })

    return res.status(201).json({ recurring_order_id: createdId })
  } catch (err) {
    next(err)
  }
})

router.put('/me/recurring-orders/:id', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!id) {
      return res.status(400).json({ error: 'Invalid recurring order id' })
    }

    const {
      frequency,
      next_run_at,
      delivery_address_id,
      payment_method_id,
      status
    } = req.body ?? {}

    const updateData: Record<string, unknown> = {}
    if (frequency) updateData.frequency = frequency
    if (next_run_at) updateData.nextRunAt = next_run_at
    if (delivery_address_id !== undefined) updateData.deliveryAddressId = delivery_address_id
    if (payment_method_id !== undefined) updateData.paymentMethodId = payment_method_id
    if (status) updateData.status = status

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ error: 'No valid fields provided' })
    }

    const rows = await db
      .update(recurringOrders)
      .set(updateData)
      .where(and(eq(recurringOrders.userId, userId), eq(recurringOrders.id, id)))
      .returning({ id: recurringOrders.id })

    if (!rows.length) {
      return res.status(404).json({ error: 'Recurring order not found' })
    }

    return res.status(200).json({ recurring_order_id: id })
  } catch (err) {
    next(err)
  }
})

router.patch('/me/recurring-orders/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { id } = req.params
    const { status } = req.body ?? {}

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!id) {
      return res.status(400).json({ error: 'Invalid recurring order id' })
    }

    if (!status) {
      return res.status(400).json({ error: 'status is required' })
    }

    const rows = await db
      .update(recurringOrders)
      .set({ status })
      .where(and(eq(recurringOrders.userId, userId), eq(recurringOrders.id, id)))
      .returning({ id: recurringOrders.id })

    if (!rows.length) {
      return res.status(404).json({ error: 'Recurring order not found' })
    }

    return res.status(200).json({ recurring_order_id: id })
  } catch (err) {
    next(err)
  }
})

router.post('/me/recurring-orders/:id/run', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!id) {
      return res.status(400).json({ error: 'Invalid recurring order id' })
    }

    const recurringRows = await db
      .select({
        id: recurringOrders.id,
        userId: recurringOrders.userId,
        restaurantId: recurringOrders.restaurantId,
        currencyCode: recurringOrders.currencyCode,
        exchangeRate: recurringOrders.exchangeRate,
        deliveryAddressId: recurringOrders.deliveryAddressId,
        paymentMethodId: recurringOrders.paymentMethodId
      })
      .from(recurringOrders)
      .where(and(eq(recurringOrders.userId, userId), eq(recurringOrders.id, id)))
      .limit(1)

    const recurring = recurringRows[0]
    if (!recurring) {
      return res.status(404).json({ error: 'Recurring order not found' })
    }

    const items = await db
      .select({
        id: recurringOrderItems.id,
        baseId: recurringOrderItems.baseId,
        cookingMethodId: recurringOrderItems.cookingMethodId,
        quantity: recurringOrderItems.quantity,
        unitPrice: recurringOrderItems.unitPrice,
        subtotal: recurringOrderItems.subtotal
      })
      .from(recurringOrderItems)
      .where(eq(recurringOrderItems.recurringOrderId, recurring.id))

    if (!items.length) {
      return res.status(400).json({ error: 'Recurring order has no items' })
    }

    const customizations = await db
      .select({
        recurringOrderItemId: recurringOrderCustomizations.recurringOrderItemId,
        ingredientId: recurringOrderCustomizations.ingredientId,
        action: recurringOrderCustomizations.action,
        qty: recurringOrderCustomizations.qty,
        deltaPrice: recurringOrderCustomizations.deltaPrice
      })
      .from(recurringOrderCustomizations)
      .where(inArray(recurringOrderCustomizations.recurringOrderItemId, items.map((i) => i.id)))

    const customizationsByItem = customizations.reduce<Record<string, typeof customizations>>(
      (acc, item) => {
        const list = acc[item.recurringOrderItemId] ?? []
        list.push(item)
        acc[item.recurringOrderItemId] = list
        return acc
      },
      {}
    )

    const createdOrderId = await db.transaction(async (tx) => {
      const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0)

      const orderRows = await tx
        .insert(orders)
        .values({
          userId,
          restaurantId: recurring.restaurantId,
          deliveryAddressId: recurring.deliveryAddressId,
          currencyCode: recurring.currencyCode,
          exchangeRate: recurring.exchangeRate ?? null,
          paymentMethodId: recurring.paymentMethodId ?? null,
          subtotal: subtotal.toFixed(2),
          tax: '0',
          total: subtotal.toFixed(2)
        })
        .returning({ id: orders.id })

      const orderId = orderRows[0]?.id
      if (!orderId) {
        throw new Error('Failed to create order')
      }

      for (const item of items) {
        const orderItemRows = await tx
          .insert(orderItems)
          .values({
            orderId,
            baseId: item.baseId,
            cookingMethodId: item.cookingMethodId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal
          })
          .returning({ id: orderItems.id })

        const orderItemId = orderItemRows[0]?.id
        const customizationRows = customizationsByItem[item.id] ?? []

        if (orderItemId && customizationRows.length) {
          await tx.insert(itemCustomizations).values(
            customizationRows.map((c) => ({
              orderItemId,
              ingredientId: c.ingredientId,
              action: c.action,
              qty: c.qty,
              deltaPrice: c.deltaPrice
            }))
          )
        }
      }

      return orderId
    })

    return res.status(201).json({ order_id: createdOrderId })
  } catch (err) {
    next(err)
  }
})

export default router
