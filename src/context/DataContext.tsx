import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { QueryClient, QueryClientProvider, focusManager, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Availability, Booking, BookingInput, BookingStatus, Client, Dish, ExpenseInput, FinanceOverview, MenuInput, MenuPackage, PaymentInput, Photo, Quote,
  StaffInput, StaffMember, Transaction, VenueInfo,
} from '../types';
import { ApiError, backend } from '../services/api';
import { useAuth } from './AuthContext';
import { todayISO } from '../utils/format';

/*
 * Server ma'lumotlari (react-query). Hamma narsa `backend` orqali: demo yoki haqiqiy server.
 *  - ro'yxatlar keshlanadi, ilova oldingi planga qaytganda yangilanadi;
 *  - har bir amaldan keyin bog'liq ma'lumotlar (moliya, mijozlar, menyu) qayta yuklanadi.
 */
export const errorMessage = (e: unknown, fallback = 'Xatolik yuz berdi') => (e instanceof ApiError ? e.message : e instanceof Error ? e.message : fallback);

const qk = {
  venue: ['venue'] as const,
  bookings: ['bookings'] as const,
  menus: ['menus'] as const,
  dishes: ['dishes'] as const,
  staff: ['staff'] as const,
  finance: ['finance'] as const,
  operations: ['operations'] as const,
  clients: ['clients'] as const,
  photos: ['photos'] as const,
};

interface DataState {
  venue: VenueInfo | undefined;
  bookings: Booking[];
  menus: MenuPackage[];
  dishes: Dish[];
  staff: StaffMember[];
  /** Asosiy ma'lumotlar birinchi marta yuklanmoqda */
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  getBooking: (id: string) => Booking | undefined;
  getMenu: (id?: string) => MenuPackage | undefined;
  createBooking: (b: BookingInput) => Promise<Booking>;
  updateBooking: (id: string, patch: Partial<BookingInput>) => Promise<Booking>;
  setStatus: (id: string, status: BookingStatus) => Promise<Booking>;
  addPayment: (bookingId: string, p: PaymentInput) => Promise<Booking>;
  assignStaff: (bookingId: string, employeeIds: string[]) => Promise<Booking>;
  createMenu: (m: MenuInput) => Promise<MenuPackage>;
  updateMenu: (id: string, m: Partial<MenuInput>) => Promise<MenuPackage>;
  deleteMenu: (id: string) => Promise<void>;
  createDish: (name: string, photoPublicId?: string) => Promise<Dish>;
  updateDish: (id: string, p: { name?: string; photoPublicId?: string | null }) => Promise<Dish>;
  deleteDish: (id: string) => Promise<void>;
  createStaff: (s: StaffInput) => Promise<StaffMember>;
  updateStaff: (id: string, s: Partial<StaffInput> & { active?: boolean }) => Promise<StaffMember>;
  deleteStaff: (id: string) => Promise<void>;
  addExpense: (e: ExpenseInput) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
}

const DataContext = createContext<DataState | null>(null);

const byDateTime = (a: Booking, b: Booking) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date));

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, gcTime: 10 * 60_000, retry: (n, e) => !(e instanceof ApiError && e.status > 0 && e.status < 500) && n < 2, refetchOnReconnect: true } },
  });
}

/** React Native: ilova oldingi planga qaytganda ma'lumotlar yangilansin */
function useAppFocus() {
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const sub = AppState.addEventListener('change', (s) => focusManager.setFocused(s === 'active'));
    return () => sub.remove();
  }, []);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(makeClient);
  useAppFocus();
  return (
    <QueryClientProvider client={client}>
      <DataInner>{children}</DataInner>
    </QueryClientProvider>
  );
}

function DataInner({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const qc = useQueryClient();
  const signedIn = status === 'signedIn';
  const identity = signedIn ? `${user?.id}:${user?.role}` : 'out';

  // Boshqa foydalanuvchi/rol bilan kirilganda eski kesh qolmasin
  useEffect(() => { qc.clear(); }, [identity, qc]);

  const venueQ = useQuery({ queryKey: [...qk.venue, identity], queryFn: () => backend.getVenue(), enabled: signedIn, staleTime: 5 * 60_000 });
  const bookingsQ = useQuery({ queryKey: [...qk.bookings, identity], queryFn: () => backend.listBookings(), enabled: signedIn });
  const menusQ = useQuery({ queryKey: [...qk.menus, identity], queryFn: () => backend.listMenus(), enabled: signedIn });
  const dishesQ = useQuery({ queryKey: [...qk.dishes, identity], queryFn: () => backend.listDishes(), enabled: signedIn });
  const staffQ = useQuery({ queryKey: [...qk.staff, identity], queryFn: () => backend.listStaff(), enabled: signedIn });

  const sorted = useMemo(() => {
    const list = bookingsQ.data ?? [];
    const today = todayISO();
    // Kelgusi bronlar (yaqinidan boshlab), so'ng o'tganlari (eng yangisidan) — ro'yxatlar uchun qulay tartib
    return [...list.filter((b) => b.date >= today).sort(byDateTime), ...list.filter((b) => b.date < today).sort((a, b) => byDateTime(b, a))];
  }, [bookingsQ.data]);

  /** Bron o'zgarganda keshdagi ro'yxatni darhol yangilaymiz, bog'liq ma'lumotlarni qayta yuklaymiz */
  const touch = useCallback((b?: Booking) => {
    if (b) {
      qc.setQueriesData<Booking[]>({ queryKey: qk.bookings }, (old) => (old ? (old.some((x) => x.id === b.id) ? old.map((x) => (x.id === b.id ? b : x)) : [...old, b]) : old));
      qc.setQueriesData<Booking>({ queryKey: ['booking', b.id] }, () => b);
    }
    for (const k of [qk.finance, qk.operations, qk.clients, qk.menus, qk.staff]) void qc.invalidateQueries({ queryKey: k });
  }, [qc]);

  const refresh = useCallback(async () => {
    await Promise.all([bookingsQ.refetch(), menusQ.refetch(), dishesQ.refetch(), staffQ.refetch(), venueQ.refetch()]);
    for (const k of [qk.finance, qk.operations, qk.clients, qk.photos]) void qc.invalidateQueries({ queryKey: k });
  }, [bookingsQ, menusQ, dishesQ, staffQ, venueQ, qc]);

  const invalidate = useCallback((...keys: (readonly string[])[]) => { for (const k of keys) void qc.invalidateQueries({ queryKey: k }); }, [qc]);

  const value = useMemo<DataState>(() => ({
    venue: venueQ.data,
    bookings: sorted,
    menus: menusQ.data ?? [],
    dishes: dishesQ.data ?? [],
    staff: staffQ.data ?? [],
    loading: signedIn && (bookingsQ.isLoading || venueQ.isLoading),
    error: bookingsQ.error ? errorMessage(bookingsQ.error) : venueQ.error ? errorMessage(venueQ.error) : null,
    refreshing: bookingsQ.isRefetching,
    refresh,
    getBooking: (id) => bookingsQ.data?.find((b) => b.id === id),
    getMenu: (id) => menusQ.data?.find((m) => m.id === id),
    createBooking: async (b) => { const r = await backend.createBooking(b); touch(r); return r; },
    updateBooking: async (id, p) => { const r = await backend.updateBooking(id, p); touch(r); return r; },
    setStatus: async (id, s) => { const r = await backend.setStatus(id, s); touch(r); return r; },
    addPayment: async (id, p) => { const r = await backend.addPayment(id, p); touch(r); return r; },
    assignStaff: async (id, ids) => { const r = await backend.assignStaff(id, ids); touch(r); return r; },
    createMenu: async (m) => { const r = await backend.createMenu(m); invalidate(qk.menus, qk.dishes); return r; },
    updateMenu: async (id, m) => { const r = await backend.updateMenu(id, m); invalidate(qk.menus, qk.dishes); return r; },
    deleteMenu: async (id) => { await backend.deleteMenu(id); invalidate(qk.menus, qk.dishes); },
    createDish: async (n, p) => { const r = await backend.createDish(n, p); invalidate(qk.dishes); return r; },
    updateDish: async (id, p) => { const r = await backend.updateDish(id, p); invalidate(qk.dishes, qk.menus); return r; },
    deleteDish: async (id) => { await backend.deleteDish(id); invalidate(qk.dishes, qk.menus); },
    createStaff: async (s) => { const r = await backend.createStaff(s); invalidate(qk.staff); return r; },
    updateStaff: async (id, s) => { const r = await backend.updateStaff(id, s); invalidate(qk.staff); return r; },
    deleteStaff: async (id) => { await backend.deleteStaff(id); invalidate(qk.staff); },
    addExpense: async (e) => { const r = await backend.addExpense(e); invalidate(qk.finance, qk.operations); return r; },
    deleteTransaction: async (id) => { await backend.deleteTransaction(id); invalidate(qk.finance, qk.operations); },
  }), [venueQ, bookingsQ, menusQ, dishesQ, staffQ, sorted, signedIn, refresh, touch, invalidate]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

/* ───────────── Alohida so'rovlar (kerak bo'lgan ekranda yuklanadi) ───────────── */

const ZERO_FINANCE: FinanceOverview = {
  month: '', today: '', revenue: 0, deposit: 0, paid: 0, expenses: 0, remaining: 0, growthPercent: null, todayIncome: 0, todayGrowthPercent: null, expected: 0, expectedClients: 0,
};

/** Bosh sahifa va Moliya ko'rsatkichlari — faqat egasi uchun (xodimga server bermaydi) */
export function useFinance() {
  const { user } = useAuth();
  const q = useQuery({ queryKey: [...qk.finance, user?.id], queryFn: () => backend.financeOverview(), enabled: user?.role === 'owner' });
  return { ...(q.data ?? ZERO_FINANCE), loading: q.isLoading, error: q.error ? errorMessage(q.error) : null };
}

/** Kirim-chiqim operatsiyalari (to'lovlar + xarajatlar) */
export function useOperations(month?: string) {
  const { user } = useAuth();
  const q = useQuery({ queryKey: [...qk.operations, user?.id, month], queryFn: () => backend.operations(month), enabled: user?.role === 'owner' });
  return { operations: (q.data ?? []) as Transaction[], loading: q.isLoading, error: q.error ? errorMessage(q.error) : null, refetch: q.refetch };
}

/** Mijozlar (serverda telefon bo'yicha jamlanadi; qidiruv serverda) */
export function useClients(search: string) {
  const { user } = useAuth();
  const q = useQuery({ queryKey: [...qk.clients, user?.id, search.trim()], queryFn: () => backend.listClients(search.trim() || undefined), enabled: !!user, placeholderData: (p) => p });
  return { clients: (q.data ?? []) as Client[], loading: q.isLoading, error: q.error ? errorMessage(q.error) : null, refetch: q.refetch };
}

/** Bitta bron (to'liq, yangi ma'lumot bilan) */
export function useBooking(id: string | undefined) {
  const { user } = useAuth();
  const q = useQuery({ queryKey: ['booking', id, user?.id], queryFn: () => backend.getBooking(id!), enabled: !!id && !!user });
  return { booking: q.data, loading: q.isLoading, error: q.error ? errorMessage(q.error) : null };
}

/** Tanlangan kunda zallar/seanslar bandligi (bron formasi) */
export function useAvailability(date: string) {
  const { user } = useAuth();
  const q = useQuery<Availability>({ queryKey: ['availability', date, user?.id], queryFn: () => backend.availability(date), enabled: !!user && /^\d{4}-\d{2}-\d{2}$/.test(date), staleTime: 10_000, placeholderData: (p) => p });
  return { availability: q.data, loading: q.isFetching };
}

/** Narx taklifi (mijoz ilovasi bilan bir xil formula — serverda) */
export function useQuote(p: { hallId?: string; date: string; session?: Booking['session']; guestCount: number; menuId?: string }) {
  const { user } = useAuth();
  const enabled = !!user && !!p.hallId && !!p.session && /^\d{4}-\d{2}-\d{2}$/.test(p.date) && p.guestCount > 0;
  const q = useQuery<Quote>({
    queryKey: ['quote', p.hallId, p.date, p.session, p.guestCount, p.menuId],
    queryFn: () => backend.quote({ hallId: p.hallId!, date: p.date, session: p.session!, guestCount: p.guestCount, menuId: p.menuId }),
    enabled, staleTime: 60_000, placeholderData: (prev) => prev,
  });
  return { quote: enabled ? q.data : undefined, loading: q.isFetching };
}

/** To'yxona galereyasi */
export function usePhotos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = [...qk.photos, user?.id];
  const q = useQuery<Photo[]>({ queryKey: key, queryFn: () => backend.listPhotos(), enabled: !!user });
  const set = (l: Photo[]) => qc.setQueryData(key, l);
  const add = useMutation({ mutationFn: (publicId: string) => backend.addPhoto(publicId), onSuccess: set });
  const remove = useMutation({ mutationFn: (id: string) => backend.removePhoto(id), onSuccess: set });
  const reorder = useMutation({ mutationFn: (ids: string[]) => backend.reorderPhotos(ids), onSuccess: set });
  return { photos: q.data ?? [], loading: q.isLoading, error: q.error ? errorMessage(q.error) : null, add: add.mutateAsync, remove: remove.mutateAsync, reorder: reorder.mutateAsync, setLocal: set };
}

/** Egasi uchun moliya ruxsati bor foydalanuvchi */
export const isActive = (b: Booking) => b.status !== 'cancelled' && b.status !== 'completed';
