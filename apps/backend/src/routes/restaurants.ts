import { Router } from 'express'
import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm'
import { db } from '../db'
import {
  addresses,
  cities,
  countries,
  kitchens,
  mealBaseCategories,
  mealBaseCategoryMap,
  mealBases,
  regions,
  restaurantCurrencies,
  restaurants
} from '../db/schema'
import { rateLimitPublic } from '../middleware/rate-limit'

const router = Router()

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

router.get('/', rateLimitPublic, async (req, res, next) => {
  try {
    const search = normalizeText(req.query.search)
    const status = normalizeText(req.query.status)
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20))

    const conditions = [] as ReturnType<typeof and>[]
    if (search) {
      conditions.push(ilike(restaurants.name, `%${search}%`))
    }
    if (status) {
      conditions.push(eq(restaurants.status, status))
    }

    const whereClause = conditions.length ? and(...conditions) : undefined

    const totalQuery = db.select({ count: sql<number>`count(*)` }).from(restaurants)
    const totalRows = whereClause ? await totalQuery.where(whereClause) : await totalQuery

    const total = Number(totalRows[0]?.count ?? 0)

    const baseQuery = db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        legalName: restaurants.legalName,
        status: restaurants.status,
        createdAt: restaurants.createdAt,
        updatedAt: restaurants.updatedAt
      })
      .from(restaurants)

    const rows = await (whereClause ? baseQuery.where(whereClause) : baseQuery)
      .orderBy(desc(restaurants.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

    return res.status(200).json({
      restaurants: rows.map((row) => ({
        id: row.id,
        name: row.name,
        legal_name: row.legalName,
        status: row.status,
        created_at: row.createdAt,
        updated_at: row.updatedAt
      })),
      pagination: { page, limit, total }
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/menu', rateLimitPublic, async (req, res, next) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ error: 'Invalid restaurant id' })
    }

    const baseRows = await db
      .select({
        id: mealBases.id,
        name: mealBases.name,
        description: mealBases.description,
        basePrice: mealBases.basePrice,
        isActive: mealBases.isActive
      })
      .from(mealBases)
      .where(and(eq(mealBases.restaurantId, id), eq(mealBases.isActive, true)))
      .orderBy(desc(mealBases.createdAt))

    const baseIds = baseRows.map((row) => row.id)
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

    const categories = new Map<string, { id: string; name: string; bases: typeof baseRows }>()
    for (const base of baseRows) {
      const baseCategories = categoriesByBase[base.id] ?? []
      if (!baseCategories.length) {
        const fallback = categories.get('uncategorized') ?? {
          id: 'uncategorized',
          name: 'Uncategorized',
          bases: []
        }
        fallback.bases.push(base)
        categories.set('uncategorized', fallback)
        continue
      }
      for (const category of baseCategories) {
        const group = categories.get(category.id) ?? { id: category.id, name: category.name, bases: [] }
        group.bases.push(base)
        categories.set(category.id, group)
      }
    }

    return res.status(200).json({
      menu: {
        restaurant_id: id,
        categories: Array.from(categories.values()).map((category) => ({
          id: category.id,
          name: category.name,
          bases: category.bases.map((base) => ({
            id: base.id,
            name: base.name,
            description: base.description,
            base_price: typeof base.basePrice === 'string' ? Number(base.basePrice) : base.basePrice,
            is_active: base.isActive
          }))
        }))
      }
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', rateLimitPublic, async (req, res, next) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ error: 'Invalid restaurant id' })
    }

    const rows = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        legalName: restaurants.legalName,
        status: restaurants.status,
        createdAt: restaurants.createdAt,
        updatedAt: restaurants.updatedAt
      })
      .from(restaurants)
      .where(eq(restaurants.id, id))
      .limit(1)

    const restaurant = rows[0]
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' })
    }

    const currencyRows = await db
      .select({
        currencyCode: restaurantCurrencies.currencyCode,
        isDefault: restaurantCurrencies.isDefault
      })
      .from(restaurantCurrencies)
      .where(eq(restaurantCurrencies.restaurantId, id))

    const kitchenRows = await db
      .select({
        id: kitchens.id,
        name: kitchens.name,
        status: kitchens.status,
        addressId: kitchens.addressId,
        addressLine1: addresses.line1,
        addressLine2: addresses.line2,
        postalCode: addresses.postalCode,
        cityName: cities.name,
        regionName: regions.name,
        countryName: countries.nameEs
      })
      .from(kitchens)
      .leftJoin(addresses, eq(kitchens.addressId, addresses.id))
      .leftJoin(cities, eq(addresses.cityId, cities.id))
      .leftJoin(regions, eq(addresses.regionId, regions.id))
      .leftJoin(countries, eq(addresses.countryId, countries.id))
      .where(eq(kitchens.restaurantId, id))
      .orderBy(desc(kitchens.createdAt))

    return res.status(200).json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        legal_name: restaurant.legalName,
        status: restaurant.status,
        created_at: restaurant.createdAt,
        updated_at: restaurant.updatedAt,
        currencies: currencyRows.map((row) => ({
          currency_code: row.currencyCode,
          is_default: row.isDefault
        })),
        kitchens: kitchenRows.map((kitchen) => ({
          id: kitchen.id,
          name: kitchen.name,
          status: kitchen.status,
          address: kitchen.addressId
            ? {
                line1: kitchen.addressLine1,
                line2: kitchen.addressLine2,
                postal_code: kitchen.postalCode,
                city: kitchen.cityName,
                region: kitchen.regionName,
                country: kitchen.countryName
              }
            : null
        }))
      }
    })
  } catch (err) {
    next(err)
  }
})

export default router
