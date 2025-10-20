import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as userApi from '@/lib/api/userApi';
import { AdminUser } from '@/lib/api/types';

// Hook for user profile
export const useUserProfile = () => {
  return useQuery<AdminUser, Error>({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getUserProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook to update user profile
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation<AdminUser, Error, Partial<AdminUser>>({
    mutationFn: (data) => userApi.updateUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};