import { BaseApiClient } from '../client/base-client';

/**
 * User data interface  
 */
export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  kycStatus?: string;
}

/**
 * User list response
 */
export interface UserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Admin User Service
 * Provides access to user management operations
 */
export class AdminUserService {
  constructor(private client: BaseApiClient) {}

  /**
   * Get paginated list of users
   */
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  } = {}): Promise<UserListResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.client.get<UserListResponse>(`/admin/users?${queryParams.toString()}`);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<AdminUser> {
    return this.client.get<AdminUser>(`/admin/users/${id}`);
  }

  /**
   * Update user role
   */
  async updateUserRole(id: string, role: string): Promise<AdminUser> {
    return this.client.put<AdminUser>(`/admin/users/${id}/role`, { role });
  }

  /**
   * Update user status
   */
  async updateUserStatus(id: string, status: string): Promise<AdminUser> {
    return this.client.put<AdminUser>(`/admin/users/${id}/status`, { status });
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    return this.client.delete(`/admin/users/${id}`);
  }
}