import type { Booking, Dish, MenuPackage, Payment, SessionInfo, StaffMember, Transaction, User, VenueInfo } from '../types';
import { addDays, todayISO } from '../utils/format';

/**
 * Demo ma'lumotlar (EXPO_PUBLIC_API_URL berilmaganda). Sanalar bugungi kunga nisbatan hisoblanadi —
 * ilova istalgan kuni ochilganda ham kalendar va bosh sahifa to'la ko'rinadi.
 * Tuzilma serverdagi bilan bir xil (seanslar, zallar, tadbir turlari).
 */
export const DEMO_USER: Omit<User, 'phone' | 'role'> = { id: 'u1', name: 'Azimjon', venueId: 'v1', venueName: 'Oltin Saroy' };

const SESSIONS: SessionInfo[] = [
  { code: 'morning', label: 'Nahorgi osh', startTime: '06:00', endTime: '10:00', eventTypes: ['nahorgi_osh'], pricingMode: 'per_guest', priceFactor: 0.6, fixedPrice: 0, minGuests: 200, note: '' },
  { code: 'day', label: "Nikoh to'yi", startTime: '12:00', endTime: '16:00', eventTypes: ['kunduzgi', 'nikoh'], pricingMode: 'per_guest', priceFactor: 1, fixedPrice: 0, minGuests: 150, note: '' },
  { code: 'evening', label: 'Kunduzgi / Vecher', startTime: '18:00', endTime: '23:00', eventTypes: ['kechki', 'nikoh'], pricingMode: 'per_guest', priceFactor: 1.15, fixedPrice: 0, minGuests: 150, note: '' },
  { code: 'special', label: 'Maxsus tadbir', startTime: '10:00', endTime: '23:00', eventTypes: ['tadbir'], pricingMode: 'negotiable', priceFactor: 1, fixedPrice: 0, minGuests: 1, note: 'Narx kelishiladi' },
];

export const DEMO_VENUE: VenueInfo = {
  id: 'v1', name: 'Oltin Saroy', district: 'Chilonzor', address: "Toshkent, Chilonzor tumani, Bunyodkor ko'chasi", phone: '+998712000000',
  description: "Zamonaviy to'yxona: katta va kichik zallar, 200 o'rinli parking.", amenities: ['Konditsioner', 'Sahna va LED ekran', 'Kelin xonasi'],
  parkingSpots: 200, status: 'active',
  halls: [
    { id: 'h1', name: 'Katta zal', capacityMin: 320, capacityMax: 800 },
    { id: 'h2', name: 'Kichik zal', capacityMin: 100, capacityMax: 300 },
    { id: 'h3', name: 'VIP zal', capacityMin: 40, capacityMax: 120 },
  ],
  sessions: SESSIONS, weekendFactor: 1.15, depositPercent: 30,
  subscription: { monthlyFee: 0, paidUntil: '', state: 'free' },
  eventTypes: [
    { code: 'nahorgi_osh', label: 'Nahorgi osh' }, { code: 'nikoh', label: "Nikoh to'yi" }, { code: 'kunduzgi', label: "Kunduzgi to'y" },
    { code: 'kechki', label: "Kechki to'y" }, { code: 'tadbir', label: 'Maxsus tadbir' },
  ],
};

const dish = (id: string, name: string): Dish => ({ id, name, photo: null, menusCount: 0 });
export const DISHES: Dish[] = [
  dish('d1', 'Palov'), dish('d2', 'Norin'), dish('d3', 'Salatlar (4 xil)'), dish('d4', 'Mevalar'), dish('d5', 'Choy, non'),
  dish('d6', 'Qazi'), dish('d7', 'Shashlik (2 six)'), dish('d8', 'Salatlar (6 xil)'), dish('d9', 'Shirinliklar'), dish('d10', 'Ichimliklar'),
  dish('d11', 'Qazi, norin'), dish('d12', 'Kabob assorti'), dish('d13', 'Salatlar (8 xil)'), dish('d14', 'Tort'),
  dish('d15', "Qo'y go'shti (butun)"), dish('d16', 'Baliq'), dish('d17', 'Salatlar (10 xil)'),
];
const pick = (...ids: string[]) => ids.map((i) => DISHES.find((d) => d.id === i)!);

export const MENUS: MenuPackage[] = [
  { id: 'm1', name: "To'y №1", pricePerPerson: 120_000, minGuests: 200, dishes: pick('d1', 'd2', 'd3', 'd4', 'd5'), photo: null, itemsText: '', usedCount: 0, popular: false },
  { id: 'm2', name: "To'y №2", pricePerPerson: 150_000, minGuests: 350, dishes: pick('d1', 'd6', 'd7', 'd8', 'd9', 'd10'), photo: null, itemsText: '', usedCount: 0, popular: false },
  { id: 'm3', name: "To'y №3", pricePerPerson: 185_000, minGuests: 400, dishes: pick('d1', 'd11', 'd12', 'd13', 'd14', 'd4', 'd10'), photo: null, itemsText: '', usedCount: 0, popular: false },
  { id: 'm4', name: 'Premium', pricePerPerson: 220_000, minGuests: 500, dishes: pick('d1', 'd15', 'd16', 'd12', 'd17', 'd14', 'd4'), photo: null, itemsText: '', usedCount: 0, popular: false },
];

export const STAFF: StaffMember[] = [
  { id: 's1', name: 'Rustam Karimov', position: 'Administrator', phone: '+998901112233', eventsCount: 0, active: true, payType: 'monthly', rate: 4_000_000, paidThisMonth: 0, appAccess: true },
  { id: 's2', name: 'Dilnoza Aliyeva', position: 'Oshpaz', phone: '+998935554433', eventsCount: 0, active: true, payType: 'monthly', rate: 5_000_000, paidThisMonth: 0, appAccess: false },
  { id: 's3', name: 'Jasur Toshmatov', position: "Ofitsiantlar boshlig'i", phone: '+998977778899', eventsCount: 0, active: true, payType: 'per_event', rate: 300_000, paidThisMonth: 0, appAccess: false },
  { id: 's4', name: 'Kamola Yusupova', position: 'Dekorator', phone: '+998946667788', eventsCount: 0, active: true, payType: 'per_event', rate: 250_000, paidThisMonth: 0, appAccess: false },
];

export function createSeed(): { bookings: Booking[]; expenses: Transaction[] } {
  const t = todayISO();
  const now = new Date().toISOString();
  const at = (daysAgo: number, h: number, m: number) => {
    const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(h, m, 0, 0); return d.toISOString();
  };
  const prevMonth = (day: number) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); d.setDate(day); d.setHours(14, 0, 0, 0); return d.toISOString(); };
  const pay = (id: string, kind: Payment['kind'], amount: number, when: string, method: Payment['method'] = 'cash'): Payment => ({ id, kind, amount, method, date: when.slice(0, 10), at: when, note: '' });
  const mk = (b: Partial<Booking> & Pick<Booking, 'id' | 'date' | 'session' | 'type' | 'guestCount' | 'clientName' | 'clientPhone' | 'status' | 'totalAmount' | 'hallId'>): Booking => {
    const s = SESSIONS.find((x) => x.code === b.session)!;
    const payments = b.payments ?? [];
    const paid = payments.reduce((a, p) => a + (p.kind === 'refund' ? -p.amount : p.amount), 0);
    return {
      source: 'owner', number: null, sessionLabel: s.label, time: s.startTime, endTime: s.endTime, typeLabel: DEMO_VENUE.eventTypes.find((e) => e.code === b.type)?.label ?? '', staffIds: [], extras: [], createdAt: now,
      pricePerGuest: 0, depositAmount: payments.filter((p) => p.kind === 'deposit').reduce((a, p) => a + p.amount, 0), paidAmount: paid,
      balance: Math.max(0, b.totalAmount - paid), payments, ...b,
      hallName: DEMO_VENUE.halls.find((h) => h.id === b.hallId)?.name,
    } as Booking;
  };
  const bookings: Booking[] = [
    mk({ id: 'b0', date: t, session: 'day', type: 'nikoh', guestCount: 150, clientName: "Ulug'bek & Nilufar", clientPhone: '+998901234500', status: 'confirmed', totalAmount: 22_500_000, hallId: 'h2', menuId: 'm1', staffIds: ['s1', 's2'], payments: [pay('p0', 'deposit', 5_000_000, at(1, 16, 0))] }),
    mk({ id: 'b1', date: t, session: 'evening', type: 'kechki', guestCount: 400, clientName: 'Azizbek & Dilshoda', clientPhone: '+998901234567', address: 'Toshkent, Chilonzor', status: 'confirmed', totalAmount: 74_000_000, hallId: 'h1', menuId: 'm3', staffIds: ['s1', 's2', 's3', 's4'], payments: [pay('p1', 'deposit', 2_000_000, at(0, 9, 10)), pay('p2', 'payment', 6_500_000, at(0, 9, 20))] }),
    mk({ id: 'b2', date: addDays(t, 3), session: 'evening', type: 'kechki', guestCount: 180, clientName: 'Otabek & Malika', clientPhone: '+998901112233', status: 'pending', totalAmount: 33_300_000, hallId: 'h1', menuId: 'm3' }),
    mk({ id: 'b3', date: addDays(t, 6), session: 'evening', type: 'nikoh', guestCount: 150, clientName: 'Sardor & Madina', clientPhone: '+998939876543', status: 'deposit', totalAmount: 120_000_000, hallId: 'h1', menuId: 'm4', staffIds: ['s1'], payments: [pay('p3', 'deposit', 12_000_000, at(2, 12, 0), 'transfer')] }),
    mk({ id: 'b4', date: addDays(t, 13), session: 'evening', type: 'kechki', guestCount: 500, clientName: 'Bekzod & Shahlo', clientPhone: '+998944567890', status: 'confirmed', totalAmount: 200_000_000, hallId: 'h1', menuId: 'm4', staffIds: ['s1', 's3'], payments: [pay('p4', 'deposit', 20_000_000, at(3, 15, 40), 'card')] }),
    mk({ id: 'b5', date: addDays(t, -5), session: 'evening', type: 'kechki', guestCount: 300, clientName: 'Javohir & Ziyoda', clientPhone: '+998971112233', status: 'completed', totalAmount: 45_000_000, hallId: 'h1', menuId: 'm2', staffIds: ['s1', 's2'], payments: [pay('p5', 'deposit', 10_000_000, at(12, 11, 0)), pay('p6', 'payment', 35_000_000, at(5, 23, 0))] }),
    mk({ id: 'b6', date: addDays(t, 20), session: 'special', type: 'tadbir', guestCount: 80, clientName: 'Shoxrux Rahimov', clientPhone: '+998998887766', status: 'cancelled', totalAmount: 9_600_000, hallId: 'h3', menuId: 'm1' }),
  ];
  // Oldingi oy tushumlari — "o'tgan oyga nisbatan" ko'rsatkichi uchun
  bookings.push(mk({ id: 'b7', date: prevMonth(8).slice(0, 10), session: 'evening', type: 'kechki', guestCount: 250, clientName: 'Eski mijoz', clientPhone: '+998900000007', status: 'completed', totalAmount: 56_900_000, hallId: 'h1', payments: [pay('p7', 'payment', 38_000_000, prevMonth(6)), pay('p8', 'deposit', 15_000_000, prevMonth(14)), pay('p9', 'payment', 3_900_000, prevMonth(22))] }));
  const expenses: Transaction[] = [
    { id: 'x1', title: 'Xarajat (oziq-ovqat mahsulotlari)', subtitle: '', createdAt: at(0, 8, 30), amount: 3_500_000, type: 'expense', method: 'cash', category: 'oziq_ovqat', deletable: true },
    { id: 'x2', title: 'Xarajat (kommunal)', subtitle: '', createdAt: at(4, 10, 0), amount: 4_200_000, type: 'expense', method: 'cash', category: 'kommunal', deletable: true },
  ];
  return { bookings, expenses };
}
