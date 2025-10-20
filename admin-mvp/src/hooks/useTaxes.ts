import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAPI } from "@/lib/api/services/admin";
import { GSTData, TDSData, TCSData } from "@/lib/api/types";
import { useAuth } from '@/contexts/AuthContext';

// Hook for GST data
export const useGSTData = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  return useQuery<GSTData>({
    queryKey: ['admin', 'taxes', 'gst'],
    queryFn: () => AdminAPI.taxes.getGSTData(),
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook for TDS data
export const useTDSData = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  return useQuery<TDSData>({
    queryKey: ['admin', 'taxes', 'tds'],
    queryFn: () => AdminAPI.taxes.getTDSData(),
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook for TCS data
export const useTCSData = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  return useQuery<TCSData>({
    queryKey: ['admin', 'taxes', 'tcs'],
    queryFn: () => AdminAPI.taxes.getTCSData(),
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook to invalidate tax data
export const useInvalidateTaxData = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateGST: () => queryClient.invalidateQueries({ queryKey: ['admin', 'taxes', 'gst'] }),
    invalidateTDS: () => queryClient.invalidateQueries({ queryKey: ['admin', 'taxes', 'tds'] }),
    invalidateTCS: () => queryClient.invalidateQueries({ queryKey: ['admin', 'taxes', 'tcs'] }),
    invalidateAllTaxData: () => queryClient.invalidateQueries({ queryKey: ['admin', 'taxes'] }),
  };
};