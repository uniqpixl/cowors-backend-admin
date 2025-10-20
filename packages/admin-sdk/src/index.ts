/**
 * @cowors/admin-sdk
 * 
 * Admin SDK for Cowors applications with type-safe API client and authentication
 * Provides admin services, authentication, and error handling
 */

// Core client
export { BaseApiClient } from './client/base-client';
export type { ApiClientConfig, ApiResponse, ApiError } from './client/base-client';

// Authentication
export * from './auth';

// Services
export * from './services';

// Re-export commonly used types
export type { AdminSession } from './client/base-client';