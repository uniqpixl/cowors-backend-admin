import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminDashboard } from '@/services/adminService';
import { useAuth } from '@/contexts/AuthContext';

// Hook for admin dashboard data
export const useAdminDashboard = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => getAdminDashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    // Only run the query when user is authenticated and not loading
    enabled: isAuthenticated && !isLoading,
  });
};

// Hook to invalidate dashboard data
export const useInvalidateAdminDashboard = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };
};