import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminApi from '@/lib/api/adminApi';
import { Review, ReviewQuery, ReviewUpdate, ReviewAnalytics } from '@/lib/api/types';
import { toast } from 'sonner';

// Get all reviews with pagination and filtering
export const useReviews = (params?: ReviewQuery) => {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: () => adminApi.getAllReviews(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single review by ID
export const useReview = (id: string) => {
  return useQuery({
    queryKey: ['review', id],
    queryFn: () => adminApi.getReviewById(id),
    enabled: !!id,
  });
};

// Update review status (approve, reject, etc.)
export const useUpdateReviewStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewUpdate }) => 
      adminApi.updateReviewStatus(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review', data.id] });
      queryClient.invalidateQueries({ queryKey: ['reviewAnalytics'] });
      toast.success('Review status updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update review status:', error);
      toast.error('Failed to update review status');
    },
  });
};

// Flag review
export const useFlagReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      adminApi.flagReview(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review', data.id] });
      queryClient.invalidateQueries({ queryKey: ['reviewAnalytics'] });
      toast.success('Review flagged successfully');
    },
    onError: (error) => {
      console.error('Failed to flag review:', error);
      toast.error('Failed to flag review');
    },
  });
};

// Unflag review
export const useUnflagReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => adminApi.unflagReview(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review', data.id] });
      queryClient.invalidateQueries({ queryKey: ['reviewAnalytics'] });
      toast.success('Review unflagged successfully');
    },
    onError: (error) => {
      console.error('Failed to unflag review:', error);
      toast.error('Failed to unflag review');
    },
  });
};

// Delete review
export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviewAnalytics'] });
      toast.success('Review deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete review:', error);
      toast.error('Failed to delete review');
    },
  });
};

// Get review analytics
export const useReviewAnalytics = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['reviewAnalytics', params],
    queryFn: () => adminApi.getReviewAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Bulk operations for reviews
export const useBulkUpdateReviews = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: ReviewUpdate }) => {
      const promises = ids.map(id => adminApi.updateReviewStatus(id, data));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviewAnalytics'] });
      toast.success('Reviews updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update reviews:', error);
      toast.error('Failed to update reviews');
    },
  });
};