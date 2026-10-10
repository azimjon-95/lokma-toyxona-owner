/*
 * Server bilan aloqa (lokma-toyxonalar-server, /api/owner-app).
 * EXPO_PUBLIC_API_URL bo'sh bo'lsa ilova demo rejimda ishlaydi (services/backend.ts).
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
export const IS_DEMO = !API_URL;
export const API_BASE = `${API_URL}/api/owner-app`;
const TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  constructor(message: string, public status = 0, public code?: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Joriy rol tokeni (AuthContext o'rnatadi) */
export const setAuthToken = (t: string | null) => { authToken = t; };
/** 401: token yaroqsiz (muddati tugagan, parol almashgan, hisob o'chirilgan) — ilova sessiyani yopadi */
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn; };

type Query = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  /** Berilsa shu token ishlatiladi (login/sessiya almashinuvi) */
  token?: string | null;
  /** 401 da ilovani chiqarib yubormaslik (login ekrani) */
  silent401?: boolean;
}

export async function request<T>(path: string, o: RequestOptions = {}): Promise<T> {
  const qs = Object.entries(o.query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const token = o.token === undefined ? authToken : o.token;
  try {
    const res = await fetch(`${API_BASE}${path}${qs ? `?${qs}` : ''}`, {
      method: o.method ?? 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(o.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: o.body !== undefined ? JSON.stringify(o.body) : undefined,
    });
    const text = await res.text();
    let data: unknown = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { message: text.slice(0, 200) }; }
    if (!res.ok) {
      const e = (data ?? {}) as { message?: string; code?: string; details?: unknown };
      if (res.status === 401 && !o.silent401) onUnauthorized?.();
      throw new ApiError(e.message || `Server xatosi (${res.status})`, res.status, e.code, e.details);
    }
    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error)?.name === 'AbortError') throw new ApiError('Server javob bermadi. Internetni tekshiring.', 0, 'timeout');
    throw new ApiError("Internet aloqasini tekshiring va qayta urinib ko'ring", 0, 'network');
  } finally {
    clearTimeout(timer);
  }
}
