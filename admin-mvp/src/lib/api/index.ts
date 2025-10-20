// Main API exports for admin application
export { apiClient } from './client';
export * from './client';
export * from './types';

// Service exports
export { AdminAPI } from './services/admin';
export { KycVerificationService } from './services/kyc';

// Re-export everything for convenience
export * from './services/admin';
export * from './services/kyc';