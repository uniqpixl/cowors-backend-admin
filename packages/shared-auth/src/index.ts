// Core authentication exports
export { getFrontendAuthOptions, getPartnerAuthOptions, getAdminAuthOptions } from './nextauth'

// Export createSharedAuthOptions separately to avoid bundling conflicts
import { createSharedAuthOptions as _createSharedAuthOptions } from './nextauth'
export const createSharedAuthOptions = _createSharedAuthOptions
export { refreshAccessToken, jwtCallbackWithRefresh, sessionCallbackWithRefresh, handleAuthError, handleAuthErrorRedirect, enrichJWTWithRoles, getUserRoles, getUserPermissions, getUserMetadata, isTokenExpired } from './refresh'
export type { EnhancedUser, EnhancedJWT, EnhancedSession } from './refresh'

// Enterprise features exports
export {
  auditSignIn,
  auditSignOut,
  auditSessionCreated,
  auditSessionUpdated,
  auditAuthError,
  auditMigrationEvent,
  trackSignIn,
  trackSignOut,
  trackAuthError,
  updateActiveSessionCount,
  getAuthMetrics,
  setAuditLogger,
  getAuditLogger,
  validateSession,
  validateCrossAppSession
} from './audit'
export type { AuditEvent, AuditLogger } from './audit'

export {
  getFeatureFlags,
  isFeatureEnabled,
  shouldUseEnhancedJWT,
  shouldValidateCrossApp,
  shouldAuditLog,
  shouldRefreshSessions
} from './features'

// Export initializeFeatureFlags separately to avoid bundling conflicts
import { initializeFeatureFlags as _initializeFeatureFlags } from './features'
export const initializeFeatureFlags = _initializeFeatureFlags
export type { FeatureFlag, FeatureFlagKey, FeatureFlagConfig, MigrationShim } from './features'

export {
  isInMigrationMode,
  shouldMaintainLegacyCompatibility,
  shouldFallbackToLegacy,
  getMigrationPhase,
  setMigrationPhase,
  executeMigrationShim,
  shouldUseNewFeature,
  incrementRolloutPercentage,
  rollbackMigration,
  completeMigration,
  getMigrationStatus,
  validateAuthConfiguration
} from './migration'

// Export initializeMigration separately to avoid bundling conflicts
import { initializeMigration as _initializeMigration } from './migration'
export const initializeMigration = _initializeMigration

// Utility exports
export { 
  validateToken, 
  hasRole, 
  hasAnyRole, 
  hasPermission, 
  canAccess, 
  ROLE_PERMISSIONS 
} from './utils'

// Legacy compatibility exports
export const createAuthOptions = _createSharedAuthOptions

// Default export
export default {
  createSharedAuthOptions,
  initializeFeatureFlags: _initializeFeatureFlags,
  initializeMigration: _initializeMigration
}