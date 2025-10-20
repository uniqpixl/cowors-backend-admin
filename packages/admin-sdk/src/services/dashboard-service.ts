import { BaseApiClient } from '../client/base-client';

/**
 * Dashboard KPI data interface
 */
export interface DashboardKPIs {
  totalUsers: number;
  totalPartners: number;
  totalBookings: number;
  totalRevenue: number;
  growthStats: {
    usersGrowth: number;
    partnersGrowth: number;
    bookingsGrowth: number;
    revenueGrowth: number;
  };
}

/**
 * Admin Dashboard Service
 * Provides access to dashboard analytics and KPIs
 */
export class AdminDashboardService {
  constructor(private client: BaseApiClient) {}

  /**
   * Get dashboard KPIs
   */
  async getKPIs(): Promise<DashboardKPIs> {
    return this.client.get<DashboardKPIs>('/admin/dashboard/kpis');
  }

  /**
   * Get dashboard analytics data
   */
  async getAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<any> {
    return this.client.get(`/admin/dashboard/analytics?period=${period}`);
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit: number = 10): Promise<any[]> {
    return this.client.get(`/admin/dashboard/activities?limit=${limit}`);
  }
}