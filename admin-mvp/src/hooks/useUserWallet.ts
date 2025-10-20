'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserWallet, getUserTransactions, getAllUserWallets } from '@/lib/api/userApi';
import { Wallet, Transaction, PaginatedTransactions, PaginatedResponse } from '@/lib/api/types';

// Hook for user wallet
export const useUserWallet = (userId: string) => {
  return useQuery({
    queryKey: ['userWallet', userId],
    queryFn: () => getUserWallet(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!userId,
  });
};

// Hook for user transactions
export const useUserTransactions = (userId: string, params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['userTransactions', userId, params],
    queryFn: () => getUserTransactions(userId, params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!userId,
  });
};

// Hook for all user wallets (admin)
export const useAllUserWallets = (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
  return useQuery({
    queryKey: ['allUserWallets', params],
    queryFn: () => getAllUserWallets(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};