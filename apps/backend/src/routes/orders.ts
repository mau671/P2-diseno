import { Router } from 'express'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'
import { db } from '../db'
import {
  cartItemCustomizations,
  cartItems,
  carts,
  ingredients,
  itemCustomizations,
  mealBases,
  orderItems,
  orderStatusHistory,
  orders,
  paymentMethods,
  restaurantCurrencies,
  restaurantUsers
} from '../db/schema'
import { rateLimitAdmin, rateLimitSensitive, rateLimitUser } from '../middleware/rate-limit'
import type { AuthRequest } from '../types/supabase'

const router = Router()

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

router.get('/', authMiddleware, rateLimitUser, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const status = normalizeText(req.query.status)
    const restaurantId = normalizeText(req.query.restaurant_id)
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20))

    const conditions = [eq(orders.userId, userId)]
    if (status) {
      conditions.push(eq(orders.status, status))
    }
    if (restaurantId) {
      conditions.push(eq(orders.restaurantId, restaurantId))
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
        tax: orders.tax,
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
        subtotal: typeof row.subtotal === 'string' ? Number(row.subtotal) : row.subtotal,
        tax: typeof row.tax === 'string' ? Number(row.tax) : row.tax,
        total: typeof row.total === 'string' ? Number(row.total) : row.total,
        currency_code: row.currencyCode,
        created_at: row.createdAt
      })),
      pagination: { page, limit, total }
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:orderId', authMiddleware, rateLimitUser, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { orderId } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!orderId) {
      return res.status(400).json({ error: 'Invalid order id' })
    }

    const orderIdParam = orderId

    const rows = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        restaurantId: orders.restaurantId,
        status: orders.status,
        deliveryAddressId: orders.deliveryAddressId,
        currencyCode: orders.currencyCode,
        paymentMethodId: orders.paymentMethodId,
        subtotal: orders.subtotal,
        tax: orders.tax,
        total: orders.total,
        createdAt: orders.createdAt
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    const order = rows[0]
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const itemRows = await db
      .select({
        id: orderItems.id,
        baseId: orderItems.baseId,
        baseName: mealBases.name,
        cookingMethodId: orderItems.cookingMethodId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        subtotal: orderItems.subtotal
      })
      .from(orderItems)
      .innerJoin(mealBases, eq(orderItems.baseId, mealBases.id))
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

    const historyRows = await db
      .select({
        status: orderStatusHistory.status,
        changedAt: orderStatusHistory.changedAt,
        changedBy: orderStatusHistory.changedBy
      })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(desc(orderStatusHistory.changedAt))

    const customizationByItem = customizationRows.reduce<Record<string, typeof customizationRows>>(
      (acc, row) => {
        const list = acc[row.orderItemId] ?? []
        list.push(row)
        acc[row.orderItemId] = list
        return acc
      },
      {}
    )

    return res.status(200).json({
      order: {
        id: order.id,
        restaurant_id: order.restaurantId,
        status: order.status,
        delivery_address_id: order.deliveryAddressId,
        currency_code: order.currencyCode,
        payment_method_id: order.paymentMethodId,
        subtotal: typeof order.subtotal === 'string' ? Number(order.subtotal) : order.subtotal,
        tax: typeof order.tax === 'string' ? Number(order.tax) : order.tax,
        total: typeof order.total === 'string' ? Number(order.total) : order.total,
        created_at: order.createdAt,
        items: itemRows.map((item) => ({
          id: item.id,
          base_id: item.baseId,
          cooking_method_id: item.cookingMethodId,
          base_name: item.baseName,
          quantity: item.quantity,
          unit_price: typeof item.unitPrice === 'string' ? Number(item.unitPrice) : item.unitPrice,
          subtotal: typeof item.subtotal === 'string' ? Number(item.subtotal) : item.subtotal,
          customizations: (customizationByItem[item.id] ?? []).map((customization) => ({
            ingredient_id: customization.ingredientId,
            ingredient_name: customization.ingredientName,
            action: customization.action,
            qty: customization.qty,
            delta_price: typeof customization.deltaPrice === 'string'
              ? Number(customization.deltaPrice)
              : customization.deltaPrice
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

router.get('/:orderId/tracking', authMiddleware, rateLimitUser, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { orderId } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!orderId) {
      return res.status(400).json({ error: 'Invalid order id' })
    }

    const orderIdParam = orderId

    const rows = await db
      .select({ id: orders.id, userId: orders.userId, status: orders.status, createdAt: orders.createdAt })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    const order = rows[0]
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const historyRows = await db
      .select({
        status: orderStatusHistory.status,
        changedAt: orderStatusHistory.changedAt
      })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(desc(orderStatusHistory.changedAt))

    return res.status(200).json({
      order_id: order.id,
      status: order.status,
      created_at: order.createdAt,
      status_history: historyRows.map((row) => ({
        status: row.status,
        changed_at: row.changedAt
      }))
    })
  } catch (err) {
    next(err)
  }
})

router.post('/', authMiddleware, rateLimitSensitive, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { cart_id, delivery_address_id, payment_method_id } = req.body ?? {}
    if (!cart_id) {
      return res.status(400).json({ error: 'cart_id is required' })
    }

    const cartRows = await db
      .select({ id: carts.id, userId: carts.userId, restaurantId: carts.restaurantId })
      .from(carts)
      .where(eq(carts.id, cart_id))
      .limit(1)

    const cart = cartRows[0]
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }
    if (cart.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const itemRows = await db
      .select({
        id: cartItems.id,
        baseId: cartItems.baseId,
        cookingMethodId: cartItems.cookingMethodId,
        quantity: cartItems.quantity,
        unitPrice: cartItems.unitPrice,
        subtotal: cartItems.subtotal
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id))

    if (!itemRows.length) {
      return res.status(400).json({ error: 'Cart is empty' })
    }

    const customizations = await db
      .select({
        cartItemId: cartItemCustomizations.cartItemId,
        ingredientId: cartItemCustomizations.ingredientId,
        action: cartItemCustomizations.action,
        qty: cartItemCustomizations.qty,
        deltaPrice: cartItemCustomizations.deltaPrice
      })
      .from(cartItemCustomizations)
      .where(inArray(cartItemCustomizations.cartItemId, itemRows.map((row) => row.id)))

    const customizationsByItem = customizations.reduce<Record<string, typeof customizations>>(
      (acc, row) => {
        const list = acc[row.cartItemId] ?? []
        list.push(row)
        acc[row.cartItemId] = list
        return acc
      },
      {}
    )

    const currencyRows = await db
      .select({ currencyCode: restaurantCurrencies.currencyCode })
      .from(restaurantCurrencies)
      .where(and(eq(restaurantCurrencies.restaurantId, cart.restaurantId), eq(restaurantCurrencies.isDefault, true)))
      .limit(1)

    const currencyCode = currencyRows[0]?.currencyCode ?? 'CRC'

    let paymentMethod = null
    if (payment_method_id) {
      const methodRows = await db
        .select({ type: paymentMethods.type })
        .from(paymentMethods)
        .where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.id, payment_method_id)))
        .limit(1)
      paymentMethod = methodRows[0]?.type ?? null
    }

    const createdOrderId = await db.transaction(async (tx) => {
      const subtotal = itemRows.reduce((sum, row) => sum + Number(row.subtotal), 0)
      const orderRows = await tx
        .insert(orders)
        .values({
          userId,
          restaurantId: cart.restaurantId,
          deliveryAddressId: delivery_address_id ?? null,
          status: 'pending',
          currencyCode,
          paymentMethod: paymentMethod ?? null,
          paymentMethodId: payment_method_id ?? null,
          subtotal: subtotal.toFixed(2),
          tax: '0',
          total: subtotal.toFixed(2)
        })
        .returning({ id: orders.id })

      const orderId = orderRows[0]?.id
      if (!orderId) {
        throw new Error('Failed to create order')
      }

      for (const item of itemRows) {
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
        const itemCustomizationRows = customizationsByItem[item.id] ?? []

        if (orderItemId && itemCustomizationRows.length) {
          await tx.insert(itemCustomizations).values(
            itemCustomizationRows.map((customization) => ({
              orderItemId,
              ingredientId: customization.ingredientId,
              action: customization.action,
              qty: customization.qty,
              deltaPrice: customization.deltaPrice
            }))
          )
        }
      }

      await tx.insert(orderStatusHistory).values({
        orderId,
        status: 'pending',
        changedBy: userId
      })

      await tx.delete(carts).where(eq(carts.id, cart.id))

      return orderId
    })

    return res.status(201).json({ order_id: createdOrderId })
  } catch (err) {
    next(err)
  }
})

router.post('/:orderId/cancel', authMiddleware, rateLimitSensitive, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { orderId } = req.params
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!orderId) {
      return res.status(400).json({ error: 'Invalid order id' })
    }

    const orderRows = await db
      .select({ id: orders.id, userId: orders.userId, status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    const order = orderRows[0]
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled' })
    }

    await db.transaction(async (tx) => {
      await tx.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, order.id))
      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        status: 'cancelled',
        changedBy: userId
      })
    })

    return res.status(200).json({ order_id: order.id, status: 'cancelled' })
  } catch (err) {
    next(err)
  }
})

router.post('/:orderId/reorder', authMiddleware, rateLimitSensitive, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { orderId } = req.params
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!orderId) {
      return res.status(400).json({ error: 'Invalid order id' })
    }

    const orderRows = await db
      .select({ id: orders.id, userId: orders.userId, restaurantId: orders.restaurantId })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    const order = orderRows[0]
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const itemRows = await db
      .select({
        id: orderItems.id,
        baseId: orderItems.baseId,
        cookingMethodId: orderItems.cookingMethodId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        subtotal: orderItems.subtotal
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))

    const customizationRows = await db
      .select({
        orderItemId: itemCustomizations.orderItemId,
        ingredientId: itemCustomizations.ingredientId,
        action: itemCustomizations.action,
        qty: itemCustomizations.qty,
        deltaPrice: itemCustomizations.deltaPrice
      })
      .from(itemCustomizations)
      .where(inArray(itemCustomizations.orderItemId, itemRows.map((row) => row.id)))

    const customizationsByItem = customizationRows.reduce<Record<string, typeof customizationRows>>(
      (acc, row) => {
        const list = acc[row.orderItemId] ?? []
        list.push(row)
        acc[row.orderItemId] = list
        return acc
      },
      {}
    )

    const activeCartRows = await db
      .select({ id: carts.id, restaurantId: carts.restaurantId })
      .from(carts)
      .where(and(eq(carts.userId, userId), eq(carts.status, 'active')))
      .orderBy(desc(carts.updatedAt))
      .limit(1)

    const activeCart = activeCartRows[0]
    if (activeCart && activeCart.restaurantId !== order.restaurantId) {
      return res.status(409).json({ error: 'Cart belongs to a different restaurant' })
    }

    const cartId = await db.transaction(async (tx) => {
      let currentCartId = activeCart?.id
      if (!currentCartId) {
        const cartRows = await tx
          .insert(carts)
          .values({ userId, restaurantId: order.restaurantId })
          .returning({ id: carts.id })
        currentCartId = cartRows[0]?.id
      }

      if (!currentCartId) {
        throw new Error('Failed to create cart')
      }

      for (const item of itemRows) {
        const cartItemRows = await tx
          .insert(cartItems)
          .values({
            cartId: currentCartId,
            baseId: item.baseId,
            cookingMethodId: item.cookingMethodId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal
          })
          .returning({ id: cartItems.id })

        const cartItemId = cartItemRows[0]?.id
        const orderCustomizations = customizationsByItem[item.id] ?? []
        if (cartItemId && orderCustomizations.length) {
          await tx.insert(cartItemCustomizations).values(
            orderCustomizations.map((customization) => ({
              cartItemId,
              ingredientId: customization.ingredientId,
              action: customization.action,
              qty: customization.qty,
              deltaPrice: customization.deltaPrice
            }))
          )
        }
      }

      await tx.update(carts).set({ updatedAt: sql`now()` }).where(eq(carts.id, currentCartId))
      return currentCartId
    })

    return res.status(201).json({ cart_id: cartId })
  } catch (err) {
    next(err)
  }
})

router.patch('/:orderId/status', authMiddleware, rateLimitAdmin, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { orderId } = req.params
    const { status } = req.body ?? {}

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!orderId) {
      return res.status(400).json({ error: 'Invalid order id' })
    }

    if (typeof status !== 'string' || status.trim().length === 0) {
      return res.status(400).json({ error: 'status is required' })
    }

    const orderRows = await db
      .select({ restaurantId: orders.restaurantId })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    const order = orderRows[0]
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const adminRoles = ['owner', 'admin']
    const membershipRows = await db
      .select({ role: restaurantUsers.role })
      .from(restaurantUsers)
      .where(
        and(
          eq(restaurantUsers.userId, userId),
          eq(restaurantUsers.restaurantId, order.restaurantId),
          inArray(sql`lower(${restaurantUsers.role})`, adminRoles)
        )
      )

    if (!membershipRows.length) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const updated = await db.transaction(async (tx) => {
      const updatedRows = await tx
        .update(orders)
        .set({ status })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, status: orders.status })

      const order = updatedRows[0]
      if (!order) {
        return null
      }

      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        status,
        changedBy: userId
      })

      return order
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
