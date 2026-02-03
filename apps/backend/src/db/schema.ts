import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  primaryKey,
  date,
  jsonb,
  uniqueIndex
} from 'drizzle-orm/pg-core'

const uuidV4 = sql`uuid_generate_v4()`

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  fullName: text('full_name'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  dateOfBirth: date('date_of_birth'),
  preferredLanguage: text('preferred_language').notNull().default('es-419'),
  notificationPreferences: jsonb('notification_preferences')
    .notNull()
    .default(sql`'{}'::jsonb`),
  preferredCurrencyCode: text('preferred_currency_code'),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const restaurants = pgTable(
  'restaurants',
  {
    id: uuid('id').primaryKey().default(uuidV4),
    name: text('name').notNull(),
    legalName: text('legal_name'),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  }
)

export const currencies = pgTable('currencies', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  precision: integer('precision').notNull().default(2),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const restaurantCurrencies = pgTable(
  'restaurant_currencies',
  {
    restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, {
      onDelete: 'cascade'
    }),
    currencyCode: text('currency_code').notNull().references(() => currencies.code, {
      onDelete: 'restrict'
    }),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.restaurantId, table.currencyCode] })
  })
)

export const countries = pgTable('countries', {
  id: uuid('id').primaryKey().default(uuidV4),
  iso2: text('iso2').notNull().unique(),
  iso3: text('iso3').notNull().unique(),
  nameEs: text('name_es').notNull(),
  nameEn: text('name_en').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const regions = pgTable(
  'regions',
  {
    id: uuid('id').primaryKey().default(uuidV4),
    countryId: uuid('country_id').notNull().references(() => countries.id, {
      onDelete: 'cascade'
    }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    unique: uniqueIndex('regions_country_id_name_unique').on(table.countryId, table.name)
  })
)

export const cities = pgTable(
  'cities',
  {
    id: uuid('id').primaryKey().default(uuidV4),
    regionId: uuid('region_id').notNull().references(() => regions.id, {
      onDelete: 'cascade'
    }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    unique: uniqueIndex('cities_region_id_name_unique').on(table.regionId, table.name)
  })
)

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().default(uuidV4),
  line1: text('line1').notNull(),
  line2: text('line2'),
  cityId: uuid('city_id').notNull().references(() => cities.id, {
    onDelete: 'restrict'
  }),
  regionId: uuid('region_id').notNull().references(() => regions.id, {
    onDelete: 'restrict'
  }),
  countryId: uuid('country_id').notNull().references(() => countries.id, {
    onDelete: 'restrict'
  }),
  postalCode: text('postal_code'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const kitchens = pgTable(
  'kitchens',
  {
    id: uuid('id').primaryKey().default(uuidV4),
    restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, {
      onDelete: 'cascade'
    }),
    name: text('name').notNull(),
    addressId: uuid('address_id').references(() => addresses.id, {
      onDelete: 'set null'
    }),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    unique: uniqueIndex('kitchens_restaurant_id_name_unique').on(table.restaurantId, table.name)
  })
)

export const restaurantUsers = pgTable(
  'restaurant_users',
  {
    restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, {
      onDelete: 'cascade'
    }),
    userId: uuid('user_id').notNull().references(() => profiles.id, {
      onDelete: 'cascade'
    }),
    role: text('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.restaurantId, table.userId] })
  })
)

export const dietaryRestrictionTypes = pgTable('dietary_restriction_types', {
  id: uuid('id').primaryKey().default(uuidV4),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const dietaryRestrictions = pgTable(
  'dietary_restrictions',
  {
    id: uuid('id').primaryKey().default(uuidV4),
    name: text('name').notNull(),
    restrictionTypeId: uuid('restriction_type_id')
      .notNull()
      .references(() => dietaryRestrictionTypes.id, {
        onDelete: 'restrict'
      }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    unique: uniqueIndex('dietary_restrictions_type_name_unique').on(
      table.restrictionTypeId,
      table.name
    )
  })
)

export const userDietaryRestrictions = pgTable(
  'user_dietary_restrictions',
  {
    userId: uuid('user_id').notNull().references(() => profiles.id, {
      onDelete: 'cascade'
    }),
    restrictionId: uuid('restriction_id')
      .notNull()
      .references(() => dietaryRestrictions.id, {
        onDelete: 'cascade'
      }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.restrictionId] })
  })
)

export const nutritionGoals = pgTable('nutrition_goals', {
  id: uuid('id').primaryKey().default(uuidV4),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const userNutritionGoals = pgTable(
  'user_nutrition_goals',
  {
    userId: uuid('user_id').notNull().references(() => profiles.id, {
      onDelete: 'cascade'
    }),
    goalId: uuid('goal_id').notNull().references(() => nutritionGoals.id, {
      onDelete: 'cascade'
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.goalId] })
  })
)

export const ingredientCategories = pgTable('ingredient_categories', {
  id: uuid('id').primaryKey().default(uuidV4),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const ingredients = pgTable(
  'ingredients',
  {
    id: uuid('id').primaryKey().default(uuidV4),
    restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, {
      onDelete: 'cascade'
    }),
    categoryId: uuid('category_id').notNull().references(() => ingredientCategories.id, {
      onDelete: 'restrict'
    }),
    name: text('name').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    stock: integer('stock').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    unique: uniqueIndex('ingredients_restaurant_id_name_unique').on(
      table.restaurantId,
      table.name
    )
  })
)

export const ingredientRestrictions = pgTable(
  'ingredient_restrictions',
  {
    ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, {
      onDelete: 'cascade'
    }),
    restrictionId: uuid('restriction_id')
      .notNull()
      .references(() => dietaryRestrictions.id, {
        onDelete: 'cascade'
      })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ingredientId, table.restrictionId] })
  })
)

export const ingredientStockMovements = pgTable('ingredient_stock_movements', {
  id: uuid('id').primaryKey().default(uuidV4),
  ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, {
    onDelete: 'cascade'
  }),
  delta: integer('delta').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const ingredientPriceHistory = pgTable('ingredient_price_history', {
  id: uuid('id').primaryKey().default(uuidV4),
  ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, {
    onDelete: 'cascade'
  }),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow()
})

export const mealBaseCategories = pgTable('meal_base_categories', {
  id: uuid('id').primaryKey().default(uuidV4),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const assets = pgTable(
  'assets',
  {
    id: uuid('id').primaryKey().default(uuidV4),
    restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, {
      onDelete: 'cascade'
    }),
    bucketId: text('bucket_id').notNull(),
    path: text('path').notNull(),
    title: text('title'),
    contentType: text('content_type'),
    sizeBytes: integer('size_bytes').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    unique: uniqueIndex('assets_bucket_path_unique').on(table.bucketId, table.path)
  })
)

export const mealBases = pgTable(
  'meal_bases',
  {
    id: uuid('id').primaryKey().default(uuidV4),
    restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, {
      onDelete: 'cascade'
    }),
    name: text('name').notNull(),
    description: text('description'),
    imageAssetId: uuid('image_asset_id').references(() => assets.id, {
      onDelete: 'set null'
    }),
    basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    unique: uniqueIndex('meal_bases_restaurant_id_name_unique').on(
      table.restaurantId,
      table.name
    )
  })
)

export const mealBaseCategoryMap = pgTable(
  'meal_base_category_map',
  {
    baseId: uuid('base_id').notNull().references(() => mealBases.id, {
      onDelete: 'cascade'
    }),
    categoryId: uuid('category_id').notNull().references(() => mealBaseCategories.id, {
      onDelete: 'cascade'
    })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.baseId, table.categoryId] })
  })
)

export const cookingMethods = pgTable('cooking_methods', {
  id: uuid('id').primaryKey().default(uuidV4),
  name: text('name').notNull().unique(),
  priceDelta: numeric('price_delta', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const baseCookingMethods = pgTable(
  'base_cooking_methods',
  {
    baseId: uuid('base_id').notNull().references(() => mealBases.id, {
      onDelete: 'cascade'
    }),
    methodId: uuid('method_id').notNull().references(() => cookingMethods.id, {
      onDelete: 'restrict'
    })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.baseId, table.methodId] })
  })
)

export const mealBaseKitchens = pgTable(
  'meal_base_kitchens',
  {
    baseId: uuid('base_id').notNull().references(() => mealBases.id, {
      onDelete: 'cascade'
    }),
    kitchenId: uuid('kitchen_id').notNull().references(() => kitchens.id, {
      onDelete: 'cascade'
    }),
    isAvailable: boolean('is_available').notNull().default(true)
  },
  (table) => ({
    pk: primaryKey({ columns: [table.baseId, table.kitchenId] })
  })
)

export const baseIngredients = pgTable(
  'base_ingredients',
  {
    baseId: uuid('base_id').notNull().references(() => mealBases.id, {
      onDelete: 'cascade'
    }),
    ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, {
      onDelete: 'restrict'
    }),
    defaultQty: integer('default_qty').notNull().default(1),
    isRemovable: boolean('is_removable').notNull().default(true),
    isEssential: boolean('is_essential').notNull().default(false)
  },
  (table) => ({
    pk: primaryKey({ columns: [table.baseId, table.ingredientId] })
  })
)

export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: uuid('id').primaryKey().default(uuidV4),
    userId: uuid('user_id').notNull().references(() => profiles.id, {
      onDelete: 'cascade'
    }),
    type: text('type').notNull(),
    name: text('name').notNull(),
    lastFour: text('last_four'),
    expiryMonth: integer('expiry_month'),
    expiryYear: integer('expiry_year'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  }
)

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().default(uuidV4),
  userId: uuid('user_id').notNull().references(() => profiles.id, {
    onDelete: 'cascade'
  }),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, {
    onDelete: 'restrict'
  }),
  kitchenId: uuid('kitchen_id').references(() => kitchens.id, {
    onDelete: 'set null'
  }),
  deliveryAddressId: uuid('delivery_address_id').references(() => addresses.id, {
    onDelete: 'set null'
  }),
  status: text('status').notNull().default('pending'),
  currencyCode: text('currency_code').notNull().references(() => currencies.code, {
    onDelete: 'restrict'
  }),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }),
  paymentMethod: text('payment_method'),
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id, {
    onDelete: 'set null'
  }),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
  tax: numeric('tax', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().default(uuidV4),
  orderId: uuid('order_id').notNull().references(() => orders.id, {
    onDelete: 'cascade'
  }),
  baseId: uuid('base_id').notNull().references(() => mealBases.id, {
    onDelete: 'restrict'
  }),
  cookingMethodId: uuid('cooking_method_id').references(() => cookingMethods.id, {
    onDelete: 'set null'
  }),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull()
})

export const itemCustomizations = pgTable('item_customizations', {
  id: uuid('id').primaryKey().default(uuidV4),
  orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id, {
    onDelete: 'cascade'
  }),
  ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, {
    onDelete: 'restrict'
  }),
  action: text('action').notNull(),
  qty: integer('qty').notNull().default(1),
  deltaPrice: numeric('delta_price', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().default(uuidV4),
  userId: uuid('user_id').notNull().references(() => profiles.id, {
    onDelete: 'cascade'
  }),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, {
    onDelete: 'cascade'
  }),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().default(uuidV4),
  cartId: uuid('cart_id').notNull().references(() => carts.id, {
    onDelete: 'cascade'
  }),
  baseId: uuid('base_id').notNull().references(() => mealBases.id, {
    onDelete: 'restrict'
  }),
  cookingMethodId: uuid('cooking_method_id').references(() => cookingMethods.id, {
    onDelete: 'set null'
  }),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull()
})

export const cartItemCustomizations = pgTable('cart_item_customizations', {
  id: uuid('id').primaryKey().default(uuidV4),
  cartItemId: uuid('cart_item_id').notNull().references(() => cartItems.id, {
    onDelete: 'cascade'
  }),
  ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, {
    onDelete: 'restrict'
  }),
  action: text('action').notNull(),
  qty: integer('qty').notNull().default(1),
  deltaPrice: numeric('delta_price', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const savedMeals = pgTable('saved_meals', {
  id: uuid('id').primaryKey().default(uuidV4),
  userId: uuid('user_id').notNull().references(() => profiles.id, {
    onDelete: 'cascade'
  }),
  baseId: uuid('base_id').notNull().references(() => mealBases.id, {
    onDelete: 'cascade'
  }),
  cookingMethodId: uuid('cooking_method_id').references(() => cookingMethods.id, {
    onDelete: 'set null'
  }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const savedMealCustomizations = pgTable('saved_meal_customizations', {
  id: uuid('id').primaryKey().default(uuidV4),
  savedMealId: uuid('saved_meal_id').notNull().references(() => savedMeals.id, {
    onDelete: 'cascade'
  }),
  ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, {
    onDelete: 'restrict'
  }),
  action: text('action').notNull(),
  qty: integer('qty').notNull().default(1),
  deltaPrice: numeric('delta_price', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().default(uuidV4),
  orderId: uuid('order_id').notNull().references(() => orders.id, {
    onDelete: 'cascade'
  }),
  provider: text('provider').notNull(),
  status: text('status').notNull(),
  currencyCode: text('currency_code').notNull().references(() => currencies.code, {
    onDelete: 'restrict'
  }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  transactionRef: text('transaction_ref'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').primaryKey().default(uuidV4),
  orderId: uuid('order_id').notNull().references(() => orders.id, {
    onDelete: 'cascade'
  }),
  status: text('status').notNull(),
  changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
  changedBy: uuid('changed_by').references(() => profiles.id, {
    onDelete: 'set null'
  })
})

export const userAddresses = pgTable(
  'user_addresses',
  {
    userId: uuid('user_id').notNull().references(() => profiles.id, {
      onDelete: 'cascade'
    }),
    addressId: uuid('address_id').notNull().references(() => addresses.id, {
      onDelete: 'cascade'
    }),
    label: text('label'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.addressId] })
  })
)

export const recurringOrders = pgTable('recurring_orders', {
  id: uuid('id').primaryKey().default(uuidV4),
  userId: uuid('user_id').notNull().references(() => profiles.id, {
    onDelete: 'cascade'
  }),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, {
    onDelete: 'restrict'
  }),
  status: text('status').notNull().default('active'),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }).notNull(),
  intervalUnit: text('interval_unit').notNull().default('week'),
  intervalValue: integer('interval_value').notNull().default(1),
  daysOfWeek: integer('days_of_week').array(),
  daysOfMonth: integer('days_of_month').array(),
  timeWindows: jsonb('time_windows').notNull().default('[]'),
  timeZone: text('time_zone').notNull().default('America/Costa_Rica'),
  startDate: date('start_date').notNull().default(sql`current_date`),
  endDate: date('end_date'),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  deliveryAddressId: uuid('delivery_address_id').references(() => addresses.id, {
    onDelete: 'set null'
  }),
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id, {
    onDelete: 'set null'
  }),
  currencyCode: text('currency_code').notNull().references(() => currencies.code, {
    onDelete: 'restrict'
  }),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const recurringOrderItems = pgTable('recurring_order_items', {
  id: uuid('id').primaryKey().default(uuidV4),
  recurringOrderId: uuid('recurring_order_id')
    .notNull()
    .references(() => recurringOrders.id, {
      onDelete: 'cascade'
    }),
  baseId: uuid('base_id').notNull().references(() => mealBases.id, {
    onDelete: 'restrict'
  }),
  cookingMethodId: uuid('cooking_method_id').references(() => cookingMethods.id, {
    onDelete: 'set null'
  }),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull()
})

export const recurringOrderCustomizations = pgTable('recurring_order_customizations', {
  id: uuid('id').primaryKey().default(uuidV4),
  recurringOrderItemId: uuid('recurring_order_item_id')
    .notNull()
    .references(() => recurringOrderItems.id, {
      onDelete: 'cascade'
    }),
  ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, {
    onDelete: 'restrict'
  }),
  action: text('action').notNull(),
  qty: integer('qty').notNull().default(1),
  deltaPrice: numeric('delta_price', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})
