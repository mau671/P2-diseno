import { Router } from 'express'
import { asc, eq } from 'drizzle-orm'
import { db } from '../db'
import { cities, countries, regions } from '../db/schema'

const router = Router()

router.get('/countries', async (req, res, next) => {
  try {
    const rows = await db
      .select({
        id: countries.id,
        iso2: countries.iso2,
        iso3: countries.iso3,
        name_es: countries.nameEs,
        name_en: countries.nameEn
      })
      .from(countries)
      .orderBy(asc(countries.nameEs))

    return res.status(200).json({ countries: rows })
  } catch (err) {
    next(err)
  }
})

router.get('/regions', async (req, res, next) => {
  try {
    const countryId = typeof req.query.countryId === 'string' ? req.query.countryId : undefined

    const query = db
      .select({
        id: regions.id,
        country_id: regions.countryId,
        name: regions.name
      })
      .from(regions)

    const rows = await (countryId
      ? query.where(eq(regions.countryId, countryId))
      : query
    ).orderBy(asc(regions.name))

    return res.status(200).json({ regions: rows })
  } catch (err) {
    next(err)
  }
})

router.get('/cities', async (req, res, next) => {
  try {
    const regionId = typeof req.query.regionId === 'string' ? req.query.regionId : undefined

    const query = db
      .select({
        id: cities.id,
        region_id: cities.regionId,
        name: cities.name
      })
      .from(cities)

    const rows = await (regionId ? query.where(eq(cities.regionId, regionId)) : query).orderBy(
      asc(cities.name)
    )

    return res.status(200).json({ cities: rows })
  } catch (err) {
    next(err)
  }
})

export default router
