import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAdminInvoices,
  getAdminInvoiceById,
  createAdminInvoice,
  updateAdminInvoice,
  deleteAdminInvoice,
  updateAdminInvoiceStatus,
  sendAdminInvoice,
  recordInvoicePayment,
  processInvoiceRefund,
  bulkInvoiceOperation,
  bulkSendInvoices,
  bulkRecordPayments,
  getInvoiceAnalytics,
  getInvoiceRevenueTrends,
  getInvoiceAgingReport,
  getInvoiceCustomerSummary,
  exportInvoiceData,
  getExportStatus,
  downloadExport,
  generateInvoiceReport,
  getReportStatus,
  downloadReport,
  getInvoiceSettings,
  updateInvoiceSettings,
  getInvoiceTemplates,
  previewInvoiceTemplate,
  getNextInvoiceNumber,
  validateInvoiceData,
  getInvoiceAuditTrail,
} from '@/lib/api/adminApi';

// Types
export interface AdminInvoice {
  id: string;
  invoiceNumber: string;
  type: 'booking' | 'subscription' | 'service' | 'product' | 'commission' | 'refund' | 'credit_note' | 'debit_note';
  status: 'draft' | 'pending' | 'sent' | 'viewed' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'refunded' | 'disputed';
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    taxId?: string;
  };
  partnerId?: string;
  bookingId?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercentage?: number;
    taxPercentage?: number;
    metadata?: Record<string, unknown>;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  terms?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInvoicesParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  customerId?: string;
  partnerId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminInvoicesResponse {
  invoices: AdminInvoice[];
  total: number;
  summary: {
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    totalCount: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
  };
}

export interface CreateAdminInvoiceData {
  type: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    taxId?: string;
  };
  partnerId?: string;
  bookingId?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercentage?: number;
    taxPercentage?: number;
    metadata?: Record<string, unknown>;
  }>;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateAdminInvoiceData {
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    taxId?: string;
  };
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercentage?: number;
    taxPercentage?: number;
    metadata?: Record<string, unknown>;
  }>;
  dueDate?: string;
  notes?: string;
  terms?: string;
  metadata?: Record<string, unknown>;
}

export interface BulkOperationData {
  operation: 'update_status' | 'send_invoices' | 'record_payments' | 'process_refunds' | 'delete_invoices' | 'apply_discount' | 'update_due_date';
  invoiceIds: string[];
  operationData?: Record<string, unknown>;
}

export interface InvoiceAnalytics {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  averageInvoiceValue: number;
  paymentRate: number;
  overdueRate: number;
  revenueGrowth: number;
  invoiceGrowth: number;
}

export interface InvoiceSettings {
  defaultCurrency: string;
  defaultPaymentTerms: number;
  defaultTaxRate: number;
  invoiceNumberPrefix: string;
  invoiceNumberFormat: string;
  autoSendInvoices: boolean;
  sendReminders: boolean;
  reminderDays: number[];
  defaultNotes: string;
  defaultTerms: string;
  companyInfo: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    phone: string;
    email: string;
    website: string;
    taxId: string;
  };
}

// Hooks
export const useAdminInvoices = (params?: AdminInvoicesParams) => {
  return useQuery({
    queryKey: ['admin-invoices', params],
    queryFn: () => getAdminInvoices(params),
    staleTime: 30000, // 30 seconds
  });
};

export const useAdminInvoice = (id: string) => {
  return useQuery({
    queryKey: ['admin-invoice', id],
    queryFn: () => getAdminInvoiceById(id),
    enabled: !!id,
  });
};

export const useCreateAdminInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdminInvoiceData) => createAdminInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      toast.success('Invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to create invoice');
    },
  });
};

export const useUpdateAdminInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminInvoiceData }) => 
      updateAdminInvoice(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-invoice', id] });
      toast.success('Invoice updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to update invoice');
    },
  });
};

export const useDeleteAdminInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdminInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to delete invoice');
    },
  });
};

export const useUpdateAdminInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) => 
      updateAdminInvoiceStatus(id, { status, reason }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-invoice', id] });
      toast.success('Invoice status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to update invoice status');
    },
  });
};

export const useSendAdminInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, email, message }: { id: string; email?: string; message?: string }) => 
      sendAdminInvoice(id, { email, message }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-invoice', id] });
      toast.success('Invoice sent successfully');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to send invoice');
    },
  });
};

export const useRecordInvoicePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, amount, paymentMethod, paymentReference, notes }: { 
      id: string; 
      amount: number; 
      paymentMethod: string; 
      paymentReference?: string; 
      notes?: string; 
    }) => recordInvoicePayment(id, { amount, paymentMethod, paymentReference, notes }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-invoice', id] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to record payment');
    },
  });
};

export const useProcessInvoiceRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, amount, reason, refundMethod }: { 
      id: string; 
      amount: number; 
      reason: string; 
      refundMethod?: string; 
    }) => processInvoiceRefund(id, { amount, reason, refundMethod }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-invoice', id] });
      toast.success('Refund processed successfully');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to process refund');
    },
  });
};

export const useBulkInvoiceOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkOperationData) => bulkInvoiceOperation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      toast.success('Bulk operation completed successfully');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to complete bulk operation');
    },
  });
};

export const useBulkSendInvoices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceIds: string[]) => bulkSendInvoices(invoiceIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      toast.success('Invoices sent successfully');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to send invoices');
    },
  });
};

export const useBulkRecordPayments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payments: Array<{ invoiceId: string; amount: number; paymentMethod: string; paymentReference?: string }>) => 
      bulkRecordPayments(payments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      toast.success('Payments recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to record payments');
    },
  });
};

// Analytics hooks
export const useInvoiceAnalytics = (params?: { dateFrom?: string; dateTo?: string }) => {
  return useQuery({
    queryKey: ['invoice-analytics', params],
    queryFn: () => getInvoiceAnalytics(params),
    staleTime: 60000, // 1 minute
  });
};

export const useInvoiceRevenueTrends = (params?: { period?: string; dateFrom?: string; dateTo?: string }) => {
  return useQuery({
    queryKey: ['invoice-revenue-trends', params],
    queryFn: () => getInvoiceRevenueTrends(params),
    staleTime: 60000, // 1 minute
  });
};

export const useInvoiceAgingReport = () => {
  return useQuery({
    queryKey: ['invoice-aging-report'],
    queryFn: () => getInvoiceAgingReport(),
    staleTime: 60000, // 1 minute
  });
};

export const useInvoiceCustomerSummary = (params?: { customerId?: string; dateFrom?: string; dateTo?: string }) => {
  return useQuery({
    queryKey: ['invoice-customer-summary', params],
    queryFn: () => getInvoiceCustomerSummary(params),
    staleTime: 60000, // 1 minute
  });
};

// Export and reporting hooks
export const useExportInvoiceData = () => {
  return useMutation({
    mutationFn: (data: { format: string; filters?: Record<string, unknown>; fields?: string[] }) => 
      exportInvoiceData(data),
    onSuccess: () => {
      toast.success('Export initiated successfully');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to initiate export');
    },
  });
};

export const useExportStatus = (exportId: string) => {
  return useQuery({
    queryKey: ['export-status', exportId],
    queryFn: () => getExportStatus(exportId),
    enabled: !!exportId,
    refetchInterval: 2000, // Poll every 2 seconds
  });
};

export const useDownloadExport = () => {
  return useMutation({
    mutationFn: (exportId: string) => downloadExport(exportId),
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to download export');
    },
  });
};

export const useGenerateInvoiceReport = () => {
  return useMutation({
    mutationFn: (data: { type: string; filters?: Record<string, unknown>; options?: Record<string, unknown> }) => 
      generateInvoiceReport(data),
    onSuccess: () => {
      toast.success('Report generation initiated successfully');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to generate report');
    },
  });
};

export const useReportStatus = (reportId: string) => {
  return useQuery({
    queryKey: ['report-status', reportId],
    queryFn: () => getReportStatus(reportId),
    enabled: !!reportId,
    refetchInterval: 2000, // Poll every 2 seconds
  });
};

export const useDownloadReport = () => {
  return useMutation({
    mutationFn: (reportId: string) => downloadReport(reportId),
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to download report');
    },
  });
};

// Settings hooks
export const useInvoiceSettings = () => {
  return useQuery({
    queryKey: ['invoice-settings'],
    queryFn: () => getInvoiceSettings(),
    staleTime: 300000, // 5 minutes
  });
};

export const useUpdateInvoiceSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<InvoiceSettings>) => updateInvoiceSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-settings'] });
      toast.success('Invoice settings updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to update invoice settings');
    },
  });
};

// Template hooks
export const useInvoiceTemplates = () => {
  return useQuery({
    queryKey: ['invoice-templates'],
    queryFn: () => getInvoiceTemplates(),
    staleTime: 300000, // 5 minutes
  });
};

export const usePreviewInvoiceTemplate = () => {
  return useMutation({
    mutationFn: (data: { templateId: string; invoiceData: Record<string, unknown> }) => 
      previewInvoiceTemplate(data.templateId, data.invoiceData),
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to preview template');
    },
  });
};

// Utility hooks
export const useNextInvoiceNumber = () => {
  return useQuery({
    queryKey: ['next-invoice-number'],
    queryFn: () => getNextInvoiceNumber(),
    staleTime: 60000, // 1 minute
  });
};

export const useValidateInvoiceData = () => {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => validateInvoiceData(data),
    onError: (error: Error) => {
      toast.error(error?.message || 'Validation failed');
    },
  });
};

export const useInvoiceAuditTrail = (invoiceId: string) => {
  return useQuery({
    queryKey: ['invoice-audit-trail', invoiceId],
    queryFn: () => getInvoiceAuditTrail(invoiceId),
    enabled: !!invoiceId,
    staleTime: 60000, // 1 minute
  });
};