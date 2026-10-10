import type {
  Availability, Booking, BookingInput, Dish, EventType, ExpenseInput, FinanceOverview, MenuInput, MenuPackage, Payment, Photo, PricingMode,
  Quote, SessionCode, StaffInput, StaffMember, Transaction, UploadTicket, User, UserRole, VenueInfo,
} from '../types';

/*
 * Server (snake_case) ↔ ilova (camelCase) xaritalari. Server DTO'lari:
 * lokma-toyxonalar-server/src/modules/owner-app/*.ts — nomlar shu yerda aynan takrorlanadi.
 */

/* ───── Server DTO'lari ───── */
export interface PhotoDto {
  id?: string; public_id: string | null; url: string; card_url: string; thumb_url: string;
  width: number | null; height: number | null; external: boolean; is_cover?: boolean;
}
export interface PaymentDto { id: string; kind: Payment['kind']; amount: number; method: Payment['method']; date: string; at: string; note: string }
export interface BookingDto {
  id: string; source: 'owner' | 'app'; number: string | null; status: Booking['status']; date: string; session: SessionCode;
  session_label: string; start_time: string; end_time: string; event_type: EventType | null; event_label: string;
  hall_id: string; hall_name: string; guests: number; customer_name: string; customer_phone: string; address: string; notes: string;
  menu_id: string | null; menu_name: string | null; staff_ids: string[]; extras: { name: string; type: string; price: number }[];
  hold_until: string | null; cancel_reason: string | null; created_at: string;
  pricing_mode?: PricingMode; price_per_guest?: number; total?: number; deposit_paid?: number; paid?: number; balance?: number; payments?: PaymentDto[];
}
export interface DishDto { id: string; name: string; photo: PhotoDto | null; menus_count: number }
export interface MenuDto {
  id: string; name: string; price_per_person: number; min_guests: number; dishes: DishDto[]; items_text: string;
  photo: PhotoDto | null; used_count: number; popular: boolean;
}
export interface OperationDto {
  id: string; type: Transaction['type']; title: string; subtitle: string; amount: number; at: string; date: string;
  method: Transaction['method']; booking_id: string | null; category: string | null; deletable: boolean;
}
export interface OverviewDto {
  month: string; today: string; revenue: number; deposit: number; paid: number; expenses: number; remaining: number;
  growth_percent: number | null; today_income: number; today_growth_percent: number | null; expected: number; expected_clients: number;
}
export interface EmployeeDto {
  id: string; name: string; phone: string; position: string; active: boolean; events_count: number;
  pay_type?: StaffMember['payType']; rate?: number; paid_this_month?: number; app_access?: boolean; hired_at?: string; note?: string;
}
export interface MeDto {
  venue: {
    id: string; name: string; district: string; address: string; phone: string; description: string; amenities: string[];
    parking_spots: number; status: string;
    halls: { id: string; name: string; capacity_min: number; capacity_max: number }[];
    sessions: { code: SessionCode; label: string; start_time: string; end_time: string; event_types: EventType[]; pricing_mode: PricingMode; price_factor: number; fixed_price: number; min_guests: number; note: string }[];
    weekend_factor: number; deposit_percent: number;
    subscription: { monthly_fee: number; paid_until: string; state: VenueInfo['subscription']['state'] };
  };
  event_types: { code: EventType; label: string }[];
}
export interface SessionDto { token: string; user: { id: string; phone: string; name: string; role: UserRole; venue_id: string; venue_name: string } }

/* ───── Serverdan → ilova ───── */
export const mapUser = (u: SessionDto['user']): User => ({ id: u.id, phone: u.phone, name: u.name, role: u.role, venueId: u.venue_id, venueName: u.venue_name });

export const mapPhoto = (p: PhotoDto | null): Photo | null =>
  p ? { id: p.id, publicId: p.public_id, url: p.url, cardUrl: p.card_url, thumbUrl: p.thumb_url, width: p.width, height: p.height, external: p.external, isCover: p.is_cover } : null;

const mapPayment = (p: PaymentDto): Payment => ({ id: p.id, kind: p.kind, amount: p.amount, method: p.method, date: p.date, at: p.at, note: p.note });

export function mapBooking(d: BookingDto): Booking {
  return {
    id: d.id, source: d.source, number: d.number, status: d.status, date: d.date, session: d.session, sessionLabel: d.session_label,
    time: d.start_time, endTime: d.end_time || undefined, type: (d.event_type ?? 'kechki') as EventType, typeLabel: d.event_label,
    guestCount: d.guests, clientName: d.customer_name, clientPhone: d.customer_phone, address: d.address || undefined, notes: d.notes || undefined,
    hallId: d.hall_id, hallName: d.hall_name || undefined, menuId: d.menu_id ?? undefined, menuName: d.menu_name ?? undefined,
    staffIds: d.staff_ids, extras: d.extras, holdUntil: d.hold_until, createdAt: d.created_at,
    // Xodimga pul maydonlari kelmaydi — 0
    pricingMode: d.pricing_mode, pricePerGuest: d.price_per_guest ?? 0, totalAmount: d.total ?? 0, depositAmount: d.deposit_paid ?? 0,
    paidAmount: d.paid ?? 0, balance: d.balance ?? 0, payments: (d.payments ?? []).map(mapPayment),
  };
}

export const mapDish = (d: DishDto): Dish => ({ id: d.id, name: d.name, photo: mapPhoto(d.photo), menusCount: d.menus_count });

export const mapMenu = (m: MenuDto): MenuPackage => ({
  id: m.id, name: m.name, pricePerPerson: m.price_per_person, minGuests: m.min_guests, dishes: m.dishes.map(mapDish), itemsText: m.items_text,
  photo: mapPhoto(m.photo), usedCount: m.used_count, popular: m.popular,
});

export const mapOperation = (o: OperationDto): Transaction => ({
  id: o.id, bookingId: o.booking_id ?? undefined, title: o.title, subtitle: o.subtitle, createdAt: o.at, amount: o.amount, type: o.type,
  method: o.method, category: o.category ?? undefined, deletable: o.deletable,
});

export const mapOverview = (o: OverviewDto): FinanceOverview => ({
  month: o.month, today: o.today, revenue: o.revenue, deposit: o.deposit, paid: o.paid, expenses: o.expenses, remaining: o.remaining,
  growthPercent: o.growth_percent, todayIncome: o.today_income, todayGrowthPercent: o.today_growth_percent, expected: o.expected, expectedClients: o.expected_clients,
});

export const mapStaff = (e: EmployeeDto): StaffMember => ({
  id: e.id, name: e.name, position: e.position, phone: e.phone, eventsCount: e.events_count, active: e.active,
  payType: e.pay_type, rate: e.rate, paidThisMonth: e.paid_this_month, appAccess: e.app_access, hiredAt: e.hired_at, note: e.note,
});

export const mapVenue = (m: MeDto): VenueInfo => ({
  id: m.venue.id, name: m.venue.name, district: m.venue.district, address: m.venue.address, phone: m.venue.phone, description: m.venue.description,
  amenities: m.venue.amenities, parkingSpots: m.venue.parking_spots, status: m.venue.status,
  halls: m.venue.halls.map((h) => ({ id: h.id, name: h.name, capacityMin: h.capacity_min, capacityMax: h.capacity_max })),
  sessions: m.venue.sessions.map((s) => ({
    code: s.code, label: s.label, startTime: s.start_time, endTime: s.end_time, eventTypes: s.event_types, pricingMode: s.pricing_mode,
    priceFactor: s.price_factor, fixedPrice: s.fixed_price, minGuests: s.min_guests, note: s.note,
  })),
  weekendFactor: m.venue.weekend_factor, depositPercent: m.venue.deposit_percent,
  subscription: { monthlyFee: m.venue.subscription.monthly_fee, paidUntil: m.venue.subscription.paid_until, state: m.venue.subscription.state },
  eventTypes: m.event_types,
});

export interface QuoteDto {
  pricing_mode: PricingMode; price_per_guest: number; total: number | null; deposit_suggested: number; capacity_max: number; min_guests: number; warnings: string[];
}
export const mapQuote = (q: QuoteDto): Quote => ({
  pricingMode: q.pricing_mode, pricePerGuest: q.price_per_guest, total: q.total, depositSuggested: q.deposit_suggested,
  capacityMax: q.capacity_max, minGuests: q.min_guests, warnings: q.warnings,
});

export interface AvailabilityDto { date: string; halls: { hall_id: string; name: string; sessions: { code: SessionCode; label: string; state: Availability['halls'][number]['sessions'][number]['state']; who: string }[] }[] }
export const mapAvailability = (a: AvailabilityDto): Availability => ({
  date: a.date, halls: a.halls.map((h) => ({ hallId: h.hall_id, name: h.name, sessions: h.sessions })),
});

export interface TicketDto { upload_url: string; public_id: string; fields: Record<string, string> }
export const mapTicket = (t: TicketDto): UploadTicket => ({ uploadUrl: t.upload_url, publicId: t.public_id, fields: t.fields });

/* ───── Ilovadan → server ───── */
export const bookingToServer = (i: Partial<BookingInput>) => ({
  hall_id: i.hallId, date: i.date, session: i.session, event_type: i.type, customer_name: i.clientName, customer_phone: i.clientPhone,
  guests: i.guestCount, menu_id: i.menuId, pricing_mode: i.pricingMode, price_per_guest: i.pricePerGuest, total: i.totalAmount,
  address: i.address, notes: i.notes, start_time: i.startTime, end_time: i.endTime, stage: i.stage,
});

export const menuToServer = (i: Partial<MenuInput>) => ({
  name: i.name, price_per_person: i.pricePerPerson, min_guests: i.minGuests, dishes: i.dishes, photo_public_id: i.photoPublicId,
});

export const staffToServer = (i: Partial<StaffInput>) => ({
  name: i.name, phone: i.phone, position: i.position, pay_type: i.payType, rate: i.rate, note: i.note, app_access: i.appAccess, app_password: i.appPassword,
});

export const expenseToServer = (i: ExpenseInput) => ({
  type: 'expense' as const, category: i.category, amount: i.amount, method: i.method, note: i.note, employee_id: i.employeeId,
});

/** undefined maydonlarni olib tashlaydi (PATCH da faqat o'zgargan maydonlar ketsin) */
export const compact = <T extends object>(o: T): Partial<T> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
