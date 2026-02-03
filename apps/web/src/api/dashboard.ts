import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

function authedClient(accessToken: string) {
  if (!accessToken) throw new Error("Missing accessToken");

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export type PopularDishMonthRow = {
  name: string;
  orders_count: number;
};

export async function getRestaurantDashboard(restaurantId: string, accessToken: string) {
  if (!restaurantId) throw new Error("Missing restaurantId");

  const authed = authedClient(accessToken);

  const { data, error } = await authed.rpc("get_restaurant_dashboard", {
    target_restaurant_id: restaurantId,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function getRestaurantPopularDishesMonth(restaurantId: string, accessToken: string) {
  if (!restaurantId) throw new Error("Missing restaurantId");

  const authed = authedClient(accessToken);

  const { data, error } = await authed.rpc("get_restaurant_popular_dishes_month", {
    target_restaurant_id: restaurantId,
  });

  if (error) throw new Error(error.message);

  return (data ?? []) as PopularDishMonthRow[];
}
