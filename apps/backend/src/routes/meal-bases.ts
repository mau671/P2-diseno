import { Router } from 'express'
import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm'
import { db } from '../db'
import {
  baseCookingMethods,
  baseIngredients,
  cookingMethods,
  ingredientCategories,
  ingredientRestrictions,
  ingredients,
  mealBaseCategoryMap,
  mealBaseCategories,
  mealBaseKitchens,
  mealBases,
  restaurants,
  userDietaryRestrictions,
  dietaryRestrictions
} from '../db/schema'
import { optionalAuthMiddleware } from '../middleware/auth'
import { rateLimitPublic } from '../middleware/rate-limit'
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

const parseBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return null
}

const getWarningMap = async (userId: string | undefined, baseIds: string[]) => {
  if (!userId || baseIds.length === 0) {
    return new Map<string, { restrictionId: string; restrictionName: string; ingredientName: string }[]>()
  }

  const rows = await db
    .select({
      baseId: baseIngredients.baseId,
      ingredientName: ingredients.name,
      restrictionId: dietaryRestrictions.id,
      restrictionName: dietaryRestrictions.name
    })
    .from(baseIngredients)
    .innerJoin(ingredients, eq(baseIngredients.ingredientId, ingredients.id))
    .innerJoin(ingredientRestrictions, eq(ingredientRestrictions.ingredientId, ingredients.id))
    .innerJoin(
      userDietaryRestrictions,
      and(
        eq(userDietaryRestrictions.userId, userId),
        eq(userDietaryRestrictions.restrictionId, ingredientRestrictions.restrictionId)
      )
    )
    .innerJoin(dietaryRestrictions, eq(ingredientRestrictions.restrictionId, dietaryRestrictions.id))
    .where(inArray(baseIngredients.baseId, baseIds))

  const map = new Map<string, { restrictionId: string; restrictionName: string; ingredientName: string }[]>()
  for (const row of rows) {
    const list = map.get(row.baseId) ?? []
    list.push({
      restrictionId: row.restrictionId,
      restrictionName: row.restrictionName,
      ingredientName: row.ingredientName
    })
    map.set(row.baseId, list)
  }

  return map
}

router.get('/', rateLimitPublic, optionalAuthMiddleware, async (req, res, next) => {
  try {
    const search = normalizeText(req.query.search)
    const restaurantId = normalizeText(req.query.restaurantId)
    const kitchenId = normalizeText(req.query.kitchenId)
    const categoryId = normalizeText(req.query.categoryId)
    const minPrice = parseNumber(req.query.minPrice)
    const maxPrice = parseNumber(req.query.maxPrice)
    const isAvailable = parseBoolean(req.query.isAvailable)
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20))

    const conditions = [] as ReturnType<typeof and>[]
    if (search) {
      conditions.push(ilike(mealBases.name, `%${search}%`))
    }
    if (restaurantId) {
      conditions.push(eq(mealBases.restaurantId, restaurantId))
    }
    if (!Number.isNaN(minPrice)) {
      conditions.push(sql`${mealBases.basePrice} >= ${minPrice}`)
    }
    if (!Number.isNaN(maxPrice)) {
      conditions.push(sql`${mealBases.basePrice} <= ${maxPrice}`)
    }
    if (isAvailable !== null) {
      conditions.push(eq(mealBases.isActive, isAvailable))
    } else {
      conditions.push(eq(mealBases.isActive, true))
    }

    if (categoryId) {
      const categoryBaseRows = await db
        .select({ baseId: mealBaseCategoryMap.baseId })
        .from(mealBaseCategoryMap)
        .where(eq(mealBaseCategoryMap.categoryId, categoryId))
      const baseIds = categoryBaseRows.map((row) => row.baseId)
      if (!baseIds.length) {
        return res.status(200).json({ meal_bases: [], pagination: { page, limit, total: 0 } })
      }
      conditions.push(inArray(mealBases.id, baseIds))
    }

    if (kitchenId) {
      const kitchenBaseRows = await db
        .select({ baseId: mealBaseKitchens.baseId })
        .from(mealBaseKitchens)
        .where(and(eq(mealBaseKitchens.kitchenId, kitchenId), eq(mealBaseKitchens.isAvailable, true)))
      const baseIds = kitchenBaseRows.map((row) => row.baseId)
      if (!baseIds.length) {
        return res.status(200).json({ meal_bases: [], pagination: { page, limit, total: 0 } })
      }
      conditions.push(inArray(mealBases.id, baseIds))
    }

    const whereClause = conditions.length ? and(...conditions) : undefined

    const totalQuery = db.select({ count: sql<number>`count(*)` }).from(mealBases)
    const totalRows = whereClause ? await totalQuery.where(whereClause) : await totalQuery

    const total = Number(totalRows[0]?.count ?? 0)

    const baseQuery = db
      .select({
        id: mealBases.id,
        restaurantId: mealBases.restaurantId,
        restaurantName: restaurants.name,
        name: mealBases.name,
        description: mealBases.description,
        imageAssetId: mealBases.imageAssetId,
        basePrice: mealBases.basePrice,
        isActive: mealBases.isActive,
        createdAt: mealBases.createdAt,
        updatedAt: mealBases.updatedAt
      })
      .from(mealBases)
      .innerJoin(restaurants, eq(mealBases.restaurantId, restaurants.id))

    const rows = await (whereClause ? baseQuery.where(whereClause) : baseQuery)
      .orderBy(desc(mealBases.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

    const baseIds = rows.map((row) => row.id)

    const categoryRows = baseIds.length
      ? await db
          .select({
            baseId: mealBaseCategoryMap.baseId,
            categoryId: mealBaseCategories.id,
            categoryName: mealBaseCategories.name
          })
          .from(mealBaseCategoryMap)
          .innerJoin(mealBaseCategories, eq(mealBaseCategoryMap.categoryId, mealBaseCategories.id))
          .where(inArray(mealBaseCategoryMap.baseId, baseIds))
      : []

    const categoriesByBase = categoryRows.reduce<Record<string, { id: string; name: string }[]>>(
      (acc, row) => {
        const list = acc[row.baseId] ?? []
        list.push({ id: row.categoryId, name: row.categoryName })
        acc[row.baseId] = list
        return acc
      },
      {}
    )

    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const warningsMap = await getWarningMap(userId, baseIds)

    return res.status(200).json({
      meal_bases: rows.map((row) => {
        const warnings = (warningsMap.get(row.id) ?? []).map((warning) => ({
          restriction_id: warning.restrictionId,
          restriction_name: warning.restrictionName,
          ingredient_name: warning.ingredientName
        }))
        return {
          id: row.id,
          restaurant_id: row.restaurantId,
          restaurant_name: row.restaurantName,
          name: row.name,
          description: row.description,
          image_asset_id: row.imageAssetId,
          base_price: typeof row.basePrice === 'string' ? Number(row.basePrice) : row.basePrice,
          is_active: row.isActive,
          categories: categoriesByBase[row.id] ?? [],
          restriction_warnings: warnings,
          matches_user_restrictions: warnings.length === 0
        }
      }),
      pagination: { page, limit, total }
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: 'Invalid meal base id' })
    }

    const {
      name,
      description,
      base_price,
      is_active,
      image_asset_id,
      category_ids
    } = req.body

    const updated = await db
      .update(mealBases)
      .set({
        name,
        description,
        basePrice: base_price,
        isActive: is_active,
        imageAssetId: image_asset_id,
        updatedAt: new Date()
      })
      .where(eq(mealBases.id, id))
      .returning({ id: mealBases.id })

    if (!updated.length) {
      return res.status(404).json({ error: 'Meal base not found' })
    }

    if (Array.isArray(category_ids)) {
      await db
        .delete(mealBaseCategoryMap)
        .where(eq(mealBaseCategoryMap.baseId, id))

    if (category_ids.length > 0) {
      await db.insert(mealBaseCategoryMap).values({
        baseId: id,
        categoryId: category_ids[0]
      })
    }
  }



    return res.status(200).json({ success: true })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: 'Invalid meal base id' })
    }

    const deleted = await db
      .delete(mealBases)
      .where(eq(mealBases.id, id))
      .returning({ id: mealBases.id })

    if (!deleted.length) {
      return res.status(404).json({ error: 'Meal base not found' })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    next(err)
  }
})


router.post('/', async (req, res, next) => {
  try {
    const {
      restaurant_id,
      name,
      description,
      base_price,
      image_asset_id,
      is_active = true,
      category_ids = []
    } = req.body

    if (!restaurant_id || !name || base_price == null) {
      return res.status(400).json({
        error: 'restaurant_id, name and base_price are required'
      })
    }

    const inserted = await db
    .insert(mealBases)
    .values({
      restaurantId: restaurant_id,
      name,
      description: description ?? null,
      basePrice: base_price,
      imageAssetId: image_asset_id ?? null,
      isActive: is_active
    })
    .returning({
      id: mealBases.id,
      restaurantId: mealBases.restaurantId,
      name: mealBases.name,
      description: mealBases.description,
      imageAssetId: mealBases.imageAssetId,
      basePrice: mealBases.basePrice,
      isActive: mealBases.isActive
    })

  const mealBase = inserted[0]

    if (!mealBase) {
      return res.status(500).json({
        error: 'Failed to create meal base'
      })
    }

    if (Array.isArray(category_ids) && category_ids.length > 0) {
      await db.insert(mealBaseCategoryMap).values({
        baseId: mealBase.id,
        categoryId: category_ids[0]
      })
    }



    return res.status(201).json({
      meal_base: {
        id: mealBase.id,
        restaurant_id: mealBase.restaurantId,
        restaurant_name: null,
        name: mealBase.name,
        description: mealBase.description,
        image_asset_id: mealBase.imageAssetId,
        base_price: Number(mealBase.basePrice),
        is_active: mealBase.isActive,
        categories: [],
        restriction_warnings: [],
        matches_user_restrictions: true
      }
    })
  } catch (err) {
    next(err)
  }
})


router.get('/:id', rateLimitPublic, optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ error: 'Invalid meal base id' })
    }

    const baseRows = await db
      .select({
        id: mealBases.id,
        restaurantId: mealBases.restaurantId,
        restaurantName: restaurants.name,
        name: mealBases.name,
        description: mealBases.description,
        imageAssetId: mealBases.imageAssetId,
        basePrice: mealBases.basePrice,
        isActive: mealBases.isActive,
        createdAt: mealBases.createdAt,
        updatedAt: mealBases.updatedAt
      })
      .from(mealBases)
      .innerJoin(restaurants, eq(mealBases.restaurantId, restaurants.id))
      .where(eq(mealBases.id, id))
      .limit(1)

    const mealBase = baseRows[0]
    if (!mealBase) {
      return res.status(404).json({ error: 'Meal base not found' })
    }

    const categoryRows = await db
      .select({ id: mealBaseCategories.id, name: mealBaseCategories.name })
      .from(mealBaseCategoryMap)
      .innerJoin(mealBaseCategories, eq(mealBaseCategoryMap.categoryId, mealBaseCategories.id))
      .where(eq(mealBaseCategoryMap.baseId, id))

    const methodRows = await db
      .select({
        id: cookingMethods.id,
        name: cookingMethods.name,
        priceDelta: cookingMethods.priceDelta
      })
      .from(baseCookingMethods)
      .innerJoin(cookingMethods, eq(baseCookingMethods.methodId, cookingMethods.id))
      .where(eq(baseCookingMethods.baseId, id))

    const baseIngredientRows = await db
      .select({
        ingredientId: ingredients.id,
        ingredientName: ingredients.name,
        categoryId: ingredientCategories.id,
        categoryName: ingredientCategories.name,
        unitPrice: ingredients.unitPrice,
        defaultQty: baseIngredients.defaultQty,
        isRemovable: baseIngredients.isRemovable,
        isEssential: baseIngredients.isEssential
      })
      .from(baseIngredients)
      .innerJoin(ingredients, eq(baseIngredients.ingredientId, ingredients.id))
      .innerJoin(ingredientCategories, eq(ingredients.categoryId, ingredientCategories.id))
      .where(eq(baseIngredients.baseId, id))

    const baseIngredientIds = baseIngredientRows.map((row) => row.ingredientId)
    const extraConditions = [
      eq(ingredients.restaurantId, mealBase.restaurantId),
      eq(ingredients.isActive, true)
    ]
    if (baseIngredientIds.length) {
      extraConditions.push(sql`${ingredients.id} not in ${baseIngredientIds}`)
    }
    const extraIngredientRows = await db
      .select({
        ingredientId: ingredients.id,
        ingredientName: ingredients.name,
        categoryId: ingredientCategories.id,
        categoryName: ingredientCategories.name,
        unitPrice: ingredients.unitPrice
      })
      .from(ingredients)
      .innerJoin(ingredientCategories, eq(ingredients.categoryId, ingredientCategories.id))
      .where(and(...extraConditions))

    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
    const warningsMap = await getWarningMap(userId, [id])
    const warnings = (warningsMap.get(id) ?? []).map((warning) => ({
      restriction_id: warning.restrictionId,
      restriction_name: warning.restrictionName,
      ingredient_name: warning.ingredientName
    }))

    return res.status(200).json({
      meal_base: {
        id: mealBase.id,
        restaurant_id: mealBase.restaurantId,
        restaurant_name: mealBase.restaurantName,
        name: mealBase.name,
        description: mealBase.description,
        image_asset_id: mealBase.imageAssetId,
        base_price: typeof mealBase.basePrice === 'string' ? Number(mealBase.basePrice) : mealBase.basePrice,
        is_active: mealBase.isActive,
        categories: categoryRows.map((category) => ({
          id: category.id,
          name: category.name
        })),
        cooking_methods: methodRows.map((method) => ({
          id: method.id,
          name: method.name,
          price_delta: typeof method.priceDelta === 'string' ? Number(method.priceDelta) : method.priceDelta
        })),
        base_ingredients: baseIngredientRows.map((row) => ({
          ingredient_id: row.ingredientId,
          ingredient_name: row.ingredientName,
          category_id: row.categoryId,
          category_name: row.categoryName,
          unit_price: typeof row.unitPrice === 'string' ? Number(row.unitPrice) : row.unitPrice,
          default_qty: row.defaultQty,
          is_removable: row.isRemovable,
          is_essential: row.isEssential
        })),
        extra_ingredients: extraIngredientRows.map((row) => ({
          ingredient_id: row.ingredientId,
          ingredient_name: row.ingredientName,
          category_id: row.categoryId,
          category_name: row.categoryName,
          unit_price: typeof row.unitPrice === 'string' ? Number(row.unitPrice) : row.unitPrice
        })),
        restriction_warnings: warnings,
        matches_user_restrictions: warnings.length === 0
      }
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/customization-options', rateLimitPublic, optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ error: 'Invalid meal base id' })
    }

    const baseRows = await db
      .select({ id: mealBases.id, restaurantId: mealBases.restaurantId, basePrice: mealBases.basePrice })
      .from(mealBases)
      .where(eq(mealBases.id, id))
      .limit(1)

    const mealBase = baseRows[0]
    if (!mealBase) {
      return res.status(404).json({ error: 'Meal base not found' })
    }

    const methodRows = await db
      .select({
        id: cookingMethods.id,
        name: cookingMethods.name,
        priceDelta: cookingMethods.priceDelta
      })
      .from(baseCookingMethods)
      .innerJoin(cookingMethods, eq(baseCookingMethods.methodId, cookingMethods.id))
      .where(eq(baseCookingMethods.baseId, id))

    const baseIngredientRows = await db
      .select({
        ingredientId: ingredients.id,
        ingredientName: ingredients.name,
        categoryId: ingredientCategories.id,
        categoryName: ingredientCategories.name,
        unitPrice: ingredients.unitPrice,
        defaultQty: baseIngredients.defaultQty,
        isRemovable: baseIngredients.isRemovable,
        isEssential: baseIngredients.isEssential
      })
      .from(baseIngredients)
      .innerJoin(ingredients, eq(baseIngredients.ingredientId, ingredients.id))
      .innerJoin(ingredientCategories, eq(ingredients.categoryId, ingredientCategories.id))
      .where(eq(baseIngredients.baseId, id))

    const baseIngredientIds = baseIngredientRows.map((row) => row.ingredientId)
    const extraConditions = [
      eq(ingredients.restaurantId, mealBase.restaurantId),
      eq(ingredients.isActive, true)
    ]
    if (baseIngredientIds.length) {
      extraConditions.push(sql`${ingredients.id} not in ${baseIngredientIds}`)
    }
    const extraIngredientRows = await db
      .select({
        ingredientId: ingredients.id,
        ingredientName: ingredients.name,
        categoryId: ingredientCategories.id,
        categoryName: ingredientCategories.name,
        unitPrice: ingredients.unitPrice
      })
      .from(ingredients)
      .innerJoin(ingredientCategories, eq(ingredients.categoryId, ingredientCategories.id))
      .where(and(...extraConditions))

    return res.status(200).json({
      customization_options: {
        base_price: typeof mealBase.basePrice === 'string' ? Number(mealBase.basePrice) : mealBase.basePrice,
        cooking_methods: methodRows.map((method) => ({
          id: method.id,
          name: method.name,
          price_delta: typeof method.priceDelta === 'string' ? Number(method.priceDelta) : method.priceDelta
        })),
        removable_ingredients: baseIngredientRows
          .filter((row) => row.isRemovable)
          .map((row) => ({
            ingredient_id: row.ingredientId,
            ingredient_name: row.ingredientName,
            category_id: row.categoryId,
            category_name: row.categoryName,
            unit_price: typeof row.unitPrice === 'string' ? Number(row.unitPrice) : row.unitPrice,
            default_qty: row.defaultQty,
            is_removable: row.isRemovable,
            is_essential: row.isEssential
          })),
        extra_ingredients: extraIngredientRows.map((row) => ({
          ingredient_id: row.ingredientId,
          ingredient_name: row.ingredientName,
          category_id: row.categoryId,
          category_name: row.categoryName,
          unit_price: typeof row.unitPrice === 'string' ? Number(row.unitPrice) : row.unitPrice
        }))
      }
    })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/calculate-price', rateLimitPublic, async (req, res, next) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ error: 'Invalid meal base id' })
    }

    const quantity = Math.max(1, parseInt(String(req.body?.quantity ?? '1'), 10) || 1)
    const cookingMethodId = normalizeText(req.body?.cooking_method_id ?? req.body?.cookingMethodId)
    const removedIngredients = Array.isArray(req.body?.removed_ingredients)
      ? req.body.removed_ingredients
      : []
    const addedIngredients = Array.isArray(req.body?.added_ingredients) ? req.body.added_ingredients : []

    const baseRows = await db
      .select({ id: mealBases.id, basePrice: mealBases.basePrice })
      .from(mealBases)
      .where(eq(mealBases.id, id))
      .limit(1)

    const mealBase = baseRows[0]
    if (!mealBase) {
      return res.status(404).json({ error: 'Meal base not found' })
    }

    let methodDelta = 0
    if (cookingMethodId) {
      const methodRows = await db
        .select({ priceDelta: cookingMethods.priceDelta })
        .from(baseCookingMethods)
        .innerJoin(cookingMethods, eq(baseCookingMethods.methodId, cookingMethods.id))
        .where(and(eq(baseCookingMethods.baseId, id), eq(cookingMethods.id, cookingMethodId)))
        .limit(1)
      const methodRow = methodRows[0]
      if (methodRow) {
        methodDelta = Number(methodRow.priceDelta)
      }
    }

    type RemovedIngredientInput = { ingredient_id?: string; ingredientId?: string }
    type AddedIngredientInput = { ingredient_id?: string; ingredientId?: string; qty?: number }

    const removedIds = (removedIngredients as RemovedIngredientInput[])
      .map((item) => normalizeText(item.ingredient_id ?? item.ingredientId))
      .filter((value) => value.length > 0)

    const addedItems = (addedIngredients as AddedIngredientInput[])
      .map((item) => ({
        ingredientId: normalizeText(item.ingredient_id ?? item.ingredientId),
        qty: typeof item.qty === 'number' ? item.qty : 1
      }))
      .filter((item): item is { ingredientId: string; qty: number } => item.ingredientId.length > 0)

    const addedIds = addedItems.map((item) => item.ingredientId)
    const ingredientIds = [...new Set([...removedIds, ...addedIds])]

    const ingredientRows = ingredientIds.length
      ? await db
          .select({ id: ingredients.id, unitPrice: ingredients.unitPrice })
          .from(ingredients)
          .where(inArray(ingredients.id, ingredientIds))
      : []

    const priceMap = new Map(ingredientRows.map((row) => [row.id, Number(row.unitPrice)]))

    const removedDiscounts = removedIds.reduce((sum: number, ingredientId: string) => {
      const price = priceMap.get(ingredientId) ?? 0
      return sum - price
    }, 0)

    const addedCharges = addedItems.reduce((sum: number, item: { ingredientId: string; qty: number }) => {
      const price = priceMap.get(item.ingredientId) ?? 0
      return sum + price * Math.max(1, item.qty)
    }, 0)

    const unitPrice = Number(mealBase.basePrice) + methodDelta + addedCharges + removedDiscounts
    const subtotal = unitPrice * quantity

    return res.status(200).json({
      base_price: typeof mealBase.basePrice === 'string' ? Number(mealBase.basePrice) : mealBase.basePrice,
      cooking_method_delta: methodDelta,
      removed_discounts: removedDiscounts,
      added_charges: addedCharges,
      quantity,
      subtotal,
      tax: 0,
      total: subtotal,
      currency_code: null
    })
  } catch (err) {
    next(err)
  }
})

export default router
