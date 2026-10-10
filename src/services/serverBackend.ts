import type { Backend } from './backend';
import { request } from './http';
import {
  bookingToServer, compact, expenseToServer, mapAvailability, mapBooking, mapDish, mapMenu, mapOperation, mapOverview, mapPhoto, mapQuote,
  mapStaff, mapTicket, mapUser, mapVenue, menuToServer, staffToServer,
  type AvailabilityDto, type BookingDto, type DishDto, type EmployeeDto, type MeDto, type MenuDto, type OperationDto, type OverviewDto,
  type PhotoDto, type QuoteDto, type SessionDto, type TicketDto,
} from './mappers';
import type { Client, Photo, UserRole } from '../types';

const photos = (l: PhotoDto[]): Photo[] => l.map((p) => mapPhoto(p)!);

/** lokma-toyxonalar-server /api/owner-app bilan ishlaydigan amalga oshirish */
export const serverBackend: Backend = {
  /* ── Kirish ── */
  login: (phone, password) => request('/auth/login', { method: 'POST', body: { phone, password }, token: null, silent401: true }),
  fetchSession: async (token, role?: UserRole) => {
    const s = await request<SessionDto>('/auth/session', { query: { role }, token, silent401: true });
    return { token: s.token, user: mapUser(s.user) };
  },
  requestPasswordReset: async (phone) => {
    const r = await request<{ ok: true; dev_code?: string }>('/auth/forgot', { method: 'POST', body: { phone }, token: null });
    return { devCode: r.dev_code };
  },
  resetPassword: async (phone, code, password) => {
    await request('/auth/reset', { method: 'POST', body: { phone, code, password }, token: null });
  },
  deleteAccount: async () => { await request('/account', { method: 'DELETE' }); },
  submitVenueApplication: async (a) => {
    await request('/applications', {
      method: 'POST', token: null,
      body: compact({ name: a.name, address: a.address, phone: a.phone, halls: a.halls, capacity: a.capacity, services: a.services, photos: a.photos, price_from: a.priceFrom, price_to: a.priceTo, notes: a.notes }),
    });
  },
  signApplicationUpload: async () => mapTicket(await request<TicketDto>('/applications/uploads/sign', { method: 'POST', token: null })),

  /* ── To'yxona va rasmlar ── */
  getVenue: async () => mapVenue(await request<MeDto>('/me')),
  patchVenue: async (p) => mapVenue(await request<MeDto>('/venue', { method: 'PATCH', body: compact({ description: p.description, address: p.address, phone: p.phone, amenities: p.amenities, parking_spots: p.parkingSpots }) })),
  listPhotos: async () => photos(await request<PhotoDto[]>('/venue/photos')),
  addPhoto: async (publicId) => photos(await request<PhotoDto[]>('/venue/photos', { method: 'POST', body: { public_id: publicId } })),
  removePhoto: async (id) => photos(await request<PhotoDto[]>(`/venue/photos/${id}`, { method: 'DELETE' })),
  reorderPhotos: async (ids) => photos(await request<PhotoDto[]>('/venue/photos/order', { method: 'PUT', body: { ids } })),
  signUpload: async (purpose) => mapTicket(await request<TicketDto>('/uploads/sign', { method: 'POST', body: { purpose } })),

  /* ── Bronlar ── */
  listBookings: async (r) => (await request<BookingDto[]>('/bookings', { query: { from: r?.from, to: r?.to, limit: 2000 } })).map(mapBooking),
  getBooking: async (id) => mapBooking(await request<BookingDto>(`/bookings/${id}`)),
  createBooking: async (i) => mapBooking(await request<BookingDto>('/bookings', { method: 'POST', body: compact(bookingToServer(i)) })),
  updateBooking: async (id, p) => mapBooking(await request<BookingDto>(`/bookings/${id}`, { method: 'PATCH', body: compact(bookingToServer({ ...p, stage: undefined })) })),
  setStatus: async (id, status) => mapBooking(await request<BookingDto>(`/bookings/${id}/status`, { method: 'POST', body: { status } })),
  addPayment: async (id, p) => mapBooking(await request<BookingDto>(`/bookings/${id}/payments`, { method: 'POST', body: compact({ kind: p.kind, amount: p.amount, method: p.method, note: p.note }) })),
  assignStaff: async (id, ids) => mapBooking(await request<BookingDto>(`/bookings/${id}/staff`, { method: 'PUT', body: { employee_ids: ids } })),
  quote: async (i) => mapQuote(await request<QuoteDto>('/bookings/quote', { method: 'POST', body: compact({ hall_id: i.hallId, date: i.date, session: i.session, guests: i.guestCount, menu_id: i.menuId }) })),
  availability: async (date) => mapAvailability(await request<AvailabilityDto>('/bookings/availability', { query: { date } })),
  listClients: async (q) => {
    const list = await request<{ key: string; name: string; phone: string; bookings_count: number; last_booking: BookingDto }[]>('/clients', { query: { q } });
    return list.map((c): Client => ({ key: c.key, name: c.name, phone: c.phone, bookingsCount: c.bookings_count, lastBooking: mapBooking(c.last_booking) }));
  },

  /* ── Menyu va taomlar ── */
  listMenus: async () => (await request<MenuDto[]>('/menus')).map(mapMenu),
  createMenu: async (i) => mapMenu(await request<MenuDto>('/menus', { method: 'POST', body: compact(menuToServer(i)) })),
  updateMenu: async (id, i) => mapMenu(await request<MenuDto>(`/menus/${id}`, { method: 'PATCH', body: compact(menuToServer(i)) })),
  deleteMenu: async (id) => { await request(`/menus/${id}`, { method: 'DELETE' }); },
  listDishes: async () => (await request<DishDto[]>('/dishes')).map(mapDish),
  createDish: async (name, photoPublicId) => mapDish(await request<DishDto>('/dishes', { method: 'POST', body: compact({ name, photo_public_id: photoPublicId }) })),
  updateDish: async (id, p) => mapDish(await request<DishDto>(`/dishes/${id}`, { method: 'PATCH', body: compact({ name: p.name, photo_public_id: p.photoPublicId }) })),
  deleteDish: async (id) => { await request(`/dishes/${id}`, { method: 'DELETE' }); },

  /* ── Moliya ── */
  financeOverview: async () => mapOverview(await request<OverviewDto>('/finance/overview')),
  operations: async (month) => (await request<{ items: OperationDto[] }>('/finance/operations', { query: { month } })).items.map(mapOperation),
  addExpense: async (i) => mapOperation(await request<OperationDto>('/transactions', { method: 'POST', body: compact(expenseToServer(i)) })),
  deleteTransaction: async (id) => { await request(`/transactions/${id}`, { method: 'DELETE' }); },

  /* ── Xodimlar ── */
  listStaff: async () => (await request<EmployeeDto[]>('/employees')).map(mapStaff),
  createStaff: async (i) => mapStaff(await request<EmployeeDto>('/employees', { method: 'POST', body: compact(staffToServer(i)) })),
  updateStaff: async (id, i) => mapStaff(await request<EmployeeDto>(`/employees/${id}`, { method: 'PATCH', body: compact({ ...staffToServer(i), active: i.active }) })),
  deleteStaff: async (id) => { await request(`/employees/${id}`, { method: 'DELETE' }); },
};
