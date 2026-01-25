type ApiErrorResponse = {
  error?: string;
};

export class BackendApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const API_ROOT = `${API_BASE_URL}/api/v1`;

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await parseJson<ApiErrorResponse>(response).catch(() => ({
      error: undefined
    }));
    const message = errorBody.error || response.statusText || "Request failed";
    throw new BackendApiError(message, response.status);
  }

  return parseJson<T>(response);
}

export type AuthUser = {
  id: string;
  email: string | null;
  user_metadata?: {
    full_name?: string | null;
  };
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export type AuthResponse = {
  user: AuthUser | null;
  session: AuthSession | null;
};
