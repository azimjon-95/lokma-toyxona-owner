import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type {
  Booking,
  BookingStatus,
  Client,
  MenuPackage,
  StaffMember,
  Transaction,
  TransactionType,
} from '../types';
import { MENUS, STAFF, createSeed } from '../data/mock';
import { todayISO, toISODate } from '../utils/format';

export type NewBooking = Omit<Booking, 'id' | 'createdAt' | 'status' | 'staffIds'>;
export type NewMenu = Omit<MenuPackage, 'id'>;

interface DataState {
  bookings: Booking[];
  transactions: Transaction[];
  menus: MenuPackage[];
  staff: StaffMember[];
  clients: Client[];
  getBooking: (id: string) => Booking | undefined;
  getMenu: (id?: string) => MenuPackage | undefined;
  paidFor: (bookingId: string) => number;
  addBooking: (b: NewBooking) => Booking;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  setStatus: (id: string, status: BookingStatus) => void;
  addPayment: (bookingId: string, amount: number, type: Exclude<TransactionType, 'expense'>) => void;
  addExpense: (title: string, amount: number) => void;
  addMenu: (m: NewMenu) => MenuPackage;
}

const DataContext = createContext<DataState | null>(null);

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const byDateTime = (a: Booking, b: Booking) =>
  a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [seed] = useState(createSeed);
  const [bookings, setBookings] = useState<Booking[]>(seed.bookings);
  const [transactions, setTransactions] = useState<Transaction[]>(seed.transactions);
  const [menus, setMenus] = useState<MenuPackage[]>(MENUS);

  const paidMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of transactions) {
      if (t.bookingId && t.type !== 'expense') m[t.bookingId] = (m[t.bookingId] ?? 0) + t.amount;
    }
    return m;
  }, [transactions]);

  const paidFor = useCallback((id: string) => paidMap[id] ?? 0, [paidMap]);

  // Kelgusi bronlar (yaqinidan boshlab), so'ng o'tganlari (eng yangisidan) — ro'yxatlar uchun qulay tartib
  const sortedBookings = useMemo(() => {
    const today = todayISO();
    const upcoming = bookings.filter((b) => b.date >= today).sort(byDateTime);
    const past = bookings.filter((b) => b.date < today).sort((a, b) => byDateTime(b, a));
    return [...upcoming, ...past];
  }, [bookings]);

  const clients = useMemo<Client[]>(() => {
    const map = new Map<string, Client>();
    // Har mijoz uchun eng dolzarb (kelgusi yoki eng so'nggi) bron ko'rsatiladi
    for (const b of sortedBookings) {
      const key = b.clientPhone;
      const existing = map.get(key);
      if (existing) existing.bookingsCount += 1;
      else map.set(key, { key, name: b.clientName, phone: b.clientPhone, lastBooking: b, bookingsCount: 1 });
    }
    return [...map.values()];
  }, [sortedBookings]);

  const getBooking = useCallback((id: string) => bookings.find((b) => b.id === id), [bookings]);
  const getMenu = useCallback((id?: string) => menus.find((m) => m.id === id), [menus]);

  const addBooking = useCallback((b: NewBooking) => {
    const booking: Booking = {
      ...b,
      id: uid('b'),
      status: 'pending',
      staffIds: [],
      createdAt: new Date().toISOString(),
    };
    setBookings((prev) => [...prev, booking]);
    return booking;
  }, []);

  const updateBooking = useCallback((id: string, patch: Partial<Booking>) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  const setStatus = useCallback(
    (id: string, status: BookingStatus) => updateBooking(id, { status }),
    [updateBooking]
  );

  const addPayment = useCallback(
    (bookingId: string, amount: number, type: Exclude<TransactionType, 'expense'>) => {
      setTransactions((prev) => [
        {
          id: uid('t'),
          bookingId,
          amount,
          type,
          title: type === 'deposit' ? 'Zakalat' : "To'lov",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== bookingId) return b;
          const next = { ...b };
          if (type === 'deposit') next.depositAmount = b.depositAmount + amount;
          if (b.status === 'pending' || b.status === 'deposit') next.status = 'confirmed';
          return next;
        })
      );
    },
    []
  );

  const addExpense = useCallback((title: string, amount: number) => {
    setTransactions((prev) => [
      { id: uid('t'), title, amount, type: 'expense', createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const addMenu = useCallback((m: NewMenu) => {
    const menu: MenuPackage = { ...m, id: uid('m') };
    setMenus((prev) => [...prev, menu]);
    return menu;
  }, []);

  const value = useMemo<DataState>(
    () => ({
      bookings: sortedBookings,
      transactions: [...transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      menus,
      staff: STAFF,
      clients,
      getBooking,
      getMenu,
      paidFor,
      addBooking,
      updateBooking,
      setStatus,
      addPayment,
      addExpense,
      addMenu,
    }),
    [sortedBookings, transactions, menus, clients, getBooking, getMenu, paidFor, addBooking, updateBooking, setStatus, addPayment, addExpense, addMenu]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

// ---------------- Hisob-kitob (selector) hooklari ----------------

const isActive = (b: Booking) => b.status !== 'cancelled' && b.status !== 'completed';

export function useFinance() {
  const { transactions, bookings, paidFor } = useData();
  return useMemo(() => {
    const now = new Date();
    const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
    const thisMonth = monthKey(now);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = monthKey(prev);
    const today = todayISO();

    let revenue = 0;
    let prevRevenue = 0;
    let deposit = 0;
    let paid = 0;
    let expenses = 0;
    let todayIncome = 0;
    let yesterdayIncome = 0;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayISO = toISODate(yesterday);

    for (const t of transactions) {
      const d = new Date(t.createdAt);
      const key = monthKey(d);
      const day = toISODate(d);
      if (t.type === 'expense') {
        if (key === thisMonth) expenses += t.amount;
        continue;
      }
      if (key === thisMonth) {
        revenue += t.amount;
        if (t.type === 'deposit') deposit += t.amount;
        else paid += t.amount;
      } else if (key === prevMonth) {
        prevRevenue += t.amount;
      }
      if (day === today) todayIncome += t.amount;
      if (day === yesterdayISO) yesterdayIncome += t.amount;
    }

    const owing = bookings
      .filter(isActive)
      .map((b) => ({ booking: b, remaining: Math.max(0, b.totalAmount - paidFor(b.id)) }))
      .filter((x) => x.remaining > 0);
    const remaining = owing.reduce((s, x) => s + x.remaining, 0);
    const dueSoon = owing.filter((x) => x.booking.date >= today);
    const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);

    return {
      revenue,
      deposit,
      paid,
      expenses,
      remaining,
      growthPercent: pct(revenue, prevRevenue),
      todayIncome,
      todayGrowthPercent: pct(todayIncome, yesterdayIncome),
      expected: dueSoon.reduce((s, x) => s + x.remaining, 0),
      expectedClients: dueSoon.length,
    };
  }, [transactions, bookings, paidFor]);
}
