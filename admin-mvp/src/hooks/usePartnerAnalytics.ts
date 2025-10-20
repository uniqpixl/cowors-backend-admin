import { useQuery } from '@tanstack/react-query';
import * as partnerApi from '@/lib/api/partnerApi';

// Hook for partner platform stats
export const usePartnerPlatformStats = () => {
  return useQuery({
    queryKey: ['partner-platform-stats'],
    queryFn: () => partnerApi.getPartnerPlatformStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook for partner booking analytics
export const usePartnerBookingAnalytics = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['partner-booking-analytics', params],
    queryFn: () => partnerApi.getPartnerBookingAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook for partner user analytics
export const usePartnerUserAnalytics = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['partner-user-analytics', params],
    queryFn: () => partnerApi.getPartnerUserAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook for partner revenue analytics
export const usePartnerRevenueAnalytics = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['partner-revenue-analytics', params],
    queryFn: () => partnerApi.getPartnerRevenueAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};