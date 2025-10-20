import * as spaceApi from "@/lib/api/spaceApi";
import { Space, SpaceQuery, PaginatedResponse } from "@/lib/api/types";

// Space Management services
export const getSpaces = async (params?: SpaceQuery): Promise<PaginatedResponse<Space>> => {
  try {
    return await spaceApi.getSpaces(params);
  } catch (error) {
    console.error('Error fetching spaces:', error);
    throw error;
  }
};

export const getSpaceById = async (id: string): Promise<Space> => {
  try {
    return await spaceApi.getSpaceById(id);
  } catch (error) {
    console.error('Error fetching space:', error);
    throw error;
  }
};

export const createSpace = async (data: Partial<Space>): Promise<Space> => {
  try {
    return await spaceApi.createSpace(data);
  } catch (error) {
    console.error('Error creating space:', error);
    throw error;
  }
};

export const updateSpace = async (id: string, data: Partial<Space>): Promise<Space> => {
  try {
    return await spaceApi.updateSpace(id, data);
  } catch (error) {
    console.error('Error updating space:', error);
    throw error;
  }
};

export const deleteSpace = async (id: string): Promise<void> => {
  try {
    return await spaceApi.deleteSpace(id);
  } catch (error) {
    console.error('Error deleting space:', error);
    throw error;
  }
};

// Space Status Management services
export const activateSpace = async (id: string): Promise<Space> => {
  try {
    return await spaceApi.activateSpace(id);
  } catch (error) {
    console.error('Error activating space:', error);
    throw error;
  }
};

export const deactivateSpace = async (id: string): Promise<Space> => {
  try {
    return await spaceApi.deactivateSpace(id);
  } catch (error) {
    console.error('Error deactivating space:', error);
    throw error;
  }
};

export const setSpaceMaintenance = async (id: string): Promise<Space> => {
  try {
    return await spaceApi.setSpaceMaintenance(id);
  } catch (error) {
    console.error('Error setting space maintenance:', error);
    throw error;
  }
};

// Space Analytics services
export const getSpaceAnalytics = async (id: string, params?: Record<string, unknown>) => {
  try {
    return await spaceApi.getSpaceAnalytics(id, params);
  } catch (error) {
    console.error('Error fetching space analytics:', error);
    throw error;
  }
};

export const getSpaceBookings = async (id: string, params?: Record<string, unknown>) => {
  try {
    return await spaceApi.getSpaceBookings(id, params);
  } catch (error) {
    console.error('Error fetching space bookings:', error);
    throw error;
  }
};

export const getSpaceReviews = async (id: string, params?: Record<string, unknown>) => {
  try {
    return await spaceApi.getSpaceReviews(id, params);
  } catch (error) {
    console.error('Error fetching space reviews:', error);
    throw error;
  }
};

// Space Bulk Operations services
export const bulkUpdateSpaces = async (spaceIds: string[], data: Partial<Space>) => {
  try {
    return await spaceApi.bulkUpdateSpaces(spaceIds, data);
  } catch (error) {
    console.error('Error bulk updating spaces:', error);
    throw error;
  }
};

export const bulkDeleteSpaces = async (spaceIds: string[]) => {
  try {
    return await spaceApi.bulkDeleteSpaces(spaceIds);
  } catch (error) {
    console.error('Error bulk deleting spaces:', error);
    throw error;
  }
};