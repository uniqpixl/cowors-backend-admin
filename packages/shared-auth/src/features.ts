// Feature flag system for gradual auth migration and rollout

export type AppType = 'frontend' | 'partner' | 'admin'

export type FeatureFlagKey = 
  | 'enhanced_jwt_claims'
  | 'cross_app_validation'
  | 'audit_logging'
  | 'session_refresh'
  | 'role_based_access'
  | 'secure_cookies'
  | 'migration_mode'
  | 'legacy_compatibility'
  | 'advanced_monitoring'
  | 'custom_providers'

export interface FeatureFlag {
  key: FeatureFlagKey
  enabled: boolean
  rolloutPercentage?: number
  environments?: string[]
  appTypes?: ('frontend' | 'partner' | 'admin')[]
  description?: string
  dependencies?: FeatureFlagKey[]
}

export interface FeatureFlagConfig {
  flags: Record<FeatureFlagKey, FeatureFlag>
  environment: string
  appType: 'frontend' | 'partner' | 'admin'
  userId?: string
}

// Default feature flag configuration
const defaultFlags: Record<FeatureFlagKey, FeatureFlag> = {
  enhanced_jwt_claims: {
    key: 'enhanced_jwt_claims',
    enabled: true,
    description: 'Enhanced JWT claims with roles and permissions'
  },
  cross_app_validation: {
    key: 'cross_app_validation',
    enabled: true,
    description: 'Cross-application session validation'
  },
  audit_logging: {
    key: 'audit_logging',
    enabled: true,
    description: 'Comprehensive audit logging for auth events'
  },
  session_refresh: {
    key: 'session_refresh',
    enabled: true,
    description: 'Automatic session refresh functionality'
  },
  role_based_access: {
    key: 'role_based_access',
    enabled: true,
    description: 'Role-based access control'
  },
  secure_cookies: {
    key: 'secure_cookies',
    enabled: true,
    description: 'Enhanced cookie security settings'
  },
  migration_mode: {
    key: 'migration_mode',
    enabled: false,
    description: 'Migration mode for gradual rollout',
    rolloutPercentage: 0
  },
  legacy_compatibility: {
    key: 'legacy_compatibility',
    enabled: true,
    description: 'Backward compatibility with legacy auth'
  },
  advanced_monitoring: {
    key: 'advanced_monitoring',
    enabled: false,
    description: 'Advanced monitoring and metrics',
    rolloutPercentage: 25
  },
  custom_providers: {
    key: 'custom_providers',
    enabled: false,
    description: 'Custom authentication providers'
  }
}

// Environment-based overrides
const environmentOverrides: Record<string, Partial<Record<FeatureFlagKey, Partial<FeatureFlag>>>> = {
  development: {
    migration_mode: { enabled: false, rolloutPercentage: 0 },
    advanced_monitoring: { enabled: true, rolloutPercentage: 100 },
    custom_providers: { enabled: true }
  },
  staging: {
    migration_mode: { enabled: true, rolloutPercentage: 50 },
    advanced_monitoring: { enabled: true, rolloutPercentage: 75 }
  },
  production: {
    migration_mode: { enabled: false, rolloutPercentage: 0 },
    advanced_monitoring: { enabled: true, rolloutPercentage: 25 }
  }
}

// App-type specific overrides
const appTypeOverrides: Record<string, Partial<Record<FeatureFlagKey, Partial<FeatureFlag>>>> = {
  admin: {
    advanced_monitoring: { enabled: true, rolloutPercentage: 100 },
    custom_providers: { enabled: true }
  },
  partner: {
    role_based_access: { enabled: true },
    cross_app_validation: { enabled: true }
  },
  frontend: {
    legacy_compatibility: { enabled: true }
  }
}

// Feature flag manager
export class FeatureFlagManager {
  private config: FeatureFlagConfig
  private flags: Record<FeatureFlagKey, FeatureFlag>

  constructor(config: Partial<FeatureFlagConfig> = {}) {
    this.config = {
      flags: defaultFlags,
      environment: process.env.NODE_ENV || 'development',
      appType: 'frontend',
      ...config
    }
    
    this.flags = this.buildFlags()
  }

  private buildFlags(): Record<FeatureFlagKey, FeatureFlag> {
    const flags = { ...defaultFlags }
    
    // Apply environment overrides
    const envOverrides = environmentOverrides[this.config.environment] || {}
    Object.entries(envOverrides).forEach(([key, override]) => {
      if (flags[key as FeatureFlagKey]) {
        flags[key as FeatureFlagKey] = { ...flags[key as FeatureFlagKey], ...override }
      }
    })
    
    // Apply app type overrides
    const appOverrides = appTypeOverrides[this.config.appType] || {}
    Object.entries(appOverrides).forEach(([key, override]) => {
      if (flags[key as FeatureFlagKey]) {
        flags[key as FeatureFlagKey] = { ...flags[key as FeatureFlagKey], ...override }
      }
    })
    
    return flags
  }

  isEnabled(flagKey: FeatureFlagKey): boolean {
    const flag = this.flags[flagKey]
    if (!flag) return false
    
    // Check basic enabled state
    if (!flag.enabled) return false
    
    // Check environment restrictions
    if (flag.environments && !flag.environments.includes(this.config.environment)) {
      return false
    }
    
    // Check app type restrictions
    if (flag.appTypes && !flag.appTypes.includes(this.config.appType)) {
      return false
    }
    
    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      return this.isInRollout(flagKey, flag.rolloutPercentage)
    }
    
    // Check dependencies
    if (flag.dependencies) {
      return flag.dependencies.every(dep => this.isEnabled(dep))
    }
    
    return true
  }

  private isInRollout(flagKey: FeatureFlagKey, percentage: number): boolean {
    if (!this.config.userId) {
      // Fallback to deterministic hash based on app type and environment
      const seed = `${this.config.appType}-${this.config.environment}-${flagKey}`
      const hash = this.simpleHash(seed)
      return (hash % 100) < percentage
    }
    
    // Use user ID for consistent rollout
    const seed = `${this.config.userId}-${flagKey}`
    const hash = this.simpleHash(seed)
    return (hash % 100) < percentage
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  getFlag(flagKey: FeatureFlagKey): FeatureFlag | undefined {
    return this.flags[flagKey]
  }

  getAllFlags(): Record<FeatureFlagKey, FeatureFlag> {
    return { ...this.flags }
  }

  updateConfig(config: Partial<FeatureFlagConfig>): void {
    this.config = { ...this.config, ...config }
    this.flags = this.buildFlags()
  }

  // Helper methods for common feature checks
  shouldUseEnhancedJWT(): boolean {
    return this.isEnabled('enhanced_jwt_claims')
  }

  shouldValidateCrossApp(): boolean {
    return this.isEnabled('cross_app_validation')
  }

  shouldAuditLog(): boolean {
    return this.isEnabled('audit_logging')
  }

  shouldRefreshSessions(): boolean {
    return this.isEnabled('session_refresh')
  }

  shouldUseRoleBasedAccess(): boolean {
    return this.isEnabled('role_based_access')
  }

  shouldUseSecureCookies(): boolean {
    return this.isEnabled('secure_cookies')
  }

  isInMigrationMode(): boolean {
    return this.isEnabled('migration_mode')
  }

  shouldMaintainLegacyCompatibility(): boolean {
    return this.isEnabled('legacy_compatibility')
  }

  shouldUseAdvancedMonitoring(): boolean {
    return this.isEnabled('advanced_monitoring')
  }

  shouldAllowCustomProviders(): boolean {
    return this.isEnabled('custom_providers')
  }
}

// Global feature flag manager instance
let globalFeatureFlags: FeatureFlagManager | null = null

// Initialize feature flags
export function initializeFeatureFlags(config?: Partial<FeatureFlagConfig>): FeatureFlagManager {
  globalFeatureFlags = new FeatureFlagManager(config)
  return globalFeatureFlags
}

// Get global feature flags instance
export function getFeatureFlags(): FeatureFlagManager {
  if (!globalFeatureFlags) {
    globalFeatureFlags = new FeatureFlagManager()
  }
  return globalFeatureFlags
}

// Convenience functions for common checks
export function isFeatureEnabled(flagKey: FeatureFlagKey): boolean {
  return getFeatureFlags().isEnabled(flagKey)
}

export function shouldUseEnhancedJWT(): boolean {
  return getFeatureFlags().shouldUseEnhancedJWT()
}

export function shouldValidateCrossApp(): boolean {
  return getFeatureFlags().shouldValidateCrossApp()
}

export function shouldAuditLog(): boolean {
  return getFeatureFlags().shouldAuditLog()
}

export function shouldRefreshSessions(): boolean {
  return getFeatureFlags().shouldRefreshSessions()
}

export function isInMigrationMode(): boolean {
  return getFeatureFlags().isInMigrationMode()
}

export function shouldMaintainLegacyCompatibility(): boolean {
  return getFeatureFlags().shouldMaintainLegacyCompatibility()
}

// Migration shims for backward compatibility
export interface MigrationShim {
  name: string
  condition: () => boolean
  legacyHandler: (...args: any[]) => any
  modernHandler: (...args: any[]) => any
}

export class MigrationShimManager {
  private shims: Map<string, MigrationShim> = new Map()

  registerShim(shim: MigrationShim): void {
    this.shims.set(shim.name, shim)
  }

  executeShim(name: string, ...args: any[]): any {
    const shim = this.shims.get(name)
    if (!shim) {
      throw new Error(`Migration shim '${name}' not found`)
    }

    if (shim.condition()) {
      return shim.modernHandler(...args)
    } else {
      return shim.legacyHandler(...args)
    }
  }

  hasShim(name: string): boolean {
    return this.shims.has(name)
  }

  removeShim(name: string): boolean {
    return this.shims.delete(name)
  }

  getAllShims(): string[] {
    return Array.from(this.shims.keys())
  }
}

// Global migration shim manager
const globalShimManager = new MigrationShimManager()

export function registerMigrationShim(shim: MigrationShim): void {
  globalShimManager.registerShim(shim)
}

export function executeMigrationShim(name: string, ...args: any[]): any {
  return globalShimManager.executeShim(name, ...args)
}

export function getMigrationShimManager(): MigrationShimManager {
  return globalShimManager
}

// Common migration shims
registerMigrationShim({
  name: 'jwt_callback',
  condition: () => shouldUseEnhancedJWT(),
  legacyHandler: (token: any) => token,
  modernHandler: (token: any) => {
    // Enhanced JWT with roles and permissions
    return {
      ...token,
      roles: token.roles || [],
      permissions: token.permissions || [],
      appType: token.appType || 'frontend'
    }
  }
})

registerMigrationShim({
  name: 'session_callback',
  condition: () => shouldValidateCrossApp(),
  legacyHandler: (session: any, token: any) => session,
  modernHandler: (session: any, token: any) => {
    // Enhanced session with cross-app validation
    return {
      ...session,
      user: {
        ...session.user,
        roles: token.roles || [],
        permissions: token.permissions || [],
        appType: token.appType || 'frontend'
      }
    }
  }
})

registerMigrationShim({
  name: 'sign_in_callback',
  condition: () => shouldAuditLog(),
  legacyHandler: (user: any, account: any, profile: any) => true,
  modernHandler: (user: any, account: any, profile: any) => {
    // Audit logging for sign-in events
    const { auditSignIn } = require('./audit')
    auditSignIn(user, account, profile)
    return true
  }
})