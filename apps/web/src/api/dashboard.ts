import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

function getLocalTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export async function getRestaurantDashboard(restaurantId: string, accessToken: string) {
  if (!restaurantId) throw new Error("Missing restaurantId");
  if (!accessToken) throw new Error("Missing accessToken");

  const authed = createClient(supabaseUrl, supabaseAnonKey, {
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

  const tz = getLocalTimeZone();

  const { data, error } = await authed.rpc("get_restaurant_dashboard", {
    target_restaurant_id: restaurantId,
    target_tz: tz,
  });

  if (error) throw new Error(error.message);
  return data;
}
