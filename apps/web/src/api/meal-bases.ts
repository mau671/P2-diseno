import { apiRequest } from "@/api/backend";

export type MealBaseCategory = {
  id: string;
  name: string;
};

export type CookingMethod = {
  id: string;
  name: string;
  price_delta: number;
};

export type BaseIngredient = {
  ingredient_id: string;
  ingredient_name: string;
  category_id: string;
  category_name: string;
  unit_price: number;
  default_qty: number;
  is_removable: boolean;
  is_essential: boolean;
};

export type ExtraIngredient = {
  ingredient_id: string;
  ingredient_name: string;
  category_id: string;
  category_name: string;
  unit_price: number;
};

export type RestrictionWarning = {
  restriction_id: string;
  restriction_name: string;
  ingredient_name: string;
};

export type MealBase = {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  name: string;
  description: string | null;
  image_asset_id: string | null;
  base_price: number;
  is_active: boolean;
  categories: MealBaseCategory[];
  restriction_warnings: RestrictionWarning[];
  matches_user_restrictions: boolean;
};

export type MealBaseDetail = MealBase & {
  cooking_methods: CookingMethod[];
  base_ingredients: BaseIngredient[];
  extra_ingredients: ExtraIngredient[];
};

export type CustomizationOptions = {
  base_price: number;
  cooking_methods: CookingMethod[];
  removable_ingredients: BaseIngredient[];
  extra_ingredients: ExtraIngredient[];
};

export type PriceCalculation = {
  base_price: number;
  cooking_method_delta: number;
  removed_discounts: number;
  added_charges: number;
  quantity: number;
  subtotal: number;
  tax: number;
  total: number;
  currency_code: string | null;
};

export type MealBasesQueryParams = {
  search?: string;
  restaurant_id?: string;
  kitchen_id?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  is_available?: boolean;
  page?: number;
  limit?: number;
};

export type MealBasesResponse = {
  meal_bases: MealBase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export type CreateMealBasePayload = {
  restaurant_id: string;
  name: string;
  description?: string;
  base_price: number;
  image_asset_id?: string;
  is_active?: boolean;
  category_ids?: string[];
  cooking_method_ids?: string[];
  base_ingredients?: Array<{
    ingredient_id: string;
    default_qty: number;
    is_removable: boolean;
    is_essential: boolean;
  }>;
};

export type UpdateMealBasePayload = {
  restaurant_id: string;
} & Partial<Omit<CreateMealBasePayload, "restaurant_id">>;

export type CalculatePricePayload = {
  quantity?: number;
  cooking_method_id?: string;
  removed_ingredients?: Array<{ ingredient_id: string }>;
  added_ingredients?: Array<{ ingredient_id: string; qty?: number }>;
};

const buildQueryString = (params: MealBasesQueryParams) => {
  const query = new URLSearchParams();

  if (params.search) query.set("search", params.search);
  if (params.restaurant_id) query.set("restaurantId", params.restaurant_id);
  if (params.kitchen_id) query.set("kitchenId", params.kitchen_id);
  if (params.category_id) query.set("categoryId", params.category_id);
  if (params.min_price !== undefined) query.set("minPrice", String(params.min_price));
  if (params.max_price !== undefined) query.set("maxPrice", String(params.max_price));
  if (params.is_available !== undefined) query.set("isAvailable", String(params.is_available));
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return qs ? `?${qs}` : "";
};

export async function fetchMealBases(
  params: MealBasesQueryParams,
  accessToken?: string
): Promise<MealBasesResponse> {
  return apiRequest(
    `/meal-bases${buildQueryString(params)}`,
    { method: "GET" },
    accessToken
  );
}

export async function fetchMealBaseById(id: string, accessToken?: string) {
  return apiRequest<{ meal_base: MealBaseDetail }>(
    `/meal-bases/${id}`,
    { method: "GET" },
    accessToken
  );
}

export async function fetchCustomizationOptions(id: string, accessToken?: string) {
  return apiRequest<{ customization_options: CustomizationOptions }>(
    `/meal-bases/${id}/customization-options`,
    { method: "GET" },
    accessToken
  );
}

export async function calculatePrice(
  id: string,
  payload: CalculatePricePayload,
  accessToken?: string
): Promise<PriceCalculation> {
  return apiRequest(
    `/meal-bases/${id}/calculate-price`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    accessToken
  );
}

export async function createMealBase(
  payload: CreateMealBasePayload,
  accessToken?: string
) {
  return apiRequest<{ meal_base: MealBase }>(
    "/meal-bases",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    accessToken
  );
}

export async function updateMealBase(
  id: string,
  payload: UpdateMealBasePayload,
  accessToken?: string
) {
  if (!payload.restaurant_id) {
    throw new Error("restaurant_id is required to update a meal base");
  }

  return apiRequest<{ meal_base: MealBase }>(
    `/meal-bases/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    accessToken
  );
}

export async function deleteMealBase(id: string, accessToken?: string) {
  return apiRequest<{ success: boolean }>(
    `/meal-bases/${id}`,
    { method: "DELETE" },
    accessToken
  );
}
