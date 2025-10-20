import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as adminApi from '@/lib/api/adminApi';
import { useAuth } from '@/contexts/AuthContext';
import { Partner, PaginatedResponse, PartnerQuery } from '@/lib/api/types';

// Hook for partner list
export const usePartners = (params?: PartnerQuery) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery<PaginatedResponse<Partner>, Error>({
    queryKey: ['partners', params],
    queryFn: () => adminApi.getAllPartners(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !isLoading,
  });
};

// Hook for partner details
export const usePartner = (id: string) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery<Partner, Error>({
    queryKey: ['partner', id],
    queryFn: () => adminApi.getPartnerById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id && isAuthenticated && !isLoading,
  });
};

// Hook to update partner
export const useUpdatePartner = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Partner, Error, { id: string; data: Partial<Partner> }>({
    mutationFn: ({ id, data }) => adminApi.updatePartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partner'] });
    },
  });
};

// Hook to approve partner
export const useApprovePartner = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Partner, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => adminApi.approvePartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partner'] });
    },
  });
};

// Hook to reject partner
export const useRejectPartner = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Partner, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => adminApi.rejectPartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partner'] });
    },
  });
};

// Hook to suspend partner
export const useSuspendPartner = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Partner, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => adminApi.suspendPartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partner'] });
    },
  });
};

// Hook to reactivate partner
export const useReactivatePartner = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Partner, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => adminApi.reactivatePartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partner'] });
    },
  });
};