import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../client';
import { 
  PartnerType, 
  PartnerTypeFormData, 
  PartnerTypeQueryParams,
  PartnerTypeListResponse,
  PartnerTypeAnalytics,
  BulkPartnerTypeAction,
  ReorderPartnerTypes
} from '@/types/partner-types';

// API functions for partner types
const partnerTypesApi = {
  // Get all partner types with filters
  getAll: async (params?: PartnerTypeQueryParams): Promise<PartnerTypeListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    const url = `/api/v1/admin/partner-types${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<PartnerTypeListResponse>({
      url,
      method: 'GET',
    });
  },

  // Get partner type by ID
  getById: async (id: string): Promise<PartnerType> => {
    return apiRequest<PartnerType>({
      url: `/api/v1/admin/partner-types/${id}`,
      method: 'GET',
    });
  },

  // Get partner type analytics
  getAnalytics: async (): Promise<PartnerTypeAnalytics> => {
    return apiRequest<PartnerTypeAnalytics>({
      url: '/api/v1/admin/partner-types/analytics',
      method: 'GET',
    });
  },

  // Create new partner type
  create: async (data: PartnerTypeFormData): Promise<PartnerType> => {
    return apiRequest<PartnerType>({
      url: '/api/v1/admin/partner-types',
      method: 'POST',
      data,
    });
  },

  // Update partner type
  update: async (id: string, data: Partial<PartnerTypeFormData>): Promise<PartnerType> => {
    return apiRequest<PartnerType>({
      url: `/api/v1/admin/partner-types/${id}`,
      method: 'PUT',
      data,
    });
  },

  // Delete partner type
  delete: async (id: string): Promise<void> => {
    return apiRequest<void>({
      url: `/api/v1/admin/partner-types/${id}`,
      method: 'DELETE',
    });
  },

  // Toggle partner type status
  toggleStatus: async (id: string): Promise<PartnerType> => {
    return apiRequest<PartnerType>({
      url: `/api/v1/admin/partner-types/${id}/toggle-status`,
      method: 'PUT',
    });
  },

  // Bulk actions
  bulkAction: async (data: BulkPartnerTypeAction): Promise<{ affected: number }> => {
    return apiRequest<{ affected: number }>({
      url: '/api/v1/admin/partner-types/bulk-action',
      method: 'POST',
      data,
    });
  },

  // Reorder partner types
  reorder: async (data: ReorderPartnerTypes): Promise<void> => {
    return apiRequest<void>({
      url: '/api/v1/admin/partner-types/reorder',
      method: 'POST',
      data,
    });
  },
};

// React Query hooks
export const usePartnerTypes = (params?: PartnerTypeQueryParams) => {
  return useQuery({
    queryKey: ['partner-types', params],
    queryFn: () => partnerTypesApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePartnerType = (id: string) => {
  return useQuery({
    queryKey: ['partner-types', id],
    queryFn: () => partnerTypesApi.getById(id),
    enabled: !!id,
  });
};

export const usePartnerTypeAnalytics = () => {
  return useQuery({
    queryKey: ['partner-types', 'analytics'],
    queryFn: partnerTypesApi.getAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreatePartnerType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: partnerTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-types'] });
    },
  });
};

export const useUpdatePartnerType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PartnerTypeFormData> }) =>
      partnerTypesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['partner-types'] });
      queryClient.invalidateQueries({ queryKey: ['partner-types', id] });
    },
  });
};

export const useDeletePartnerType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: partnerTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-types'] });
    },
  });
};

export const useTogglePartnerTypeStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: partnerTypesApi.toggleStatus,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['partner-types'] });
      queryClient.invalidateQueries({ queryKey: ['partner-types', id] });
    },
  });
};

export const useBulkPartnerTypeAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: partnerTypesApi.bulkAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-types'] });
    },
  });
};

export const useReorderPartnerTypes = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: partnerTypesApi.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-types'] });
    },
  });
};