import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAdminProfile,
  updateAdminProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
  getAppearanceSettings,
  updateAppearanceSettings,
  changePassword,
  uploadAvatar,
  getFinanceSettings,
  updateFinanceSettings,
  getSecuritySettings,
  updateSecuritySettings,
  toggle2FA,
  setup2FA,
  verify2FA
} from '@/lib/api/adminApi';
import type {
  AdminProfile,
  NotificationPreferences,
  AppearanceSettings,
  PasswordChangeRequest,
  PasswordChangeResponse,
  AvatarUploadResponse,
  FinanceSettings,
  SecuritySettings
} from '@/lib/api/types';

// Profile hooks
export const useAdminProfile = () => {
  return useQuery({
    queryKey: ['admin-profile'],
    queryFn: getAdminProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateAdminProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (profileData: Partial<AdminProfile>) => updateAdminProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update profile');
    },
  });
};

// Notification preferences hooks
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getNotificationPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (preferences: NotificationPreferences) => updateNotificationPreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Notification preferences updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update notification preferences');
    },
  });
};

// Appearance settings hooks
export const useAppearanceSettings = () => {
  return useQuery({
    queryKey: ['appearance-settings'],
    queryFn: getAppearanceSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateAppearanceSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: AppearanceSettings) => updateAppearanceSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appearance-settings'] });
      toast.success('Appearance settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update appearance settings');
    },
  });
};

// Password change hook
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (passwordData: PasswordChangeRequest) => changePassword(passwordData),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to change password');
    },
  });
};

// Avatar upload hook
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
      toast.success('Avatar uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to upload avatar');
    },
  });
};

// Finance settings hooks
export const useFinanceSettings = () => {
  return useQuery({
    queryKey: ['finance-settings'],
    queryFn: getFinanceSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateFinanceSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: FinanceSettings) => updateFinanceSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-settings'] });
      toast.success('Finance settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update finance settings');
    },
  });
};

// Security settings hooks
export const useSecuritySettings = () => {
  return useQuery({
    queryKey: ['security-settings'],
    queryFn: getSecuritySettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateSecuritySettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: SecuritySettings) => updateSecuritySettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
      toast.success('Security settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update security settings');
    },
  });
};

// 2FA hooks
export const useToggle2FA = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (enabled: boolean) => toggle2FA(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
      toast.success('2FA settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update 2FA settings');
    },
  });
};

export const useSetup2FA = () => {
  return useMutation({
    mutationFn: () => setup2FA(),
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to setup 2FA');
    },
  });
};

export const useVerify2FA = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (code: string) => verify2FA(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
      toast.success('2FA verified successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to verify 2FA code');
    },
  });
};