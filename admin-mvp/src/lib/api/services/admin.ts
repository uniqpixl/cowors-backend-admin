import { apiRequest } from '../client';
import {
  AdminUser,
  AdminUserQuery,
  AdminUserUpdate,
  AdminUserBan,
  AdminUserSuspend,
  PaginatedResponse,
  DashboardKPIs,
  PlatformStats,
  BookingAnalytics,
  UserAnalytics,
  RevenueAnalytics,
  GSTData,
  TDSData,
  TCSData,
  BookingTimelineEvent,
  BookingNote,
  CreateBookingNoteRequest,
} from '../types';

// Category Analytics Types
export interface CategoryUsageAnalytics {
  categoryId: string;
  categoryName: string;
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  conversionRate: number;
  popularityScore: number;
  growthRate: number;
  lastUpdated: string;
}

export interface CategoryPerformanceMetrics {
  categoryId: string;
  categoryName: string;
  partnersCount: number;
  subcategoriesCount: number;
  averageRating: number;
  totalViews: number;
  clickThroughRate: number;
  bookingConversionRate: number;
}

// Admin Dashboard API Services
export class AdminDashboardService {
  // Get dashboard KPIs (main dashboard stats)
  static async getDashboardKPIs(): Promise<DashboardKPIs> {
    return apiRequest<DashboardKPIs>({
      method: 'GET',
      url: '/api/v1/admin/dashboard/kpis',
    });
  }

  // Get platform statistics
  static async getPlatformStats(): Promise<PlatformStats> {
    return apiRequest<PlatformStats>({
      method: 'GET',
      url: '/api/v1/admin/analytics/platform-stats',
    });
  }

  // Get booking analytics
  static async getBookingAnalytics(timeRange?: string): Promise<BookingAnalytics> {
    const timeframe = timeRange === 'weekly' ? 'weekly' : 
                     timeRange === 'monthly' ? 'monthly' : 
                     timeRange === 'yearly' ? 'yearly' : 'daily';
    console.log('getBookingAnalytics: timeRange=', timeRange, 'timeframe=', timeframe);
    return apiRequest<BookingAnalytics>({
      method: 'GET',
      url: '/api/v1/admin/analytics/bookings',
      params: timeRange ? { timeframe } : undefined,
    });
  }

  // Get user analytics
  static async getUserAnalytics(timeRange?: string): Promise<UserAnalytics> {
    const timeframe = timeRange === 'weekly' ? 'weekly' : 
                     timeRange === 'monthly' ? 'monthly' : 
                     timeRange === 'yearly' ? 'yearly' : 'daily';
    console.log('getUserAnalytics: timeRange=', timeRange, 'timeframe=', timeframe);
    return apiRequest<UserAnalytics>({
      method: 'GET',
      url: '/api/v1/admin/analytics/users',
      params: timeRange ? { timeframe } : undefined,
    });
  }

  // Get revenue analytics
  static async getRevenueAnalytics(timeRange?: string): Promise<RevenueAnalytics> {
    const timeframe = timeRange === 'weekly' ? 'weekly' : 
                     timeRange === 'monthly' ? 'monthly' : 
                     timeRange === 'yearly' ? 'yearly' : 'daily';
    console.log('getRevenueAnalytics: timeRange=', timeRange, 'timeframe=', timeframe);
    return apiRequest<RevenueAnalytics>({
      method: 'GET',
      url: '/api/v1/admin/analytics/revenue',
      params: timeRange ? { timeframe } : undefined,
    });
  }
}

// Admin User Management API Services
export class AdminUserService {
  // Get all users with filtering and pagination
  static async getAllUsers(query?: AdminUserQuery): Promise<PaginatedResponse<AdminUser>> {
    // Convert frontend query parameters to backend expected parameters
    const backendQuery: Record<string, any> = {};
    
    if (query) {
      // Direct mappings
      if (query.page !== undefined) backendQuery.page = query.page;
      if (query.limit !== undefined) backendQuery.limit = query.limit;
      if (query.role !== undefined) backendQuery.role = query.role;
      if (query.status !== undefined) backendQuery.status = query.status;
      if (query.sortOrder !== undefined) backendQuery.sortOrder = query.sortOrder;
      
      // Renamed mappings
      if (query.search !== undefined) backendQuery.query = query.search;
      if (query.startDate !== undefined) backendQuery.createdAfter = query.startDate;
      if (query.endDate !== undefined) backendQuery.createdBefore = query.endDate;
      if (query.sortBy === 'lastLoginAt') {
        backendQuery.sortBy = 'lastLoginAt';
      } else if (query.sortBy === 'email') {
        backendQuery.sortBy = 'email';
      } else {
        backendQuery.sortBy = 'createdAt'; // default
      }
      
      // Note: kycStatus is not supported by backend API
    }
    
    console.log('getAllUsers: frontend query=', query, 'backend query=', backendQuery);
    
    return apiRequest<PaginatedResponse<AdminUser>>({
      method: 'GET',
      url: '/api/v1/admin/users',
      params: backendQuery,
    });
  }

  // Get user by ID
  static async getUserById(id: string): Promise<AdminUser> {
    return apiRequest<AdminUser>({
      method: 'GET',
      url: `/api/v1/admin/users/${id}`,
    });
  }

  // Update user details
  static async updateUser(id: string, updates: AdminUserUpdate): Promise<AdminUser> {
    return apiRequest<AdminUser>({
      method: 'PUT',
      url: `/api/v1/admin/users/${id}`,
      data: updates,
    });
  }

  // Update user role by email (temporary endpoint)
  static async updateUserRoleByEmail(email: string, role: string): Promise<AdminUser> {
    return apiRequest<AdminUser>({
      method: 'POST',
      url: '/api/v1/admin/users/update-role-by-email',
      data: { email, role },
    });
  }

  // Ban user
  static async banUser(id: string, banData: AdminUserBan): Promise<AdminUser> {
    return apiRequest<AdminUser>({
      method: 'POST',
      url: `/api/v1/admin/users/${id}/ban`,
      data: banData,
    });
  }

  // Suspend user
  static async suspendUser(id: string, suspendData: AdminUserSuspend): Promise<AdminUser> {
    return apiRequest<AdminUser>({
      method: 'POST',
      url: `/api/v1/admin/users/${id}/suspend`,
      data: suspendData,
    });
  }

  // Reactivate user
  static async reactivateUser(id: string): Promise<AdminUser> {
    return apiRequest<AdminUser>({
      method: 'POST',
      url: `/api/v1/admin/users/${id}/reactivate`,
    });
  }
}

// Admin Category Analytics API Services
export class AdminCategoryService {
  // Get category usage analytics
  static async getCategoryUsageAnalytics(): Promise<CategoryUsageAnalytics[]> {
    return apiRequest<CategoryUsageAnalytics[]>({
      method: 'GET',
      url: '/api/v1/admin/partner-categories/usage-analytics',
    });
  }

  // Get category performance metrics (using usage-analytics endpoint)
  static async getCategoryPerformanceMetrics(): Promise<CategoryPerformanceMetrics[]> {
    return apiRequest<CategoryPerformanceMetrics[]>({
      method: 'GET',
      url: '/api/v1/admin/partner-categories/usage-analytics',
    });
  }

  // Track category interaction
  static async trackCategoryInteraction(
    categoryId: string,
    interactionType: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return apiRequest<void>({
      method: 'POST',
      url: `/api/v1/admin/partner-categories/${categoryId}/track-interaction`,
      data: {
        interactionType,
        metadata,
      },
    });
  }

  // Get category analytics by ID
  static async getCategoryAnalyticsById(categoryId: string): Promise<{
    usage: CategoryUsageAnalytics;
    performance: CategoryPerformanceMetrics;
  }> {
    return apiRequest<{
      usage: CategoryUsageAnalytics;
      performance: CategoryPerformanceMetrics;
    }>({
      method: 'GET',
      url: `/api/v1/admin/partner-categories/${categoryId}/analytics`,
    });
  }
}

// Admin Booking Management API Services
export class AdminBookingService {
  // Get booking timeline events
  static async getBookingTimeline(bookingId: string): Promise<BookingTimelineEvent[]> {
    return apiRequest<BookingTimelineEvent[]>({
      method: 'GET',
      url: `/api/v1/admin/bookings/${bookingId}/timeline`,
    });
  }

  // Get booking notes
  static async getBookingNotes(bookingId: string): Promise<BookingNote[]> {
    return apiRequest<BookingNote[]>({
      method: 'GET',
      url: `/api/v1/admin/bookings/${bookingId}/notes`,
    });
  }

  // Add booking note
  static async addBookingNote(bookingId: string, noteData: CreateBookingNoteRequest): Promise<BookingNote> {
    return apiRequest<BookingNote>({
      method: 'POST',
      url: `/api/v1/admin/bookings/${bookingId}/notes`,
      data: noteData,
    });
  }

  // Update booking note
  static async updateBookingNote(bookingId: string, noteId: string, content: string): Promise<BookingNote> {
    return apiRequest<BookingNote>({
      method: 'PUT',
      url: `/api/v1/admin/bookings/${bookingId}/notes/${noteId}`,
      data: { content },
    });
  }

  // Delete booking note
  static async deleteBookingNote(bookingId: string, noteId: string): Promise<void> {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/api/v1/admin/bookings/${bookingId}/notes/${noteId}`,
    });
  }
}

// Admin Tax Management API Services
export class AdminTaxService {
  // Get GST dashboard data
  static async getGSTData(): Promise<GSTData> {
    return apiRequest<GSTData>({
      method: 'GET',
      url: '/api/v1/admin/taxes/gst',
    });
  }

  // Get TDS dashboard data
  static async getTDSData(): Promise<TDSData> {
    return apiRequest<TDSData>({
      method: 'GET',
      url: '/api/v1/admin/taxes/tds',
    });
  }

  // Get TCS dashboard data
  static async getTCSData(): Promise<TCSData> {
    return apiRequest<TCSData>({
      method: 'GET',
      url: '/api/v1/admin/taxes/tcs',
    });
  }
}

// Combined Admin API class
export class AdminAPI {
  static dashboard = AdminDashboardService;
  static users = AdminUserService;
  static categories = AdminCategoryService;
  static bookings = AdminBookingService;
  static taxes = AdminTaxService;
}

export default AdminAPI;