import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminApi from '@/lib/api/adminApi';
import { toast } from 'sonner';

// Hook for fetching partner invoices
export const usePartnerInvoices = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['partner-invoices', params],
    queryFn: () => adminApi.getPartnerInvoices(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching a single partner invoice
export const usePartnerInvoice = (id: string) => {
  return useQuery({
    queryKey: ['partner-invoice', id],
    queryFn: () => adminApi.getPartnerInvoiceById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for creating a partner invoice
export const useCreatePartnerInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createPartnerInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-invoices'] });
      toast.success('Partner invoice created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create partner invoice');
    },
  });
};

// Hook for updating partner invoice status
export const useUpdatePartnerInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string; notes?: string } }) => 
      adminApi.updatePartnerInvoiceStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['partner-invoice'] });
      toast.success('Invoice status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update invoice status');
    },
  });
};