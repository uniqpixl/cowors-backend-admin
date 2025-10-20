import { apiRequest } from './client';
import { 
  Partner, 
  Booking, 
  PaginatedResponse, 
  BookingQuery,
  PlatformStats,
  BookingAnalytics,
  UserAnalytics,
  RevenueAnalytics
} from '@/lib/api/types';

// Partner Profile endpoints
export const getPartnerProfile = async (): Promise<Partner> => {
  return apiRequest<Partner>({
    url: '/api/v1/partner/profile',
    method: 'GET',
  });
};

export const updatePartnerProfile = async (data: Partial<Partner>): Promise<Partner> => {
  return apiRequest<Partner>({
    url: '/api/v1/partner/profile',
    method: 'PUT',
    data,
  });
};

// Partner Spaces endpoints
export const getPartnerSpaces = async (params?: Record<string, unknown>): Promise<PaginatedResponse<unknown>> => {
  return apiRequest<PaginatedResponse<unknown>>({
    url: '/api/v1/partner/spaces',
    method: 'GET',
    params,
  });
};

export const getPartnerSpaceById = async (id: string): Promise<unknown> => {
  return apiRequest<unknown>({ 
    url: `/api/v1/partner/spaces/${id}`,
    method: 'GET',
  });
};

export const createPartnerSpace = async (data: Record<string, unknown>): Promise<unknown> => {
  return apiRequest<unknown>({ 
    url: '/api/v1/partner/spaces',
    method: 'POST',
    data,
  });
};

export const updatePartnerSpace = async (id: string, data: Record<string, unknown>): Promise<unknown> => {
  return apiRequest<unknown>({ 
    url: `/api/v1/partner/spaces/${id}`,
    method: 'PUT',
    data,
  });
};

export const deletePartnerSpace = async (id: string): Promise<unknown> => {
  return apiRequest<unknown>({ 
    url: `/api/v1/partner/spaces/${id}`,
    method: 'DELETE',
  });
};

// Partner Bookings endpoints
export const getPartnerBookings = async (params?: BookingQuery): Promise<PaginatedResponse<Booking>> => {
  return apiRequest<PaginatedResponse<Booking>>({
    url: '/api/v1/partner/bookings',
    method: 'GET',
    params,
  });
};

export const getPartnerBookingById = async (id: string): Promise<Booking> => {
  return apiRequest<Booking>({
    url: `/api/v1/partner/bookings/${id}`,
    method: 'GET',
  });
};

export const updatePartnerBooking = async (id: string, data: Record<string, unknown>): Promise<Booking> => {
  return apiRequest<Booking>({
    url: `/api/v1/partner/bookings/${id}`,
    method: 'PUT',
    data,
  });
};

export const confirmPartnerBooking = async (id: string, data: Record<string, unknown>): Promise<Booking> => {
  return apiRequest<Booking>({
    url: `/api/v1/partner/bookings/${id}/confirm`,
    method: 'POST',
    data,
  });
};

export const cancelPartnerBooking = async (id: string, data: Record<string, unknown>): Promise<Booking> => {
  return apiRequest<Booking>({
    url: `/api/v1/partner/bookings/${id}/cancel`,
    method: 'POST',
    data,
  });
};

// Partner Dashboard endpoints
export const getPartnerDashboardStats = async () => {
  return apiRequest({
    url: '/api/v1/partner/dashboard/stats',
    method: 'GET',
  });
};

export const getPartnerNotifications = async () => {
  return apiRequest({
    url: '/api/v1/partner/dashboard/notifications',
    method: 'GET',
  });
};

// Partner Analytics endpoints
export const getPartnerPlatformStats = async (): Promise<PlatformStats> => {
  return apiRequest<PlatformStats>({
    url: '/api/v1/partner/analytics/platform-stats',
    method: 'GET',
  });
};

export const getPartnerBookingAnalytics = async (params?: Record<string, unknown>): Promise<BookingAnalytics> => {
  return apiRequest<BookingAnalytics>({
    url: '/api/v1/partner/analytics/bookings',
    method: 'GET',
    params,
  });
};

export const getPartnerUserAnalytics = async (params?: Record<string, unknown>): Promise<UserAnalytics> => {
  return apiRequest<UserAnalytics>({
    url: '/api/v1/partner/analytics/users',
    method: 'GET',
    params,
  });
};

export const getPartnerRevenueAnalytics = async (params?: Record<string, unknown>): Promise<RevenueAnalytics> => {
  return apiRequest<RevenueAnalytics>({
    url: '/api/v1/partner/analytics/revenue',
    method: 'GET',
    params,
  });
};

// Partner Activity endpoints
export const getPartnerActivityFeed = async (params?: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/partner/activity/feed',
    method: 'GET',
    params,
  });
};

// Partner Wallet endpoints
export const getPartnerWallet = async () => {
  return apiRequest({
    url: '/api/v1/partner/wallet',
    method: 'GET',
  });
};

export const getPartnerTransactions = async (params?: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/partner/wallet/transactions',
    method: 'GET',
    params,
  });
};

export const requestPayout = async (data: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/partner/wallet/payout',
    method: 'POST',
    data,
  });
};

// Partner Settings endpoints
export const getPartnerSettings = async () => {
  return apiRequest({
    url: '/api/v1/partner/settings',
    method: 'GET',
  });
};

export const updatePartnerSettings = async (data: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/partner/settings',
    method: 'PUT',
    data,
  });
};

export const updatePartnerPassword = async (data: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/partner/settings/password',
    method: 'PUT',
    data,
  });
};