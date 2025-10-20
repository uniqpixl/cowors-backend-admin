import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as partnerApi from '@/lib/api/partnerApi';
import { Partner } from '@/lib/api/types';

// Hook for partner profile
export const usePartnerProfile = () => {
  return useQuery<Partner, Error>({
    queryKey: ['partner-profile'],
    queryFn: () => partnerApi.getPartnerProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook to update partner profile
export const useUpdatePartnerProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Partner, Error, Partial<Partner>>({
    mutationFn: (data) => partnerApi.updatePartnerProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-profile'] });
    },
  });
};