import { createClient } from "@supabase/supabase-js";

// Aquí se cargan variables de entorno para conectar con Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Aquí se valida early que existan las env vars necesarias (evita errores raros en runtime)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

// Aquí crea un cliente de Supabase “autenticado” por request usando Bearer token en headers
function authedClient(accessToken: string) {
  if (!accessToken) throw new Error("Missing accessToken");

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Aquí evita que el cliente guarde sesión localmente (controlado por tu auth)
      autoRefreshToken: false, // Aquí evita refrescos automáticos del token
      detectSessionInUrl: false, // Aquí evita leer sesión desde URL (flows OAuth)
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Aquí se manda el token para cumplir RLS/Policies
      },
    },
  });
}

// Aquí define el shape del RPC de platillos populares por mes (lo usa useDashboard)
export type PopularDishMonthRow = {
  name: string;
  orders_count: number;
};

// Aquí consulta el dashboard del restaurante por RPC (métricas del día + órdenes activas)
export async function getRestaurantDashboard(restaurantId: string, accessToken: string) {
  if (!restaurantId) throw new Error("Missing restaurantId");

  const authed = authedClient(accessToken);

  // Aquí llama el RPC que agrega y devuelve métricas y listas necesarias para el dashboard
  const { data, error } = await authed.rpc("get_restaurant_dashboard", {
    target_restaurant_id: restaurantId,
  });

  // Aquí traduce el error de Supabase a un Error estándar para que React Query lo maneje
  if (error) throw new Error(error.message);
  return data;
}

// Aquí consulta platillos populares del mes por RPC (independiente del filtro del día)
export async function getRestaurantPopularDishesMonth(restaurantId: string, accessToken: string) {
  if (!restaurantId) throw new Error("Missing restaurantId");

  const authed = authedClient(accessToken);

  // Aquí llama el RPC que calcula popularidad en rango mensual (1 al último día)
  const { data, error } = await authed.rpc("get_restaurant_popular_dishes_month", {
    target_restaurant_id: restaurantId,
  });

  if (error) throw new Error(error.message);

  // Aquí asegura que siempre se retorne un array tipado para la UI (evita null checks repetidos)
  return (data ?? []) as PopularDishMonthRow[];
}
