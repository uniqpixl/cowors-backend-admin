import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as partnerApi from '@/lib/api/partnerApi';

// Define types for wallet data
interface Wallet {
  balance: number;
  currency: string;
  lastUpdated: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}

// Hook for partner wallet
export const usePartnerWallet = () => {
  return useQuery<Wallet, Error>({
    queryKey: ['partner-wallet'],
    queryFn: () => partnerApi.getPartnerWallet() as Promise<Wallet>,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook for partner transactions
export const usePartnerTransactions = (params?: Record<string, unknown>) => {
  return useQuery<PaginatedTransactions, Error>({
    queryKey: ['partner-transactions', params],
    queryFn: () => partnerApi.getPartnerTransactions(params) as Promise<PaginatedTransactions>,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook to request payout
export const useRequestPayout = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Wallet, Error, Record<string, unknown>>({
    mutationFn: (data) => partnerApi.requestPayout(data) as Promise<Wallet>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['partner-transactions'] });
    },
  });
};