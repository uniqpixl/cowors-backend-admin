/**
 * Common API response interfaces and error types
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  timestamp?: string;
  requestId?: string;
}

/**
 * API error response
 */
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
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Cursor-based pagination metadata
 */
export interface CursorPaginationMeta {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
  totalCount?: number;
}

/**
 * Cursor-based paginated response
 */
export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: CursorPaginationMeta;
}

/**
 * Base query parameters for pagination
 */
export interface BaseQueryDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Cursor-based query parameters
 */
export interface CursorQueryDto {
  first?: number;
  last?: number;
  after?: string;
  before?: string;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: ServiceHealthStatus[];
}

/**
 * Service health status
 */
export interface ServiceHealthStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  lastChecked: string;
  details?: Record<string, any>;
}

/**
 * Analytics time range
 */
export enum AnalyticsTimeRange {
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

/**
 * Analytics query parameters
 */
export interface AnalyticsQueryDto {
  timeRange?: AnalyticsTimeRange;
  startDate?: string;
  endDate?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  filters?: Record<string, any>;
}

/**
 * Platform statistics interface
 */
export interface PlatformStats {
  users: {
    total: number;
    active: number;
    new: number;
    verified: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  spaces: {
    total: number;
    active: number;
    inactive: number;
  };
  partners: {
    total: number;
    active: number;
    pending: number;
  };
}

/**
 * Dashboard KPIs interface
 */
export interface DashboardKPIs {
  totalUsers: number;
  activeUsers: number;
  totalBookings: number;
  totalRevenue: number;
  totalSpaces: number;
  activeSpaces: number;
  totalPartners: number;
  verifiedPartners: number;
  userGrowthRate: number;
  revenueGrowthRate: number;
  bookingGrowthRate: number;
  averageBookingValue: number;
  occupancyRate: number;
  customerSatisfactionScore: number;
}

/**
 * Standard error codes
 */
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',
  SPACE_UNAVAILABLE = 'SPACE_UNAVAILABLE',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_BANNED = 'USER_BANNED',
  KYC_REQUIRED = 'KYC_REQUIRED',
  VERIFICATION_PENDING = 'VERIFICATION_PENDING',
}

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
  constraint?: string;
}