import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getPartnerDashboard,
  getPartnerProfile,
  updatePartnerProfile,
  getPartnerSpaces,
  getPartnerSpaceById,
  createPartnerSpace,
  updatePartnerSpace,
  deletePartnerSpace,
  getPartnerBookings,
  getPartnerBookingById,
  updatePartnerBooking,
  confirmPartnerBooking,
  cancelPartnerBooking,
  getPartnerAnalyticsData,
  getPartnerWallet,
  getPartnerTransactions,
  requestPayout,
  getPartnerSettings,
  updatePartnerSettings,
  changePartnerPassword
} from "@/services/partnerService";
import { BookingQuery } from "@/lib/api/types";

// Partner Dashboard hook
export const usePartnerDashboard = () => {
  return useQuery({
    queryKey: ["partner-dashboard"],
    queryFn: getPartnerDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Partner Profile hooks
export const usePartnerProfile = () => {
  return useQuery({
    queryKey: ["partner-profile"],
    queryFn: getPartnerProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdatePartnerProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updatePartnerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-profile"] });
      queryClient.invalidateQueries({ queryKey: ["partner-dashboard"] });
    },
  });
};

// Partner Spaces hooks
export const usePartnerSpaces = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ["partner-spaces", params],
    queryFn: () => getPartnerSpaces(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePartnerSpaceById = (id: string) => {
  return useQuery({
    queryKey: ["partner-space", id],
    queryFn: () => getPartnerSpaceById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreatePartnerSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPartnerSpace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-spaces"] });
    },
  });
};

export const useUpdatePartnerSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updatePartnerSpace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-spaces"] });
      queryClient.invalidateQueries({ queryKey: ["partner-space"] });
    },
  });
};

export const useDeletePartnerSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deletePartnerSpace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-spaces"] });
    },
  });
};

// Partner Bookings hooks
export const usePartnerBookings = (params?: BookingQuery) => {
  return useQuery({
    queryKey: ["partner-bookings", params],
    queryFn: () => getPartnerBookings(params as Record<string, unknown>),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePartnerBookingById = (id: string) => {
  return useQuery({
    queryKey: ["partner-booking", id],
    queryFn: () => getPartnerBookingById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdatePartnerBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updatePartnerBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["partner-booking"] });
    },
  });
};

export const useConfirmPartnerBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => confirmPartnerBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["partner-dashboard"] });
    },
  });
};

export const useCancelPartnerBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => cancelPartnerBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["partner-dashboard"] });
    },
  });
};

// Partner Analytics hook
export const usePartnerAnalytics = (timeRange?: string) => {
  return useQuery({
    queryKey: ["partner-analytics", timeRange],
    queryFn: () => getPartnerAnalyticsData(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Partner Wallet hooks
export const usePartnerWallet = () => {
  return useQuery({
    queryKey: ["partner-wallet"],
    queryFn: getPartnerWallet,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePartnerTransactions = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ["partner-transactions", params],
    queryFn: () => getPartnerTransactions(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRequestPayout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: requestPayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["partner-transactions"] });
    },
  });
};

// Partner Settings hooks
export const usePartnerSettings = () => {
  return useQuery({
    queryKey: ["partner-settings"],
    queryFn: getPartnerSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdatePartnerSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updatePartnerSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-settings"] });
    },
  });
};

export const useChangePartnerPassword = () => {
  return useMutation({
    mutationFn: changePartnerPassword,
  });
};