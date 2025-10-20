import { apiRequest } from './client';
import { DashboardKPIs, Partner, Booking, AdminUser, PaginatedResponse, PartnerQuery, BookingQuery, Review, ReviewQuery, ReviewUpdate, ReviewAnalytics, AdminProfile, NotificationPreferences, AppearanceSettings, PasswordChangeRequest, PasswordChangeResponse, AvatarUploadResponse, AuditLog, AuditLogsResponse, AuditLogsStats, AuditLogsFilters, FinanceSettings, SecuritySettings, Transaction, PaginatedTransactions, PartnerPayout, PaginatedPayouts, PayoutAnalytics } from '@/lib/api/types';

// Dashboard endpoints
export const getDashboardKPIs = async (): Promise<DashboardKPIs> => {
  return apiRequest<DashboardKPIs>({
    url: '/api/v1/admin/dashboard/kpis',
    method: 'GET',
  });
};

export const getDashboardNotifications = async () => {
  return apiRequest({
    url: '/api/v1/admin/dashboard/notifications',
    method: 'GET',
  });
};

export const getDashboardStats = async () => {
  return apiRequest({
    url: '/api/v1/admin/dashboard/stats',
    method: 'GET',
  });
};

// User management endpoints
export const getAllUsers = async (params?: Record<string, unknown>): Promise<PaginatedResponse<AdminUser>> => {
  return apiRequest<PaginatedResponse<AdminUser>>({
    url: '/api/v1/admin/users',
    method: 'GET',
    params,
  });
};

export const getUserById = async (id: string): Promise<AdminUser> => {
  return apiRequest<AdminUser>({
    url: `/api/v1/admin/users/${id}`,
    method: 'GET',
  });
};

export const updateUser = async (id: string, data: Record<string, unknown>): Promise<AdminUser> => {
  return apiRequest<AdminUser>({
    url: `/api/v1/admin/users/${id}`,
    method: 'PUT',
    data,
  });
};

export const banUser = async (id: string, data: Record<string, unknown>): Promise<AdminUser> => {
  return apiRequest<AdminUser>({
    url: `/api/v1/admin/users/${id}/ban`,
    method: 'POST',
    data,
  });
};

export const suspendUser = async (id: string, data: Record<string, unknown>): Promise<AdminUser> => {
  return apiRequest<AdminUser>({
    url: `/api/v1/admin/users/${id}/suspend`,
    method: 'POST',
    data,
  });
};

export const reactivateUser = async (id: string): Promise<AdminUser> => {
  return apiRequest<AdminUser>({
    url: `/api/v1/admin/users/${id}/reactivate`,
    method: 'POST',
  });
};

// Partner management endpoints
export const getAllPartners = async (params?: PartnerQuery): Promise<PaginatedResponse<Partner>> => {
  return apiRequest<PaginatedResponse<Partner>>({
    url: '/api/v1/admin/partners',
    method: 'GET',
    params,
  });
};

export const getPartnerById = async (id: string): Promise<Partner> => {
  return apiRequest<Partner>({
    url: `/api/v1/admin/partners/${id}`,
    method: 'GET',
  });
};

export const updatePartner = async (id: string, data: Record<string, unknown>): Promise<Partner> => {
  return apiRequest<Partner>({
    url: `/api/v1/admin/partners/${id}`,
    method: 'PUT',
    data,
  });
};

export const approvePartner = async (id: string, data: Record<string, unknown>): Promise<Partner> => {
  return apiRequest<Partner>({
    url: `/api/v1/admin/partners/${id}/approve`,
    method: 'POST',
    data,
  });
};

export const rejectPartner = async (id: string, data: Record<string, unknown>): Promise<Partner> => {
  return apiRequest<Partner>({
    url: `/api/v1/admin/partners/${id}/reject`,
    method: 'POST',
    data,
  });
};

export const suspendPartner = async (id: string, data: Record<string, unknown>): Promise<Partner> => {
  return apiRequest<Partner>({
    url: `/api/v1/admin/partners/${id}/suspend`,
    method: 'POST',
    data,
  });
};

export const reactivatePartner = async (id: string, data: Record<string, unknown>): Promise<Partner> => {
  return apiRequest<Partner>({
    url: `/api/v1/admin/partners/${id}/reactivate`,
    method: 'POST',
    data,
  });
};

// Partner Wallet management endpoints
export const getAllPartnerWallets = async (params?: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/partner-wallets',
    method: 'GET',
    params,
  });
};

// Booking management endpoints
export const getAllBookings = async (params?: BookingQuery): Promise<PaginatedResponse<Booking>> => {
  // Transform frontend parameters to match backend expectations
  const transformedParams = {
    ...params,
    // Map frontend sortBy values to backend BookingSortBy enum
    sortBy: params?.sortBy === 'startTime' ? 'bookingDate' : 
            params?.sortBy === 'amount' ? 'amount' : 
            params?.sortBy === 'createdAt' ? 'createdAt' : 
            'createdAt', // default
    // Backend expects 'asc'/'desc', frontend sends same
    sortOrder: params?.sortOrder || 'desc',
  };
  
  // Remove undefined values to avoid validation errors
  const cleanParams = Object.fromEntries(
    Object.entries(transformedParams).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  );
  
  return apiRequest<PaginatedResponse<Booking>>({
    url: '/api/v1/admin/bookings',
    method: 'GET',
    params: cleanParams,
  });
};

export const getBookingById = async (id: string): Promise<Booking> => {
  return apiRequest<Booking>({
    url: `/api/v1/admin/bookings/${id}`,
    method: 'GET',
  });
};

export const updateBooking = async (id: string, data: Record<string, unknown>): Promise<Booking> => {
  return apiRequest<Booking>({
    url: `/api/v1/admin/bookings/${id}`,
    method: 'PUT',
    data,
  });
};

export const cancelBooking = async (id: string, data: Record<string, unknown>): Promise<Booking> => {
  return apiRequest<Booking>({
    url: `/api/v1/admin/bookings/${id}/cancel`,
    method: 'POST',
    data,
  });
};

// Analytics endpoints
export const getPlatformStats = async () => {
  return apiRequest({
    url: '/api/v1/admin/analytics/platform-stats',
    method: 'GET',
  });
};

export const getBookingAnalytics = async (params?: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/analytics/bookings',
    method: 'GET',
    params,
  });
};

export const getUserAnalytics = async (params?: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/analytics/users',
    method: 'GET',
    params,
  });
};

export const getRevenueAnalytics = async (params?: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/analytics/revenue',
    method: 'GET',
    params,
  });
};

export const getRevenueTrends = async (params?: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/analytics/revenue-trends',
    method: 'GET',
    params,
  });
};

export const getRevenueMetrics = async (params?: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/analytics/revenue-metrics',
    method: 'GET',
    params,
  });
};

export const getRevenueBreakdown = async (params?: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/analytics/revenue-breakdown',
    method: 'GET',
    params,
  });
};

// Activity feed endpoint
export const getActivityFeed = async (params?: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/activity/feed',
    method: 'GET',
    params,
  });
};

// Review management endpoints
export const getAllReviews = async (params?: ReviewQuery): Promise<PaginatedResponse<Review>> => {
  return apiRequest<PaginatedResponse<Review>>({
    url: '/api/v1/admin/reviews',
    method: 'GET',
    params,
  });
};

export const getReviewById = async (id: string): Promise<Review> => {
  return apiRequest<Review>({
    url: `/api/v1/admin/reviews/${id}`,
    method: 'GET',
  });
};

export const updateReviewStatus = async (id: string, data: ReviewUpdate): Promise<Review> => {
  return apiRequest<Review>({
    url: `/api/v1/admin/reviews/${id}/status`,
    method: 'PUT',
    data,
  });
};

export const flagReview = async (id: string, reason: string): Promise<Review> => {
  return apiRequest<Review>({
    url: `/api/v1/admin/reviews/${id}/flag`,
    method: 'POST',
    data: { reason },
  });
};

export const unflagReview = async (id: string): Promise<Review> => {
  return apiRequest<Review>({
    url: `/api/v1/admin/reviews/${id}/unflag`,
    method: 'POST',
  });
};

export const deleteReview = async (id: string): Promise<void> => {
  return apiRequest<void>({
    url: `/api/v1/admin/reviews/${id}`,
    method: 'DELETE',
  });
};

export const getReviewAnalytics = async (params?: Record<string, unknown>): Promise<ReviewAnalytics> => {
  return apiRequest<ReviewAnalytics>({
    url: '/api/v1/admin/reviews/analytics',
    method: 'GET',
    params,
  });
};

// Settings API functions

// Profile settings
export const getAdminProfile = async (): Promise<AdminProfile> => {
  return apiRequest<AdminProfile>({
    url: '/api/v1/admin/settings/profile',
    method: 'GET',
  });
};

export const updateAdminProfile = async (profileData: Partial<AdminProfile>): Promise<AdminProfile> => {
  return apiRequest<AdminProfile>({
    url: '/api/v1/admin/settings/profile',
    method: 'PUT',
    data: profileData,
  });
};

// Notification preferences
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  return apiRequest<NotificationPreferences>({
    url: '/api/v1/admin/settings/notifications',
    method: 'GET',
  });
};

export const updateNotificationPreferences = async (preferences: NotificationPreferences): Promise<NotificationPreferences> => {
  return apiRequest<NotificationPreferences>({
    url: '/api/v1/admin/settings/notifications',
    method: 'PUT',
    data: preferences,
  });
};

// Appearance settings
export const getAppearanceSettings = async (): Promise<AppearanceSettings> => {
  return apiRequest<AppearanceSettings>({
    url: '/api/v1/admin/settings/appearance',
    method: 'GET',
  });
};

export const updateAppearanceSettings = async (settings: AppearanceSettings): Promise<AppearanceSettings> => {
  return apiRequest<AppearanceSettings>({
    url: '/api/v1/admin/settings/appearance',
    method: 'PUT',
    data: settings,
  });
};

// Password change
export const changePassword = async (passwordData: PasswordChangeRequest): Promise<PasswordChangeResponse> => {
  return apiRequest<PasswordChangeResponse>({
    url: '/api/v1/admin/settings/password',
    method: 'PUT',
    data: passwordData,
  });
};

// Avatar upload
export const uploadAvatar = async (file: File): Promise<AvatarUploadResponse> => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  return apiRequest<AvatarUploadResponse>({
    url: '/api/v1/admin/settings/avatar',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Audit Logs API
export const getAuditLogs = async (filters?: AuditLogsFilters): Promise<AuditLogsResponse> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
  }
  
  return apiRequest<AuditLogsResponse>({
    url: `/api/v1/admin/audit/logs?${params}`,
    method: 'GET',
  });
};

export const getAuditLogsStats = async (): Promise<AuditLogsStats> => {
  return apiRequest<AuditLogsStats>({
    url: '/api/v1/admin/audit/stats',
    method: 'GET',
  });
};

// Transaction management endpoints
export const getAllTransactions = async (params?: Record<string, unknown>): Promise<PaginatedTransactions> => {
  // Transform sortOrder from lowercase to uppercase for backend compatibility
  const transformedParams = params ? { ...params } : {};
  if (transformedParams.sortOrder && typeof transformedParams.sortOrder === 'string') {
    transformedParams.sortOrder = transformedParams.sortOrder.toUpperCase();
  }
  
  return apiRequest<PaginatedTransactions>({
    url: '/api/v1/admin/transactions',
    method: 'GET',
    params: transformedParams,
  });
};

export const getTransactionById = async (id: string): Promise<Transaction> => {
  return apiRequest<Transaction>({
    url: `/api/v1/admin/transactions/${id}`,
    method: 'GET',
  });
};

export const getTransactionAnalytics = async (params?: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/transactions/analytics/overview',
    method: 'GET',
    params,
  });
};

// Payout management endpoints
export const getAllPayouts = async (params?: Record<string, unknown>): Promise<PaginatedPayouts> => {
  return apiRequest<PaginatedPayouts>({
    url: '/api/v1/admin/payouts',
    method: 'GET',
    params,
  });
};

export const getPayoutById = async (id: string): Promise<PartnerPayout> => {
  return apiRequest<PartnerPayout>({
    url: `/api/v1/admin/payouts/${id}`,
    method: 'GET',
  });
};

export const updatePayoutStatus = async (id: string, data: { status: string; notes?: string }): Promise<PartnerPayout> => {
  return apiRequest<PartnerPayout>({
    url: `/api/v1/admin/payouts/${id}/status`,
    method: 'PUT',
    data,
  });
};

export const getPayoutAnalytics = async (params?: Record<string, unknown>): Promise<PayoutAnalytics> => {
  return apiRequest<PayoutAnalytics>({
    url: '/api/v1/admin/payouts/analytics',
    method: 'GET',
    params,
  });
};

export const processPayoutBatch = async (payoutIds: string[]): Promise<{ processed: number; failed: number }> => {
  return apiRequest<{ processed: number; failed: number }>({
    url: '/api/v1/admin/payouts/batch/process',
    method: 'POST',
    data: { payoutIds },
  });
};

export const exportAuditLogs = async (filters?: AuditLogsFilters): Promise<{ downloadUrl: string }> => {
  return apiRequest<{ downloadUrl: string }>({
    url: '/api/v1/admin/audit/export',
    method: 'POST',
    data: filters || {},
  });
};

// Finance Settings API
export const getFinanceSettings = async (): Promise<FinanceSettings> => {
  return apiRequest<FinanceSettings>({
    url: '/api/v1/admin/settings/finance',
    method: 'GET',
  });
};

export const updateFinanceSettings = async (settings: FinanceSettings): Promise<FinanceSettings> => {
  return apiRequest<FinanceSettings>({
    url: '/api/v1/admin/settings/finance',
    method: 'PUT',
    data: settings,
  });
};

// Security Settings API
export const getSecuritySettings = async (): Promise<SecuritySettings> => {
  return apiRequest<SecuritySettings>({
    url: '/api/v1/admin/settings/security',
    method: 'GET',
  });
};

export const updateSecuritySettings = async (data: Partial<SecuritySettings>): Promise<SecuritySettings> => {
  return apiRequest<SecuritySettings>({
    url: '/api/v1/admin/settings/security',
    method: 'PUT',
    data,
  });
};

// Partner Invoice management endpoints
export const getPartnerInvoices = async (params?: Record<string, unknown>) => {
  // Transform frontend parameters to match backend expectations
  const transformedParams = {
    ...params,
    // Map frontend sortBy values to backend AdminInvoiceSortBy enum
    sortBy: params?.sortBy === 'date' ? 'createdAt' : 
            params?.sortBy === 'invoiceNumber' ? 'invoiceNumber' : 
            params?.sortBy === 'netSettlement' ? 'totalAmount' : 
            params?.sortBy === 'status' ? 'status' : 
            params?.sortBy === 'dueDate' ? 'dueDate' : 
            'createdAt', // default
    // Backend expects 'ASC'/'DESC', frontend sends 'asc'/'desc'
    sortOrder: params?.sortOrder ? (params.sortOrder as string).toUpperCase() : 'DESC',
  };
  
  // Remove undefined values to avoid validation errors
  const cleanParams = Object.fromEntries(
    Object.entries(transformedParams).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  );
  
  return apiRequest({
    url: '/api/v1/admin/invoices/partner',
    method: 'GET',
    params: cleanParams,
  });
};

export const getPartnerInvoiceById = async (id: string) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/partner/${id}`,
    method: 'GET',
  });
};

export const createPartnerInvoice = async (data: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/invoices/partner',
    method: 'POST',
    data,
  });
};

export const updatePartnerInvoiceStatus = async (id: string, data: { status: string; notes?: string }) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/partner/${id}/status`,
    method: 'PUT',
    data,
  });
};

// User Invoice management endpoints
export const getUserInvoices = async (params?: Record<string, unknown>) => {
  // Transform frontend parameters to match backend expectations
  const transformedParams = {
    ...params,
    // Map frontend sortBy values to backend AdminInvoiceSortBy enum
    sortBy: params?.sortBy === 'date' ? 'createdAt' : 
            params?.sortBy === 'invoiceNumber' ? 'invoiceNumber' : 
            params?.sortBy === 'amount' ? 'totalAmount' : 
            params?.sortBy === 'status' ? 'status' : 
            params?.sortBy === 'dueDate' ? 'dueDate' : 
            'createdAt', // default
    // Backend expects 'ASC'/'DESC', frontend sends 'asc'/'desc'
    sortOrder: params?.sortOrder ? (params.sortOrder as string).toUpperCase() : 'DESC',
  };
  
  // Remove undefined values to avoid validation errors
  const cleanParams = Object.fromEntries(
    Object.entries(transformedParams).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  );
  
  return apiRequest({
    url: '/api/v1/admin/invoices/user',
    method: 'GET',
    params: cleanParams,
  });
};

export const getUserInvoiceById = async (id: string) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/user/${id}`,
    method: 'GET',
  });
};

export const createUserInvoice = async (data: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/invoices/user',
    method: 'POST',
    data,
  });
};

export const updateUserInvoiceStatus = async (id: string, data: { status: string; notes?: string }) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/user/${id}/status`,
    method: 'PUT',
    data,
  });
};

// Admin Invoice Management API (unified invoice management)
export const getAdminInvoices = async (params?: Record<string, unknown>) => {
  // Transform frontend parameters to match backend expectations
  const transformedParams = {
    ...params,
    // Map frontend sortBy values to backend expectations
    sortBy: params?.sortBy === 'date' ? 'createdAt' : 
            params?.sortBy === 'invoiceNumber' ? 'invoiceNumber' : 
            params?.sortBy === 'amount' ? 'totalAmount' : 
            params?.sortBy === 'status' ? 'status' : 
            params?.sortBy === 'dueDate' ? 'dueDate' : 
            'createdAt', // default
    // Backend expects 'ASC'/'DESC', frontend sends 'asc'/'desc'
    sortOrder: params?.sortOrder ? (params.sortOrder as string).toUpperCase() : 'DESC',
  };
  
  // Remove undefined values to avoid validation errors
  const cleanParams = Object.fromEntries(
    Object.entries(transformedParams).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  );
  
  return apiRequest({
    url: '/api/v1/admin/invoices',
    method: 'GET',
    params: cleanParams,
  });
};

export const getAdminInvoiceById = async (id: string) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/${id}`,
    method: 'GET',
  });
};

export const createAdminInvoice = async (data: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/invoices',
    method: 'POST',
    data,
  });
};

export const updateAdminInvoice = async (id: string, data: Record<string, unknown>) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/${id}`,
    method: 'PUT',
    data,
  });
};

export const deleteAdminInvoice = async (id: string) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/${id}`,
    method: 'DELETE',
  });
};

export const updateAdminInvoiceStatus = async (id: string, data: { status: string; reason?: string }) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/${id}/status`,
    method: 'PUT',
    data,
  });
};

export const sendAdminInvoice = async (id: string, data?: { email?: string; message?: string }) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/${id}/send`,
    method: 'POST',
    data,
  });
};

export const recordInvoicePayment = async (id: string, data: { amount: number; paymentMethod: string; paymentReference?: string; notes?: string }) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/${id}/payment`,
    method: 'POST',
    data,
  });
};

export const processInvoiceRefund = async (id: string, data: { amount: number; reason: string; refundMethod?: string }) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/${id}/refund`,
    method: 'POST',
    data,
  });
};

// Bulk Operations
export const bulkInvoiceOperation = async (data: { operation: string; invoiceIds: string[]; operationData?: Record<string, unknown> }) => {
  return apiRequest({
    url: '/api/v1/admin/invoices/bulk-operation',
    method: 'POST',
    data,
  });
};

export const bulkSendInvoices = async (invoiceIds: string[]) => {
  return apiRequest({
    url: '/api/v1/admin/invoices/bulk-send',
    method: 'POST',
    data: { invoiceIds },
  });
};

export const bulkRecordPayments = async (payments: Array<{ invoiceId: string; amount: number; paymentMethod: string; paymentReference?: string }>) => {
  return apiRequest({
    url: '/api/v1/admin/invoices/bulk-payment',
    method: 'POST',
    data: { payments },
  });
};

// Analytics
export const getInvoiceAnalytics = async (params?: { dateFrom?: string; dateTo?: string }) => {
  return apiRequest({
    url: '/api/v1/admin/invoices/analytics/overview',
    method: 'GET',
    params,
  });
};

export const getInvoiceRevenueTrends = async (params?: { period?: string; dateFrom?: string; dateTo?: string }) => {
  return apiRequest({
    url: '/api/v1/admin/invoices/analytics/revenue-trends',
    method: 'GET',
    params,
  });
};

export const getInvoiceAgingReport = async () => {
  return apiRequest({
    url: '/api/v1/admin/invoices/analytics/aging-report',
    method: 'GET',
  });
};

export const getInvoiceCustomerSummary = async (params?: { customerId?: string; dateFrom?: string; dateTo?: string }) => {
  return apiRequest({
    url: '/api/v1/admin/invoices/analytics/customer-summary',
    method: 'GET',
    params,
  });
};

// Export and Reporting
export const exportInvoiceData = async (data: { format: string; filters?: Record<string, unknown>; fields?: string[] }) => {
  return apiRequest({
    url: '/api/v1/admin/invoices/export',
    method: 'POST',
    data,
  });
};

export const getExportStatus = async (exportId: string) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/export/${exportId}/status`,
    method: 'GET',
  });
};

export const downloadExport = async (exportId: string) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/export/${exportId}/download`,
    method: 'GET',
  });
};

export const generateInvoiceReport = async (data: { type: string; filters?: Record<string, unknown>; format?: string }) => {
  return apiRequest({
    url: '/api/v1/admin/invoices/reports/generate',
    method: 'POST',
    data,
  });
};

export const getReportStatus = async (reportId: string) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/reports/${reportId}/status`,
    method: 'GET',
  });
};

export const downloadReport = async (reportId: string) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/reports/${reportId}/download`,
    method: 'GET',
  });
};

// Settings
export const getInvoiceSettings = async () => {
  return apiRequest({
    url: '/api/v1/admin/invoices/settings',
    method: 'GET',
  });
};

export const updateInvoiceSettings = async (data: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/invoices/settings',
    method: 'PUT',
    data,
  });
};

// Templates
export const getInvoiceTemplates = async () => {
  return apiRequest({
    url: '/api/v1/admin/invoices/templates/list',
    method: 'GET',
  });
};

export const previewInvoiceTemplate = async (templateId: string, sampleData: Record<string, unknown>) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/templates/${templateId}/preview`,
    method: 'POST',
    data: sampleData,
  });
};

// Utilities
export const getNextInvoiceNumber = async (type?: string) => {
  return apiRequest({
    url: '/api/v1/admin/invoices/number-sequences/next',
    method: 'GET',
    params: type ? { type } : undefined,
  });
};

export const validateInvoiceData = async (invoiceData: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/invoices/validate',
    method: 'POST',
    data: invoiceData,
  });
};

export const getInvoiceAuditTrail = async (id: string) => {
  return apiRequest({
    url: `/api/v1/admin/invoices/audit-trail/${id}`,
    method: 'GET',
  });
};

export const toggle2FA = async (enabled: boolean): Promise<{ success: boolean }> => {
  return apiRequest<{ success: boolean }>({
    url: '/api/v1/admin/settings/security/2fa',
    method: 'POST',
    data: { enabled },
  });
};

export const setup2FA = async (): Promise<{ qrCode: string; secret: string }> => {
  return apiRequest<{ qrCode: string; secret: string }>({
    url: '/api/v1/admin/settings/security/2fa/setup',
    method: 'POST',
  });
};

export const verify2FA = async (code: string): Promise<{ success: boolean }> => {
  return apiRequest<{ success: boolean }>({
    url: '/api/v1/admin/settings/security/2fa/verify',
    method: 'POST',
    data: { code },
  });
};

// Role Management API
export const getAllRoles = async () => {
  return apiRequest({
    url: '/api/v1/admin/roles',
    method: 'GET',
  });
};

export const getRoleById = async (id: string) => {
  return apiRequest({
    url: `/api/v1/admin/roles/${id}`,
    method: 'GET',
  });
};

export const createRole = async (data: { name: string; description: string; permissions: string[] }) => {
  return apiRequest({
    url: '/api/v1/admin/roles',
    method: 'POST',
    data,
  });
};

export const updateRole = async (id: string, data: { name?: string; description?: string; permissions?: string[] }) => {
  return apiRequest({
    url: `/api/v1/admin/roles/${id}`,
    method: 'PUT',
    data,
  });
};

export const deleteRole = async (id: string) => {
  return apiRequest({
    url: `/api/v1/admin/roles/${id}`,
    method: 'DELETE',
  });
};

export const assignPermissionsToRole = async (roleId: string, permissionIds: string[]) => {
  return apiRequest({
    url: `/api/v1/admin/roles/${roleId}/permissions`,
    method: 'POST',
    data: { permissionIds },
  });
};

export const removePermissionsFromRole = async (roleId: string, permissionIds: string[]) => {
  return apiRequest({
    url: `/api/v1/admin/roles/${roleId}/permissions`,
    method: 'DELETE',
    data: { permissionIds },
  });
};

// Permission Management API
export const getAllPermissions = async () => {
  return apiRequest({
    url: '/api/v1/admin/permissions',
    method: 'GET',
  });
};

// Commission Settings API
export const getCommissionSettings = async () => {
  return apiRequest({
    url: '/api/v1/admin/commission/settings',
    method: 'GET',
  });
};

export const updateCommissionSettings = async (settings: Record<string, unknown>) => {
  return apiRequest({
    url: '/api/v1/admin/commission/settings',
    method: 'PUT',
    data: settings,
  });
};