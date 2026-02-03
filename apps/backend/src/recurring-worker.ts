import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

async function tick() {
  const { data, error } = await supabase.rpc("run_due_recurring_orders", { p_limit: 50 });

  if (error) {
    console.error("[worker] RPC error:", error);
    return;
  }

  if (Array.isArray(data) && data.length > 0) {
    console.log("[worker] executed:", data);
  } else {
    console.log("[worker] nothing due");
  }
}

tick();
setInterval(tick, 60_000);
