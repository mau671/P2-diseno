import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../db'
import {
  dietaryRestrictions,
  ingredientRestrictions,
  ingredients,
  userDietaryRestrictions
} from '../db/schema'

export type RestrictionWarning = {
  restrictionId: string
  restrictionName: string
  ingredientId: string
  ingredientName: string
}

export const getRestrictionWarnings = async (userId: string | undefined, ingredientIds: string[]) => {
  if (!userId || ingredientIds.length === 0) {
    return [] as RestrictionWarning[]
  }

  const rows = await db
    .select({
      restrictionId: dietaryRestrictions.id,
      restrictionName: dietaryRestrictions.name,
      ingredientId: ingredients.id,
      ingredientName: ingredients.name
    })
    .from(ingredientRestrictions)
    .innerJoin(ingredients, eq(ingredientRestrictions.ingredientId, ingredients.id))
    .innerJoin(
      userDietaryRestrictions,
      and(
        eq(userDietaryRestrictions.restrictionId, ingredientRestrictions.restrictionId),
        eq(userDietaryRestrictions.userId, userId)
      )
    )
    .innerJoin(dietaryRestrictions, eq(ingredientRestrictions.restrictionId, dietaryRestrictions.id))
    .where(inArray(ingredientRestrictions.ingredientId, ingredientIds))

  return rows
}
