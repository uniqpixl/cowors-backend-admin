import { apiRequest } from './client';
import { 
  PaginatedResponse,
  Space,
  SpaceQuery
} from '@/lib/api/types';

// Space Management endpoints
export const getSpaces = async (params?: SpaceQuery): Promise<PaginatedResponse<Space>> => {
  console.log('📡 spaceApi.getSpaces called with params:', params);
  
  try {
    const result = await apiRequest<PaginatedResponse<Space>>({
      url: '/api/v1/admin/spaces',
      method: 'GET',
      params,
    });
    console.log('✅ spaceApi.getSpaces success:', result);
    return result;
  } catch (error) {
    console.error('❌ spaceApi.getSpaces error:', error);
    throw error;
  }
};

export const getSpaceById = async (id: string): Promise<Space> => {
  return apiRequest<Space>({
    url: `/api/v1/admin/spaces/${id}`,
    method: 'GET',
  });
};

export const createSpace = async (data: Partial<Space>): Promise<Space> => {
  return apiRequest<Space>({
    url: '/api/v1/admin/spaces',
    method: 'POST',
    data,
  });
};

export const updateSpace = async (id: string, data: Partial<Space>): Promise<Space> => {
  return apiRequest<Space>({
    url: `/api/v1/admin/spaces/${id}`,
    method: 'PUT',
    data,
  });
};

export const deleteSpace = async (id: string): Promise<void> => {
  return apiRequest<void>({
    url: `/api/v1/admin/spaces/${id}`,
    method: 'DELETE',
  });
};

// Space Status Management
export const activateSpace = async (id: string): Promise<Space> => {
  return apiRequest<Space>({
    url: `/api/v1/admin/spaces/${id}/activate`,
    method: 'POST',
  });
};

export const deactivateSpace = async (id: string): Promise<Space> => {
  return apiRequest<Space>({
    url: `/api/v1/admin/spaces/${id}/deactivate`,
    method: 'POST',
  });
};

export const setSpaceMaintenance = async (id: string): Promise<Space> => {
  return apiRequest<Space>({
    url: `/api/v1/admin/spaces/${id}/maintenance`,
    method: 'POST',
  });
};

// Space Analytics endpoints
export const getSpaceAnalytics = async (id: string, params?: Record<string, unknown>) => {
  return apiRequest({
    url: `/api/v1/admin/spaces/${id}/analytics`,
    method: 'GET',
    params,
  });
};

export const getSpaceBookings = async (id: string, params?: Record<string, unknown>) => {
  return apiRequest({
    url: `/api/v1/admin/spaces/${id}/bookings`,
    method: 'GET',
    params,
  });
};

export const getSpaceReviews = async (id: string, params?: Record<string, unknown>) => {
  return apiRequest({
    url: `/api/v1/admin/spaces/${id}/reviews`,
    method: 'GET',
    params,
  });
};

// Space Bulk Operations
export const bulkUpdateSpaces = async (spaceIds: string[], data: Partial<Space>) => {
  return apiRequest({
    url: '/api/v1/admin/spaces/bulk-update',
    method: 'POST',
    data: { spaceIds, ...data },
  });
};

export const bulkDeleteSpaces = async (spaceIds: string[]) => {
  return apiRequest({
    url: '/api/v1/admin/spaces/bulk-delete',
    method: 'POST',
    data: { spaceIds },
  });
};