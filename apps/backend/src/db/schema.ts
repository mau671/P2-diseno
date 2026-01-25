import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  primaryKey
} from 'drizzle-orm/pg-core'

const uuidV4 = sql`uuid_generate_v4()`

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  fullName: text('full_name'),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const dietaryRestrictions = pgTable('dietary_restrictions', {
  id: uuid('id').primaryKey().default(uuidV4),
  name: text('name').notNull().unique(),
  type: text('type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const userDietaryRestrictions = pgTable(
  'user_dietary_restrictions',
  {
    userId: uuid('user_id').notNull().references(() => profiles.id),
    restrictionId: uuid('restriction_id').notNull().references(() => dietaryRestrictions.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.restrictionId] })
  })
)

export const ingredients = pgTable('ingredients', {
  id: uuid('id').primaryKey().default(uuidV4),
  name: text('name').notNull().unique(),
  category: text('category').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const mealBases = pgTable('meal_bases', {
  id: uuid('id').primaryKey().default(uuidV4),
  name: text('name').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const baseIngredients = pgTable(
  'base_ingredients',
  {
    baseId: uuid('base_id').notNull().references(() => mealBases.id),
    ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id),
    defaultQty: integer('default_qty').notNull().default(1),
    isRemovable: boolean('is_removable').notNull().default(true),
    isEssential: boolean('is_essential').notNull().default(false)
  },
  (table) => ({
    pk: primaryKey({ columns: [table.baseId, table.ingredientId] })
  })
)

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().default(uuidV4),
  userId: uuid('user_id').notNull().references(() => profiles.id),
  status: text('status').notNull().default('pending'),
  deliveryAddress: text('delivery_address').notNull(),
  paymentMethod: text('payment_method'),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
  tax: numeric('tax', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().default(uuidV4),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  baseId: uuid('base_id').notNull().references(() => mealBases.id),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull()
})

export const itemCustomizations = pgTable('item_customizations', {
  id: uuid('id').primaryKey().default(uuidV4),
  orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id),
  ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id),
  action: text('action').notNull(),
  qty: integer('qty').notNull().default(1),
  deltaPrice: numeric('delta_price', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})
