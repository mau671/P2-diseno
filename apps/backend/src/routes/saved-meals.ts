import { Router } from 'express'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db'
import {
  cartItemCustomizations,
  cartItems,
  carts,
  baseCookingMethods,
  cookingMethods,
  ingredients,
  mealBases,
  recurringOrderCustomizations,
  recurringOrderItems,
  recurringOrders,
  savedMealCustomizations,
  savedMeals
} from '../db/schema'
import {
  TIME_ZONE_ID,
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
type IngredientInput = { ingredient_id?: string }

router.get('/', authMiddleware, rateLimitUser, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const rows = await db
      .select({
        id: savedMeals.id,
        name: savedMeals.name,
        baseId: savedMeals.baseId,
        baseName: mealBases.name,
        createdAt: savedMeals.createdAt
      })
      .from(savedMeals)
      .innerJoin(mealBases, eq(savedMeals.baseId, mealBases.id))
      .where(eq(savedMeals.userId, userId))
      .orderBy(desc(savedMeals.createdAt))

    return res.status(200).json({
      saved_meals: rows.map((row) => ({
        id: row.id,
        name: row.name,
        base_id: row.baseId,
        base_name: row.baseName,
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
      return res.status(400).json({ error: 'Invalid saved meal id' })
    }

    const rows = await db
      .select({
        id: savedMeals.id,
        name: savedMeals.name,
        baseId: savedMeals.baseId,
        baseName: mealBases.name,
        basePrice: mealBases.basePrice,
        cookingMethodId: savedMeals.cookingMethodId,
        createdAt: savedMeals.createdAt
      })
      .from(savedMeals)
      .innerJoin(mealBases, eq(savedMeals.baseId, mealBases.id))
      .where(and(eq(savedMeals.userId, userId), eq(savedMeals.id, id)))
      .limit(1)

    const savedMeal = rows[0]
    if (!savedMeal) {
      return res.status(404).json({ error: 'Saved meal not found' })
    }

    const customizationRows = await db
      .select({
        id: savedMealCustomizations.id,
        ingredientId: savedMealCustomizations.ingredientId,
        ingredientName: ingredients.name,
        action: savedMealCustomizations.action,
        qty: savedMealCustomizations.qty,
        deltaPrice: savedMealCustomizations.deltaPrice
      })
      .from(savedMealCustomizations)
      .innerJoin(ingredients, eq(savedMealCustomizations.ingredientId, ingredients.id))
      .where(eq(savedMealCustomizations.savedMealId, id))

    return res.status(200).json({
      saved_meal: {
        id: savedMeal.id,
        name: savedMeal.name,
        base_id: savedMeal.baseId,
        base_name: savedMeal.baseName,
        base_price: typeof savedMeal.basePrice === 'string' ? Number(savedMeal.basePrice) : savedMeal.basePrice,
        cooking_method_id: savedMeal.cookingMethodId,
        created_at: savedMeal.createdAt,
        customizations: customizationRows.map((row) => ({
          id: row.id,
          ingredient_id: row.ingredientId,
          ingredient_name: row.ingredientName,
          action: row.action,
          qty: row.qty,
          delta_price: typeof row.deltaPrice === 'string' ? Number(row.deltaPrice) : row.deltaPrice
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

    const name = normalizeText(req.body?.name)
    const mealBaseId = normalizeText(req.body?.meal_base_id)
    const cookingMethodId = normalizeText(req.body?.cooking_method_id)
    const customizations: CustomizationInput[] = Array.isArray(req.body?.customizations)
      ? req.body.customizations
      : []

    if (!name || !mealBaseId) {
      return res.status(400).json({ error: 'name and meal_base_id are required' })
    }

    const ingredientIds = customizations
      .map((item: IngredientInput) => normalizeText(item.ingredient_id))
      .filter((value) => value.length > 0)

    const ingredientRows = ingredientIds.length
      ? await db
          .select({ id: ingredients.id, unitPrice: ingredients.unitPrice })
          .from(ingredients)
          .where(inArray(ingredients.id, ingredientIds))
      : []

    const priceMap = new Map(ingredientRows.map((row) => [row.id, Number(row.unitPrice)]))

    const savedMealId = await db.transaction(async (tx) => {
      if (cookingMethodId) {
        const methodRows = await tx
          .select({ id: baseCookingMethods.methodId })
          .from(baseCookingMethods)
          .where(and(eq(baseCookingMethods.baseId, mealBaseId), eq(baseCookingMethods.methodId, cookingMethodId)))
          .limit(1)

        if (!methodRows.length) {
          throw new Error('Invalid cooking method for this base')
        }
      }

      const rows = await tx
        .insert(savedMeals)
        .values({ userId, baseId: mealBaseId, name, cookingMethodId: cookingMethodId || null })
        .returning({ id: savedMeals.id })

      const id = rows[0]?.id
      if (!id) {
        throw new Error('Failed to create saved meal')
      }

      const values = customizations
        .map((item) => ({
          ingredientId: normalizeText(item.ingredient_id),
          action: normalizeText(item.action),
          qty: typeof item.qty === 'number' ? item.qty : 1
        }))
        .filter((item) => item.ingredientId && item.action)
        .map((item) => ({
          savedMealId: id,
          ingredientId: item.ingredientId,
          action: item.action,
          qty: Math.max(1, item.qty),
          deltaPrice: ((priceMap.get(item.ingredientId) ?? 0) * Math.max(1, item.qty) * (item.action === 'remove' ? -1 : 1)).toFixed(2)
        }))

      if (values.length) {
        await tx.insert(savedMealCustomizations).values(values)
      }

      return id
    })

    return res.status(201).json({ saved_meal_id: savedMealId })
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
        return res.status(400).json({ error: 'Invalid saved meal id' })
      }

    const name = normalizeText(req.body?.name)
    const customizations: CustomizationInput[] = Array.isArray(req.body?.customizations)
      ? req.body.customizations
      : []

    const existing = await db
      .select({ id: savedMeals.id })
      .from(savedMeals)
      .where(and(eq(savedMeals.userId, userId), eq(savedMeals.id, id)))
      .limit(1)

    if (!existing.length) {
      return res.status(404).json({ error: 'Saved meal not found' })
    }

    const ingredientIds = customizations
      .map((item: IngredientInput) => normalizeText(item.ingredient_id))
      .filter((value) => value.length > 0)

    const ingredientRows = ingredientIds.length
      ? await db
          .select({ id: ingredients.id, unitPrice: ingredients.unitPrice })
          .from(ingredients)
          .where(inArray(ingredients.id, ingredientIds))
      : []

    const priceMap = new Map(ingredientRows.map((row) => [row.id, Number(row.unitPrice)]))

    await db.transaction(async (tx) => {
      if (name) {
        await tx.update(savedMeals).set({ name }).where(eq(savedMeals.id, id))
      }

      await tx.delete(savedMealCustomizations).where(eq(savedMealCustomizations.savedMealId, id))

      const values = customizations
        .map((item) => ({
          ingredientId: normalizeText(item.ingredient_id),
          action: normalizeText(item.action),
          qty: typeof item.qty === 'number' ? item.qty : 1
        }))
        .filter((item) => item.ingredientId && item.action)
        .map((item) => ({
          savedMealId: id,
          ingredientId: item.ingredientId,
          action: item.action,
          qty: Math.max(1, item.qty),
          deltaPrice: ((priceMap.get(item.ingredientId) ?? 0) * Math.max(1, item.qty) * (item.action === 'remove' ? -1 : 1)).toFixed(2)
        }))

      if (values.length) {
        await tx.insert(savedMealCustomizations).values(values)
      }
    })

    return res.status(200).json({ saved_meal_id: id })
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
        return res.status(400).json({ error: 'Invalid saved meal id' })
      }

    await db.delete(savedMeals).where(and(eq(savedMeals.userId, userId), eq(savedMeals.id, id)))
    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})

  router.post('/:id/add-to-cart', authMiddleware, rateLimitSensitive, async (req, res, next) => {
    try {
      const authRequest = req as AuthRequest
      const userId = authRequest.locals?.userId
      const { id } = req.params
      const quantity = Math.max(1, parseInt(String(req.body?.quantity ?? '1'), 10) || 1)
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      if (!id) {
        return res.status(400).json({ error: 'Invalid saved meal id' })
      }

    const savedMealRows = await db
      .select({
        id: savedMeals.id,
        baseId: savedMeals.baseId,
        restaurantId: mealBases.restaurantId,
        basePrice: mealBases.basePrice,
        cookingMethodId: savedMeals.cookingMethodId
      })
      .from(savedMeals)
      .innerJoin(mealBases, eq(savedMeals.baseId, mealBases.id))
      .where(and(eq(savedMeals.userId, userId), eq(savedMeals.id, id)))
      .limit(1)

    const savedMeal = savedMealRows[0]
    if (!savedMeal) {
      return res.status(404).json({ error: 'Saved meal not found' })
    }

    const customizationRows = await db
      .select({
        ingredientId: savedMealCustomizations.ingredientId,
        action: savedMealCustomizations.action,
        qty: savedMealCustomizations.qty
      })
      .from(savedMealCustomizations)
      .where(eq(savedMealCustomizations.savedMealId, id))

    const ingredientIds = customizationRows.map((row) => row.ingredientId)
    const ingredientRows = ingredientIds.length
      ? await db
          .select({ id: ingredients.id, unitPrice: ingredients.unitPrice })
          .from(ingredients)
          .where(inArray(ingredients.id, ingredientIds))
      : []

    const priceMap = new Map(ingredientRows.map((row) => [row.id, Number(row.unitPrice)]))
    const addedCharges = customizationRows
      .filter((row) => row.action === 'add')
      .reduce((sum, row) => sum + (priceMap.get(row.ingredientId) ?? 0) * row.qty, 0)
    const removedDiscounts = customizationRows
      .filter((row) => row.action === 'remove')
      .reduce((sum, row) => sum - (priceMap.get(row.ingredientId) ?? 0) * row.qty, 0)

    let cookingMethodDelta = 0
    if (savedMeal.cookingMethodId) {
      const methodRows = await db
        .select({ priceDelta: cookingMethods.priceDelta })
        .from(cookingMethods)
        .where(eq(cookingMethods.id, savedMeal.cookingMethodId))
        .limit(1)
      const methodRow = methodRows[0]
      cookingMethodDelta = methodRow ? Number(methodRow.priceDelta) : 0
    }

    const unitPrice = Number(savedMeal.basePrice) + cookingMethodDelta + addedCharges + removedDiscounts
    const subtotal = unitPrice * quantity

    const activeCartRows = await db
      .select({ id: carts.id, restaurantId: carts.restaurantId })
      .from(carts)
      .where(and(eq(carts.userId, userId), eq(carts.status, 'active')))
      .orderBy(desc(carts.updatedAt))
      .limit(1)

    const activeCart = activeCartRows[0]
    if (activeCart && activeCart.restaurantId !== savedMeal.restaurantId) {
      return res.status(409).json({ error: 'Cart belongs to a different restaurant' })
    }

    await db.transaction(async (tx) => {
      let cartId = activeCart?.id
      if (!cartId) {
        const rows = await tx
          .insert(carts)
          .values({ userId, restaurantId: savedMeal.restaurantId })
          .returning({ id: carts.id })
        cartId = rows[0]?.id
      }

      if (!cartId) {
        throw new Error('Failed to create cart')
      }

      const itemRows = await tx
        .insert(cartItems)
        .values({
          cartId,
          baseId: savedMeal.baseId,
          cookingMethodId: savedMeal.cookingMethodId,
          quantity,
          unitPrice: unitPrice.toFixed(2),
          subtotal: subtotal.toFixed(2)
        })
        .returning({ id: cartItems.id })

      const cartItemId = itemRows[0]?.id
      if (cartItemId) {
        const values = customizationRows.map((row) => ({
          cartItemId,
          ingredientId: row.ingredientId,
          action: row.action,
          qty: row.qty,
          deltaPrice: ((priceMap.get(row.ingredientId) ?? 0) * row.qty * (row.action === 'remove' ? -1 : 1)).toFixed(2)
        }))
        if (values.length) {
          await tx.insert(cartItemCustomizations).values(values)
        }
      }

      await tx.update(carts).set({ updatedAt: sql`now()` }).where(eq(carts.id, cartId))
    })

    return res.status(201).json({ success: true })
  } catch (err) {
    next(err)
  }
})

  router.post('/:id/create-recurring', authMiddleware, rateLimitSensitive, async (req, res, next) => {
    try {
      const authRequest = req as AuthRequest
      const userId = authRequest.locals?.userId
      const { id } = req.params
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      if (!id) {
        return res.status(400).json({ error: 'Invalid saved meal id' })
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
      currency_code
    } = req.body ?? {}

    if (!interval_unit || !interval_value || !next_run_at || !currency_code) {
      return res
        .status(400)
        .json({ error: 'interval_unit, interval_value, next_run_at, currency_code are required' })
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

    const savedMealRows = await db
      .select({
        id: savedMeals.id,
        baseId: savedMeals.baseId,
        restaurantId: mealBases.restaurantId,
        basePrice: mealBases.basePrice,
        cookingMethodId: savedMeals.cookingMethodId
      })
      .from(savedMeals)
      .innerJoin(mealBases, eq(savedMeals.baseId, mealBases.id))
      .where(and(eq(savedMeals.userId, userId), eq(savedMeals.id, id)))
      .limit(1)

    const savedMeal = savedMealRows[0]
    if (!savedMeal) {
      return res.status(404).json({ error: 'Saved meal not found' })
    }

    const customizationRows = await db
      .select({
        ingredientId: savedMealCustomizations.ingredientId,
        action: savedMealCustomizations.action,
        qty: savedMealCustomizations.qty,
        deltaPrice: savedMealCustomizations.deltaPrice
      })
      .from(savedMealCustomizations)
      .where(eq(savedMealCustomizations.savedMealId, id))

    const ingredientIds = customizationRows.map((row) => row.ingredientId)
    const ingredientRows = ingredientIds.length
      ? await db
          .select({ id: ingredients.id, unitPrice: ingredients.unitPrice })
          .from(ingredients)
          .where(inArray(ingredients.id, ingredientIds))
      : []

    const priceMap = new Map(ingredientRows.map((row) => [row.id, Number(row.unitPrice)]))
    const addedCharges = customizationRows
      .filter((row) => row.action === 'add')
      .reduce((sum, row) => sum + (priceMap.get(row.ingredientId) ?? 0) * row.qty, 0)
    const removedDiscounts = customizationRows
      .filter((row) => row.action === 'remove')
      .reduce((sum, row) => sum - (priceMap.get(row.ingredientId) ?? 0) * row.qty, 0)

    let cookingMethodDelta = 0
    if (savedMeal.cookingMethodId) {
      const methodRows = await db
        .select({ priceDelta: cookingMethods.priceDelta })
        .from(cookingMethods)
        .where(eq(cookingMethods.id, savedMeal.cookingMethodId))
        .limit(1)
      const methodRow = methodRows[0]
      cookingMethodDelta = methodRow ? Number(methodRow.priceDelta) : 0
    }

    const unitPrice = Number(savedMeal.basePrice) + cookingMethodDelta + addedCharges + removedDiscounts
    const subtotal = unitPrice

    const recurringId = await db.transaction(async (tx) => {
      const recurringRows = await tx
        .insert(recurringOrders)
        .values({
          userId,
          restaurantId: savedMeal.restaurantId,
          currencyCode: currency_code,
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

      const recurringOrderId = recurringRows[0]?.id
      if (!recurringOrderId) {
        throw new Error('Failed to create recurring order')
      }

      const itemRows = await tx
        .insert(recurringOrderItems)
        .values({
          recurringOrderId,
          baseId: savedMeal.baseId,
          cookingMethodId: savedMeal.cookingMethodId,
          quantity: 1,
          unitPrice: unitPrice.toFixed(2),
          subtotal: subtotal.toFixed(2)
        })
        .returning({ id: recurringOrderItems.id })

      const recurringItemId = itemRows[0]?.id
      if (recurringItemId && customizationRows.length) {
        await tx.insert(recurringOrderCustomizations).values(
          customizationRows.map((row) => ({
            recurringOrderItemId: recurringItemId,
            ingredientId: row.ingredientId,
            action: row.action,
            qty: row.qty,
            deltaPrice: row.deltaPrice
          }))
        )
      }

      return recurringOrderId
    })

    return res.status(201).json({ recurring_order_id: recurringId })
  } catch (err) {
    next(err)
  }
})

export default router
