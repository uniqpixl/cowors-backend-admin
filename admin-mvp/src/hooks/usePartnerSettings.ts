import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as partnerApi from '@/lib/api/partnerApi';

// Define types for partner settings
interface PartnerSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  preferences: {
    theme: 'light' | 'dark';
    language: string;
  };
}

interface PasswordChangeData extends Record<string, unknown> {
  currentPassword: string;
  newPassword: string;
}

// Hook for partner settings
export const usePartnerSettings = () => {
  return useQuery<PartnerSettings, Error>({
    queryKey: ['partner-settings'],
    queryFn: () => partnerApi.getPartnerSettings() as Promise<PartnerSettings>,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook to update partner settings
export const useUpdatePartnerSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation<PartnerSettings, Error, Partial<PartnerSettings>>({
    mutationFn: (data) => partnerApi.updatePartnerSettings(data) as Promise<PartnerSettings>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-settings'] });
    },
  });
};

// Hook to change partner password
export const useChangePartnerPassword = () => {
  return useMutation<void, Error, PasswordChangeData>({
    mutationFn: (data) => partnerApi.updatePartnerPassword(data) as Promise<void>,
  });
};