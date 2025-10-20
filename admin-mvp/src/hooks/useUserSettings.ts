import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as userApi from '@/lib/api/userApi';

// Define types for our settings
interface UserSettings {
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

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

// Hook for user settings
export const useUserSettings = () => {
  return useQuery<UserSettings, Error>({
    queryKey: ['user-settings'],
    queryFn: () => userApi.getUserSettings() as Promise<UserSettings>,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook to update user settings
export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation<UserSettings, Error, Partial<UserSettings>>({
    mutationFn: (data) => userApi.updateUserSettings(data) as Promise<UserSettings>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });
};

// Hook to change user password
export const useChangeUserPassword = () => {
  return useMutation<void, Error, PasswordChangeData>({
    mutationFn: (data) => userApi.changeUserPassword(data) as Promise<void>,
  });
};