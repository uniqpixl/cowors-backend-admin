import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as spaceApi from '@/lib/api/spaceApi';
import { useAuth } from '@/contexts/AuthContext';
import { Space, PaginatedResponse, SpaceQuery } from '@/lib/api/types';

// Hook for space list
export const useSpaces = (params?: SpaceQuery) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Filter out empty string values and undefined values
  const cleanParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => 
      value !== undefined && value !== null && value !== ''
    )
  ) as SpaceQuery : undefined;
  
  // Debug logging
  console.log('🔍 useSpaces Debug:', {
    isAuthenticated,
    isLoading,
    enabled: isAuthenticated && !isLoading,
    originalParams: params,
    cleanParams
  });
  
  return useQuery<PaginatedResponse<Space>, Error>({
    queryKey: ['spaces', cleanParams],
    queryFn: () => {
      console.log('🚀 Making API call to getSpaces with params:', cleanParams);
      return spaceApi.getSpaces(cleanParams);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !isLoading,
  });
};

// Hook for space details
export const useSpace = (id: string) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery<Space, Error>({
    queryKey: ['space', id],
    queryFn: () => spaceApi.getSpaceById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id && isAuthenticated && !isLoading,
  });
};

// Hook to create space
export const useCreateSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Space, Error, Partial<Space>>({
    mutationFn: (data) => spaceApi.createSpace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
};

// Hook to update space
export const useUpdateSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Space, Error, { id: string; data: Partial<Space> }>({
    mutationFn: ({ id, data }) => spaceApi.updateSpace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['space'] });
    },
  });
};

// Hook to delete space
export const useDeleteSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: (id) => spaceApi.deleteSpace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
};

// Hook to activate space
export const useActivateSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Space, Error, string>({
    mutationFn: (id) => spaceApi.activateSpace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['space'] });
    },
  });
};

// Hook to deactivate space
export const useDeactivateSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Space, Error, string>({
    mutationFn: (id) => spaceApi.deactivateSpace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['space'] });
    },
  });
};

// Hook to set space maintenance
export const useSetSpaceMaintenance = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Space, Error, string>({
    mutationFn: (id) => spaceApi.setSpaceMaintenance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['space'] });
    },
  });
};

// Hook for space analytics
export const useSpaceAnalytics = (id: string, params?: Record<string, unknown>) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery({
    queryKey: ['space-analytics', id, params],
    queryFn: () => spaceApi.getSpaceAnalytics(id, params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id && isAuthenticated && !isLoading,
  });
};

// Hook for space bookings
export const useSpaceBookings = (id: string, params?: Record<string, unknown>) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery({
    queryKey: ['space-bookings', id, params],
    queryFn: () => spaceApi.getSpaceBookings(id, params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id && isAuthenticated && !isLoading,
  });
};

// Hook for space reviews
export const useSpaceReviews = (id: string, params?: Record<string, unknown>) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery({
    queryKey: ['space-reviews', id, params],
    queryFn: () => spaceApi.getSpaceReviews(id, params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id && isAuthenticated && !isLoading,
  });
};

// Hook for bulk operations
export const useBulkUpdateSpaces = () => {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, { spaceIds: string[]; data: Partial<Space> }>({
    mutationFn: ({ spaceIds, data }) => spaceApi.bulkUpdateSpaces(spaceIds, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
};

export const useBulkDeleteSpaces = () => {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, string[]>({
    mutationFn: (spaceIds) => spaceApi.bulkDeleteSpaces(spaceIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
};