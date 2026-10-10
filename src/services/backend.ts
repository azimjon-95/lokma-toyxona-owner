import type {
  Availability, Booking, BookingInput, BookingStatus, Client, Dish, ExpenseInput, FinanceOverview, MenuInput, MenuPackage, PaymentInput, Photo,
  Quote, Session, StaffInput, StaffMember, Transaction, UploadPurpose, UploadTicket, UserRole, VenueApplication, VenueInfo,
} from '../types';

export interface LoginResult {
  /** Rol tanlash uchun qisqa muddatli token */
  token: string;
  /** Foydalanuvchida bir nechta rol bo'lsa — rol tanlash ekrani ko'rsatiladi */
  roles: UserRole[];
}

export interface VenuePatch { description?: string; address?: string; phone?: string; amenities?: string[]; parkingSpots?: number }

/*
 * Ilovaning BARCHA server amallari shu yerda. Ikki amalga oshirish bor:
 *   serverBackend — lokma-toyxonalar-server (/api/owner-app), EXPO_PUBLIC_API_URL berilganda;
 *   demoBackend   — xotirada, server qoidalarini taqlid qiladi (demo rejim).
 * Ekranlar faqat shu shartnoma bilan ishlaydi.
 */
export interface Backend {
  /* ── Kirish ── */
  login(phone: string, password: string): Promise<LoginResult>;
  /** Kirish tokenini rol tokeniga almashtiradi; rol tokeni bilan chaqirilsa — sessiyani tekshiradi */
  fetchSession(token: string, role?: UserRole): Promise<Session>;
  /** `devCode` faqat server dev/test rejimida (SMS provayderisiz) qaytadi */
  requestPasswordReset(phone: string): Promise<{ devCode?: string }>;
  resetPassword(phone: string, code: string, password: string): Promise<void>;
  deleteAccount(): Promise<void>;
  submitVenueApplication(app: VenueApplication): Promise<void>;
  signApplicationUpload(): Promise<UploadTicket>;

  /* ── To'yxona va rasmlar ── */
  getVenue(): Promise<VenueInfo>;
  patchVenue(p: VenuePatch): Promise<VenueInfo>;
  listPhotos(): Promise<Photo[]>;
  addPhoto(publicId: string): Promise<Photo[]>;
  removePhoto(id: string): Promise<Photo[]>;
  reorderPhotos(ids: string[]): Promise<Photo[]>;
  signUpload(purpose: UploadPurpose): Promise<UploadTicket>;

  /* ── Bronlar ── */
  listBookings(range?: { from?: string; to?: string }): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking>;
  createBooking(i: BookingInput): Promise<Booking>;
  updateBooking(id: string, patch: Partial<BookingInput>): Promise<Booking>;
  setStatus(id: string, status: BookingStatus): Promise<Booking>;
  addPayment(id: string, p: PaymentInput): Promise<Booking>;
  assignStaff(id: string, employeeIds: string[]): Promise<Booking>;
  quote(i: { hallId: string; date: string; session: Booking['session']; guestCount: number; menuId?: string }): Promise<Quote>;
  availability(date: string): Promise<Availability>;
  listClients(q?: string): Promise<Client[]>;

  /* ── Menyu va taomlar ── */
  listMenus(): Promise<MenuPackage[]>;
  createMenu(i: MenuInput): Promise<MenuPackage>;
  updateMenu(id: string, i: Partial<MenuInput>): Promise<MenuPackage>;
  deleteMenu(id: string): Promise<void>;
  listDishes(): Promise<Dish[]>;
  createDish(name: string, photoPublicId?: string): Promise<Dish>;
  updateDish(id: string, p: { name?: string; photoPublicId?: string | null }): Promise<Dish>;
  deleteDish(id: string): Promise<void>;

  /* ── Moliya (faqat egasi) ── */
  financeOverview(): Promise<FinanceOverview>;
  operations(month?: string): Promise<Transaction[]>;
  addExpense(i: ExpenseInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  /* ── Xodimlar ── */
  listStaff(): Promise<StaffMember[]>;
  createStaff(i: StaffInput): Promise<StaffMember>;
  updateStaff(id: string, i: Partial<StaffInput> & { active?: boolean }): Promise<StaffMember>;
  deleteStaff(id: string): Promise<void>;
}
