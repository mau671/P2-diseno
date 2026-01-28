import { Router } from 'express'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'
import { db } from '../db'
import {
  addresses,
  cities,
  countries,
  dietaryRestrictions,
  mealBases,
  orderItems,
  orders,
  profiles,
  regions,
  restaurantUsers,
  restaurants,
  userDietaryRestrictions
} from '../db/schema'
import type { AuthRequest } from '../types/supabase'

const router = Router()

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const profileRows = await db
      .select({
        id: profiles.id,
        full_name: profiles.fullName,
        phone: profiles.phone,
        avatar_url: profiles.avatarUrl,
        date_of_birth: profiles.dateOfBirth,
        preferred_language: profiles.preferredLanguage,
        notification_preferences: profiles.notificationPreferences,
        preferred_currency_code: profiles.preferredCurrencyCode,
        is_admin: profiles.isAdmin,
        created_at: profiles.createdAt,
        updated_at: profiles.updatedAt
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1)

    const profile = profileRows[0] ?? null

    return res.status(200).json({
      profile: profile
        ? {
            ...profile,
            email: authRequest.locals?.user?.email ?? null
          }
        : null
    })
  } catch (err) {
    next(err)
  }
})

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const {
      full_name,
      phone,
      avatar_url,
      date_of_birth,
      preferred_language,
      preferred_currency_code,
      notification_preferences
    } = req.body ?? {}

    const updates: Record<string, unknown> = {}

    if (typeof full_name === 'string') {
      updates.fullName = full_name.trim()
    }

    if (typeof phone === 'string') {
      updates.phone = phone.trim()
    }

    if (avatar_url === null) {
      updates.avatarUrl = null
    } else if (typeof avatar_url === 'string') {
      const trimmed = avatar_url.trim()
      if (trimmed.length > 0 && !isValidUrl(trimmed)) {
        return res.status(400).json({ error: 'Invalid avatar URL' })
      }
      updates.avatarUrl = trimmed.length > 0 ? trimmed : null
    }

    if (date_of_birth === null) {
      updates.dateOfBirth = null
    } else if (typeof date_of_birth === 'string') {
      const trimmed = date_of_birth.trim()
      const isValid = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid date_of_birth format' })
      }
      updates.dateOfBirth = trimmed
    }

    if (typeof preferred_language === 'string') {
      updates.preferredLanguage = preferred_language.trim()
    }

    if (typeof preferred_currency_code === 'string') {
      updates.preferredCurrencyCode = preferred_currency_code.trim()
    }

    if (notification_preferences === null) {
      updates.notificationPreferences = {}
    } else if (
      notification_preferences &&
      typeof notification_preferences === 'object' &&
      !Array.isArray(notification_preferences)
    ) {
      updates.notificationPreferences = notification_preferences
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided' })
    }

    const updatedRows = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.id, userId))
      .returning({
        id: profiles.id,
        full_name: profiles.fullName,
        phone: profiles.phone,
        avatar_url: profiles.avatarUrl,
        date_of_birth: profiles.dateOfBirth,
        preferred_language: profiles.preferredLanguage,
        notification_preferences: profiles.notificationPreferences,
        preferred_currency_code: profiles.preferredCurrencyCode,
        is_admin: profiles.isAdmin,
        created_at: profiles.createdAt,
        updated_at: profiles.updatedAt
      })

    const updated = updatedRows[0] ?? null

    return res.status(200).json({ profile: updated })
  } catch (err) {
    next(err)
  }
})

router.get('/me/dietary', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const rows = await db
      .select({ restrictionId: userDietaryRestrictions.restrictionId })
      .from(userDietaryRestrictions)
      .where(eq(userDietaryRestrictions.userId, userId))

    const restrictionIds = rows.map((row) => row.restrictionId)

    return res.status(200).json({ restriction_ids: restrictionIds })
  } catch (err) {
    next(err)
  }
})

router.get('/me/orders', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const page = Number(req.query.page ?? 1)
    const limit = Math.min(Number(req.query.limit ?? 20), 100)
    const status = typeof req.query.status === 'string' ? req.query.status : undefined

    const offset = Math.max(page - 1, 0) * limit

    const conditions = [eq(orders.userId, userId)]
    if (status) {
      conditions.push(eq(orders.status, status))
    }

    const baseQuery = db
      .select({
        id: orders.id,
        status: orders.status,
        total: orders.total,
        currencyCode: orders.currencyCode,
        createdAt: orders.createdAt,
        deliveryAddressId: orders.deliveryAddressId,
        addressLine1: addresses.line1,
        addressLine2: addresses.line2,
        cityName: cities.name,
        regionName: regions.name,
        countryName: countries.nameEs
      })
      .from(orders)
      .leftJoin(addresses, eq(orders.deliveryAddressId, addresses.id))
      .leftJoin(cities, eq(addresses.cityId, cities.id))
      .leftJoin(regions, eq(addresses.regionId, regions.id))
      .leftJoin(countries, eq(addresses.countryId, countries.id))
      .where(and(...conditions))

    const ordersRows = await baseQuery
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset)

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(...conditions))

    const countRows = await countQuery
    const totalCount = Number(countRows[0]?.count ?? 0)

    const orderIds = ordersRows.map((row) => row.id)
    const items = orderIds.length
      ? await db
          .select({
            orderId: orderItems.orderId,
            id: orderItems.id,
            baseName: mealBases.name,
            quantity: orderItems.quantity,
            unitPrice: orderItems.unitPrice,
            subtotal: orderItems.subtotal
          })
          .from(orderItems)
          .innerJoin(mealBases, eq(orderItems.baseId, mealBases.id))
          .where(inArray(orderItems.orderId, orderIds))
      : []

    const itemsByOrder = items.reduce<Record<string, typeof items>>((acc, item) => {
      const list = acc[item.orderId] ?? []
      list.push(item)
      acc[item.orderId] = list
      return acc
    }, {})

    const result = ordersRows.map((row) => ({
      id: row.id,
      status: row.status,
      total: typeof row.total === 'string' ? Number(row.total) : row.total,
      currency: row.currencyCode,
      createdAt: row.createdAt,
      items: (itemsByOrder[row.id] ?? []).map((item) => ({
        id: item.id,
        baseName: item.baseName,
        quantity: item.quantity,
        unitPrice: typeof item.unitPrice === 'string' ? Number(item.unitPrice) : item.unitPrice,
        subtotal: typeof item.subtotal === 'string' ? Number(item.subtotal) : item.subtotal
      })),
      deliveryAddress: row.deliveryAddressId
        ? {
            line1: row.addressLine1,
            line2: row.addressLine2,
            city: row.cityName,
            region: row.regionName,
            country: row.countryName
          }
        : null
    }))

    return res.status(200).json({
      orders: result,
      pagination: {
        page,
        limit,
        total: totalCount
      }
    })
  } catch (err) {
    next(err)
  }
})

router.put('/me/dietary', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { restriction_ids } = req.body ?? {}
    if (!Array.isArray(restriction_ids)) {
      return res.status(400).json({ error: 'restriction_ids must be an array' })
    }

    const normalizedIds = restriction_ids
      .filter((id): id is string => typeof id === 'string')
      .map((id) => id.trim())
      .filter((id) => id.length > 0)

    const uniqueIds = Array.from(new Set(normalizedIds))

    if (uniqueIds.length > 0) {
      const existing = await db
        .select({ id: dietaryRestrictions.id })
        .from(dietaryRestrictions)
        .where(inArray(dietaryRestrictions.id, uniqueIds))

      if (existing.length !== uniqueIds.length) {
        return res.status(400).json({ error: 'One or more restriction ids are invalid' })
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(userDietaryRestrictions)
        .where(eq(userDietaryRestrictions.userId, userId))

      if (uniqueIds.length > 0) {
        await tx.insert(userDietaryRestrictions).values(
          uniqueIds.map((restrictionId) => ({
            userId,
            restrictionId
          }))
        )
      }
    })

    return res.status(200).json({ restriction_ids: uniqueIds })
  } catch (err) {
    next(err)
  }
})

router.get('/me/access', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const profileRows = await db
      .select({ isAdmin: profiles.isAdmin })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1)

    const adminRoles = ['owner', 'admin']
    const memberships = await db
      .select({
        restaurant_id: restaurantUsers.restaurantId,
        restaurant_name: restaurants.name,
        role: restaurantUsers.role
      })
      .from(restaurantUsers)
      .innerJoin(restaurants, eq(restaurantUsers.restaurantId, restaurants.id))
      .where(
        and(
          eq(restaurantUsers.userId, userId),
          inArray(sql`lower(${restaurantUsers.role})`, adminRoles)
        )
      )

    return res.status(200).json({
      is_admin: profileRows[0]?.isAdmin ?? false,
      restaurants: memberships
    })
  } catch (err) {
    next(err)
  }
})

export default router
