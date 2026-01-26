import { Router } from "express";
import { optionalAuthMiddleware } from "../middleware/auth";
import { getSupabaseClient } from "../lib/supabase";
import type { AuthRequest } from "../types/supabase";

const router = Router();

/**
 * GET /api/v1/catalog/bases
 * Query:
 *  - limit (default 10)
 *  - page  (default 1)
 *  - q     (search by name or cuisine_type)
 *  - cuisine (exact match)
 *
 * Optional auth:
 *  - If Bearer token exists -> applies dietary restrictions filtering.
 */
router.get("/bases", optionalAuthMiddleware, async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit ?? 10), 50));
    const page = Math.max(1, Number(req.query.page ?? 1));
    const q = typeof req.query.q === "string" ? req.query.q : null;
    const cuisine = typeof req.query.cuisine === "string" ? req.query.cuisine : null;

    const authReq = req as AuthRequest;
    const userId = authReq.locals?.userId ?? null;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc("get_catalog_bases", {
      p_user_id: userId,
      p_q: q,
      p_cuisine: cuisine,
      p_limit: limit,
      p_page: page,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const total = data?.[0]?.total_count ?? 0;
    const items = (data ?? []).map(({ total_count, ...rest }) => rest);

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
