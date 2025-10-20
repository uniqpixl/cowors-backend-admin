import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/generated-admin-api';
import { Activity } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';

// Hook for activity feed
export const useActivityFeed = (params?: Record<string, unknown>) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery<Activity[], Error>({
    queryKey: ['activity-feed', params],
    queryFn: async () => {
      const response = await adminAPI.getActivityFeed();
      return Array.isArray(response) ? response : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    // Only run the query when user is authenticated and not loading
    enabled: isAuthenticated && !isLoading,
  });
};