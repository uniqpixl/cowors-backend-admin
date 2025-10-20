import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminAPI } from "@/lib/api/services/admin";
import { useAuth } from '@/contexts/AuthContext';
import { 
  AdminUser, 
  PaginatedResponse, 
  AdminUserQuery,
  AdminUserUpdate,
  AdminUserBan,
  AdminUserSuspend
} from "@/lib/api/types";

// Get all admin users with pagination and filtering
export const useAdminUsers = (params?: AdminUserQuery) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  console.log('useAdminUsers: Auth state:', { isAuthenticated, isLoading, enabled: isAuthenticated && !isLoading });
  console.log('useAdminUsers: Query params:', params);
  
  return useQuery<PaginatedResponse<AdminUser>, Error>({
    queryKey: ['adminUsers', params],
    queryFn: async () => {
      console.log('useAdminUsers: Making API call to getAllUsers');
      return AdminAPI.users.getAllUsers(params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !isLoading,
  });
};

// Get admin user by ID
export const useAdminUser = (id: string) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery<AdminUser, Error>({
    queryKey: ['adminUser', id],
    queryFn: () => AdminAPI.users.getUserById(id),
    enabled: !!id && isAuthenticated && !isLoading,
  });
};

// Update admin user
export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: AdminUserUpdate }) => 
      AdminAPI.users.updateUser(id, updates),
    onSuccess: (_, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUser', variables.id] });
    },
  });
};

// Update user role by email
export const useUpdateUserRoleByEmail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) => 
      AdminAPI.users.updateUserRoleByEmail(email, role),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
};

// Ban user
export const useBanUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUserBan }) => 
      AdminAPI.users.banUser(id, data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUser', variables.id] });
    },
  });
};

// Suspend user
export const useSuspendUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUserSuspend }) => 
      AdminAPI.users.suspendUser(id, data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUser', variables.id] });
    },
  });
};

// Reactivate user
export const useReactivateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => AdminAPI.users.reactivateUser(id),
    onSuccess: (_, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUser', variables] });
    },
  });
};