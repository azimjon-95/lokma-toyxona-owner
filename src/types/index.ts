export type UserRole = 'owner' | 'staff';

export type BookingStatus = 'pending' | 'deposit' | 'confirmed' | 'completed' | 'cancelled';

export type EventType = 'toy' | 'nikoh' | 'other';

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

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
}

export interface Booking {
  id: string;
  /** YYYY-MM-DD (mahalliy sana) */
  date: string;
  /** HH:mm */
  time: string;
  endTime?: string;
  type: EventType;
  guestCount: number;
  clientName: string;
  clientPhone: string;
  address?: string;
  status: BookingStatus;
  totalAmount: number;
  depositAmount: number;
  menuId?: string;
  hallName?: string;
  notes?: string;
  staffIds: string[];
  createdAt: string;
}

export interface MenuPackage {
  id: string;
  name: string;
  pricePerPerson: number;
  minGuests: number;
  dishes: string[];
}

export type TransactionType = 'income' | 'deposit' | 'expense';

export interface Transaction {
  id: string;
  bookingId?: string;
  title: string;
  /** ISO datetime */
  createdAt: string;
  /** Har doim musbat; yo'nalish `type` orqali aniqlanadi */
  amount: number;
  type: TransactionType;
}

export interface Client {
  key: string;
  name: string;
  phone: string;
  lastBooking: Booking;
  bookingsCount: number;
}

export interface VenueApplication {
  name: string;
  address: string;
  phone: string;
  halls: number;
  capacity: number;
  services: string[];
  photos: string[];
  priceFrom?: number;
  priceTo?: number;
  notes?: string;
}
