import { useQuery } from '@tanstack/react-query';
import { getAllPartnerWallets } from '@/services/adminService';
import { useAuth } from '@/contexts/AuthContext';

// Hook for admin partner wallets
export const useAdminPartnerWallets = (params?: Record<string, unknown>) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return useQuery({
    queryKey: ['admin-partner-wallets', params],
    queryFn: () => getAllPartnerWallets(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !isLoading,
  });
};