import type {
  Availability, Booking, BookingInput, BookingStatus, Client, Dish, MenuPackage, Payment, Photo, Quote, SessionCode, StaffMember, Transaction, VenueInfo,
} from '../types';
import type { Backend } from './backend';
import { ApiError } from './http';
import { DEMO_USER, DEMO_VENUE, DISHES, MENUS, STAFF, createSeed } from '../data/mock';
import { addDays, isWeekendISO, todayISO, toISODate } from '../utils/format';

/*
 * Demo rejim: server qoidalarini xotirada taqlid qiladi (EXPO_PUBLIC_API_URL bo'sh bo'lganda).
 * Maqsad — ilovani serversiz ko'rsatish; ma'lumot ilova yopilganda yo'qoladi.
 */
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const nameKey = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
const roundTo1000 = (n: number) => Math.round(n / 1000) * 1000;
const net = (ps: Payment[]) => ps.reduce((s, p) => s + (p.kind === 'refund' ? -p.amount : p.amount), 0);

let seed = createSeed();
let bookings: Booking[] = seed.bookings;
let expenses: Transaction[] = seed.expenses;
let menus: MenuPackage[] = clone(MENUS);
let dishes: Dish[] = clone(DISHES);
let staff: StaffMember[] = clone(STAFF);
let venue: VenueInfo = clone(DEMO_VENUE);
let photos: Photo[] = [];

const hall = (id: string) => venue.halls.find((h) => h.id === id);
const sessionOf = (code: SessionCode) => venue.sessions.find((s) => s.code === code);
const withMoney = (b: Booking): Booking => {
  const paid = net(b.payments);
  return { ...b, depositAmount: b.payments.filter((p) => p.kind === 'deposit').reduce((s, p) => s + p.amount, 0), paidAmount: paid, balance: Math.max(0, b.totalAmount - paid) };
};
const find = (id: string) => {
  const b = bookings.find((x) => x.id === id);
  if (!b) throw new ApiError('Bron topilmadi', 404);
  return b;
};
const photoFrom = (publicId: string): Photo => {
  const url = publicId.startsWith('demo:') ? publicId.slice(5) : publicId;
  return { id: uid('ph'), publicId, url, cardUrl: url, thumbUrl: url, width: null, height: null, external: false };
};
const syncMenus = () => {
  for (const m of menus) {
    m.dishes = m.dishes.map((d) => dishes.find((x) => x.id === d.id) ?? d);
    m.itemsText = m.dishes.map((d) => d.name).join(', ');
    m.usedCount = bookings.filter((b) => b.menuId === m.id && b.status !== 'cancelled').length;
  }
  const top = Math.max(0, ...menus.map((m) => m.usedCount));
  for (const m of menus) m.popular = top > 0 && m.usedCount === top;
  for (const d of dishes) d.menusCount = menus.filter((m) => m.dishes.some((x) => x.id === d.id)).length;
};
const busy = (hallId: string, date: string, session: SessionCode, exceptId?: string) =>
  bookings.find((b) => b.id !== exceptId && b.hallId === hallId && b.date === date && b.session === session && b.status !== 'cancelled');

const staffEvents = () => staff.map((s) => ({ ...s, eventsCount: bookings.filter((b) => b.staffIds.includes(s.id) && b.status !== 'cancelled').length }));

export const demoBackend: Backend = {
  /* ── Kirish ── */
  login: async (_phone, password) => {
    await delay(500);
    if (password.length < 4) throw new ApiError("Telefon raqam yoki parol noto'g'ri", 401);
    return { token: `demo-${Date.now()}`, roles: ['owner', 'staff'] };
  },
  fetchSession: async (token, role = 'owner') => {
    await delay(200);
    const phone = '+998901234567';
    return { token, user: { ...DEMO_USER, phone, role } };
  },
  requestPasswordReset: async () => { await delay(500); return { devCode: '123456' }; },
  resetPassword: async (_p, code) => { await delay(500); if (code.length < 4) throw new ApiError("SMS kod noto'g'ri", 400); },
  deleteAccount: async () => { await delay(400); },
  submitVenueApplication: async () => { await delay(800); },
  signApplicationUpload: async () => ({ uploadUrl: 'demo://upload', publicId: `demo:application-${uid('')}`, fields: {} }),

  /* ── To'yxona va rasmlar ── */
  getVenue: async () => clone(venue),
  patchVenue: async (p) => {
    venue = { ...venue, ...(p.description !== undefined ? { description: p.description } : {}), ...(p.address !== undefined ? { address: p.address } : {}), ...(p.phone !== undefined ? { phone: p.phone } : {}), ...(p.amenities ? { amenities: p.amenities } : {}), ...(p.parkingSpots !== undefined ? { parkingSpots: p.parkingSpots } : {}) };
    return clone(venue);
  },
  listPhotos: async () => photos.map((p, i) => ({ ...p, isCover: i === 0 })),
  addPhoto: async (publicId) => { photos = [...photos, photoFrom(publicId)]; return photos.map((p, i) => ({ ...p, isCover: i === 0 })); },
  removePhoto: async (id) => { photos = photos.filter((p) => p.id !== id); return photos.map((p, i) => ({ ...p, isCover: i === 0 })); },
  reorderPhotos: async (ids) => { photos = ids.map((i) => photos.find((p) => p.id === i)!).filter(Boolean); return photos.map((p, i) => ({ ...p, isCover: i === 0 })); },
  signUpload: async (purpose) => ({ uploadUrl: 'demo://upload', publicId: `demo:${purpose}-${uid('')}`, fields: {} }),

  /* ── Bronlar ── */
  listBookings: async () => { await delay(); syncMenus(); return clone(bookings.map(withMoney)); },
  getBooking: async (id) => clone(withMoney(find(id))),
  createBooking: async (i: BookingInput) => {
    await delay(250);
    if (i.date < todayISO()) throw new ApiError("O'tgan sanaga bron qilib bo'lmaydi", 422);
    if (i.totalAmount <= 0) throw new ApiError('Jami summani kiriting', 422);
    const h = hall(i.hallId); const s = sessionOf(i.session);
    if (!h) throw new ApiError('Zal topilmadi', 404);
    if (!s) throw new ApiError("Bu to'yxonada bunday seans yo'q", 422);
    if (s.eventTypes.length && !s.eventTypes.includes(i.type)) throw new ApiError("Bu seansda tanlangan tadbir turini o'tkazib bo'lmaydi", 422);
    if (busy(i.hallId, i.date, i.session)) throw new ApiError('Bu seans allaqachon band', 409, 'slot_taken');
    const menu = menus.find((m) => m.id === i.menuId);
    const b: Booking = withMoney({
      id: uid('b'), source: 'owner', number: null, status: i.stage ?? 'pending', date: i.date, session: i.session, sessionLabel: s.label,
      time: i.startTime || s.startTime, endTime: i.endTime || s.endTime, type: i.type, typeLabel: venue.eventTypes.find((e) => e.code === i.type)?.label ?? '',
      guestCount: i.guestCount, clientName: i.clientName, clientPhone: i.clientPhone.startsWith('+') ? i.clientPhone : `+998${i.clientPhone.replace(/\D/g, '').slice(-9)}`,
      address: i.address, notes: i.notes, hallId: i.hallId, hallName: h.name, menuId: menu?.id, menuName: menu?.name, staffIds: [], extras: [],
      createdAt: new Date().toISOString(), pricingMode: i.pricingMode, pricePerGuest: i.pricePerGuest ?? 0, totalAmount: i.totalAmount, depositAmount: 0, paidAmount: 0, balance: i.totalAmount, payments: [],
    });
    bookings = [...bookings, b];
    return clone(b);
  },
  updateBooking: async (id, p) => {
    await delay(250);
    const b = find(id);
    if (b.status === 'completed' || b.status === 'cancelled') throw new ApiError("Bu bronni tahrirlab bo'lmaydi", 409, 'invalid_state');
    const hallId = p.hallId ?? b.hallId; const date = p.date ?? b.date; const session = p.session ?? b.session;
    if (busy(hallId, date, session, id)) throw new ApiError('Bu seans allaqachon band', 409, 'slot_taken');
    const s = sessionOf(session)!;
    const menu = p.menuId !== undefined ? menus.find((m) => m.id === p.menuId) : undefined;
    Object.assign(b, {
      hallId, hallName: hall(hallId)?.name, date, session, sessionLabel: s.label,
      time: p.startTime ?? (p.session ? s.startTime : b.time), endTime: p.endTime ?? (p.session ? s.endTime : b.endTime),
      ...(p.type ? { type: p.type, typeLabel: venue.eventTypes.find((e) => e.code === p.type)?.label ?? '' } : {}),
      ...(p.clientName !== undefined ? { clientName: p.clientName } : {}), ...(p.clientPhone !== undefined ? { clientPhone: p.clientPhone.startsWith('+') ? p.clientPhone : `+998${p.clientPhone.replace(/\D/g, '').slice(-9)}` } : {}),
      ...(p.guestCount !== undefined ? { guestCount: p.guestCount } : {}), ...(p.totalAmount !== undefined ? { totalAmount: p.totalAmount } : {}),
      ...(p.address !== undefined ? { address: p.address } : {}), ...(p.notes !== undefined ? { notes: p.notes } : {}),
      ...(p.menuId !== undefined ? { menuId: menu?.id, menuName: menu?.name } : {}),
    });
    return clone(withMoney(b));
  },
  setStatus: async (id: string, status: BookingStatus) => {
    await delay(150);
    const b = find(id);
    if (b.status === 'cancelled') throw new ApiError("Bekor qilingan bronning holatini o'zgartirib bo'lmaydi", 409, 'invalid_state');
    b.status = status;
    return clone(withMoney(b));
  },
  addPayment: async (id, p) => {
    await delay(250);
    const b = find(id);
    if (b.status === 'cancelled' || b.status === 'completed') throw new ApiError("Bu bronga to'lov yozib bo'lmaydi", 409, 'invalid_state');
    const paid = net(b.payments);
    if (p.kind === 'refund' ? p.amount > paid : p.amount > Math.max(0, b.totalAmount - paid)) {
      throw new ApiError(p.kind === 'refund' ? "Qaytariladigan summa to'langandan oshmasin" : `Qoldiqdan oshmasin: ${Math.max(0, b.totalAmount - paid)}`, 422);
    }
    const now = new Date();
    b.payments = [{ id: uid('p'), kind: p.kind, amount: p.amount, method: p.method, date: toISODate(now), at: now.toISOString(), note: p.note ?? '' }, ...b.payments];
    if (p.kind !== 'refund' && (b.status === 'pending' || b.status === 'deposit')) b.status = 'confirmed';
    return clone(withMoney(b));
  },
  assignStaff: async (id, ids) => { const b = find(id); b.staffIds = [...new Set(ids)]; return clone(withMoney(b)); },
  quote: async (i): Promise<Quote> => {
    const s = sessionOf(i.session); const menu = menus.find((m) => m.id === i.menuId); const h = hall(i.hallId);
    const weekend = isWeekendISO(i.date);
    const ppg = s && menu && s.pricingMode === 'per_guest' ? roundTo1000(menu.pricePerPerson * s.priceFactor * (weekend ? venue.weekendFactor : 1)) : 0;
    const total = s?.pricingMode === 'fixed' ? s.fixedPrice : ppg ? ppg * i.guestCount : null;
    const warnings: string[] = [];
    if (h && i.guestCount > h.capacityMax) warnings.push(`${h.name} sig'imi ${h.capacityMax} kishi`);
    if (menu?.minGuests && i.guestCount < menu.minGuests) warnings.push(`${menu.name} kamida ${menu.minGuests} mehmon uchun`);
    return { pricingMode: s?.pricingMode ?? 'per_guest', pricePerGuest: ppg, total, depositSuggested: total ? Math.round((total * venue.depositPercent) / 100) : 0, capacityMax: h?.capacityMax ?? 0, minGuests: s?.minGuests ?? 0, warnings };
  },
  availability: async (date): Promise<Availability> => ({
    date,
    halls: venue.halls.map((h) => ({
      hallId: h.id, name: h.name,
      sessions: venue.sessions.map((s) => {
        const b = busy(h.id, date, s.code);
        return { code: s.code, label: s.label, state: date < todayISO() ? ('past' as const) : b ? ('booked' as const) : ('free' as const), who: b?.clientName ?? '' };
      }),
    })),
  }),
  listClients: async (q): Promise<Client[]> => {
    const today = todayISO();
    const list = [...bookings].sort((a, b) => (a.date >= today ? 0 : 1) - (b.date >= today ? 0 : 1) || (a.date >= today ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
    const map = new Map<string, Client>();
    for (const b of list) {
      const key = b.clientPhone.replace(/\D/g, '').slice(-9);
      const e = map.get(key);
      if (e) e.bookingsCount += 1; else map.set(key, { key, name: b.clientName, phone: b.clientPhone, lastBooking: clone(withMoney(b)), bookingsCount: 1 });
    }
    const term = (q ?? '').trim().toLowerCase(); const digits = term.replace(/\D/g, '');
    return [...map.values()].filter((c) => !term || c.name.toLowerCase().includes(term) || (digits.length >= 3 && c.phone.replace(/\D/g, '').includes(digits)));
  },

  /* ── Menyu va taomlar ── */
  listMenus: async () => { syncMenus(); return clone(menus); },
  createMenu: async (i) => {
    if (menus.some((m) => nameKey(m.name) === nameKey(i.name))) throw new ApiError('Bunday nomli menyu allaqachon bor', 409);
    const ds = (i.dishes ?? []).map((n) => {
      let d = dishes.find((x) => nameKey(x.name) === nameKey(n));
      if (!d) { d = { id: uid('d'), name: n.trim(), photo: null, menusCount: 0 }; dishes.push(d); }
      return d;
    });
    const m: MenuPackage = { id: uid('m'), name: i.name.trim(), pricePerPerson: i.pricePerPerson, minGuests: i.minGuests ?? 0, dishes: ds, photo: i.photoPublicId ? photoFrom(i.photoPublicId) : null, itemsText: '', usedCount: 0, popular: false };
    menus = [...menus, m]; syncMenus();
    return clone(m);
  },
  updateMenu: async (id, i) => {
    const m = menus.find((x) => x.id === id);
    if (!m) throw new ApiError('Menyu topilmadi', 404);
    if (i.name !== undefined) m.name = i.name.trim();
    if (i.pricePerPerson !== undefined) m.pricePerPerson = i.pricePerPerson;
    if (i.minGuests !== undefined) m.minGuests = i.minGuests;
    if (i.dishes) {
      m.dishes = i.dishes.map((n) => {
        let d = dishes.find((x) => nameKey(x.name) === nameKey(n));
        if (!d) { d = { id: uid('d'), name: n.trim(), photo: null, menusCount: 0 }; dishes.push(d); }
        return d;
      });
    }
    if (i.photoPublicId !== undefined) m.photo = i.photoPublicId ? photoFrom(i.photoPublicId) : null;
    syncMenus();
    return clone(m);
  },
  deleteMenu: async (id) => {
    if (menus.length <= 1) throw new ApiError('Kamida bitta menyu paketi qolishi kerak', 409, 'last_menu');
    menus = menus.filter((m) => m.id !== id);
  },
  listDishes: async () => { syncMenus(); return clone([...dishes].sort((a, b) => a.name.localeCompare(b.name))); },
  createDish: async (name, photoPublicId) => {
    if (dishes.some((d) => nameKey(d.name) === nameKey(name))) throw new ApiError('Bunday taom allaqachon bor', 409);
    const d: Dish = { id: uid('d'), name: name.trim(), photo: photoPublicId ? photoFrom(photoPublicId) : null, menusCount: 0 };
    dishes = [...dishes, d];
    return clone(d);
  },
  updateDish: async (id, p) => {
    const d = dishes.find((x) => x.id === id);
    if (!d) throw new ApiError('Taom topilmadi', 404);
    if (p.name !== undefined) {
      if (dishes.some((x) => x.id !== id && nameKey(x.name) === nameKey(p.name!))) throw new ApiError('Bunday taom allaqachon bor', 409);
      d.name = p.name.trim();
    }
    if (p.photoPublicId !== undefined) d.photo = p.photoPublicId ? photoFrom(p.photoPublicId) : null;
    syncMenus();
    return clone(d);
  },
  deleteDish: async (id) => {
    dishes = dishes.filter((d) => d.id !== id);
    for (const m of menus) m.dishes = m.dishes.filter((d) => d.id !== id);
    syncMenus();
  },

  /* ── Moliya ── */
  financeOverview: async () => {
    const ops = collectOps();
    const now = new Date(); const ym = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
    const cur = ym(now); const prev = ym(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const today = todayISO(); const yesterday = addDays(today, -1);
    const sign = (o: Transaction) => (o.type === 'refund' ? -o.amount : o.amount);
    const inc = ops.filter((o) => o.type !== 'expense');
    const sum = (f: (o: Transaction) => boolean) => inc.filter(f).reduce((s, o) => s + sign(o), 0);
    const revenue = sum((o) => ym(new Date(o.createdAt)) === cur);
    const prevRevenue = sum((o) => ym(new Date(o.createdAt)) === prev);
    const todayIncome = sum((o) => toISODate(new Date(o.createdAt)) === today);
    const yIncome = sum((o) => toISODate(new Date(o.createdAt)) === yesterday);
    const active = bookings.map(withMoney).filter((b) => b.status !== 'cancelled' && b.status !== 'completed' && b.balance > 0);
    const upcoming = active.filter((b) => b.date >= today);
    const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);
    const deposit = inc.filter((o) => o.type === 'deposit' && ym(new Date(o.createdAt)) === cur).reduce((s, o) => s + o.amount, 0);
    return {
      month: today.slice(0, 7), today, revenue, deposit, paid: revenue - deposit,
      expenses: ops.filter((o) => o.type === 'expense' && ym(new Date(o.createdAt)) === cur).reduce((s, o) => s + o.amount, 0),
      remaining: active.reduce((s, b) => s + b.balance, 0), growthPercent: pct(revenue, prevRevenue), todayIncome, todayGrowthPercent: pct(todayIncome, yIncome),
      expected: upcoming.reduce((s, b) => s + b.balance, 0), expectedClients: upcoming.length,
    };
  },
  operations: async () => clone(collectOps().sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
  addExpense: async (i) => {
    const labels: Record<string, string> = { ish_haqi: 'ish haqi', oziq_ovqat: 'oziq-ovqat mahsulotlari', kommunal: 'kommunal', soliq: 'soliq', kredit: 'kredit', ijara_tolov: 'ijara', tamir: "ta'mir", jihoz: 'jihoz', reklama: 'reklama', transport: 'transport', boshqa: 'boshqa' };
    const t: Transaction = { id: uid('x'), title: `Xarajat (${labels[i.category] ?? i.category})`, subtitle: i.note ?? '', createdAt: new Date().toISOString(), amount: i.amount, type: 'expense', method: i.method ?? 'cash', category: i.category, deletable: true };
    expenses = [t, ...expenses];
    return clone(t);
  },
  deleteTransaction: async (id) => { expenses = expenses.filter((e) => e.id !== id); },

  /* ── Xodimlar ── */
  listStaff: async () => clone(staffEvents()),
  createStaff: async (i) => {
    const s: StaffMember = { id: uid('s'), name: i.name, position: i.position ?? '', phone: i.phone ?? '', eventsCount: 0, active: true, payType: i.payType ?? 'monthly', rate: i.rate ?? 0, paidThisMonth: 0, appAccess: !!i.appAccess, note: i.note };
    staff = [...staff, s];
    return clone(s);
  },
  updateStaff: async (id, i) => {
    const s = staff.find((x) => x.id === id);
    if (!s) throw new ApiError('Ishchi topilmadi', 404);
    Object.assign(s, { ...(i.name !== undefined ? { name: i.name } : {}), ...(i.position !== undefined ? { position: i.position } : {}), ...(i.phone !== undefined ? { phone: i.phone } : {}), ...(i.payType ? { payType: i.payType } : {}), ...(i.rate !== undefined ? { rate: i.rate } : {}), ...(i.note !== undefined ? { note: i.note } : {}), ...(i.appAccess !== undefined ? { appAccess: i.appAccess } : {}), ...(i.active !== undefined ? { active: i.active } : {}) });
    return clone(s);
  },
  deleteStaff: async (id) => { const s = staff.find((x) => x.id === id); if (s) s.active = false; },
};

/** Barcha to'lovlar (bronlardan) + xarajatlar — server moliyasi bilan bir xil manba */
function collectOps(): Transaction[] {
  const pays: Transaction[] = bookings.flatMap((b) => b.payments.map((p): Transaction => ({
    id: p.id, bookingId: b.id, title: p.kind === 'deposit' ? 'Zakalat' : p.kind === 'refund' ? 'Qaytarish' : "To'lov", subtitle: b.clientName, createdAt: p.at,
    amount: p.amount, type: p.kind === 'deposit' ? 'deposit' : p.kind === 'refund' ? 'refund' : 'income', method: p.method, deletable: false,
  })));
  return [...pays, ...expenses];
}
