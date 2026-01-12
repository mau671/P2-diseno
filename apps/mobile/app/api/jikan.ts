// apps/mobile/api/jikan.ts
export type JikanPagination = {
  last_visible_page?: number;
  has_next_page?: boolean;
  current_page?: number;
};

export type JikanListResponse<T> = {
  data: T;
  pagination?: JikanPagination;
};

export class JikanError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "JikanError";
    this.status = status;
  }
}

const BASE_URL = "https://api.jikan.moe/v4";

function buildQuery(params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return "";
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchJikan<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  opts?: { signal?: AbortSignal }
): Promise<T> {
  const url = `${BASE_URL}${path}${buildQuery(params)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: opts?.signal,
  });

  if (!res.ok) {
    // Jikan rate limit suele ser 429
    if (res.status === 429) {
      throw new JikanError("Too many requests. Please try again.", 429);
    }

    let msg = "Failed to load data.";
    try {
      const j = (await res.json()) as any;
      msg =
        j?.message ||
        j?.error ||
        j?.status ||
        `Request failed (${res.status})`;
    } catch {
      // ignore
    }
    throw new JikanError(msg, res.status);
  }

  return (await res.json()) as T;
}
