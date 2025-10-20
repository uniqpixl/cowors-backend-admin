import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Local UserRole enum for now - will be replaced with shared types
enum UserRole {
  User = 'User',
  Partner = 'Partner',
  Admin = 'Admin',
  SuperAdmin = 'SuperAdmin',
  Moderator = 'Moderator',
}

// Auth types (simplified for now)
export interface AdminSession {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  session: {
    token: string;
  };
}

// Simple getSession function type
type GetSessionFunction = () => Promise<{ data: AdminSession | null }>;

// Placeholder auth function - will be replaced with proper Better Auth integration
const getSession: GetSessionFunction = async () => {
  // This will be replaced with actual Better Auth getSession
  return { data: null };
};

// Base API error interface
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  timestamp?: string;
  requestId?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
  statusCode: number;
  timestamp: string;
  requestId?: string;
  details?: Record<string, any>;
}

/**
 * Configuration for the API client
 */
export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  onError?: (error: ApiError) => void;
  onUnauthorized?: () => void;
  onForbidden?: () => void;
}

/**
 * Helper function to check admin access from any session type
 */
const hasAdminAccess = (session: AdminSession | null): boolean => {
  if (!session?.user) return false;
  const role = session.user.role;
  return role === UserRole.Admin || role === UserRole.SuperAdmin;
};

/**
 * Base API Client with authentication, error handling, and retry logic
 */
export class BaseApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || 'http://localhost:5001',
      timeout: config.timeout || 15000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      enableLogging: config.enableLogging ?? true,
      ...config
    };

    this.client = this.createAxiosInstance();
    this.setupInterceptors();
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for Better Auth cookies
    });
  }

  private setupInterceptors(): void {
    // Request interceptor for adding auth tokens
    this.client.interceptors.request.use(
      async (config: any) => {
        // Get session from Better Auth
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (this.config.enableLogging) {
          console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
      },
      (error: any) => {
        if (this.config.enableLogging) {
          console.error('API Request Error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling common errors
    this.client.interceptors.response.use(
      (response: any) => {
        if (this.config.enableLogging) {
          console.log(`API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      async (error: any) => {
        return this.handleResponseError(error);
      }
    );
  }

  private async handleResponseError(error: any): Promise<never> {
    // Handle different error scenarios
    if (error.response?.status === 401) {
      // Handle unauthorized - check if user has valid session
      console.warn('API: Authentication required for this endpoint');
      
      if (this.config.onUnauthorized) {
        this.config.onUnauthorized();
      }
    } else if (error.response?.status === 403) {
      console.warn('API: Forbidden access - insufficient permissions');
      
      if (this.config.onForbidden) {
        this.config.onForbidden();
      }
    } else if (error.response?.status === 429) {
      console.warn('API: Rate limit exceeded');
    } else if (error.response?.status >= 500) {
      console.error('API: Server error');
    } else if (!error.response) {
      console.error('API: Network error');
    }

    if (this.config.onError) {
      const apiError: ApiError = {
        success: false,
        message: error.response?.data?.message || error.message || 'An error occurred',
        errors: error.response?.data?.errors || [],
        statusCode: error.response?.status || 0,
        timestamp: new Date().toISOString(),
        requestId: error.response?.data?.requestId,
      };
      this.config.onError(apiError);
    }

    return Promise.reject(error);
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        return null; // Skip auth on server side
      }
      
      const { data: session } = await getSession();
      
      // Validate admin access before providing token
      if (session && !hasAdminAccess(session)) {
        console.warn('User session exists but lacks admin privileges');
        return null;
      }
      
      // Better Auth typically uses session tokens via cookies
      // The session token should be automatically sent via cookies
      // but we can also extract it for explicit Authorization headers
      if (session?.session?.token) {
        return session.session.token;
      }
      
      // Fallback: try to extract from cookies if session token exists
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('better-auth.session_token='))
        ?.split('=')[1];
      
      return sessionCookie || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  public async validateAdminSession(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        return false; // Server side, cannot validate
      }
      
      const { data: session } = await getSession();
      return hasAdminAccess(session);
    } catch (error) {
      // Use console.warn instead of console.error for 401 responses to avoid unhandled error exceptions
      console.warn('Error validating admin session:', error);
      return false;
    }
  }

  public handleApiResponse<T>(response: any): T {
    return response.data;
  }

  /**
   * Helper function to handle API errors
   */
  public handleApiError(error: any): never {
    if (error.response) {
      // Server responded with error status
      const apiError: ApiError = {
        success: false,
        message: error.response.data?.message || 'An error occurred',
        errors: error.response.data?.errors || [],
        statusCode: error.response.status,
        timestamp: new Date().toISOString(),
        requestId: error.response.data?.requestId,
      };
      throw apiError;
    } else if (error.request) {
      // Request was made but no response received
      const networkError: ApiError = {
        success: false,
        message: 'Network error - please check your connection',
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
      throw networkError;
    } else {
      // Something else happened
      const unknownError: ApiError = {
        success: false,
        message: error.message || 'An unexpected error occurred',
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
      throw unknownError;
    }
  }

  public async apiRequest<T>(
    config: any,
    requireAdmin: boolean = true
  ): Promise<T> {
    try {
      // Validate admin session if required
      if (requireAdmin && typeof window !== 'undefined') {
        const isValidAdmin = await this.validateAdminSession();
        if (!isValidAdmin) {
          const adminError: ApiError = {
            success: false,
            message: 'Admin access required for this operation',
            statusCode: 403,
            timestamp: new Date().toISOString(),
          };
          throw adminError;
        }
      }
      
      const response: AxiosResponse<T> = await this.client.request<T>(config);
      return this.handleApiResponse(response);
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Convenience method for admin API calls
   */
  public async adminApiRequest<T>(config: any): Promise<T> {
    return this.apiRequest<T>(config, true);
  }

  /**
   * Convenience method for public API calls (no admin validation)
   */
  public async publicApiRequest<T>(config: any): Promise<T> {
    return this.apiRequest<T>(config, false);
  }

  /**
   * GET request
   */
  public async get<T>(url: string, config?: any): Promise<T> {
    return this.adminApiRequest<T>({ ...config, method: 'GET', url });
  }

  /**
   * POST request
   */
  public async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.adminApiRequest<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * PUT request
   */
  public async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.adminApiRequest<T>({ ...config, method: 'PUT', url, data });
  }

  /**
   * PATCH request
   */
  public async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.adminApiRequest<T>({ ...config, method: 'PATCH', url, data });
  }

  /**
   * DELETE request
   */
  public async delete<T>(url: string, config?: any): Promise<T> {
    return this.adminApiRequest<T>({ ...config, method: 'DELETE', url });
  }

  /**
   * Get the underlying axios instance for advanced usage
   */
  public getAxiosInstance(): any {
    return this.client;
  }
}