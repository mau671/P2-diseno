import { apiRequest } from "@/api/backend";

export type Ingredient = {
  id: string;
  name: string;
  category: string;
  unit_price: string;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type IngredientsResponse = {
  items: Ingredient[];
  page: number;
  page_size: number;
  total: number;
};

export type CreateIngredientPayload = {
  name: string;
  category: string;
  unit_price: number;
  stock: number;
  is_active?: boolean;
};

export type UpdateIngredientPayload = Partial<CreateIngredientPayload>;

export type IngredientsQueryParams = {
  search?: string;
  category?: string;
  is_active?: boolean | null;
  page?: number;
  page_size?: number;
  sort?: string;
  order?: "asc" | "desc";
};

const buildQueryString = (params: IngredientsQueryParams) => {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.is_active !== undefined && params.is_active !== null) {
    query.set("is_active", String(params.is_active));
  }
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  if (params.sort) query.set("sort", params.sort);
  if (params.order) query.set("order", params.order);
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export async function fetchIngredients(
  params: IngredientsQueryParams,
  accessToken?: string
): Promise<IngredientsResponse> {
  const queryString = buildQueryString(params);
  return apiRequest<IngredientsResponse>(`/ingredients${queryString}`, { method: "GET" }, accessToken);
}

export async function fetchIngredient(id: string, accessToken?: string) {
  return apiRequest<{ ingredient: Ingredient }>(`/ingredients/${id}`, { method: "GET" }, accessToken);
}

export async function createIngredient(payload: CreateIngredientPayload, accessToken?: string) {
  return apiRequest<{ ingredient: Ingredient }>(
    "/ingredients",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    accessToken
  );
}

export async function updateIngredient(
  id: string,
  payload: UpdateIngredientPayload,
  accessToken?: string
) {
  return apiRequest<{ ingredient: Ingredient }>(
    `/ingredients/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    accessToken
  );
}

export async function deleteIngredient(id: string, accessToken?: string) {
  return apiRequest<{ ingredient: Ingredient }>(
    `/ingredients/${id}`,
    { method: "DELETE" },
    accessToken
  );
}
