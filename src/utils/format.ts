import type { BookingStatus, EventType, PayKind, PayMethod, PayType, SessionCode } from '../types';

export const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
] as const;

export const MONTHS_SHORT = [
  'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek',
] as const;

/** Dushanbadan boshlanadi (O'zbekiston standarti). */
export const WEEKDAYS_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'] as const;

/** 85300000 -> "85 300 000" (Intl-ga bog'liq emas: Hermes-da barcha lokallar yo'q). */
export function formatNumber(n: number): string {
  const sign = n < 0 ? '-' : '';
  return sign + Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatMoney(n: number): string {
  return `${formatNumber(n)} so'm`;
}

/** Kichik plitkalar uchun: 404 300 000 -> "404,3 mln"; 74 000 000 -> "74 000 000". */
export function formatNumberCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.', ',').replace(',0', '')} mlrd`;
  if (abs >= 100_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')} mln`;
  return formatNumber(n);
}

export function formatMoneyCompact(n: number): string {
  return `${formatNumberCompact(n)} so'm`;
}

/** Faqat raqamlarni qoldiradi. */
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

export function parseAmount(s: string): number {
  const d = digitsOnly(s);
  return d ? Number.parseInt(d, 10) : 0;
}

/** Kiritish paytida "1500000" -> "1 500 000". */
export function formatAmountInput(s: string): string {
  const d = digitsOnly(s).replace(/^0+(?=\d)/, '');
  return d ? formatNumber(Number.parseInt(d, 10)) : '';
}

/**
 * O'zbekiston raqami uchun mahalliy qism (9 raqam) -> "90 123 45 67".
 * `+998` prefiksi alohida ko'rsatiladi.
 */
export function formatLocalPhone(input: string): string {
  let d = digitsOnly(input);
  if (d.startsWith('998') && d.length > 9) d = d.slice(3);
  d = d.slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.join(' ');
}

export function isValidLocalPhone(input: string): boolean {
  return digitsOnly(input).length === 9;
}

export function toE164(local: string): string {
  return `+998${digitsOnly(local)}`;
}

/** "+998901234567" -> "+998 90 123 45 67" */
export function formatPhone(e164: string): string {
  const d = digitsOnly(e164);
  const local = d.startsWith('998') ? d.slice(3) : d;
  return `+998 ${formatLocalPhone(local)}`;
}

// ---------- Sanalar (mahalliy vaqt zonasida, UTC siljishisiz) ----------

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((x) => Number.parseInt(x, 10));
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** "2026-10-12" -> "12 Okt 2026" */
export function formatDateShort(iso: string, withYear = true): string {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`;
}

/** "2026-10-12" -> "12 Oktabr 2026" */
export function formatDateLong(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** ISO datetime -> "12 Okt, 18:20" */
export function formatDateTime(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${hh}:${mm}`;
}

export function isWeekendISO(iso: string): boolean {
  const d = parseISODate(iso).getDay();
  return d === 0 || d === 6;
}

export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = parseISODate(s);
  return toISODate(d) === s;
}

export function isValidTime(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

// ---------- Statuslar ----------

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Yangi',
  deposit: 'Zakalat kutilmoqda',
  confirmed: 'Tasdiqlangan',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
};

/** Tadbir turlari — server (lib/sessions.ts) bilan bir xil nomlar */
export const EVENT_LABEL: Record<EventType, string> = {
  nahorgi_osh: 'Nahorgi osh',
  nikoh: 'Nikoh to\'yi',
  kunduzgi: 'Kunduzgi to\'y',
  kechki: 'Kechki to\'y',
  tadbir: 'Maxsus tadbir',
};

export const SESSION_LABEL: Record<SessionCode, string> = {
  morning: 'Nahorgi osh',
  day: 'Nikoh to\'yi',
  evening: 'Kunduzgi / Vecher',
  special: 'Maxsus tadbir',
};

export const PAY_METHOD_LABEL: Record<PayMethod, string> = {
  cash: 'Naqd',
  card: 'Karta',
  transfer: 'Hisob raqamiga',
  click: 'Click',
  payme: 'Payme',
  other: 'Boshqa',
};

export const PAY_KIND_LABEL: Record<PayKind, string> = {
  deposit: 'Zakalat',
  payment: 'To\'lov',
  refund: 'Qaytarish',
};

export const PAY_TYPE_LABEL: Record<PayType, string> = {
  daily: 'Kunlik',
  monthly: 'Oylik',
  per_event: 'Tadbir boshiga',
};

export function pluralGuests(n: number): string {
  return `${formatNumber(n)} mehmon`;
}
