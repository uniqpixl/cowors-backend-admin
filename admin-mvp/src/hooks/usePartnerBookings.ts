import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as partnerApi from '@/lib/api/partnerApi';
import { Booking, PaginatedResponse } from '@/lib/api/types';

// Hook for partner booking list
export const usePartnerBookings = (params?: Record<string, unknown>) => {
  return useQuery<PaginatedResponse<Booking>, Error>({
    queryKey: ['partner-bookings', params],
    queryFn: () => partnerApi.getPartnerBookings(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook for partner booking details
export const usePartnerBooking = (id: string) => {
  return useQuery<Booking, Error>({
    queryKey: ['partner-booking', id],
    queryFn: () => partnerApi.getPartnerBookingById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
};

// Hook to update partner booking
export const useUpdatePartnerBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Booking, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => partnerApi.updatePartnerBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['partner-booking'] });
    },
  });
};

// Hook to confirm partner booking
export const useConfirmPartnerBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Booking, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => partnerApi.confirmPartnerBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['partner-booking'] });
    },
  });
};

// Hook to cancel partner booking
export const useCancelPartnerBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Booking, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => partnerApi.cancelPartnerBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['partner-booking'] });
    },
  });
};