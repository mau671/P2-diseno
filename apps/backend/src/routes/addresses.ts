import { Router } from 'express'
import { and, desc, eq } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'
import { db } from '../db'
import {
  addresses,
  cities,
  countries,
  orders,
  regions,
  userAddresses
} from '../db/schema'
import type { AuthRequest } from '../types/supabase'

const router = Router()

router.get('/me/addresses', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const rows = await db
      .select({
        addressId: userAddresses.addressId,
        label: userAddresses.label,
        isDefault: userAddresses.isDefault,
        line1: addresses.line1,
        line2: addresses.line2,
        postalCode: addresses.postalCode,
        notes: addresses.notes,
        cityId: cities.id,
        cityName: cities.name,
        regionId: regions.id,
        regionName: regions.name,
        countryId: countries.id,
        countryNameEs: countries.nameEs,
        countryNameEn: countries.nameEn
      })
      .from(userAddresses)
      .innerJoin(addresses, eq(userAddresses.addressId, addresses.id))
      .innerJoin(cities, eq(addresses.cityId, cities.id))
      .innerJoin(regions, eq(addresses.regionId, regions.id))
      .innerJoin(countries, eq(addresses.countryId, countries.id))
      .where(eq(userAddresses.userId, userId))
      .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt))

    const result = rows.map((row) => ({
      id: row.addressId,
      label: row.label,
      isDefault: row.isDefault,
      address: {
        id: row.addressId,
        line1: row.line1,
        line2: row.line2,
        postalCode: row.postalCode,
        notes: row.notes,
        city: {
          id: row.cityId,
          name: row.cityName
        },
        region: {
          id: row.regionId,
          name: row.regionName
        },
        country: {
          id: row.countryId,
          nameEs: row.countryNameEs,
          nameEn: row.countryNameEn
        }
      }
    }))

    return res.status(200).json({ addresses: result })
  } catch (err) {
    next(err)
  }
})

router.post('/me/addresses', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const {
      label,
      isDefault,
      line1,
      line2,
      cityId,
      regionId,
      countryId,
      postalCode,
      notes
    } = req.body ?? {}

    if (!line1 || !cityId || !regionId || !countryId) {
      return res.status(400).json({ error: 'line1, cityId, regionId, countryId are required' })
    }

    const created = await db.transaction(async (tx) => {
      if (isDefault) {
        await tx
          .update(userAddresses)
          .set({ isDefault: false })
          .where(eq(userAddresses.userId, userId))
      }

      const insertedAddresses = await tx
        .insert(addresses)
        .values({
          line1,
          line2,
          cityId,
          regionId,
          countryId,
          postalCode,
          notes
        })
        .returning({ id: addresses.id })

      const addressId = insertedAddresses[0]?.id
      if (!addressId) {
        throw new Error('Failed to create address')
      }

      await tx.insert(userAddresses).values({
        userId,
        addressId,
        label: typeof label === 'string' ? label : null,
        isDefault: Boolean(isDefault)
      })

      return addressId
    })

    return res.status(201).json({ address_id: created })
  } catch (err) {
    next(err)
  }
})

router.put('/me/addresses/:addressId', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
  const { addressId } = req.params

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!addressId) {
    return res.status(400).json({ error: 'Invalid address id' })
  }

    const existing = await db
      .select({ addressId: userAddresses.addressId })
      .from(userAddresses)
      .where(and(eq(userAddresses.userId, userId), eq(userAddresses.addressId, addressId)))
      .limit(1)

    if (!existing.length) {
      return res.status(404).json({ error: 'Address not found' })
    }

    const {
      label,
      isDefault,
      line1,
      line2,
      cityId,
      regionId,
      countryId,
      postalCode,
      notes
    } = req.body ?? {}

    await db.transaction(async (tx) => {
      if (isDefault) {
        await tx
          .update(userAddresses)
          .set({ isDefault: false })
          .where(eq(userAddresses.userId, userId))
      }

      if (
        line1 ||
        line2 !== undefined ||
        cityId ||
        regionId ||
        countryId ||
        postalCode !== undefined ||
        notes !== undefined
      ) {
        const updateAddress: Record<string, unknown> = {}
        if (line1) updateAddress.line1 = line1
        if (line2 !== undefined) updateAddress.line2 = line2
        if (cityId) updateAddress.cityId = cityId
        if (regionId) updateAddress.regionId = regionId
        if (countryId) updateAddress.countryId = countryId
        if (postalCode !== undefined) updateAddress.postalCode = postalCode
        if (notes !== undefined) updateAddress.notes = notes

        await tx
          .update(addresses)
          .set(updateAddress)
          .where(eq(addresses.id, addressId))
      }

      if (label !== undefined || isDefault !== undefined) {
        const updateLink: Record<string, unknown> = {}
        if (label !== undefined) {
          updateLink.label = typeof label === 'string' ? label : null
        }
        if (isDefault !== undefined) {
          updateLink.isDefault = Boolean(isDefault)
        }

        await tx
          .update(userAddresses)
          .set(updateLink)
          .where(and(eq(userAddresses.userId, userId), eq(userAddresses.addressId, addressId)))
      }
    })

    return res.status(200).json({ address_id: addressId })
  } catch (err) {
    next(err)
  }
})

router.delete('/me/addresses/:addressId', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
  const { addressId } = req.params

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!addressId) {
    return res.status(400).json({ error: 'Invalid address id' })
  }

    const hasOrder = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.deliveryAddressId, addressId)))
      .limit(1)

    if (hasOrder.length) {
      return res.status(400).json({ error: 'Address is linked to existing orders' })
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(userAddresses)
        .where(and(eq(userAddresses.userId, userId), eq(userAddresses.addressId, addressId)))

      const remaining = await tx
        .select({ id: userAddresses.addressId })
        .from(userAddresses)
        .where(eq(userAddresses.addressId, addressId))
        .limit(1)

      if (!remaining.length) {
        await tx.delete(addresses).where(eq(addresses.id, addressId))
      }
    })

    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.patch('/me/addresses/:addressId/default', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId
  const { addressId } = req.params

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!addressId) {
    return res.status(400).json({ error: 'Invalid address id' })
  }

    await db.transaction(async (tx) => {
      await tx
        .update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, userId))

      await tx
        .update(userAddresses)
        .set({ isDefault: true })
        .where(and(eq(userAddresses.userId, userId), eq(userAddresses.addressId, addressId)))
    })

    return res.status(200).json({ address_id: addressId })
  } catch (err) {
    next(err)
  }
})

export default router
