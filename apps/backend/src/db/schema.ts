import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  pgEnum 
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['user', 'admin'])
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'])

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  username: text('username').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const dietaryRestrictions = pgTable('dietary_restrictions', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description')
})

export const userDietaryRestrictions = pgTable('user_dietary_restrictions', {
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  restrictionId: uuid('restriction_id').references(() => dietaryRestrictions.id).notNull()
})

export const ingredients = pgTable('ingredients', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category')
})

export const mealBases = pgTable('meal_bases', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  basePrice: text('base_price').notNull()
})

export const baseIngredients = pgTable('base_ingredients', {
  mealBaseId: uuid('meal_base_id').references(() => mealBases.id).notNull(),
  ingredientId: uuid('ingredient_id').references(() => ingredients.id).notNull()
})

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  totalPrice: text('total_price').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  mealBaseId: uuid('meal_base_id').references(() => mealBases.id).notNull(),
  quantity: text('quantity').notNull(),
  price: text('price').notNull()
})

export const itemCustomizations = pgTable('item_customizations', {
  orderItemId: uuid('order_item_id').references(() => orderItems.id).notNull(),
  ingredientId: uuid('ingredient_id').references(() => ingredients.id).notNull(),
  action: text('action').notNull()
})
