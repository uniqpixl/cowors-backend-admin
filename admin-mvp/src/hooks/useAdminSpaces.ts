import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  AdminSpace, 
  AdminSpaceQuery, 
  AdminSpaceUpdate, 
  SpaceApprovalData, 
  SpaceBulkAction, 
  AdminSpaceStats,
  SpaceAnalytics
} from '@/types/admin-spaces';
import { PaginatedResponse } from '@/lib/api/types';
import { toast } from 'sonner';
import { isMockMode, mockAdminSpaces, mockAdminSpaceStats, mockPendingSpaces } from '@/lib/mockData';

// API functions
const adminSpaceApi = {
  // Get all spaces with admin filters
  getSpaces: async (params?: AdminSpaceQuery): Promise<PaginatedResponse<AdminSpace>> => {
    return apiRequest<PaginatedResponse<AdminSpace>>({
      url: '/api/v1/admin/spaces',
      method: 'GET',
      params,
    });
  },

  // Get pending spaces
  getPendingSpaces: async (): Promise<AdminSpace[]> => {
    return apiRequest<AdminSpace[]>({
      url: '/api/v1/admin/spaces/pending',
      method: 'GET',
    });
  },

  // Get space statistics
  getSpaceStats: async (): Promise<AdminSpaceStats> => {
    return apiRequest<AdminSpaceStats>({
      url: '/api/v1/admin/spaces/stats',
      method: 'GET',
    });
  },

  // Get space by ID
  getSpaceById: async (id: string): Promise<AdminSpace> => {
    return apiRequest<AdminSpace>({
      url: `/api/v1/admin/spaces/${id}`,
      method: 'GET',
    });
  },

  // Get space analytics
  getSpaceAnalytics: async (id: string, startDate?: string, endDate?: string): Promise<SpaceAnalytics> => {
    return apiRequest<SpaceAnalytics>({
      url: `/api/v1/admin/spaces/${id}/analytics`,
      method: 'GET',
      params: { startDate, endDate },
    });
  },

  // Update space
  updateSpace: async (id: string, data: AdminSpaceUpdate): Promise<AdminSpace> => {
    return apiRequest<AdminSpace>({
      url: `/api/v1/admin/spaces/${id}`,
      method: 'PUT',
      data,
    });
  },

  // Approve space
  approveSpace: async (id: string, data: SpaceApprovalData): Promise<AdminSpace> => {
    return apiRequest<AdminSpace>({
      url: `/api/v1/admin/spaces/${id}/approve`,
      method: 'PUT',
      data,
    });
  },

  // Reject space
  rejectSpace: async (id: string, data: SpaceApprovalData): Promise<AdminSpace> => {
    return apiRequest<AdminSpace>({
      url: `/api/v1/admin/spaces/${id}/reject`,
      method: 'PUT',
      data,
    });
  },

  // Update space status
  updateSpaceStatus: async (id: string, status: 'Active' | 'Inactive' | 'Maintenance'): Promise<AdminSpace> => {
    return apiRequest<AdminSpace>({
      url: `/api/v1/admin/spaces/${id}/status`,
      method: 'PUT',
      data: { status },
    });
  },

  // Delete space
  deleteSpace: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>({
      url: `/api/v1/admin/spaces/${id}`,
      method: 'DELETE',
    });
  },

  // Bulk operations
  bulkAction: async (action: SpaceBulkAction): Promise<{ message: string; affected: number }> => {
    return apiRequest<{ message: string; affected: number }>({
      url: '/api/v1/admin/spaces/bulk',
      method: 'POST',
      data: action,
    });
  },
};

// Query keys
const adminSpaceKeys = {
  all: ['admin-spaces'] as const,
  lists: () => [...adminSpaceKeys.all, 'list'] as const,
  list: (params?: AdminSpaceQuery) => [...adminSpaceKeys.lists(), params] as const,
  details: () => [...adminSpaceKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminSpaceKeys.details(), id] as const,
  stats: () => [...adminSpaceKeys.all, 'stats'] as const,
  pending: () => [...adminSpaceKeys.all, 'pending'] as const,
  analytics: (id: string) => [...adminSpaceKeys.all, 'analytics', id] as const,
};

// Hooks
export const useAdminSpaces = (params?: AdminSpaceQuery) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: adminSpaceKeys.list(params),
    queryFn: () => adminSpaceApi.getSpaces(params),
    enabled: !!user && (user.role === 'Admin' || user.role === 'SuperAdmin'),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
};

export const usePendingSpaces = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: adminSpaceKeys.pending(),
    queryFn: () => adminSpaceApi.getPendingSpaces(),
    enabled: !!user && (user.role === 'Admin' || user.role === 'SuperAdmin'),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
};

export const useAdminSpaceStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: adminSpaceKeys.stats(),
    queryFn: () => adminSpaceApi.getSpaceStats(),
    enabled: !!user && (user.role === 'Admin' || user.role === 'SuperAdmin'),
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });
};

export const useAdminSpace = (id: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: adminSpaceKeys.detail(id),
    queryFn: () => adminSpaceApi.getSpaceById(id),
    enabled: !!user && !!id && (user.role === 'Admin' || user.role === 'SuperAdmin'),
  });
};

export const useAdminSpaceAnalytics = (id: string, startDate?: string, endDate?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: adminSpaceKeys.analytics(id),
    queryFn: () => adminSpaceApi.getSpaceAnalytics(id, startDate, endDate),
    enabled: !!user && !!id && (user.role === 'Admin' || user.role === 'SuperAdmin'),
    staleTime: 300000, // 5 minutes
  });
};

// Mutations
export const useUpdateAdminSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminSpaceUpdate }) =>
      adminSpaceApi.updateSpace(id, data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.stats() });
      
      toast.success('Space updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update space');
    },
  });
};

export const useApproveSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SpaceApprovalData }) =>
      adminSpaceApi.approveSpace(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.pending() });
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.stats() });
      
      toast.success('Space approved successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to approve space');
    },
  });
};

export const useRejectSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SpaceApprovalData }) =>
      adminSpaceApi.rejectSpace(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.pending() });
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.stats() });
      
      toast.success('Space rejected successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to reject space');
    },
  });
};

export const useUpdateAdminSpaceStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Active' | 'Inactive' | 'Maintenance' }) =>
      adminSpaceApi.updateSpaceStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.stats() });
      
      toast.success(`Space status updated to ${variables.status}`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update space status');
    },
  });
};

export const useDeleteAdminSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => adminSpaceApi.deleteSpace(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.lists() });
      queryClient.removeQueries({ queryKey: adminSpaceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.stats() });
      
      toast.success('Space deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete space');
    },
  });
};

export const useAdminSpaceBulkAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (action: SpaceBulkAction) => adminSpaceApi.bulkAction(action),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.pending() });
      queryClient.invalidateQueries({ queryKey: adminSpaceKeys.stats() });
      
      toast.success(`Bulk ${variables.action} completed. ${data.affected} spaces affected.`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Bulk operation failed');
    },
  });
};