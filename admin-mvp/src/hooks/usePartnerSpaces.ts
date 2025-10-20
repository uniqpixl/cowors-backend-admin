import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as partnerApi from '@/lib/api/partnerApi';

// Hook for partner spaces list
export const usePartnerSpaces = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['partner-spaces', params],
    queryFn: () => partnerApi.getPartnerSpaces(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook for partner space details
export const usePartnerSpace = (id: string) => {
  return useQuery({
    queryKey: ['partner-space', id],
    queryFn: () => partnerApi.getPartnerSpaceById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
};

// Hook to create partner space
export const useCreatePartnerSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => partnerApi.createPartnerSpace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-spaces'] });
    },
  });
};

// Hook to update partner space
export const useUpdatePartnerSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => partnerApi.updatePartnerSpace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-spaces'] });
      queryClient.invalidateQueries({ queryKey: ['partner-space'] });
    },
  });
};

// Hook to delete partner space
export const useDeletePartnerSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => partnerApi.deletePartnerSpace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-spaces'] });
    },
  });
};