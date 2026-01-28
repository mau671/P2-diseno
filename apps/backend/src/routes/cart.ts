import { Router } from 'express'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db'
import {
  baseIngredients,
  baseCookingMethods,
  cartItemCustomizations,
  cartItems,
  carts,
  cookingMethods,
  ingredients,
  mealBases
} from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import { rateLimitSensitive, rateLimitUser } from '../middleware/rate-limit'
import { getRestrictionWarnings } from '../lib/restrictions'
import type { AuthRequest } from '../types/supabase'

const router = Router()

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

const parseNumber = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return NaN
}

type IngredientInput = { ingredient_id?: string; qty?: number }
type NormalizedIngredient = { ingredientId: string; qty: number }

const getActiveCart = async (userId: string) => {
  const rows = await db
    .select({
      id: carts.id,
      restaurantId: carts.restaurantId,
      status: carts.status,
      createdAt: carts.createdAt,
      updatedAt: carts.updatedAt
    })
    .from(carts)
    .where(and(eq(carts.userId, userId), eq(carts.status, 'active')))
    .orderBy(desc(carts.updatedAt))
    .limit(1)

  return rows[0] ?? null
}

const buildCartResponse = async (cartId: string, userId: string) => {
  const cartRows = await db
    .select({
      id: carts.id,
      restaurantId: carts.restaurantId,
      status: carts.status,
      createdAt: carts.createdAt,
      updatedAt: carts.updatedAt
    })
    .from(carts)
    .where(eq(carts.id, cartId))
    .limit(1)

  const cart = cartRows[0]
  if (!cart) {
    return null
  }

    const itemRows = await db
      .select({
        id: cartItems.id,
        baseId: cartItems.baseId,
        baseName: mealBases.name,
        cookingMethodId: cartItems.cookingMethodId,
        quantity: cartItems.quantity,
        unitPrice: cartItems.unitPrice,
        subtotal: cartItems.subtotal
      })
    .from(cartItems)
    .innerJoin(mealBases, eq(cartItems.baseId, mealBases.id))
    .where(eq(cartItems.cartId, cart.id))

  const itemIds = itemRows.map((row) => row.id)
  const customizationRows = itemIds.length
    ? await db
        .select({
          id: cartItemCustomizations.id,
          cartItemId: cartItemCustomizations.cartItemId,
          ingredientId: cartItemCustomizations.ingredientId,
          ingredientName: ingredients.name,
          action: cartItemCustomizations.action,
          qty: cartItemCustomizations.qty,
          deltaPrice: cartItemCustomizations.deltaPrice
        })
        .from(cartItemCustomizations)
        .innerJoin(ingredients, eq(cartItemCustomizations.ingredientId, ingredients.id))
        .where(inArray(cartItemCustomizations.cartItemId, itemIds))
    : []

  const customizationsByItem = customizationRows.reduce<Record<string, typeof customizationRows>>(
    (acc, row) => {
      const list = acc[row.cartItemId] ?? []
      list.push(row)
      acc[row.cartItemId] = list
      return acc
    },
    {}
  )

  const baseIds = itemRows.map((row) => row.baseId)
  const baseIngredientRows = baseIds.length
    ? await db
        .select({ baseId: baseIngredients.baseId, ingredientId: baseIngredients.ingredientId })
        .from(baseIngredients)
        .where(inArray(baseIngredients.baseId, baseIds))
    : []

  const baseIngredientsByBase = baseIngredientRows.reduce<Record<string, string[]>>((acc, row) => {
    const list = acc[row.baseId] ?? []
    list.push(row.ingredientId)
    acc[row.baseId] = list
    return acc
  }, {})

  const allIngredientIds = new Set<string>()
  for (const item of itemRows) {
    const baseIds = baseIngredientsByBase[item.baseId] ?? []
    for (const id of baseIds) allIngredientIds.add(id)
    const customizations = customizationsByItem[item.id] ?? []
    for (const customization of customizations) {
      allIngredientIds.add(customization.ingredientId)
    }
  }

  const warnings = await getRestrictionWarnings(userId, Array.from(allIngredientIds))
  const warningsByIngredient = warnings.reduce<Record<string, typeof warnings>>((acc, row) => {
    const list = acc[row.ingredientId] ?? []
    list.push(row)
    acc[row.ingredientId] = list
    return acc
  }, {})

  const items = itemRows.map((item) => {
    const baseIngredientIds = baseIngredientsByBase[item.baseId] ?? []
    const customizations = customizationsByItem[item.id] ?? []
    const itemIngredientIds = new Set<string>(baseIngredientIds)
    for (const customization of customizations) {
      itemIngredientIds.add(customization.ingredientId)
    }
    const restrictionWarnings = Array.from(itemIngredientIds)
      .flatMap((ingredientId) => warningsByIngredient[ingredientId] ?? [])
      .map((warning) => ({
        restriction_id: warning.restrictionId,
        restriction_name: warning.restrictionName,
        ingredient_id: warning.ingredientId,
        ingredient_name: warning.ingredientName
      }))

    return {
      id: item.id,
      base_id: item.baseId,
      cooking_method_id: item.cookingMethodId,
      base_name: item.baseName,
      quantity: item.quantity,
      unit_price: typeof item.unitPrice === 'string' ? Number(item.unitPrice) : item.unitPrice,
      subtotal: typeof item.subtotal === 'string' ? Number(item.subtotal) : item.subtotal,
      customizations: customizations.map((customization) => ({
        id: customization.id,
        ingredient_id: customization.ingredientId,
        ingredient_name: customization.ingredientName,
        action: customization.action,
        qty: customization.qty,
        delta_price: typeof customization.deltaPrice === 'string'
          ? Number(customization.deltaPrice)
          : customization.deltaPrice
      })),
      restriction_warnings: restrictionWarnings
    }
  })

  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0)

  return {
    id: cart.id,
    restaurant_id: cart.restaurantId,
    status: cart.status,
    items,
    subtotal,
    tax: 0,
    total: subtotal,
    item_count: items.reduce((sum, item) => sum + Number(item.quantity), 0),
    created_at: cart.createdAt,
    updated_at: cart.updatedAt
  }
}

router.get('/', authMiddleware, rateLimitUser, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const activeCart = await getActiveCart(userId)
    if (!activeCart) {
      return res.status(200).json({ cart: null })
    }

    const cart = await buildCartResponse(activeCart.id, userId)
    return res.status(200).json({ cart })
  } catch (err) {
    next(err)
  }
})

router.get('/summary', authMiddleware, rateLimitUser, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const activeCart = await getActiveCart(userId)
    if (!activeCart) {
      return res.status(200).json({ has_active_cart: false, item_count: 0, subtotal: 0 })
    }

    const rows = await db
      .select({ subtotal: cartItems.subtotal, quantity: cartItems.quantity })
      .from(cartItems)
      .where(eq(cartItems.cartId, activeCart.id))

    const subtotal = rows.reduce((sum, row) => sum + Number(row.subtotal), 0)
    const itemCount = rows.reduce((sum, row) => sum + Number(row.quantity), 0)

    return res.status(200).json({
      has_active_cart: true,
      cart_id: activeCart.id,
      item_count: itemCount,
      subtotal
    })
  } catch (err) {
    next(err)
  }
})

router.post('/items', authMiddleware, rateLimitSensitive, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const mealBaseId = normalizeText(req.body?.meal_base_id)
    const cookingMethodId = normalizeText(req.body?.cooking_method_id)
    const quantity = Math.max(1, parseInt(String(req.body?.quantity ?? '1'), 10) || 1)
    const addedIngredients: IngredientInput[] = Array.isArray(req.body?.added_ingredients)
      ? req.body.added_ingredients
      : []
    const removedIngredients: IngredientInput[] = Array.isArray(req.body?.removed_ingredients)
      ? req.body.removed_ingredients
      : []

    if (!mealBaseId) {
      return res.status(400).json({ error: 'meal_base_id is required' })
    }

    const baseRows = await db
      .select({ id: mealBases.id, restaurantId: mealBases.restaurantId, basePrice: mealBases.basePrice })
      .from(mealBases)
      .where(eq(mealBases.id, mealBaseId))
      .limit(1)

    const mealBase = baseRows[0]
    if (!mealBase) {
      return res.status(404).json({ error: 'Meal base not found' })
    }

    const addedItems: NormalizedIngredient[] = addedIngredients
      .map((item) => ({
        ingredientId: normalizeText(item.ingredient_id),
        qty: typeof item.qty === 'number' ? item.qty : 1
      }))
      .filter((item): item is NormalizedIngredient => item.ingredientId.length > 0)

    const removedItems: NormalizedIngredient[] = removedIngredients
      .map((item) => ({
        ingredientId: normalizeText(item.ingredient_id),
        qty: typeof item.qty === 'number' ? item.qty : 1
      }))
      .filter((item): item is NormalizedIngredient => item.ingredientId.length > 0)

    const ingredientIds = Array.from(
      new Set([...addedItems.map((item) => item.ingredientId), ...removedItems.map((item) => item.ingredientId)])
    )

    let cookingMethodDelta = 0
    if (cookingMethodId) {
      const methodRows = await db
        .select({ priceDelta: cookingMethods.priceDelta })
        .from(baseCookingMethods)
        .innerJoin(cookingMethods, eq(baseCookingMethods.methodId, cookingMethods.id))
        .where(and(eq(baseCookingMethods.baseId, mealBaseId), eq(baseCookingMethods.methodId, cookingMethodId)))
        .limit(1)

      if (!methodRows.length) {
        return res.status(400).json({ error: 'Invalid cooking method for this base' })
      }

      const methodRow = methodRows[0]
      if (!methodRow) {
        return res.status(400).json({ error: 'Invalid cooking method for this base' })
      }

      cookingMethodDelta = Number(methodRow.priceDelta)
    }

    const ingredientRows = ingredientIds.length
      ? await db
          .select({ id: ingredients.id, unitPrice: ingredients.unitPrice })
          .from(ingredients)
          .where(inArray(ingredients.id, ingredientIds))
      : []

    const priceMap = new Map(ingredientRows.map((row) => [row.id, Number(row.unitPrice)]))

    const addedCharges = addedItems.reduce((sum: number, item: NormalizedIngredient) => {
      const price = priceMap.get(item.ingredientId) ?? 0
      return sum + price * Math.max(1, item.qty)
    }, 0)

    const removedDiscounts = removedItems.reduce((sum: number, item: NormalizedIngredient) => {
      const price = priceMap.get(item.ingredientId) ?? 0
      return sum - price * Math.max(1, item.qty)
    }, 0)

    const unitPrice = Number(mealBase.basePrice) + cookingMethodDelta + addedCharges + removedDiscounts
    const subtotal = unitPrice * quantity

    const activeCart = await getActiveCart(userId)
    if (activeCart && activeCart.restaurantId !== mealBase.restaurantId) {
      return res.status(409).json({ error: 'Cart belongs to a different restaurant' })
    }

    const cartId = await db.transaction(async (tx) => {
      let currentCartId = activeCart?.id
      if (!currentCartId) {
        const cartRows = await tx
          .insert(carts)
          .values({ userId, restaurantId: mealBase.restaurantId })
          .returning({ id: carts.id })
        currentCartId = cartRows[0]?.id
      }

      if (!currentCartId) {
        throw new Error('Failed to create cart')
      }

      const itemRows = await tx
        .insert(cartItems)
        .values({
          cartId: currentCartId,
          baseId: mealBaseId,
          cookingMethodId: cookingMethodId || null,
          quantity,
          unitPrice: unitPrice.toFixed(2),
          subtotal: subtotal.toFixed(2)
        })
        .returning({ id: cartItems.id })

      const cartItemId = itemRows[0]?.id
      if (cartItemId) {
        const customizations = [
          ...addedItems.map((item) => ({
            cartItemId,
            ingredientId: item.ingredientId,
            action: 'add',
            qty: Math.max(1, item.qty),
            deltaPrice: ((priceMap.get(item.ingredientId) ?? 0) * Math.max(1, item.qty)).toFixed(2)
          })),
          ...removedItems.map((item) => ({
            cartItemId,
            ingredientId: item.ingredientId,
            action: 'remove',
            qty: Math.max(1, item.qty),
            deltaPrice: ((priceMap.get(item.ingredientId) ?? 0) * Math.max(1, item.qty) * -1).toFixed(2)
          }))
        ]

        if (customizations.length) {
          await tx.insert(cartItemCustomizations).values(customizations)
        }
      }

      await tx.update(carts).set({ updatedAt: sql`now()` }).where(eq(carts.id, currentCartId))

      return currentCartId
    })

    const cart = await buildCartResponse(cartId, userId)
    return res.status(201).json({ cart })
  } catch (err) {
    next(err)
  }
})

router.put('/items/:itemId', authMiddleware, rateLimitSensitive, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { itemId } = req.params
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!itemId) {
      return res.status(400).json({ error: 'Invalid cart item id' })
    }

    const itemRows = await db
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        baseId: cartItems.baseId,
        cookingMethodId: cartItems.cookingMethodId,
        quantity: cartItems.quantity
      })
      .from(cartItems)
      .where(eq(cartItems.id, itemId))
      .limit(1)

    const item = itemRows[0]
    if (!item) {
      return res.status(404).json({ error: 'Cart item not found' })
    }

    const cartRows = await db
      .select({ userId: carts.userId, restaurantId: carts.restaurantId })
      .from(carts)
      .where(eq(carts.id, item.cartId))
      .limit(1)

    const cart = cartRows[0]
    if (!cart || cart.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const quantity = req.body?.quantity !== undefined ? parseNumber(req.body.quantity) : null
    const addedIngredients: IngredientInput[] = Array.isArray(req.body?.added_ingredients)
      ? req.body.added_ingredients
      : []
    const removedIngredients: IngredientInput[] = Array.isArray(req.body?.removed_ingredients)
      ? req.body.removed_ingredients
      : []

    const baseRows = await db
      .select({ basePrice: mealBases.basePrice })
      .from(mealBases)
      .where(eq(mealBases.id, item.baseId))
      .limit(1)

    const base = baseRows[0]
    if (!base) {
      return res.status(404).json({ error: 'Meal base not found' })
    }

    let cookingMethodDelta = 0
    if (item.cookingMethodId) {
      const methodRows = await db
        .select({ priceDelta: cookingMethods.priceDelta })
        .from(cookingMethods)
        .where(eq(cookingMethods.id, item.cookingMethodId))
        .limit(1)
      const methodRow = methodRows[0]
      cookingMethodDelta = methodRow ? Number(methodRow.priceDelta) : 0
    }

    const addedItems: NormalizedIngredient[] = addedIngredients
      .map((input) => ({
        ingredientId: normalizeText(input.ingredient_id),
        qty: typeof input.qty === 'number' ? input.qty : 1
      }))
      .filter((entry): entry is NormalizedIngredient => entry.ingredientId.length > 0)

    const removedItems: NormalizedIngredient[] = removedIngredients
      .map((input) => ({
        ingredientId: normalizeText(input.ingredient_id),
        qty: typeof input.qty === 'number' ? input.qty : 1
      }))
      .filter((entry): entry is NormalizedIngredient => entry.ingredientId.length > 0)

    const ingredientIds = Array.from(
      new Set([...addedItems.map((entry) => entry.ingredientId), ...removedItems.map((entry) => entry.ingredientId)])
    )

    const ingredientRows = ingredientIds.length
      ? await db
          .select({ id: ingredients.id, unitPrice: ingredients.unitPrice })
          .from(ingredients)
          .where(inArray(ingredients.id, ingredientIds))
      : []

    const priceMap = new Map(ingredientRows.map((row) => [row.id, Number(row.unitPrice)]))
    const addedCharges = addedItems.reduce((sum: number, entry: NormalizedIngredient) => {
      const price = priceMap.get(entry.ingredientId) ?? 0
      return sum + price * Math.max(1, entry.qty)
    }, 0)

    const removedDiscounts = removedItems.reduce((sum: number, entry: NormalizedIngredient) => {
      const price = priceMap.get(entry.ingredientId) ?? 0
      return sum - price * Math.max(1, entry.qty)
    }, 0)

    const resolvedQuantity =
      quantity !== null && !Number.isNaN(quantity) ? Math.max(1, quantity) : item.quantity
    const unitPrice = Number(base.basePrice) + cookingMethodDelta + addedCharges + removedDiscounts
    const subtotal = unitPrice * resolvedQuantity

    await db.transaction(async (tx) => {
      await tx
        .update(cartItems)
        .set({
          quantity: resolvedQuantity,
          unitPrice: unitPrice.toFixed(2),
          subtotal: subtotal.toFixed(2)
        })
        .where(eq(cartItems.id, item.id))

      await tx.delete(cartItemCustomizations).where(eq(cartItemCustomizations.cartItemId, item.id))

      const customizations = [
        ...addedItems.map((entry) => ({
          cartItemId: item.id,
          ingredientId: entry.ingredientId,
          action: 'add',
          qty: Math.max(1, entry.qty),
          deltaPrice: ((priceMap.get(entry.ingredientId) ?? 0) * Math.max(1, entry.qty)).toFixed(2)
        })),
        ...removedItems.map((entry) => ({
          cartItemId: item.id,
          ingredientId: entry.ingredientId,
          action: 'remove',
          qty: Math.max(1, entry.qty),
          deltaPrice: ((priceMap.get(entry.ingredientId) ?? 0) * Math.max(1, entry.qty) * -1).toFixed(2)
        }))
      ]

      if (customizations.length) {
        await tx.insert(cartItemCustomizations).values(customizations)
      }

      await tx.update(carts).set({ updatedAt: sql`now()` }).where(eq(carts.id, item.cartId))
    })

    const cartResponse = await buildCartResponse(item.cartId, userId)
    return res.status(200).json({ cart: cartResponse })
  } catch (err) {
    next(err)
  }
})

router.delete('/items/:itemId', authMiddleware, rateLimitSensitive, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const { itemId } = req.params
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!itemId) {
      return res.status(400).json({ error: 'Invalid cart item id' })
    }

    const itemRows = await db
      .select({ cartId: cartItems.cartId })
      .from(cartItems)
      .where(eq(cartItems.id, itemId))
      .limit(1)

    const item = itemRows[0]
    if (!item) {
      return res.status(404).json({ error: 'Cart item not found' })
    }

    const cartRows = await db
      .select({ userId: carts.userId })
      .from(carts)
      .where(eq(carts.id, item.cartId))
      .limit(1)

    if (!cartRows[0] || cartRows[0].userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await db.delete(cartItems).where(eq(cartItems.id, itemId))
    await db.update(carts).set({ updatedAt: sql`now()` }).where(eq(carts.id, item.cartId))

    const cartResponse = await buildCartResponse(item.cartId, userId)
    return res.status(200).json({ cart: cartResponse })
  } catch (err) {
    next(err)
  }
})

router.delete('/', authMiddleware, rateLimitSensitive, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const cart = await getActiveCart(userId)
    if (!cart) {
      return res.status(204).send()
    }

    await db.delete(carts).where(eq(carts.id, cart.id))
    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.post('/validate', authMiddleware, rateLimitSensitive, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const cart = await getActiveCart(userId)
    if (!cart) {
      return res.status(200).json({ valid: true, price_updates: [] })
    }

    const itemRows = await db
      .select({
        id: cartItems.id,
        baseId: cartItems.baseId,
        cookingMethodId: cartItems.cookingMethodId,
        quantity: cartItems.quantity,
        unitPrice: cartItems.unitPrice
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id))

    if (!itemRows.length) {
      return res.status(200).json({ valid: true, price_updates: [] })
    }

    const customizationRows = await db
      .select({
        id: cartItemCustomizations.id,
        cartItemId: cartItemCustomizations.cartItemId,
        ingredientId: cartItemCustomizations.ingredientId,
        action: cartItemCustomizations.action,
        qty: cartItemCustomizations.qty
      })
      .from(cartItemCustomizations)
      .where(inArray(cartItemCustomizations.cartItemId, itemRows.map((row) => row.id)))

    const customizationsByItem = customizationRows.reduce<Record<string, typeof customizationRows>>(
      (acc, row) => {
        const list = acc[row.cartItemId] ?? []
        list.push(row)
        acc[row.cartItemId] = list
        return acc
      },
      {}
    )

    const ingredientIds = Array.from(
      new Set(customizationRows.map((row) => row.ingredientId))
    )

    const ingredientRows = ingredientIds.length
      ? await db
          .select({ id: ingredients.id, unitPrice: ingredients.unitPrice })
          .from(ingredients)
          .where(inArray(ingredients.id, ingredientIds))
      : []

    const methodIds = Array.from(
      new Set(
        itemRows
          .map((row) => row.cookingMethodId)
          .filter((id): id is string => Boolean(id))
      )
    )
    const methodRows = methodIds.length
      ? await db
          .select({ id: cookingMethods.id, priceDelta: cookingMethods.priceDelta })
          .from(cookingMethods)
          .where(inArray(cookingMethods.id, methodIds))
      : []

    const methodDeltaMap = new Map(
      methodRows.map((row) => [row.id, Number(row.priceDelta)])
    )

    const priceMap = new Map(ingredientRows.map((row) => [row.id, Number(row.unitPrice)]))

    const baseRows = await db
      .select({ id: mealBases.id, basePrice: mealBases.basePrice })
      .from(mealBases)
      .where(inArray(mealBases.id, itemRows.map((row) => row.baseId)))

    const basePriceMap = new Map(baseRows.map((row) => [row.id, Number(row.basePrice)]))

    const priceUpdates: { item_id: string; old_unit_price: number; new_unit_price: number; delta: number }[] = []

    await db.transaction(async (tx) => {
      for (const item of itemRows) {
        const basePrice = basePriceMap.get(item.baseId) ?? 0
        const customizations = customizationsByItem[item.id] ?? []
        const addedCharges = customizations
          .filter((entry) => entry.action === 'add')
          .reduce(
            (sum: number, entry: { ingredientId: string; qty: number }) =>
              sum + (priceMap.get(entry.ingredientId) ?? 0) * entry.qty,
            0
          )
        const removedDiscounts = customizations
          .filter((entry) => entry.action === 'remove')
          .reduce(
            (sum: number, entry: { ingredientId: string; qty: number }) =>
              sum - (priceMap.get(entry.ingredientId) ?? 0) * entry.qty,
            0
          )

        const methodDelta = item.cookingMethodId ? (methodDeltaMap.get(item.cookingMethodId) ?? 0) : 0
        const unitPrice = basePrice + methodDelta + addedCharges + removedDiscounts
        const oldUnitPrice = Number(item.unitPrice)
        if (Math.abs(unitPrice - oldUnitPrice) > 0.0001) {
          priceUpdates.push({
            item_id: item.id,
            old_unit_price: oldUnitPrice,
            new_unit_price: unitPrice,
            delta: unitPrice - oldUnitPrice
          })
          await tx
            .update(cartItems)
            .set({
              unitPrice: unitPrice.toFixed(2),
              subtotal: (unitPrice * item.quantity).toFixed(2)
            })
            .where(eq(cartItems.id, item.id))
        }

        for (const customization of customizations) {
          const price = priceMap.get(customization.ingredientId) ?? 0
          const delta = customization.action === 'remove' ? price * customization.qty * -1 : price * customization.qty
          await tx
            .update(cartItemCustomizations)
            .set({ deltaPrice: delta.toFixed(2) })
            .where(eq(cartItemCustomizations.id, customization.id))
        }
      }

      await tx.update(carts).set({ updatedAt: sql`now()` }).where(eq(carts.id, cart.id))
    })

    const cartResponse = await buildCartResponse(cart.id, userId)
    return res.status(200).json({
      valid: true,
      price_updates: priceUpdates,
      cart: cartResponse
    })
  } catch (err) {
    next(err)
  }
})

export default router
