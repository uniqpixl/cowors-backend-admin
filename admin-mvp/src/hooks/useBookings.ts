import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as adminApi from '@/lib/api/adminApi';
import { useAuth } from '@/contexts/AuthContext';
import { Booking, PaginatedResponse } from '@/lib/api/types';

// Hook for booking list
export const useBookings = (params?: Record<string, unknown>) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery<PaginatedResponse<Booking>, Error>({
    queryKey: ['bookings', params],
    queryFn: () => adminApi.getAllBookings(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !isLoading,
  });
};

// Hook for booking details
export const useBooking = (id: string) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery<Booking, Error>({
    queryKey: ['booking', id],
    queryFn: () => adminApi.getBookingById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id && isAuthenticated && !isLoading,
  });
};

// Hook to update booking
export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Booking, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => adminApi.updateBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
  });
};

// Hook to cancel booking
export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Booking, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => adminApi.cancelBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
  });
};