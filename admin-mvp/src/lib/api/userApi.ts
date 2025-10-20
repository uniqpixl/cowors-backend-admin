import { apiRequest } from './client';
import { 
  AdminUser, 
  Booking, 
  PaginatedResponse, 
  BookingQuery,
  PlatformStats,
  BookingAnalytics,
  UserAnalytics,
  RevenueAnalytics,
  Transaction,
  Wallet,
  PaginatedTransactions
} from '@/lib/api/types';

// User Profile endpoints
export const getUserProfile = async (): Promise<AdminUser> => {
  return apiRequest<AdminUser>({
    url: '/api/v1/user/profile',
    method: 'GET',
  });
};

export const updateUserProfile = async (data: Partial<AdminUser>): Promise<AdminUser> => {
  return apiRequest<AdminUser>({
    url: '/api/v1/user/profile',
    method: 'PUT',
    data,
  });
};

// User Bookings endpoints
export const getUserBookings = async (params?: BookingQuery): Promise<PaginatedResponse<Booking>> => {
  return apiRequest<PaginatedResponse<Booking>>({
    url: '/api/v1/user/bookings',
    method: 'GET',
    params,
  });
};

export const getUserBookingById = async (id: string): Promise<Booking> => {
  return apiRequest<Booking>({
    url: `/api/v1/user/bookings/${id}`,
    method: 'GET',
  });
};

export const createUserBooking = async (data: Record<string, unknown>): Promise<Booking> => {
  return apiRequest<Booking>({
    url: '/api/v1/user/bookings',
    method: 'POST',
    data,
  });
};

export const updateUserBooking = async (id: string, data: Record<string, unknown>): Promise<Booking> => {
  return apiRequest<Booking>({
    url: `/api/v1/user/bookings/${id}`,
    method: 'PUT',
    data,
  });
};

export const cancelUserBooking = async (id: string, data: Record<string, unknown>): Promise<Booking> => {
  return apiRequest<Booking>({
    url: `/api/v1/user/bookings/${id}/cancel`,
    method: 'POST',
    data,
  });
};

// User Dashboard endpoints
export const getUserDashboardStats = async () => {
  return apiRequest({
    url: '/api/v1/user/dashboard/stats',
    method: 'GET',
  });
};

export const getUserNotifications = async () => {
  return apiRequest({
    url: '/api/v1/user/dashboard/notifications',
    method: 'GET',
  });
};

// User Analytics endpoints
export const getUserPlatformStats = async (): Promise<PlatformStats> => {
  return apiRequest<PlatformStats>({
    url: '/api/v1/user/analytics/platform-stats',
    method: 'GET',
  });
};

export const getUserBookingAnalytics = async (params?: Record<string, unknown>): Promise<BookingAnalytics> => {
  return apiRequest<BookingAnalytics>({
    url: '/api/v1/user/analytics/bookings',
    method: 'GET',
    params,
  });
};

export const getUserAnalytics = async (params?: Record<string, unknown>): Promise<UserAnalytics> => {
  return apiRequest<UserAnalytics>({
    url: '/api/v1/user/analytics/users',
    method: 'GET',
    params,
  });
};

export const getUserRevenueAnalytics = async (params?: Record<string, unknown>): Promise<RevenueAnalytics> => {
  return apiRequest<RevenueAnalytics>({
    url: '/api/v1/user/analytics/revenue',
    method: 'GET',
    params,
  });
};

// User Activity endpoints
export const getUserActivityFeed = async (params?: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/user/activity/feed',
    method: 'GET',
    params,
  });
};

// User Settings endpoints
export const getUserSettings = async () => {
  return apiRequest({
    url: '/api/v1/user/settings',
    method: 'GET',
  });
};

export const updateUserSettings = async (data: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/user/settings',
    method: 'PUT',
    data,
  });
};

export const changeUserPassword = async (data: { currentPassword: string; newPassword: string }) => {
  return apiRequest({
    url: '/api/v1/user/settings/password',
    method: 'POST',
    data,
  });
};

export const deleteUserAccount = async () => {
  return apiRequest({
    url: '/api/v1/user/account',
    method: 'DELETE',
  });
};

// User Wallet endpoints
export const getUserWallet = async (userId: string): Promise<Wallet> => {
  return apiRequest<Wallet>({
    url: `/api/v1/admin/users/${userId}/wallet`,
    method: 'GET',
  });
};

export const getUserTransactions = async (userId: string, params?: Record<string, unknown>): Promise<PaginatedTransactions> => {
  return apiRequest<PaginatedTransactions>({
    url: `/api/v1/admin/users/${userId}/transactions`,
    method: 'GET',
    params,
  });
};

// Admin Finance endpoints
export const getAllUserWallets = async (params?: Record<string, unknown>): Promise<PaginatedResponse<Wallet & { userName: string; userEmail: string; totalSpent: number; totalTopups: number; lastActivity: string; }>> => {
  return apiRequest<PaginatedResponse<Wallet & { userName: string; userEmail: string; totalSpent: number; totalTopups: number; lastActivity: string; }>>({
    url: '/api/v1/admin/finance/user-wallets',
    method: 'GET',
    params,
  });
};