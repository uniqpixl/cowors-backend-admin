import { useQuery } from '@tanstack/react-query';
import * as userApi from '@/lib/api/userApi';
import { PlatformStats, BookingAnalytics, UserAnalytics, RevenueAnalytics } from '@/lib/api/types';

// Hook for user platform stats
export const useUserPlatformStats = () => {
  return useQuery<PlatformStats, Error>({
    queryKey: ['user-platform-stats'],
    queryFn: () => userApi.getUserPlatformStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook for user booking analytics
export const useUserBookingAnalytics = (params?: Record<string, unknown>) => {
  return useQuery<BookingAnalytics, Error>({
    queryKey: ['user-booking-analytics', params],
    queryFn: () => userApi.getUserBookingAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook for user analytics
export const useUserAnalytics = (params?: Record<string, unknown>) => {
  return useQuery<UserAnalytics, Error>({
    queryKey: ['user-analytics', params],
    queryFn: () => userApi.getUserAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook for user revenue analytics
export const useUserRevenueAnalytics = (params?: Record<string, unknown>) => {
  return useQuery<RevenueAnalytics, Error>({
    queryKey: ['user-revenue-analytics', params],
    queryFn: () => userApi.getUserRevenueAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};