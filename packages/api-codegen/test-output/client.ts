import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { schemas } from './schemas';

export interface AdminAPIConfig {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class AdminAPI {
  private client: AxiosInstance;

  constructor(config: AdminAPIConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      timeout: config.timeout || 30000,
    });

    // Request interceptor for auth tokens
    this.client.interceptors.request.use((config) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // Override this method to provide authentication token
    return null;
  }

  // API Endpoints
  async AdminController_getAllUsers(query?: { query?: string; status?: string; role?: string; emailVerified?: boolean; createdAfter?: string; createdBefore?: string; lastLoginAfter?: string; sortBy?: string; sortOrder?: string; page?: number; limit?: number }, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/users`, { ...config, params: query });
  }

  async AdminController_getUserById(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/users/${id}`, config);
  }

  async AdminController_updateUser(id: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.put(`/admin/users/${id}`, data, config);
  }

  async AdminController_updateUserRoleByEmail(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/users/update-role-by-email`, config);
  }

  async AdminController_banUser(id: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/users/${id}/ban`, data, config);
  }

  async AdminController_suspendUser(id: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/users/${id}/suspend`, data, config);
  }

  async AdminController_reactivateUser(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/users/${id}/reactivate`, config);
  }

  async AdminController_getPlatformStats(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/analytics/platform-stats`, config);
  }

  async AdminController_getBookingAnalytics(query?: { startDate?: string; endDate?: string; timeframe?: string; partnerId?: string; spaceId?: string }, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/analytics/bookings`, { ...config, params: query });
  }

  async AdminController_getUserAnalytics(query?: { startDate?: string; endDate?: string; timeframe?: string; partnerId?: string; spaceId?: string }, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/analytics/users`, { ...config, params: query });
  }

  async AdminController_getRevenueAnalytics(query?: { startDate?: string; endDate?: string; timeframe?: string; partnerId?: string; spaceId?: string }, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/analytics/revenue`, { ...config, params: query });
  }

  async AdminController_getPendingSpaces(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/spaces/pending`, config);
  }

  async AdminController_getUserStats(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/users/stats`, config);
  }

  async AdminController_verifyUser(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/users/${id}/verify`, config);
  }

  async AdminController_rejectVerification(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/users/${id}/reject-verification`, config);
  }

  async AdminController_getAllVerifications(query?: { page?: number; limit?: number; status?: string; provider?: string; verificationType?: string; riskLevel?: string; search?: string; dateFrom?: string; dateTo?: string; minCost?: number; maxCost?: number; fraudAlertsOnly?: boolean; bookingId?: string; sortBy?: string; sortOrder?: string }, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/users/verification`, { ...config, params: query });
  }

  async AdminController_getUserVerification(userId: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/users/${userId}/verification`, config);
  }

  async AdminController_reviewVerification(userId: string, verificationId: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/users/${userId}/verification/${verificationId}/review`, config);
  }

  async AdminController_getVerificationStats(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/users/verification/stats`, config);
  }

  async AdminController_getKycProviderStats(query?: { provider?: any; dateFrom?: string; dateTo?: string }, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/kyc/providers/stats`, { ...config, params: query });
  }

  async AdminController_getKycProviders(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/kyc/providers`, config);
  }

  async AdminController_bulkReviewKyc(data: any, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/kyc/bulk-review`, data, config);
  }

  async AdminController_getUserDocuments(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/users/${id}/documents`, config);
  }

  async AdminController_requestDocuments(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/users/${id}/request-documents`, config);
  }

  async AdminController_reviewDocument(userId: string, documentId: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/users/${userId}/documents/${documentId}/review`, config);
  }

  async AdminController_addFlag(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/users/${id}/flags`, config);
  }

  async AdminController_updateFlag(userId: string, flagId: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.put(`/admin/users/${userId}/flags/${flagId}`, config);
  }

  async AdminController_removeFlag(userId: string, flagId: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.delete(`/admin/users/${userId}/flags/${flagId}`, config);
  }

  async AdminController_getLatestBookings(query?: { limit: string }, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/bookings/latest`, { ...config, params: query });
  }

  async AdminController_getUserBookings(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/users/${id}/bookings`, config);
  }

  async AdminController_getUserPayments(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/users/${id}/payments`, config);
  }

  async AdminController_sendNotification(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/users/${id}/notifications`, config);
  }

  async AdminController_bulkSendNotification(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/users/bulk-notifications`, config);
  }

  async AdminController_exportUsers(query?: { query?: string; status?: string; role?: string; emailVerified?: boolean; createdAfter?: string; createdBefore?: string; lastLoginAfter?: string; sortBy?: string; sortOrder?: string; page?: number; limit?: number }, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/users/export`, { ...config, params: query });
  }

  async AdminController_bulkUpdateStatus(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/users/bulk-update-status`, config);
  }

  async AdminController_searchUsers(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/users/search`, config);
  }

  async AdminController_getFinancialStats(query?: { period: string }, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/financial/stats`, { ...config, params: query });
  }

  async AdminController_getSupportStats(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/support/stats`, config);
  }

  async AdminController_getUserActivityData(query?: { startDate?: string; endDate?: string; timeframe?: string; partnerId?: string; spaceId?: string }, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/analytics/users/activity`, { ...config, params: query });
  }

  async AdminController_getUserSegments(query?: { startDate?: string; endDate?: string; timeframe?: string; partnerId?: string; spaceId?: string }, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/analytics/users/segments`, { ...config, params: query });
  }

  async AdminController_getTopUsers(query?: { startDate?: string; endDate?: string; timeframe?: string; partnerId?: string; spaceId?: string }, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/analytics/users/top-users`, { ...config, params: query });
  }

  async AdminController_getUserMetrics(query?: { startDate?: string; endDate?: string; timeframe?: string; partnerId?: string; spaceId?: string }, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/analytics/users/metrics`, { ...config, params: query });
  }

  async AdminController_getDashboardKpis(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/dashboard/kpis`, config);
  }

  async AdminController_getDashboardNotifications(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/dashboard/notifications`, config);
  }

  async AdminController_getDashboardStats(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/dashboard/stats`, config);
  }

  async AdminController_markNotificationAsRead(notificationId: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.patch(`/admin/dashboard/notifications/${notificationId}/read`, config);
  }

  async AdminController_markAllNotificationsAsRead(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.patch(`/admin/dashboard/notifications/read-all`, config);
  }

  async AdminController_getSystemHealth(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/system/health`, config);
  }

  async AdminPartnerController_getAllPartners(query?: { limit?: number; page?: number; q?: string; order?: string; search?: string; businessType?: string; status?: string; verificationStatus?: string }, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/partners`, { ...config, params: query });
  }

  async AdminPartnerController_getPartnerStats(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/partners/stats`, config);
  }

  async AdminPartnerController_getPartner(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/partners/${id}`, config);
  }

  async AdminPartnerController_deletePartner(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.delete(`/admin/partners/${id}`, config);
  }

  async AdminPartnerController_updatePartnerStatus(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.patch(`/admin/partners/${id}/status`, config);
  }

  async AdminPartnerController_approvePartner(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/partners/${id}/approve`, config);
  }

  async AdminPartnerController_rejectPartner(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/partners/${id}/reject`, config);
  }

  async AdminPartnerController_requestDocuments(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/partners/${id}/request-documents`, config);
  }

  async AdminPartnerController_getPartnerDocuments(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/partners/${id}/documents`, config);
  }

  async AdminPartnerController_reviewDocument(partnerId: string, documentId: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.patch(`/admin/partners/${partnerId}/documents/${documentId}`, config);
  }

  async AdminPartnerController_updateSubscription(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.patch(`/admin/partners/${id}/subscription`, config);
  }

  async AdminPartnerController_suspendPartner(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/partners/${id}/suspend`, config);
  }

  async AdminPartnerController_reactivatePartner(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/partners/${id}/reactivate`, config);
  }

  async AdminPartnerController_exportPartners(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.get(`/admin/partners/export`, config);
  }

  async AdminPartnerController_sendNotification(id: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/partners/${id}/notify`, config);
  }

  async AdminPartnerController_bulkUpdateStatus(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/partners/bulk/status`, config);
  }

  async AdminPartnerController_bulkSendNotification(config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.client.post(`/admin/partners/bulk/notify`, config);
  }
}

export default AdminAPI;
