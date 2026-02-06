export type UserRole = 'ADMIN' | 'PARTICIPANT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELED';

export interface Event {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  capacity: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  remainingPlaces?: number;
  createdBy?: User;
  reservations?: Reservation[];
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'REFUSED' | 'CANCELED';

export interface Reservation {
  id: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  user?: User;
  event?: Event;
}

export interface StatsResponse {
  upcomingCount: number;
  fillRate: number;
}

export interface ReservationStatsResponse {
  total: number;
  statusCounts: Record<ReservationStatus, number>;
}
