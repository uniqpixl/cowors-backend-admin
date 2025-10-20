import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getAuthToken } from './auth';

// Define the DashboardKPIs type that matches the backend PlatformStatsDto
export interface DashboardKPIs {
  totalUsers: number;
  totalPartners: number;
  totalSpaces: number;
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  newUsersThisMonth: number;
  newPartnersThisMonth: number;
  bookingsThisMonth: number;
  revenueThisMonth: number;
  averageBookingValue: number;
  platformCommission: number;
}

// Define analytics types
export interface PlatformStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  activeSpaces: number;
}

export interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  period?: string;
}

export interface BookingAnalytics {
  totalBookings: number;
  bookingGrowth: number;
  averageBookingValue: number;
}

export interface UserAnalytics {
  totalUsers: number;
  userGrowth: number;
  activeUsers: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueGrowth: number;
  averageRevenuePerUser: number;
}

// Note: getAuthToken is now imported from './auth' to use the centralized auth logic

/**
 * Custom AdminAPI client that integrates with our custom auth session management
 */
export class AdminAPI {
  private client: AxiosInstance;

  constructor(config: { baseURL: string; timeout?: number }) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for our auth cookies
    });

    // Request interceptor for logging (auth tokens will be added manually when needed)
    this.client.interceptors.request.use(
      async (config) => {
        // Note: Auth token is now added manually in specific API calls to avoid circular dependency
        // with NextAuth session fetching
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling common errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        // Handle different error scenarios
        if (error.response?.status === 401) {
          console.warn('API: Authentication required for this endpoint');
        } else if (error.response?.status === 403) {
          console.warn('API: Forbidden access - insufficient permissions');
        } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR' || !error.response) {
          console.warn('API: Network connectivity issue - backend server may be down');
        } else if (error.response?.status >= 500) {
          console.error('API: Server error occurred');
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Helper method to add auth token to request config
   */
  private async addAuthToken(config: any): Promise<any> {
    try {
      const token = await getAuthToken();
      if (token) {
        console.log('addAuthToken - token length:', token.length);
        console.log('addAuthToken - full token:', token);
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        };
      }
    } catch (error) {
      console.error('Error adding auth token:', error);
    }
    return config;
  }

  /**
   * Make authenticated request
   */
  private async makeAuthenticatedRequest(method: string, url: string, data?: any, config?: any): Promise<any> {
    const requestConfig = await this.addAuthToken(config || {});
    
    switch (method.toLowerCase()) {
      case 'get':
        return this.client.get(url, requestConfig);
      case 'post':
        return this.client.post(url, data, requestConfig);
      case 'put':
        return this.client.put(url, data, requestConfig);
      case 'delete':
        return this.client.delete(url, requestConfig);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  /**
   * Get dashboard KPIs with proper typing
   */
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    try {
      const response = await this.makeAuthenticatedRequest('get', '/api/v1/admin/dashboard/kpis');
      return response.data as DashboardKPIs;
    } catch (error) {
      console.warn('Error fetching dashboard KPIs:', error);
      throw error;
    }
  }
  
  /**
   * Get all users with query parameters
   */
  async getAllUsers(query?: Record<string, unknown>): Promise<AxiosResponse<unknown>> {
    return this.makeAuthenticatedRequest('get', '/api/v1/admin/users', null, { params: query });
  }
  
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<AxiosResponse<unknown>> {
    return this.makeAuthenticatedRequest('get', `/api/v1/admin/users/${id}`);
  }
  
  /**
   * Update user by ID
   */
  async updateUser(id: string, data: Record<string, unknown>): Promise<AxiosResponse<unknown>> {
    return this.makeAuthenticatedRequest('put', `/api/v1/admin/users/${id}`, data);
  }
  
  /**
   * Ban user by ID
   */
  async banUser(id: string, data: Record<string, unknown>): Promise<AxiosResponse<unknown>> {
    return this.makeAuthenticatedRequest('post', `/api/v1/admin/users/${id}/ban`, data);
  }
  
  /**
   * Suspend user by ID
   */
  async suspendUser(id: string, data: Record<string, unknown>): Promise<AxiosResponse<unknown>> {
    return this.makeAuthenticatedRequest('post', `/api/v1/admin/users/${id}/suspend`, data);
  }
  
  /**
   * Reactivate user by ID
   */
  async reactivateUser(id: string): Promise<AxiosResponse<unknown>> {
    return this.makeAuthenticatedRequest('post', `/api/v1/admin/users/${id}/reactivate`);
  }
  
  /**
   * Get platform stats
   */
  async getPlatformStats(): Promise<PlatformStats> {
    const response = await this.makeAuthenticatedRequest('get', '/api/v1/admin/analytics/platform-stats');
    return response.data;
  }
  
  /**
   * Get booking analytics
   */
  async getBookingAnalytics(query?: AnalyticsQuery): Promise<BookingAnalytics> {
    const response = await this.makeAuthenticatedRequest('get', '/api/v1/admin/analytics/bookings', null, { params: query });
    return response.data;
  }
  
  /**
   * Get user analytics
   */
  async getUserAnalytics(query?: AnalyticsQuery): Promise<UserAnalytics> {
    const response = await this.makeAuthenticatedRequest('get', '/api/v1/admin/analytics/users', null, { params: query });
    return response.data;
  }
  
  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(query?: AnalyticsQuery): Promise<RevenueAnalytics> {
    const response = await this.makeAuthenticatedRequest('get', '/api/v1/admin/analytics/revenue', null, { params: query });
    return response.data;
  }

  /**
   * Get activity feed
   */
  async getActivityFeed(): Promise<any[]> {
    const response = await this.makeAuthenticatedRequest('get', '/api/v1/admin/activity/feed');
    return response.data;
  }
}

// Create a singleton instance of the AdminAPI client
export const adminAPI = new AdminAPI({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  timeout: 15000,
});

export default adminAPI;