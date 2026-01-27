import { apiRequest } from "./backend";

export type CatalogBase = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  cuisine_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CatalogResponse = {
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
  items: CatalogBase[];
};

export type CatalogQuery = {
  page?: number;
  limit?: number;
  q?: string;
  cuisine?: string;
};

export async function getCatalogBases(
  params: CatalogQuery = {},
  accessToken?: string
): Promise<CatalogResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 12;

  const usp = new URLSearchParams();
  usp.set("page", String(page));
  usp.set("limit", String(limit));
  if (params.q?.trim()) usp.set("q", params.q.trim());
  if (params.cuisine?.trim()) usp.set("cuisine", params.cuisine.trim());

  return apiRequest<CatalogResponse>(`/catalog/bases?${usp.toString()}`, {}, accessToken);
}
