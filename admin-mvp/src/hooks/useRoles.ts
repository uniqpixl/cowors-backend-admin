import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import {
  Role,
  Permission,
  CreateRoleData,
  UpdateRoleData,
  PermissionAssignmentData,
} from '@/types/roles';

// API functions
const rolesApi = {
  // Role operations
  getRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get('/admin/roles');
    return response.data;
  },

  getRoleById: async (id: string): Promise<Role> => {
    const response = await apiClient.get(`/admin/roles/${id}`);
    return response.data;
  },

  createRole: async (data: CreateRoleData): Promise<Role> => {
    const response = await apiClient.post('/admin/roles', data);
    return response.data;
  },

  updateRole: async (id: string, data: UpdateRoleData): Promise<Role> => {
    const response = await apiClient.put(`/admin/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/roles/${id}`);
  },

  // Permission operations
  assignPermissions: async (
    roleId: string,
    data: PermissionAssignmentData
  ): Promise<Role> => {
    const response = await apiClient.post(`/admin/roles/${roleId}/permissions`, data);
    return response.data;
  },

  removePermissions: async (
    roleId: string,
    data: PermissionAssignmentData
  ): Promise<Role> => {
    const response = await apiClient.delete(`/admin/roles/${roleId}/permissions`, {
      data,
    });
    return response.data;
  },
};

// Query keys
export const roleQueryKeys = {
  all: ['roles'] as const,
  lists: () => [...roleQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...roleQueryKeys.lists(), { filters }] as const,
  details: () => [...roleQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleQueryKeys.details(), id] as const,
};

// Hooks
export const useRoles = () => {
  return useQuery({
    queryKey: roleQueryKeys.lists(),
    queryFn: rolesApi.getRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRole = (id: string) => {
  return useQuery({
    queryKey: roleQueryKeys.detail(id),
    queryFn: () => rolesApi.getRoleById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rolesApi.createRole,
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
      toast.success('Role created successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create role';
      toast.error(message);
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleData }) =>
      rolesApi.updateRole(id, data),
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.detail(updatedRole.id) });
      toast.success('Role updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update role';
      toast.error(message);
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rolesApi.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
      toast.success('Role deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete role';
      toast.error(message);
    },
  });
};

export const useAssignPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: PermissionAssignmentData }) =>
      rolesApi.assignPermissions(roleId, data),
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.detail(updatedRole.id) });
      toast.success('Permissions assigned successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to assign permissions';
      toast.error(message);
    },
  });
};

export const useRemovePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: PermissionAssignmentData }) =>
      rolesApi.removePermissions(roleId, data),
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.detail(updatedRole.id) });
      toast.success('Permissions removed successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to remove permissions';
      toast.error(message);
    },
  });
};