import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as userApi from '@/lib/api/userApi';
import { Booking, PaginatedResponse, BookingQuery } from '@/lib/api/types';

// Hook for user booking list
export const useUserBookings = (params?: BookingQuery) => {
  return useQuery<PaginatedResponse<Booking>, Error>({
    queryKey: ['user-bookings', params],
    queryFn: () => userApi.getUserBookings(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook for user booking details
export const useUserBooking = (id: string) => {
  return useQuery<Booking, Error>({
    queryKey: ['user-booking', id],
    queryFn: () => userApi.getUserBookingById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
};

// Hook to create user booking
export const useCreateUserBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Booking, Error, Partial<Booking>>({
    mutationFn: (data) => userApi.createUserBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
    },
  });
};

// Hook to update user booking
export const useUpdateUserBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Booking, Error, { id: string; data: Partial<Booking> }>({
    mutationFn: ({ id, data }) => userApi.updateUserBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['user-booking'] });
    },
  });
};

// Hook to cancel user booking
export const useCancelUserBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Booking, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => userApi.cancelUserBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['user-booking'] });
    },
  });
};