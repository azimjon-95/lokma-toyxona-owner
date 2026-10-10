/*
 * Domen turlari. Server (lokma-toyxonalar-server, /api/owner-app) bilan BIR XIL kodlar va tushunchalar:
 * seanslar, tadbir turlari, bron bosqichlari, to'lov turlari va usullari.
 * Server javoblari snake_case — `services/mappers.ts` ularni shu turlarga o'giradi.
 */
export type UserRole = 'owner' | 'staff';

/** Yangi → Zakalat kutilmoqda → Tasdiqlangan → Yakunlangan | Bekor qilingan */
export type BookingStatus = 'pending' | 'deposit' | 'confirmed' | 'completed' | 'cancelled';

/** Nahorgi osh · Nikoh to'yi · Kunduzgi/Vecher · Maxsus tadbir */
export type SessionCode = 'morning' | 'day' | 'evening' | 'special';

export type EventType = 'nahorgi_osh' | 'nikoh' | 'kunduzgi' | 'kechki' | 'tadbir';
export type PricingMode = 'per_guest' | 'fixed' | 'negotiable';
export type PayKind = 'deposit' | 'payment' | 'refund';
export type PayMethod = 'cash' | 'card' | 'transfer' | 'click' | 'payme' | 'other';
/** owner — to'yxona egasi qo'lda kiritgan; app — Lokma ilovasi orqali mijoz bron qilgan */
export type BookingSource = 'owner' | 'app';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  venueId: string;
  venueName: string;
}

export interface Session {
  token: string;
  user: User;
}

/** Cloudinary (yoki eski tashqi) rasm */
export interface Photo {
  /** Galereya yozuvi ID'si (taom/menyu rasmlarida yo'q) */
  id?: string;
  publicId: string | null;
  url: string;
  cardUrl: string;
  thumbUrl: string;
  width: number | null;
  height: number | null;
  /** Cloudinary'dan tashqari eski URL */
  external: boolean;
  isCover?: boolean;
}

export interface Hall {
  id: string;
  name: string;
  capacityMin: number;
  capacityMax: number;
}

export interface SessionInfo {
  code: SessionCode;
  label: string;
  startTime: string;
  endTime: string;
  eventTypes: EventType[];
  pricingMode: PricingMode;
  priceFactor: number;
  fixedPrice: number;
  minGuests: number;
  note: string;
}

export type SubscriptionState = 'free' | 'ok' | 'expiring' | 'overdue';

export interface VenueInfo {
  id: string;
  name: string;
  district: string;
  address: string;
  phone: string;
  description: string;
  amenities: string[];
  parkingSpots: number;
  status: string;
  halls: Hall[];
  sessions: SessionInfo[];
  weekendFactor: number;
  depositPercent: number;
  subscription: { monthlyFee: number; paidUntil: string; state: SubscriptionState };
  eventTypes: { code: EventType; label: string }[];
}

export interface Payment {
  id: string;
  kind: PayKind;
  amount: number;
  method: PayMethod;
  /** YYYY-MM-DD */
  date: string;
  /** ISO datetime */
  at: string;
  note: string;
}

export interface Extra {
  name: string;
  type: string;
  price: number;
}

export interface Booking {
  id: string;
  source: BookingSource;
  /** Lokma ilovasi bronlari uchun: TY-XXXXX */
  number: string | null;
  status: BookingStatus;
  /** YYYY-MM-DD */
  date: string;
  session: SessionCode;
  sessionLabel: string;
  /** HH:mm — seans shablonidan yoki egasi kiritgan */
  time: string;
  endTime?: string;
  type: EventType;
  typeLabel: string;
  guestCount: number;
  clientName: string;
  clientPhone: string;
  address?: string;
  notes?: string;
  hallId: string;
  hallName?: string;
  menuId?: string;
  menuName?: string;
  staffIds: string[];
  /** Mijoz Lokma ilovasida tanlagan videochi/kortej */
  extras: Extra[];
  /** Mijoz to'lamasa seans shu vaqtgacha ushlab turiladi (Lokma broni, "Yangi" holatda) */
  holdUntil?: string | null;
  createdAt: string;
  /* Pul — faqat egasiga keladi; xodim uchun 0 / bo'sh */
  pricingMode?: PricingMode;
  pricePerGuest: number;
  totalAmount: number;
  /** To'langan zakalat */
  depositAmount: number;
  paidAmount: number;
  balance: number;
  payments: Payment[];
}

export interface Dish {
  id: string;
  name: string;
  photo: Photo | null;
  menusCount: number;
}

export interface MenuPackage {
  id: string;
  name: string;
  pricePerPerson: number;
  minGuests: number;
  dishes: Dish[];
  photo: Photo | null;
  itemsText: string;
  usedCount: number;
  popular: boolean;
}

/** deposit — zakalat, income — to'lov/kirim, expense — xarajat, refund — mijozga qaytarilgan */
export type TransactionType = 'income' | 'deposit' | 'expense' | 'refund';

export interface Transaction {
  id: string;
  bookingId?: string;
  title: string;
  subtitle: string;
  /** ISO datetime */
  createdAt: string;
  /** Har doim musbat; yo'nalish `type` orqali aniqlanadi */
  amount: number;
  type: TransactionType;
  method: PayMethod;
  category?: string;
  deletable: boolean;
}

export interface FinanceOverview {
  month: string;
  today: string;
  revenue: number;
  deposit: number;
  paid: number;
  expenses: number;
  remaining: number;
  growthPercent: number | null;
  todayIncome: number;
  todayGrowthPercent: number | null;
  expected: number;
  expectedClients: number;
}

export interface Client {
  key: string;
  name: string;
  phone: string;
  lastBooking: Booking;
  bookingsCount: number;
}

export type PayType = 'daily' | 'monthly' | 'per_event';

export interface StaffMember {
  id: string;
  name: string;
  /** Lavozim (Administrator, Oshpaz...) */
  position: string;
  phone: string;
  eventsCount: number;
  active: boolean;
  /* Faqat egasi ko'radi */
  payType?: PayType;
  rate?: number;
  paidThisMonth?: number;
  appAccess?: boolean;
  hiredAt?: string;
  note?: string;
}

export interface VenueApplication {
  name: string;
  address: string;
  phone: string;
  halls: number;
  capacity: number;
  services: string[];
  /** Cloudinary public_id'lar (rasmlar yuklangandan keyin) */
  photos: string[];
  priceFrom?: number;
  priceTo?: number;
  notes?: string;
}

/* ───── Kiritish shakllari ───── */
export interface BookingInput {
  hallId: string;
  date: string;
  session: SessionCode;
  type: EventType;
  clientName: string;
  clientPhone: string;
  guestCount: number;
  menuId?: string;
  pricingMode?: PricingMode;
  pricePerGuest?: number;
  totalAmount: number;
  address?: string;
  notes?: string;
  startTime?: string;
  endTime?: string;
  stage?: 'pending' | 'deposit' | 'confirmed';
}

export interface PaymentInput {
  kind: PayKind;
  amount: number;
  method: PayMethod;
  note?: string;
}

export interface MenuInput {
  name: string;
  pricePerPerson: number;
  minGuests?: number;
  dishes?: string[];
  photoPublicId?: string | null;
}

export interface StaffInput {
  name: string;
  phone?: string;
  position?: string;
  payType?: PayType;
  rate?: number;
  note?: string;
  appAccess?: boolean;
  appPassword?: string;
}

export interface ExpenseInput {
  category: string;
  amount: number;
  method?: PayMethod;
  note?: string;
  employeeId?: string;
}

export interface Quote {
  pricingMode: PricingMode;
  pricePerGuest: number;
  total: number | null;
  depositSuggested: number;
  capacityMax: number;
  minGuests: number;
  warnings: string[];
}

export type SlotState = 'free' | 'booked' | 'hold' | 'closed' | 'past';

export interface Availability {
  date: string;
  halls: { hallId: string; name: string; sessions: { code: SessionCode; label: string; state: SlotState; who: string }[] }[];
}

/** Cloudinary'ga to'g'ridan-to'g'ri yuklash chiptasi (server imzolaydi) */
export interface UploadTicket {
  uploadUrl: string;
  publicId: string;
  fields: Record<string, string>;
}

export type UploadPurpose = 'venue_photo' | 'dish_photo' | 'menu_photo';
