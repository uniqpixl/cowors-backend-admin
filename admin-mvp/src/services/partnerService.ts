import * as partnerApi from "@/lib/api/partnerApi";

export const getPartnerDashboard = async () => {
  try {
    const [profile, bookings, stats] = await Promise.all([
      partnerApi.getPartnerProfile(),
      partnerApi.getPartnerBookings({ limit: 5 }), // Get recent bookings
      partnerApi.getPartnerDashboardStats(),
    ]);
    
    return { profile, bookings, stats };
  } catch (error) {
    console.error('Error fetching partner dashboard data:', error);
    throw error;
  }
};

// Partner Profile services
export const getPartnerProfile = async () => {
  try {
    return await partnerApi.getPartnerProfile();
  } catch (error) {
    console.error('Error fetching partner profile:', error);
    throw error;
  }
};

export const updatePartnerProfile = async (data: Partial<unknown>) => {
  try {
    return await partnerApi.updatePartnerProfile(data);
  } catch (error) {
    console.error('Error updating partner profile:', error);
    throw error;
  }
};

// Partner Spaces services
export const getPartnerSpaces = async (params?: Record<string, unknown>) => {
  try {
    return await partnerApi.getPartnerSpaces(params);
  } catch (error) {
    console.error('Error fetching partner spaces:', error);
    throw error;
  }
};

export const getPartnerSpaceById = async (id: string) => {
  try {
    return await partnerApi.getPartnerSpaceById(id);
  } catch (error) {
    console.error('Error fetching partner space:', error);
    throw error;
  }
};

export const createPartnerSpace = async (data: Record<string, unknown>) => {
  try {
    return await partnerApi.createPartnerSpace(data);
  } catch (error) {
    console.error('Error creating partner space:', error);
    throw error;
  }
};

export const updatePartnerSpace = async (id: string, data: Record<string, unknown>) => {
  try {
    return await partnerApi.updatePartnerSpace(id, data);
  } catch (error) {
    console.error('Error updating partner space:', error);
    throw error;
  }
};

export const deletePartnerSpace = async (id: string) => {
  try {
    return await partnerApi.deletePartnerSpace(id);
  } catch (error) {
    console.error('Error deleting partner space:', error);
    throw error;
  }
};

// Partner Bookings services
export const getPartnerBookings = async (params?: Record<string, unknown>) => {
  try {
    return await partnerApi.getPartnerBookings(params);
  } catch (error) {
    console.error('Error fetching partner bookings:', error);
    throw error;
  }
};

export const getPartnerBookingById = async (id: string) => {
  try {
    return await partnerApi.getPartnerBookingById(id);
  } catch (error) {
    console.error('Error fetching partner booking:', error);
    throw error;
  }
};

export const updatePartnerBooking = async (id: string, data: Record<string, unknown>) => {
  try {
    return await partnerApi.updatePartnerBooking(id, data);
  } catch (error) {
    console.error('Error updating partner booking:', error);
    throw error;
  }
};

export const confirmPartnerBooking = async (id: string, data: Record<string, unknown>) => {
  try {
    return await partnerApi.confirmPartnerBooking(id, data);
  } catch (error) {
    console.error('Error confirming partner booking:', error);
    throw error;
  }
};

export const cancelPartnerBooking = async (id: string, data: Record<string, unknown>) => {
  try {
    return await partnerApi.cancelPartnerBooking(id, data);
  } catch (error) {
    console.error('Error canceling partner booking:', error);
    throw error;
  }
};

// Partner Analytics services
export const getPartnerAnalyticsData = async (timeRange?: string) => {
  try {
    const [platformStats, bookingAnalytics, userAnalytics, revenueAnalytics] = await Promise.all([
      partnerApi.getPartnerPlatformStats(),
      partnerApi.getPartnerBookingAnalytics({ timeRange }),
      partnerApi.getPartnerUserAnalytics({ timeRange }),
      partnerApi.getPartnerRevenueAnalytics({ timeRange }),
    ]);
    
    return {
      platformStats,
      bookingAnalytics,
      userAnalytics,
      revenueAnalytics,
    };
  } catch (error) {
    console.error('Error fetching partner analytics data:', error);
    throw error;
  }
};

// Partner Wallet services
export const getPartnerWallet = async () => {
  try {
    return await partnerApi.getPartnerWallet();
  } catch (error) {
    console.error('Error fetching partner wallet:', error);
    throw error;
  }
};

export const getPartnerTransactions = async (params?: Record<string, unknown>) => {
  try {
    return await partnerApi.getPartnerTransactions(params);
  } catch (error) {
    console.error('Error fetching partner transactions:', error);
    throw error;
  }
};

export const requestPayout = async (data: Record<string, unknown>) => {
  try {
    return await partnerApi.requestPayout(data);
  } catch (error) {
    console.error('Error requesting payout:', error);
    throw error;
  }
};

// Partner Settings services
export const getPartnerSettings = async () => {
  try {
    return await partnerApi.getPartnerSettings();
  } catch (error) {
    console.error('Error fetching partner settings:', error);
    throw error;
  }
};

export const updatePartnerSettings = async (data: Record<string, unknown>) => {
  try {
    return await partnerApi.updatePartnerSettings(data);
  } catch (error) {
    console.error('Error updating partner settings:', error);
    throw error;
  }
};

export const changePartnerPassword = async (data: { currentPassword: string; newPassword: string }) => {
  try {
    return await partnerApi.updatePartnerPassword(data);
  } catch (error) {
    console.error('Error changing partner password:', error);
    throw error;
  }
};