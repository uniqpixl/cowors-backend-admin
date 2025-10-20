import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminApi from '@/lib/api/adminApi';
import { toast } from 'sonner';

// Commission Settings Hook
export const useCommissionSettings = () => {
  return useQuery({
    queryKey: ['commission-settings'],
    queryFn: () => adminApi.getCommissionSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update Commission Settings Hook
export const useUpdateCommissionSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Record<string, unknown>) => adminApi.updateCommissionSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-settings'] });
      toast.success('Commission settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update commission settings');
    },
  });
};