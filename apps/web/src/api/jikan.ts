// apps/web/src/lib/jikan.ts
const BASE_URL = "https://api.jikan.moe/v4";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Respuesta típica de Jikan v4
export type JikanResponse<T> = {
  data: T;
  pagination?: unknown;
};

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
}


