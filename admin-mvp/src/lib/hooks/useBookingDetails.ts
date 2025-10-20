import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminAPI } from '../api/services/admin';
import { CreateBookingNoteRequest } from '../api/types';
import { useAuth } from '@/contexts/AuthContext';

// Hook to fetch booking timeline
export const useBookingTimeline = (bookingId: string) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['booking-timeline', bookingId],
    queryFn: () => AdminAPI.bookings.getBookingTimeline(bookingId),
    enabled: isAuthenticated && !!bookingId,
    staleTime: 30000, // 30 seconds
  });
};

// Hook to fetch booking notes
export const useBookingNotes = (bookingId: string) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['booking-notes', bookingId],
    queryFn: () => AdminAPI.bookings.getBookingNotes(bookingId),
    enabled: isAuthenticated && !!bookingId,
    staleTime: 30000, // 30 seconds
  });
};

// Hook to add booking note
export const useAddBookingNote = (bookingId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (noteData: CreateBookingNoteRequest) => 
      AdminAPI.bookings.addBookingNote(bookingId, noteData),
    onSuccess: () => {
      // Invalidate and refetch booking notes
      queryClient.invalidateQueries({ queryKey: ['booking-notes', bookingId] });
      // Also invalidate timeline as adding a note might create a timeline event
      queryClient.invalidateQueries({ queryKey: ['booking-timeline', bookingId] });
    },
  });
};

// Hook to update booking note
export const useUpdateBookingNote = (bookingId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) => 
      AdminAPI.bookings.updateBookingNote(bookingId, noteId, content),
    onSuccess: () => {
      // Invalidate and refetch booking notes
      queryClient.invalidateQueries({ queryKey: ['booking-notes', bookingId] });
    },
  });
};

// Hook to delete booking note
export const useDeleteBookingNote = (bookingId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (noteId: string) => 
      AdminAPI.bookings.deleteBookingNote(bookingId, noteId),
    onSuccess: () => {
      // Invalidate and refetch booking notes
      queryClient.invalidateQueries({ queryKey: ['booking-notes', bookingId] });
    },
  });
};

// Hook to invalidate booking-related queries
export const useInvalidateBookingData = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateTimeline: (bookingId: string) => {
      queryClient.invalidateQueries({ queryKey: ['booking-timeline', bookingId] });
    },
    invalidateNotes: (bookingId: string) => {
      queryClient.invalidateQueries({ queryKey: ['booking-notes', bookingId] });
    },
    invalidateAll: (bookingId: string) => {
      queryClient.invalidateQueries({ queryKey: ['booking-timeline', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking-notes', bookingId] });
    },
  };
};