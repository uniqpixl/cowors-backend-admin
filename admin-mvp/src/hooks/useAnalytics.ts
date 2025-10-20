import { useQuery } from "@tanstack/react-query";
import { AdminAPI, CategoryUsageAnalytics, CategoryPerformanceMetrics } from "@/lib/api/services/admin";
import { useAuth } from '@/contexts/AuthContext';
import { 
  PlatformStats,
  BookingAnalytics,
  UserAnalytics,
  RevenueAnalytics
} from "@/lib/api/types";
import { getRevenueTrends, getRevenueMetrics, getRevenueBreakdown } from "@/lib/api/adminApi";

// Get platform statistics
export const usePlatformStats = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery<PlatformStats, Error>({
    queryKey: ['platformStats'],
    queryFn: () => AdminAPI.dashboard.getPlatformStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !isLoading,
  });
};

// Get booking analytics
export const useBookingAnalytics = (timeRange?: string) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery<BookingAnalytics, Error>({
    queryKey: ['bookingAnalytics', timeRange],
    queryFn: () => AdminAPI.dashboard.getBookingAnalytics(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !isLoading,
  });
};

// Get user analytics
export const useUserAnalytics = (timeRange?: string) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery<UserAnalytics, Error>({
    queryKey: ['userAnalytics', timeRange],
    queryFn: () => AdminAPI.dashboard.getUserAnalytics(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !isLoading,
  });
};

// Get revenue analytics
export const useRevenueAnalytics = (timeRange?: string) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery<RevenueAnalytics, Error>({
    queryKey: ['revenueAnalytics', timeRange],
    queryFn: () => AdminAPI.dashboard.getRevenueAnalytics(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !isLoading,
  });
};

// Get revenue trends
export const useRevenueTrends = (params?: Record<string, unknown>) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery({
    queryKey: ['revenueTrends', params],
    queryFn: () => getRevenueTrends(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !isLoading,
  });
};

// Get revenue metrics
export const useRevenueMetrics = (params?: Record<string, unknown>) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery({
    queryKey: ['revenueMetrics', params],
    queryFn: () => getRevenueMetrics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !isLoading,
  });
};

// Get revenue breakdown
export const useRevenueBreakdown = (params?: Record<string, unknown>) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery({
    queryKey: ['revenueBreakdown', params],
    queryFn: () => getRevenueBreakdown(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !isLoading,
  });
};

// Category Analytics Hooks with Enhanced Caching
export const useCategoryUsageAnalytics = (options?: {
  refetchInterval?: number;
  backgroundRefetch?: boolean;
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery<CategoryUsageAnalytics[], Error>({
    queryKey: ['categoryUsageAnalytics'],
    queryFn: () => AdminAPI.analytics.getCategoryUsageAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: options?.refetchInterval || 5 * 60 * 1000, // 5 minutes default
    refetchIntervalInBackground: options?.backgroundRefetch ?? false,
    enabled: isAuthenticated && !isLoading,
  });
};

export const useCategoryPerformanceMetrics = (options?: {
  refetchInterval?: number;
  backgroundRefetch?: boolean;
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery<CategoryPerformanceMetrics[], Error>({
    queryKey: ['categoryPerformanceMetrics'],
    queryFn: () => AdminAPI.analytics.getCategoryPerformanceMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: options?.refetchInterval || 5 * 60 * 1000, // 5 minutes default
    refetchIntervalInBackground: options?.backgroundRefetch ?? false,
    enabled: isAuthenticated && !isLoading,
  });
};

export const useCategoryAnalyticsById = (categoryId: string, options?: {
  refetchInterval?: number;
  backgroundRefetch?: boolean;
}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['category-analytics', categoryId],
    queryFn: async () => {
      try {
        return await AdminAPI.categories.getCategoryAnalyticsById(categoryId);
      } catch (error) {
        console.error(`Failed to fetch analytics for category ${categoryId}:`, error);
        throw error;
      }
    },
    enabled: !!user && !!categoryId,
    staleTime: 8 * 60 * 1000, // 8 minutes - slightly less for individual category data
    gcTime: 20 * 60 * 1000, // 20 minutes cache retention
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: options?.backgroundRefetch ? (12 * 60 * 1000) : false, // Background refresh every 12 minutes if enabled
    retry: (failureCount, error) => {
      if (failureCount < 2) { // Fewer retries for individual category
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 20000),
  });
};

// Combined hook for all analytics
export const useAllAnalytics = () => {
  const platformStats = usePlatformStats();
  const bookingAnalytics = useBookingAnalytics();
  const userAnalytics = useUserAnalytics();
  const revenueAnalytics = useRevenueAnalytics();
  const categoryUsage = useCategoryUsageAnalytics();
  const categoryPerformance = useCategoryPerformanceMetrics();

  return {
    platformStats,
    bookingAnalytics,
    userAnalytics,
    revenueAnalytics,
    categoryUsage,
    categoryPerformance,
    isLoading: platformStats.isLoading || bookingAnalytics.isLoading || userAnalytics.isLoading || revenueAnalytics.isLoading || categoryUsage.isLoading || categoryPerformance.isLoading,
    error: platformStats.error || bookingAnalytics.error || userAnalytics.error || revenueAnalytics.error || categoryUsage.error || categoryPerformance.error,
  };
};