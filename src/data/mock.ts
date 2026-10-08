import type { Booking, MenuPackage, StaffMember, Transaction, User } from '../types';
import { addDays, todayISO } from '../utils/format';

/**
 * Demo ma'lumotlar. Sanalar bugungi kunga nisbatan hisoblanadi —
 * ilova istalgan kuni ochilganda ham kalendar va bosh sahifa to'la ko'rinadi.
 * Backend ulanganda `src/services/api.ts` shu fayl o'rniga serverdan oladi.
 */

export const DEMO_USER: Omit<User, 'phone' | 'role'> = {
  id: 'u1',
  name: 'Azimjon',
  venueId: 'v1',
  venueName: 'Oltin Saroy',
};

export const MENUS: MenuPackage[] = [
  {
    id: 'm1',
    name: "To'y №1",
    pricePerPerson: 120_000,
    minGuests: 200,
    dishes: ['Palov', 'Norin', 'Salatlar (4 xil)', 'Mevalar', 'Choy, non'],
  },
  {
    id: 'm2',
    name: "To'y №2",
    pricePerPerson: 150_000,
    minGuests: 350,
    dishes: ['Palov', 'Qazi', "Shashlik (2 six)", 'Salatlar (6 xil)', 'Shirinliklar', 'Ichimliklar'],
  },
  {
    id: 'm3',
    name: "To'y №3",
    pricePerPerson: 185_000,
    minGuests: 400,
    dishes: ['Palov', 'Qazi, norin', 'Kabob assorti', 'Salatlar (8 xil)', 'Tort', 'Mevalar', 'Ichimliklar'],
  },
  {
    id: 'm4',
    name: 'Premium',
    pricePerPerson: 220_000,
    minGuests: 500,
    dishes: ['Palov', "Qo'y go'shti (butun)", 'Baliq', 'Kabob assorti', 'Salatlar (10 xil)', 'Tort', 'Mevalar'],
  },
];

export const STAFF: StaffMember[] = [
  { id: 's1', name: 'Rustam Karimov', role: 'Administrator', phone: '+998901112233' },
  { id: 's2', name: 'Dilnoza Aliyeva', role: 'Oshpaz', phone: '+998935554433' },
  { id: 's3', name: 'Jasur Toshmatov', role: 'Ofitsiantlar boshlig\'i', phone: '+998977778899' },
  { id: 's4', name: 'Kamola Yusupova', role: 'Dekorator', phone: '+998946667788' },
];

export function createSeed(): { bookings: Booking[]; transactions: Transaction[] } {
  const t = todayISO();
  const now = new Date().toISOString();
  const bookings: Booking[] = [
    {
      id: 'b0', date: t, time: '11:00', endTime: '15:00', type: 'nikoh', guestCount: 150,
      clientName: 'Ulug\'bek & Nilufar', clientPhone: '+998901234500', status: 'confirmed',
      totalAmount: 22_500_000, depositAmount: 5_000_000, menuId: 'm1', hallName: 'Kichik zal',
      staffIds: ['s1', 's2'], createdAt: now,
    },
    {
      id: 'b1', date: t, time: '18:00', endTime: '23:00', type: 'toy', guestCount: 400,
      clientName: 'Azizbek & Dilshoda', clientPhone: '+998901234567', address: 'Toshkent, Chilonzor',
      status: 'confirmed', totalAmount: 74_000_000, depositAmount: 2_000_000, menuId: 'm3',
      hallName: 'Katta zal', staffIds: ['s1', 's2', 's3', 's4'], createdAt: now,
    },
    {
      id: 'b2', date: addDays(t, 3), time: '18:00', endTime: '23:00', type: 'toy', guestCount: 180,
      clientName: 'Otabek & Malika', clientPhone: '+998901112233', status: 'pending',
      totalAmount: 33_300_000, depositAmount: 0, menuId: 'm3', hallName: 'Katta zal',
      staffIds: [], createdAt: now,
    },
    {
      id: 'b3', date: addDays(t, 6), time: '17:00', endTime: '21:00', type: 'nikoh', guestCount: 150,
      clientName: 'Sardor & Madina', clientPhone: '+998939876543', status: 'deposit',
      totalAmount: 120_000_000, depositAmount: 12_000_000, menuId: 'm4', hallName: 'Katta zal',
      staffIds: ['s1'], createdAt: now,
    },
    {
      id: 'b4', date: addDays(t, 13), time: '18:00', endTime: '23:00', type: 'toy', guestCount: 500,
      clientName: 'Bekzod & Shahlo', clientPhone: '+998944567890', status: 'confirmed',
      totalAmount: 200_000_000, depositAmount: 20_000_000, menuId: 'm4', hallName: 'Katta zal',
      staffIds: ['s1', 's3'], createdAt: now,
    },
    {
      id: 'b5', date: addDays(t, -5), time: '18:00', endTime: '23:00', type: 'toy', guestCount: 300,
      clientName: 'Javohir & Ziyoda', clientPhone: '+998971112233', status: 'completed',
      totalAmount: 45_000_000, depositAmount: 10_000_000, menuId: 'm2', hallName: 'Katta zal',
      staffIds: ['s1', 's2'], createdAt: now,
    },
    {
      id: 'b6', date: addDays(t, 20), time: '12:00', type: 'other', guestCount: 80,
      clientName: 'Shoxrux Rahimov', clientPhone: '+998998887766', status: 'cancelled',
      totalAmount: 9_600_000, depositAmount: 0, menuId: 'm1', staffIds: [], createdAt: now,
    },
  ];

  const at = (daysAgo: number, h: number, m: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  // O'tgan oy tushumlari — "o'tgan oyga nisbatan" ko'rsatkichi uchun
  const prevMonth = (day: number) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    d.setDate(day);
    d.setHours(14, 0, 0, 0);
    return d.toISOString();
  };

  const transactions: Transaction[] = [
    { id: 'p1', title: "To'liq to'lov", createdAt: prevMonth(6), amount: 38_000_000, type: 'income' },
    { id: 'p2', title: 'Zakalat', createdAt: prevMonth(14), amount: 15_000_000, type: 'deposit' },
    { id: 'p3', title: "To'liq to'lov", createdAt: prevMonth(22), amount: 18_900_000, type: 'income' },
    { id: 't1', bookingId: 'b1', title: "To'yona (naqd)", createdAt: at(0, 9, 20), amount: 6_500_000, type: 'income' },
    { id: 't2', bookingId: 'b1', title: 'Zakalat', createdAt: at(0, 9, 10), amount: 2_000_000, type: 'deposit' },
    { id: 't3', title: 'Xarajat (oziq-ovqat mahsulotlari)', createdAt: at(0, 8, 30), amount: 3_500_000, type: 'expense' },
    { id: 't4', bookingId: 'b0', title: 'Zakalat', createdAt: at(1, 16, 0), amount: 5_000_000, type: 'deposit' },
    { id: 't5', bookingId: 'b3', title: 'Zakalat', createdAt: at(2, 12, 0), amount: 12_000_000, type: 'deposit' },
    { id: 't6', bookingId: 'b5', title: "To'liq to'lov", createdAt: at(5, 23, 0), amount: 35_000_000, type: 'income' },
    { id: 't7', bookingId: 'b5', title: 'Zakalat', createdAt: at(12, 11, 0), amount: 10_000_000, type: 'deposit' },
    { id: 't8', bookingId: 'b4', title: 'Zakalat', createdAt: at(3, 15, 40), amount: 20_000_000, type: 'deposit' },
    { id: 't9', title: 'Xarajat (kommunal)', createdAt: at(4, 10, 0), amount: 4_200_000, type: 'expense' },
  ];

  return { bookings, transactions };
}
