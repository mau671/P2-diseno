import { Router } from 'express'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { addresses, cities, countries, kitchens, regions, restaurants } from '../db/schema'
import { rateLimitPublic } from '../middleware/rate-limit'

const router = Router()

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

router.get('/', rateLimitPublic, async (req, res, next) => {
  try {
    const restaurantId = normalizeText(req.query.restaurantId)
    const status = normalizeText(req.query.status)
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20))

    const conditions = [] as ReturnType<typeof and>[]
    if (restaurantId) {
      conditions.push(eq(kitchens.restaurantId, restaurantId))
    }
    if (status) {
      conditions.push(eq(kitchens.status, status))
    }

    const whereClause = conditions.length ? and(...conditions) : undefined

    const totalQuery = db.select({ count: sql<number>`count(*)` }).from(kitchens)
    const totalRows = whereClause ? await totalQuery.where(whereClause) : await totalQuery

    const total = Number(totalRows[0]?.count ?? 0)

    const baseQuery = db
      .select({
        id: kitchens.id,
        name: kitchens.name,
        status: kitchens.status,
        restaurantId: kitchens.restaurantId,
        restaurantName: restaurants.name,
        addressLine1: addresses.line1,
        addressLine2: addresses.line2,
        postalCode: addresses.postalCode,
        cityName: cities.name,
        regionName: regions.name,
        countryName: countries.nameEs
      })
      .from(kitchens)
      .innerJoin(restaurants, eq(kitchens.restaurantId, restaurants.id))
      .leftJoin(addresses, eq(kitchens.addressId, addresses.id))
      .leftJoin(cities, eq(addresses.cityId, cities.id))
      .leftJoin(regions, eq(addresses.regionId, regions.id))
      .leftJoin(countries, eq(addresses.countryId, countries.id))

    const rows = await (whereClause ? baseQuery.where(whereClause) : baseQuery)
      .orderBy(desc(kitchens.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

    return res.status(200).json({
      kitchens: rows.map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        restaurant_id: row.restaurantId,
        restaurant_name: row.restaurantName,
        address: row.addressLine1
          ? {
              line1: row.addressLine1,
              line2: row.addressLine2,
              postal_code: row.postalCode,
              city: row.cityName,
              region: row.regionName,
              country: row.countryName
            }
          : null
      })),
      pagination: { page, limit, total }
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', rateLimitPublic, async (req, res, next) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ error: 'Invalid kitchen id' })
    }

    const rows = await db
      .select({
        id: kitchens.id,
        name: kitchens.name,
        status: kitchens.status,
        restaurantId: kitchens.restaurantId,
        restaurantName: restaurants.name,
        addressLine1: addresses.line1,
        addressLine2: addresses.line2,
        postalCode: addresses.postalCode,
        cityName: cities.name,
        regionName: regions.name,
        countryName: countries.nameEs
      })
      .from(kitchens)
      .innerJoin(restaurants, eq(kitchens.restaurantId, restaurants.id))
      .leftJoin(addresses, eq(kitchens.addressId, addresses.id))
      .leftJoin(cities, eq(addresses.cityId, cities.id))
      .leftJoin(regions, eq(addresses.regionId, regions.id))
      .leftJoin(countries, eq(addresses.countryId, countries.id))
      .where(eq(kitchens.id, id))
      .limit(1)

    const kitchen = rows[0]
    if (!kitchen) {
      return res.status(404).json({ error: 'Kitchen not found' })
    }

    return res.status(200).json({
      kitchen: {
        id: kitchen.id,
        name: kitchen.name,
        status: kitchen.status,
        restaurant_id: kitchen.restaurantId,
        restaurant_name: kitchen.restaurantName,
        address: kitchen.addressLine1
          ? {
              line1: kitchen.addressLine1,
              line2: kitchen.addressLine2,
              postal_code: kitchen.postalCode,
              city: kitchen.cityName,
              region: kitchen.regionName,
              country: kitchen.countryName
            }
          : null
      }
    })
  } catch (err) {
    next(err)
  }
})

export default router
