const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'lead_platform_token';
const USER_KEY = 'lead_platform_user';

export function getApiUrl() {
  return API_URL.replace(/\/$/, '');
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: unknown) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser<T>(): T | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  errors?: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = options.token ?? getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${getApiUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.message || 'Request failed', res.status, data.errors);
  }

  return data as T;
}
