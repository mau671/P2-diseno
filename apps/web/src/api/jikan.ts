import { rateLimiter } from "@/lib/rate-limiter";

const BASE_URL = "https://api.jikan.moe/v4";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type JikanResponse<T> = {
  data: T;
  pagination?: unknown;
};

const requestQueue = new Map<string, Promise<unknown>>();

export async function fetchJikan<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: { signal?: AbortSignal }
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }

  const cacheKey = url.toString();

  // Check for duplicate requests first (before rate limiting)
  if (requestQueue.has(cacheKey)) {
    return requestQueue.get(cacheKey) as Promise<T>;
  }

  // Create the request promise wrapped with rate limiter
  const requestPromise = rateLimiter.execute(async () => {
    let res: Response;
    try {
      res = await fetch(url.toString(), { signal: options?.signal });
    } catch {
      throw new ApiError("Sin conexión. Revisá tu internet.");
    }

    if (!res.ok) {
      if (res.status === 429) throw new ApiError("Demasiadas solicitudes. Intentá de nuevo.", 429);
      throw new ApiError("Error al cargar datos.", res.status);
    }

    return (await res.json()) as T;
  }) as Promise<T>;

  requestQueue.set(cacheKey, requestPromise);

  requestPromise.finally(() => {
    requestQueue.delete(cacheKey);
  });

  return requestPromise;
}


