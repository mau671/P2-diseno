import { Router } from 'express'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from '../db'
import {
  baseCookingMethods,
  cookingMethods,
  ingredients,
  itemCustomizations,
  mealBases,
  orderItems,
  orders,
  recurringOrderCustomizations,
  recurringOrderItems,
  recurringOrders
} from '../db/schema'
import {
  TIME_ZONE_ID,
  computeNextRunAt,
  formatDateInTz,
  normalizeDays,
  normalizeTimeWindows,
  validateFirstRun,
  validateSchedule
} from '../lib/recurring-schedule'
import { authMiddleware } from '../middleware/auth'
import { rateLimitSensitive, rateLimitUser } from '../middleware/rate-limit'
import type { AuthRequest } from '../types/supabase'

const router = Router()

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

type CustomizationInput = { ingredient_id?: string; action?: string; qty?: number }

const calculateItemPrice = async (
  baseId: string,
  cookingMethodId: string | undefined,
  customizations: { ingredientId: string; action: string; qty: number }[]
) => {
  const baseRows = await db
    .select({ basePrice: mealBases.basePrice })
    .from(mealBases)
    .where(eq(mealBases.id, baseId))
    .limit(1)
  const basePrice = Number(baseRows[0]?.basePrice ?? 0)

  let cookingMethodDelta = 0
  if (cookingMethodId) {
    const methodRows = await db
      .select({ priceDelta: cookingMethods.priceDelta })
      .from(baseCookingMethods)
      .innerJoin(cookingMethods, eq(baseCookingMethods.methodId, cookingMethods.id))
      .where(and(eq(baseCookingMethods.baseId, baseId), eq(baseCookingMethods.methodId, cookingMethodId)))
      .limit(1)
    const methodRow = methodRows[0]
    if (!methodRow) {
      throw new Error('Invalid cooking method for this base')
    }
    cookingMethodDelta = Number(methodRow.priceDelta)
  }

  const ingredientIds = customizations.map((customization) => customization.ingredientId)
  const ingredientRows = ingredientIds.length
    ? await db
        .select({ id: ingredients.id, unitPrice: ingredients.unitPrice })
        .from(ingredients)
        .where(inArray(ingredients.id, ingredientIds))
    : []

  const priceMap = new Map(ingredientRows.map((row) => [row.id, Number(row.unitPrice)]))
  const added = customizations
    .filter((customization) => customization.action === 'add')
    .reduce((sum, customization) => sum + (priceMap.get(customization.ingredientId) ?? 0) * customization.qty, 0)
  const removed = customizations
    .filter((customization) => customization.action === 'remove')
    .reduce((sum, customization) => sum - (priceMap.get(customization.ingredientId) ?? 0) * customization.qty, 0)

  return { basePrice, cookingMethodDelta, added, removed }
}

router.get('/', authMiddleware, rateLimitUser, async (req, res, next) => {
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
        nextRunAt: recurringOrders.nextRunAt,
        intervalUnit: recurringOrders.intervalUnit,
        intervalValue: recurringOrders.intervalValue,
        daysOfWeek: recurringOrders.daysOfWeek,
        daysOfMonth: recurringOrders.daysOfMonth,
        timeWindows: recurringOrders.timeWindows,
        timeZone: recurringOrders.timeZone,
        startDate: recurringOrders.startDate,
        endDate: recurringOrders.endDate,
        lastRunAt: recurringOrders.lastRunAt,
        deliveryAddressId: recurringOrders.deliveryAddressId,
        paymentMethodId: recurringOrders.paymentMethodId,
        currencyCode: recurringOrders.currencyCode,
        restaurantId: recurringOrders.restaurantId,
        createdAt: recurringOrders.createdAt
      })
      .from(recurringOrders)
      .where(eq(recurringOrders.userId, userId))
      .orderBy(desc(recurringOrders.createdAt))

    return res.status(200).json({
      recurring_orders: rows.map((row) => ({
        id: row.id,
        status: row.status,
        next_run_at: row.nextRunAt,
        interval_unit: row.intervalUnit,
        interval_value: row.intervalValue,
        days_of_week: row.daysOfWeek ?? [],
        days_of_month: row.daysOfMonth ?? [],
        time_windows: row.timeWindows ?? [],
        time_zone: row.timeZone,
        start_date: row.startDate,
        end_date: row.endDate,
        last_run_at: row.lastRunAt,
        delivery_address_id: row.deliveryAddressId,
        payment_method_id: row.paymentMethodId,
        currency_code: row.currencyCode,
        restaurant_id: row.restaurantId,
        created_at: row.createdAt
      }))
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', authMiddleware, rateLimitUser, async (req, res, next) => {
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

    const rows = await db
      .select({
        id: recurringOrders.id,
        status: recurringOrders.status,
        nextRunAt: recurringOrders.nextRunAt,
        intervalUnit: recurringOrders.intervalUnit,
        intervalValue: recurringOrders.intervalValue,
        daysOfWeek: recurringOrders.daysOfWeek,
        daysOfMonth: recurringOrders.daysOfMonth,
        timeWindows: recurringOrders.timeWindows,
        timeZone: recurringOrders.timeZone,
        startDate: recurringOrders.startDate,
        endDate: recurringOrders.endDate,
        lastRunAt: recurringOrders.lastRunAt,
        deliveryAddressId: recurringOrders.deliveryAddressId,
        paymentMethodId: recurringOrders.paymentMethodId,
        currencyCode: recurringOrders.currencyCode,
        restaurantId: recurringOrders.restaurantId,
        createdAt: recurringOrders.createdAt
      })
      .from(recurringOrders)
      .where(and(eq(recurringOrders.userId, userId), eq(recurringOrders.id, id)))
      .limit(1)

    const recurring = rows[0]
    if (!recurring) {
      return res.status(404).json({ error: 'Recurring order not found' })
    }

    const itemRows = await db
      .select({
        id: recurringOrderItems.id,
        baseId: recurringOrderItems.baseId,
        cookingMethodId: recurringOrderItems.cookingMethodId,
        quantity: recurringOrderItems.quantity,
        unitPrice: recurringOrderItems.unitPrice,
        subtotal: recurringOrderItems.subtotal
      })
      .from(recurringOrderItems)
      .where(eq(recurringOrderItems.recurringOrderId, id))

    const itemIds = itemRows.map((row) => row.id)
    const customizationRows = itemIds.length
      ? await db
          .select({
            recurringOrderItemId: recurringOrderCustomizations.recurringOrderItemId,
            ingredientId: recurringOrderCustomizations.ingredientId,
            action: recurringOrderCustomizations.action,
            qty: recurringOrderCustomizations.qty,
            deltaPrice: recurringOrderCustomizations.deltaPrice
          })
          .from(recurringOrderCustomizations)
          .where(inArray(recurringOrderCustomizations.recurringOrderItemId, itemIds))
      : []

    const customizationsByItem = customizationRows.reduce<Record<string, typeof customizationRows>>(
      (acc, row) => {
        const list = acc[row.recurringOrderItemId] ?? []
        list.push(row)
        acc[row.recurringOrderItemId] = list
        return acc
      },
      {}
    )

    return res.status(200).json({
      recurring_order: {
        id: recurring.id,
        status: recurring.status,
        next_run_at: recurring.nextRunAt,
        interval_unit: recurring.intervalUnit,
        interval_value: recurring.intervalValue,
        days_of_week: recurring.daysOfWeek ?? [],
        days_of_month: recurring.daysOfMonth ?? [],
        time_windows: recurring.timeWindows ?? [],
        time_zone: recurring.timeZone,
        start_date: recurring.startDate,
        end_date: recurring.endDate,
        last_run_at: recurring.lastRunAt,
        delivery_address_id: recurring.deliveryAddressId,
        payment_method_id: recurring.paymentMethodId,
        currency_code: recurring.currencyCode,
        restaurant_id: recurring.restaurantId,
        created_at: recurring.createdAt,
        items: itemRows.map((item) => ({
          id: item.id,
          base_id: item.baseId,
          quantity: item.quantity,
          unit_price: typeof item.unitPrice === 'string' ? Number(item.unitPrice) : item.unitPrice,
          subtotal: typeof item.subtotal === 'string' ? Number(item.subtotal) : item.subtotal,
          customizations: (customizationsByItem[item.id] ?? []).map((customization) => ({
            ingredient_id: customization.ingredientId,
            action: customization.action,
            qty: customization.qty,
            delta_price: typeof customization.deltaPrice === 'string'
              ? Number(customization.deltaPrice)
              : customization.deltaPrice
          }))
        }))
      }
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

    const {
      restaurant_id,
      currency_code,
      exchange_rate,
      status,
      next_run_at,
      interval_unit,
      interval_value,
      days_of_week,
      days_of_month,
      time_windows,
      end_date,
      delivery_address_id,
      payment_method_id,
      items
    } = req.body ?? {}

    if (!restaurant_id || !currency_code || !interval_unit || !interval_value || !next_run_at) {
      return res
        .status(400)
        .json({ error: 'restaurant_id, currency_code, interval_unit, interval_value, next_run_at are required' })
    }

    const intervalUnit = typeof interval_unit === 'string' ? interval_unit : ''
    const intervalValue = Number(interval_value)
    const daysOfWeek = normalizeDays(days_of_week, 0, 6)
    const daysOfMonth = normalizeDays(days_of_month, 1, 31)
    const timeWindows = normalizeTimeWindows(time_windows)

    const scheduleValidation = validateSchedule({
      intervalUnit,
      intervalValue,
      daysOfWeek,
      daysOfMonth,
      timeWindows
    })
    if (!scheduleValidation.ok) {
      return res.status(400).json({ error: scheduleValidation.error })
    }

    const firstRun = new Date(next_run_at)
    if (Number.isNaN(firstRun.getTime())) {
      return res.status(400).json({ error: 'next_run_at must be a valid date' })
    }

    const startDate = formatDateInTz(firstRun)
    const firstRunValidation = validateFirstRun({
      nextRunAt: firstRun,
      startDate,
      intervalUnit,
      intervalValue,
      daysOfWeek,
      daysOfMonth,
      timeWindows
    })
    if (!firstRunValidation.ok) {
      return res.status(400).json({ error: firstRunValidation.error })
    }

    const normalizedItems: Array<{
      base_id?: string
      cooking_method_id?: string
      unit_price?: number
      subtotal?: number
      quantity?: number
      customizations?: CustomizationInput[]
    }> = Array.isArray(items) ? items : []
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
          intervalUnit,
          intervalValue,
          daysOfWeek,
          daysOfMonth,
          timeWindows,
          timeZone: TIME_ZONE_ID,
          startDate,
          endDate: typeof end_date === 'string' ? end_date : null,
          nextRunAt: firstRun,
          deliveryAddressId: delivery_address_id ?? null,
          paymentMethodId: payment_method_id ?? null
        })
        .returning({ id: recurringOrders.id })

      const recurringId = recurringRows[0]?.id
      if (!recurringId) {
        throw new Error('Failed to create recurring order')
      }

      for (const item of normalizedItems) {
        if (!item.base_id) {
          throw new Error('Each item must include base_id')
        }

        const customizations = Array.isArray(item.customizations)
          ? item.customizations.map((customization: CustomizationInput) => ({
              ingredientId: normalizeText(customization.ingredient_id),
              action: normalizeText(customization.action),
              qty: typeof customization.qty === 'number' ? customization.qty : 1
            }))
          : []

        const { basePrice, cookingMethodDelta, added, removed } = await calculateItemPrice(
          item.base_id,
          normalizeText(item.cooking_method_id),
          customizations
        )
        const unitPrice =
          typeof item.unit_price === 'number'
            ? item.unit_price
            : basePrice + cookingMethodDelta + added + removed
        const subtotal = typeof item.subtotal === 'number' ? item.subtotal : unitPrice * (item.quantity ?? 1)

        const itemRows = await tx
          .insert(recurringOrderItems)
          .values({
            recurringOrderId: recurringId,
            baseId: item.base_id,
            cookingMethodId: normalizeText(item.cooking_method_id) || null,
            quantity: typeof item.quantity === 'number' ? item.quantity : 1,
            unitPrice: unitPrice.toFixed(2),
            subtotal: subtotal.toFixed(2)
          })
          .returning({ id: recurringOrderItems.id })

        const recurringItemId = itemRows[0]?.id
        if (recurringItemId && customizations.length) {
          const ingredientIds = customizations.map((customization) => customization.ingredientId)
          const ingredientRows = ingredientIds.length
            ? await tx
                .select({ id: ingredients.id, unitPrice: ingredients.unitPrice })
                .from(ingredients)
                .where(inArray(ingredients.id, ingredientIds))
            : []
          const priceMap = new Map(ingredientRows.map((row) => [row.id, Number(row.unitPrice)]))

          await tx.insert(recurringOrderCustomizations).values(
            customizations
              .filter((customization) => customization.ingredientId && customization.action)
              .map((customization) => ({
                recurringOrderItemId: recurringItemId,
                ingredientId: customization.ingredientId,
                action: customization.action,
                qty: typeof customization.qty === 'number' ? customization.qty : 1,
                deltaPrice: (
                  (priceMap.get(customization.ingredientId) ?? 0) *
                  Math.max(1, customization.qty) *
                  (customization.action === 'remove' ? -1 : 1)
                ).toFixed(2)
              }))
          )
        }
      }

      return recurringId
    })

    return res.status(201).json({ recurring_order_id: createdId })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', authMiddleware, rateLimitSensitive, async (req, res, next) => {
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
      interval_unit,
      interval_value,
      days_of_week,
      days_of_month,
      time_windows,
      next_run_at,
      end_date,
      delivery_address_id,
      payment_method_id,
      status
    } = req.body ?? {}

    const existingRows = await db
      .select({
        id: recurringOrders.id,
        intervalUnit: recurringOrders.intervalUnit,
        intervalValue: recurringOrders.intervalValue,
        daysOfWeek: recurringOrders.daysOfWeek,
        daysOfMonth: recurringOrders.daysOfMonth,
        timeWindows: recurringOrders.timeWindows,
        startDate: recurringOrders.startDate,
        nextRunAt: recurringOrders.nextRunAt
      })
      .from(recurringOrders)
      .where(and(eq(recurringOrders.userId, userId), eq(recurringOrders.id, id)))
      .limit(1)

    const existing = existingRows[0]
    if (!existing) {
      return res.status(404).json({ error: 'Recurring order not found' })
    }

    const hasScheduleUpdate =
      interval_unit !== undefined ||
      interval_value !== undefined ||
      days_of_week !== undefined ||
      days_of_month !== undefined ||
      time_windows !== undefined ||
      next_run_at !== undefined ||
      end_date !== undefined

    if (hasScheduleUpdate && !next_run_at) {
      return res.status(400).json({ error: 'next_run_at is required when updating schedule' })
    }

    const intervalUnit = typeof interval_unit === 'string' ? interval_unit : existing.intervalUnit
    const intervalValue = interval_value !== undefined ? Number(interval_value) : existing.intervalValue
    const daysOfWeek = days_of_week !== undefined
      ? normalizeDays(days_of_week, 0, 6)
      : (existing.daysOfWeek ?? [])
    const daysOfMonth = days_of_month !== undefined
      ? normalizeDays(days_of_month, 1, 31)
      : (existing.daysOfMonth ?? [])
    const timeWindows = time_windows !== undefined
      ? normalizeTimeWindows(time_windows)
      : ((existing.timeWindows ?? []) as { start: string; end: string }[])

    if (hasScheduleUpdate) {
      const scheduleValidation = validateSchedule({
        intervalUnit,
        intervalValue,
        daysOfWeek,
        daysOfMonth,
        timeWindows
      })
      if (!scheduleValidation.ok) {
        return res.status(400).json({ error: scheduleValidation.error })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (interval_unit !== undefined) updateData.intervalUnit = intervalUnit
    if (interval_value !== undefined) updateData.intervalValue = intervalValue
    if (days_of_week !== undefined) updateData.daysOfWeek = daysOfWeek
    if (days_of_month !== undefined) updateData.daysOfMonth = daysOfMonth
    if (time_windows !== undefined) updateData.timeWindows = timeWindows
    if (end_date !== undefined) updateData.endDate = typeof end_date === 'string' ? end_date : null
    if (next_run_at) {
      const firstRun = new Date(next_run_at)
      if (Number.isNaN(firstRun.getTime())) {
        return res.status(400).json({ error: 'next_run_at must be a valid date' })
      }
      const startDate = formatDateInTz(firstRun)
      const firstRunValidation = validateFirstRun({
        nextRunAt: firstRun,
        startDate,
        intervalUnit,
        intervalValue,
        daysOfWeek,
        daysOfMonth,
        timeWindows
      })
      if (!firstRunValidation.ok) {
        return res.status(400).json({ error: firstRunValidation.error })
      }
      updateData.nextRunAt = firstRun
      updateData.startDate = startDate
    }
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

router.patch('/:id/status', authMiddleware, rateLimitSensitive, async (req, res, next) => {
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

router.post('/:id/run-now', authMiddleware, rateLimitSensitive, async (req, res, next) => {
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
        restaurantId: recurringOrders.restaurantId,
        currencyCode: recurringOrders.currencyCode,
        exchangeRate: recurringOrders.exchangeRate,
        intervalUnit: recurringOrders.intervalUnit,
        intervalValue: recurringOrders.intervalValue,
        daysOfWeek: recurringOrders.daysOfWeek,
        daysOfMonth: recurringOrders.daysOfMonth,
        timeWindows: recurringOrders.timeWindows,
        startDate: recurringOrders.startDate,
        nextRunAt: recurringOrders.nextRunAt,
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
      .where(inArray(recurringOrderCustomizations.recurringOrderItemId, items.map((item) => item.id)))

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
            customizationRows.map((customization) => ({
              orderItemId,
              ingredientId: customization.ingredientId,
              action: customization.action,
              qty: customization.qty,
              deltaPrice: customization.deltaPrice
            }))
          )
        }
      }

      return orderId
    })

    const nextRunAt = computeNextRunAt({
      startDate: recurring.startDate,
      intervalUnit: recurring.intervalUnit,
      intervalValue: recurring.intervalValue,
      daysOfWeek: recurring.daysOfWeek ?? [],
      daysOfMonth: recurring.daysOfMonth ?? [],
      timeWindows: (recurring.timeWindows ?? []) as { start: string; end: string }[],
      fromDate: new Date(recurring.nextRunAt)
    })

    await db
      .update(recurringOrders)
      .set({
        lastRunAt: new Date(),
        nextRunAt: nextRunAt ?? recurring.nextRunAt
      })
      .where(and(eq(recurringOrders.userId, userId), eq(recurringOrders.id, id)))

    return res.status(201).json({ order_id: createdOrderId })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/skip', authMiddleware, rateLimitSensitive, async (req, res, next) => {
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

    const rows = await db
      .select({
        id: recurringOrders.id,
        nextRunAt: recurringOrders.nextRunAt,
        intervalUnit: recurringOrders.intervalUnit,
        intervalValue: recurringOrders.intervalValue,
        daysOfWeek: recurringOrders.daysOfWeek,
        daysOfMonth: recurringOrders.daysOfMonth,
        timeWindows: recurringOrders.timeWindows,
        startDate: recurringOrders.startDate
      })
      .from(recurringOrders)
      .where(and(eq(recurringOrders.userId, userId), eq(recurringOrders.id, id)))
      .limit(1)

    const recurring = rows[0]
    if (!recurring) {
      return res.status(404).json({ error: 'Recurring order not found' })
    }

    const nextRunAt = computeNextRunAt({
      startDate: recurring.startDate,
      intervalUnit: recurring.intervalUnit,
      intervalValue: recurring.intervalValue,
      daysOfWeek: recurring.daysOfWeek ?? [],
      daysOfMonth: recurring.daysOfMonth ?? [],
      timeWindows: (recurring.timeWindows ?? []) as { start: string; end: string }[],
      fromDate: new Date(recurring.nextRunAt)
    })
    if (!nextRunAt) {
      return res.status(400).json({ error: 'Unable to compute next run time' })
    }

    await db
      .update(recurringOrders)
      .set({ nextRunAt })
      .where(and(eq(recurringOrders.userId, userId), eq(recurringOrders.id, id)))

    return res.status(200).json({ success: true, next_run_at: nextRunAt.toISOString() })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', authMiddleware, rateLimitSensitive, async (req, res, next) => {
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

    await db.delete(recurringOrders).where(and(eq(recurringOrders.userId, userId), eq(recurringOrders.id, id)))
    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
