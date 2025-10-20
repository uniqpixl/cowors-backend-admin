import * as userApi from "@/lib/api/userApi";

export const getUserDashboard = async () => {
  try {
    const [profile, bookings, stats] = await Promise.all([
      userApi.getUserProfile(),
      userApi.getUserBookings({ limit: 5 }), // Get recent bookings
      userApi.getUserDashboardStats(),
    ]);
    
    return { profile, bookings, stats };
  } catch (error) {
    console.error('Error fetching user dashboard data:', error);
    throw error;
  }
};

// User Profile services
export const getUserProfile = async () => {
  try {
    return await userApi.getUserProfile();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (data: Partial<unknown>) => {
  try {
    return await userApi.updateUserProfile(data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// User Bookings services
export const getUserBookings = async (params?: Record<string, unknown>) => {
  try {
    return await userApi.getUserBookings(params);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

export const getUserBookingById = async (id: string) => {
  try {
    return await userApi.getUserBookingById(id);
  } catch (error) {
    console.error('Error fetching user booking:', error);
    throw error;
  }
};

export const createUserBooking = async (data: Record<string, unknown>) => {
  try {
    return await userApi.createUserBooking(data);
  } catch (error) {
    console.error('Error creating user booking:', error);
    throw error;
  }
};

export const updateUserBooking = async (id: string, data: Record<string, unknown>) => {
  try {
    return await userApi.updateUserBooking(id, data);
  } catch (error) {
    console.error('Error updating user booking:', error);
    throw error;
  }
};

export const cancelUserBooking = async (id: string, data: Record<string, unknown>) => {
  try {
    return await userApi.cancelUserBooking(id, data);
  } catch (error) {
    console.error('Error canceling user booking:', error);
    throw error;
  }
};

// User Analytics services
export const getUserAnalyticsData = async (timeRange?: string) => {
  try {
    const [platformStats, bookingAnalytics, userAnalytics, revenueAnalytics] = await Promise.all([
      userApi.getUserPlatformStats(),
      userApi.getUserBookingAnalytics({ timeRange }),
      userApi.getUserAnalytics({ timeRange }),
      userApi.getUserRevenueAnalytics({ timeRange }),
    ]);
    
    return {
      platformStats,
      bookingAnalytics,
      userAnalytics,
      revenueAnalytics,
    };
  } catch (error) {
    console.error('Error fetching user analytics data:', error);
    throw error;
  }
};

// User Settings services
export const getUserSettings = async () => {
  try {
    return await userApi.getUserSettings();
  } catch (error) {
    console.error('Error fetching user settings:', error);
    throw error;
  }
};

export const updateUserSettings = async (data: Record<string, unknown>) => {
  try {
    return await userApi.updateUserSettings(data);
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

export const changeUserPassword = async (data: { currentPassword: string; newPassword: string }) => {
  try {
    return await userApi.changeUserPassword(data);
  } catch (error) {
    console.error('Error changing user password:', error);
    throw error;
  }
};