import { apiRequest } from "@/api/backend";

export type AccessSummary = {
  is_admin: boolean;
  restaurants: Array<{
    restaurant_id: string;
    restaurant_name: string;
    role: string;
  }>;
};

export async function fetchAccessSummary(accessToken?: string) {
  return apiRequest<AccessSummary>("/profiles/me/access", { method: "GET" }, accessToken);
}
