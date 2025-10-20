import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../client';
import { SpaceCategory, SpaceCategoryFormData } from '@/types/space-categories';
import { PaginatedResponse } from '../types';

// API functions for space categories
const spaceCategoriesApi = {
  // Get all space categories
  getAll: async (): Promise<SpaceCategory[]> => {
    return apiRequest<SpaceCategory[]>({
      url: '/api/v1/admin/partner-categories',
      method: 'GET',
    });
  },

  // Get space category by ID
  getById: async (id: string): Promise<SpaceCategory> => {
    return apiRequest<SpaceCategory>({
      url: `/api/v1/admin/partner-categories/${id}`,
      method: 'GET',
    });
  },

  // Create new space category
  create: async (data: SpaceCategoryFormData): Promise<SpaceCategory> => {
    return apiRequest<SpaceCategory>({
      url: '/api/v1/admin/partner-categories',
      method: 'POST',
      data,
    });
  },

  // Update space category
  update: async (id: string, data: Partial<SpaceCategoryFormData>): Promise<SpaceCategory> => {
    return apiRequest<SpaceCategory>({
      url: `/api/v1/admin/partner-categories/${id}`,
      method: 'PUT',
      data,
    });
  },

  // Delete space category
  delete: async (id: string): Promise<void> => {
    return apiRequest<void>({
      url: `/api/v1/admin/partner-categories/${id}`,
      method: 'DELETE',
    });
  },

  // Toggle space category status
  toggleStatus: async (id: string): Promise<SpaceCategory> => {
    return apiRequest<SpaceCategory>({
      url: `/api/v1/admin/partner-categories/${id}/toggle-status`,
      method: 'PATCH',
    });
  },
};

// React Query hooks
export const useSpaceCategories = () => {
  return useQuery({
    queryKey: ['space-categories'],
    queryFn: spaceCategoriesApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSpaceCategory = (id: string) => {
  return useQuery({
    queryKey: ['space-categories', id],
    queryFn: () => spaceCategoriesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateSpaceCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: spaceCategoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-categories'] });
    },
  });
};

export const useUpdateSpaceCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SpaceCategoryFormData> }) =>
      spaceCategoriesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['space-categories'] });
      queryClient.invalidateQueries({ queryKey: ['space-categories', id] });
    },
  });
};

export const useDeleteSpaceCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: spaceCategoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-categories'] });
    },
  });
};

export const useToggleSpaceCategoryStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: spaceCategoriesApi.toggleStatus,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['space-categories'] });
      queryClient.invalidateQueries({ queryKey: ['space-categories', id] });
    },
  });
};