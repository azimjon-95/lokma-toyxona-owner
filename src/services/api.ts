import type { Session, UserRole, VenueApplication } from '../types';
import { DEMO_USER } from '../data/mock';

/**
 * API qatlami. Hozircha demo (mock) rejimda ishlaydi.
 * Backend tayyor bo'lganda `EXPO_PUBLIC_API_URL` o'rnating va
 * har bir funksiyadagi mock qismini `request()` chaqiruvi bilan almashtiring.
 * Ekranlar faqat shu modul bilan ishlaydi — UI kodini o'zgartirish shart emas.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
export const IS_DEMO = !API_URL;

export class ApiError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
    this.name = 'ApiError';
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function request<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
        ...init.headers,
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(body?.message ?? 'Server xatosi', res.status);
    return body as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("Internet aloqasini tekshiring va qayta urinib ko'ring");
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------------

export interface LoginResult {
  token: string;
  /** Agar foydalanuvchida ikkala rol bo'lsa — rol tanlash ekrani ko'rsatiladi */
  roles: UserRole[];
}

export async function login(phoneE164: string, password: string): Promise<LoginResult> {
  if (!IS_DEMO) {
    return request<LoginResult>('/owner/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone: phoneE164, password }),
    });
  }
  await delay(600);
  if (password.length < 4) throw new ApiError("Telefon raqam yoki parol noto'g'ri", 401);
  return { token: `demo-${Date.now()}`, roles: ['owner', 'staff'] };
}

export async function fetchSession(token: string, phoneE164: string, role: UserRole): Promise<Session> {
  if (!IS_DEMO) {
    return request<Session>(`/owner/auth/session?role=${role}`, { token });
  }
  await delay(250);
  return { token, user: { ...DEMO_USER, phone: phoneE164, role } };
}

export async function requestPasswordReset(phoneE164: string): Promise<void> {
  if (!IS_DEMO) {
    await request('/owner/auth/forgot', { method: 'POST', body: JSON.stringify({ phone: phoneE164 }) });
    return;
  }
  await delay(600);
}

export async function resetPassword(phoneE164: string, code: string, newPassword: string): Promise<void> {
  if (!IS_DEMO) {
    await request('/owner/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ phone: phoneE164, code, password: newPassword }),
    });
    return;
  }
  await delay(600);
  if (code.length < 4) throw new ApiError("SMS kod noto'g'ri", 400);
}

export async function submitVenueApplication(app: VenueApplication): Promise<void> {
  if (!IS_DEMO) {
    await request('/venue-applications', { method: 'POST', body: JSON.stringify(app) });
    return;
  }
  await delay(900);
}

export async function deleteAccount(token: string): Promise<void> {
  if (!IS_DEMO) {
    await request('/owner/account', { method: 'DELETE', token });
    return;
  }
  await delay(600);
}
