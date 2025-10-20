import { AdminAPI } from '@/lib/api/services/admin';
import * as adminApi from '@/lib/api/adminApi';

// Dashboard service
export const getAdminDashboard = async () => {
  try {
    const kpis = await AdminAPI.dashboard.getDashboardKPIs();
    const notifications = await adminApi.getDashboardNotifications();
    const stats = await adminApi.getDashboardStats();
    
    return {
      kpis,
      notifications,
      stats,
    };
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    throw error;
  }
};

// User management service
export const getUserList = async (query?: any) => {
  try {
    return await AdminAPI.users.getAllUsers(query);
  } catch (error) {
    console.error('Error fetching user list:', error);
    throw error;
  }
};

export const getUserDetails = async (id: string) => {
  try {
    const user = await adminApi.getUserById(id);
    return user;
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    throw error;
  }
};

export const updateUserDetails = async (id: string, data: Record<string, unknown>) => {
  try {
    const user = await adminApi.updateUser(id, data);
    return user;
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
};

export const banUserAccount = async (id: string, data: Record<string, unknown>) => {
  try {
    const result = await adminApi.banUser(id, data);
    return result;
  } catch (error) {
    console.error(`Error banning user ${id}:`, error);
    throw error;
  }
};

export const suspendUserAccount = async (id: string, data: Record<string, unknown>) => {
  try {
    const result = await adminApi.suspendUser(id, data);
    return result;
  } catch (error) {
    console.error(`Error suspending user ${id}:`, error);
    throw error;
  }
};

export const reactivateUserAccount = async (id: string) => {
  try {
    const result = await adminApi.reactivateUser(id);
    return result;
  } catch (error) {
    console.error(`Error reactivating user ${id}:`, error);
    throw error;
  }
};

// Partner Wallet Management service
export const getAllPartnerWallets = async (query?: any) => {
  try {
    return await adminApi.getAllPartnerWallets(query);
  } catch (error) {
    console.error('Error fetching partner wallets:', error);
    throw error;
  }
};

// Analytics service
export const getPlatformAnalytics = async () => {
  try {
    return await AdminAPI.dashboard.getPlatformStats();
  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    throw error;
  }
};