import { useState, useEffect } from 'react';
import { getAllPayouts } from '@/lib/api/adminApi';
import { PartnerPayout, PaginatedPayouts } from '@/lib/api/types';

interface UsePayoutsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  amountMin?: number;
  amountMax?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UsePayoutsReturn {
  payouts: PartnerPayout[];
  totalPayouts: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePayouts = (params: UsePayoutsParams = {}): UsePayoutsReturn => {
  const [payouts, setPayouts] = useState<PartnerPayout[]>([]);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(params.page || 1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayouts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response: PaginatedPayouts = await getAllPayouts({
        page: params.page || 1,
        limit: params.limit || 10,
        search: params.search,
        status: params.status,
        amountMin: params.amountMin,
        amountMax: params.amountMax,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      });

      setPayouts(response.payouts || []);
      
      // Add safety checks for pagination object
      if (response.pagination) {
        setTotalPayouts(response.pagination.total || 0);
        setTotalPages(response.pagination.totalPages || 0);
        setCurrentPage(response.pagination.page || 1);
      } else {
        // Fallback values if pagination is undefined
        setTotalPayouts(0);
        setTotalPages(0);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Error fetching payouts:', err);
      
      // Reset state on error
      setPayouts([]);
      setTotalPayouts(0);
      setTotalPages(0);
      setCurrentPage(1);
      
      // Set user-friendly error message
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to fetch payouts: ${errorMessage}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [
    params.page,
    params.limit,
    params.search,
    params.status,
    params.amountMin,
    params.amountMax,
    params.sortBy,
    params.sortOrder,
  ]);

  const refetch = () => {
    fetchPayouts();
  };

  return {
    payouts,
    totalPayouts,
    totalPages,
    currentPage,
    isLoading,
    error,
    refetch,
  };
};