import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserInvoices, getUserInvoiceById, updateUserInvoiceStatus, createUserInvoice } from '../lib/api/adminApi';
import { toast } from 'sonner';

interface UserInvoice {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface UserInvoicesParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UserInvoicesResponse {
  data: UserInvoice[];
  total: number;
  page: number;
  limit: number;
}

interface CreateUserInvoiceData extends Record<string, unknown> {
  userId: string;
  amount: number;
  currency?: string;
  dueDate: string;
  description?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

// Hook to fetch user invoices with pagination and filters
export const useUserInvoices = (params: UserInvoicesParams = {}) => {
  return useQuery<UserInvoicesResponse>({
    queryKey: ['userInvoices', params],
    queryFn: () => getUserInvoices(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch a single user invoice by ID
export const useUserInvoice = (invoiceId: string) => {
  return useQuery({
    queryKey: ['userInvoice', invoiceId],
    queryFn: () => getUserInvoiceById(invoiceId),
    enabled: !!invoiceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to update user invoice status
export const useUpdateUserInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, status, notes }: { invoiceId: string; status: string; notes?: string }) =>
      updateUserInvoiceStatus(invoiceId, { status, notes }),
    onSuccess: () => {
      toast.success('Invoice status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['userInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['userInvoice'] });
    },
    onError: (error: Error) => {
      toast.error((error as any)?.response?.data?.message || 'Failed to update invoice status');
    },
  });
};

// Hook to create a new user invoice
export const useCreateUserInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceData: CreateUserInvoiceData) => createUserInvoice(invoiceData),
    onSuccess: () => {
      toast.success('User invoice created successfully');
      queryClient.invalidateQueries({ queryKey: ['userInvoices'] });
    },
    onError: (error: Error) => {
      toast.error((error as any)?.response?.data?.message || 'Failed to create user invoice');
    },
  });
};