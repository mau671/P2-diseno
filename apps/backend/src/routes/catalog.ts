import { Router } from "express";
import { getSupabaseClient } from "../lib/supabase";
import { optionalAuthMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../types/supabase";

const router = Router();

type CatalogBaseRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: string | number | null;
  cuisine_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_count: number | string;
};

router.get("/bases", optionalAuthMiddleware, async (req, res, next) => {
  try {
    const limitRaw = Number(req.query.limit ?? 10);
    const pageRaw = Number(req.query.page ?? 1);

    const limit = Math.min(50, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 10));
    const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1);

    const q = typeof req.query.q === "string" ? req.query.q.trim() : null;
    const cuisine = typeof req.query.cuisine === "string" ? req.query.cuisine.trim() : null;

    const authReq = req as AuthRequest;
    const userId = authReq.locals?.userId ?? null;

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not initialized" });
    }

    const { data, error } = (await (supabase as any).rpc("get_catalog_bases", {
      p_user_id: userId,
      p_q: q,
      p_cuisine: cuisine,
      p_limit: limit,
      p_page: page,
    })) as { data: CatalogBaseRow[] | null; error: { message?: string } | null };

    if (error) {
      return res.status(500).json({ error: error.message ?? "RPC error" });
    }

    const rows = data ?? [];
    const total = Number((rows[0]?.total_count ?? 0));

    const items = rows.map(({ total_count, ...rest }) => ({
      ...rest,
      base_price:
        typeof rest.base_price === "string"
          ? Number(rest.base_price)
          : (rest.base_price ?? 0),
    }));

    return res.status(200).json({
      page,
      limit,
      total,
      has_more: page * limit < total,
      items,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
