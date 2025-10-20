import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getUserDashboard, 
  getUserProfile, 
  updateUserProfile,
  getUserBookings,
  getUserBookingById,
  createUserBooking,
  updateUserBooking,
  cancelUserBooking,
  getUserAnalyticsData,
  getUserSettings,
  updateUserSettings,
  changeUserPassword
} from "@/services/userService";
import { Booking, BookingQuery, AdminUser, PaginatedResponse } from "@/lib/api/types";
import { isMockMode, mockUserDashboard } from '@/lib/mockData';

// User Dashboard hook
export const useUserDashboard = () => {
  return useQuery({
    queryKey: ["user-dashboard"],
    queryFn: async () => {
      if (isMockMode()) {
        console.log('🎭 useUserDashboard: Using mock data');
        return mockUserDashboard;
      }
      return getUserDashboard();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: !isMockMode(),
  });
};

// User Profile hooks
export const useUserProfile = () => {
  return useQuery<AdminUser, Error>({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation<AdminUser, Error, Partial<AdminUser>>({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
    },
  });
};

// User Bookings hooks
export const useUserBookings = (params?: BookingQuery) => {
  return useQuery<PaginatedResponse<Booking>, Error>({
    queryKey: ["user-bookings", JSON.stringify(params)],
    queryFn: () => getUserBookings(params as Record<string, unknown> | undefined),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserBookingById = (id: string) => {
  return useQuery<Booking, Error>({
    queryKey: ["user-booking", id],
    queryFn: () => getUserBookingById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateUserBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Booking, Error, Partial<Booking>>({
    mutationFn: createUserBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
    },
  });
};

export const useUpdateUserBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Booking, Error, { id: string; data: Partial<Booking> }>({
    mutationFn: ({ id, data }) => updateUserBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["user-booking"] });
    },
  });
};

export const useCancelUserBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Booking, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => cancelUserBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
    },
  });
};

// User Analytics hook
export const useUserAnalytics = (timeRange?: string) => {
  return useQuery({
    queryKey: ["user-analytics", timeRange],
    queryFn: () => getUserAnalyticsData(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// User Settings hooks
export const useUserSettings = () => {
  return useQuery({
    queryKey: ["user-settings"],
    queryFn: getUserSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateUserSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    },
  });
};

export const useChangeUserPassword = () => {
  return useMutation({
    mutationFn: changeUserPassword,
  });
};