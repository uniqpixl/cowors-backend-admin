import { NextAuthOptions, User, Account, Profile, Session, JWT } from 'next-auth'
import { AppType } from './features'
import { auditAuthError, auditMigrationEvent } from './audit'

// Migration state management
interface MigrationState {
  isActive: boolean
  phase: 'preparation' | 'gradual' | 'completion' | 'cleanup'
  startTime: number
  rollbackEnabled: boolean
  affectedApps: AppType[]
}

let migrationState: MigrationState = {
  isActive: false,
  phase: 'preparation',
  startTime: 0,
  rollbackEnabled: true,
  affectedApps: []
}

// Migration configuration
interface MigrationConfig {
  enableLegacySupport: boolean
  gradualRolloutPercentage: number
  fallbackToLegacy: boolean
  validateMigration: boolean
  auditMigrationEvents: boolean
}

const defaultMigrationConfig: MigrationConfig = {
  enableLegacySupport: true,
  gradualRolloutPercentage: 0,
  fallbackToLegacy: true,
  validateMigration: true,
  auditMigrationEvents: true
}

let migrationConfig: MigrationConfig = { ...defaultMigrationConfig }

// Migration utilities
export function initializeMigration(config: Partial<MigrationConfig> = {}) {
  migrationConfig = { ...defaultMigrationConfig, ...config }
  migrationState.isActive = true
  migrationState.startTime = Date.now()
  
  if (migrationConfig.auditMigrationEvents) {
    auditMigrationEvent('migration_initialized', {
      config: migrationConfig,
      timestamp: migrationState.startTime
    })
  }
}

export function isInMigrationMode(): boolean {
  return migrationState.isActive && process.env.AUTH_MIGRATION_MODE === 'true'
}

export function shouldMaintainLegacyCompatibility(): boolean {
  return migrationConfig.enableLegacySupport
}

export function shouldFallbackToLegacy(): boolean {
  return migrationConfig.fallbackToLegacy
}

export function getMigrationPhase(): string {
  return migrationState.phase
}

export function setMigrationPhase(phase: MigrationState['phase']) {
  const previousPhase = migrationState.phase
  migrationState.phase = phase
  
  if (migrationConfig.auditMigrationEvents) {
    auditMigrationEvent('migration_phase_changed', {
      previousPhase,
      newPhase: phase,
      timestamp: Date.now()
    })
  }
}

// Legacy compatibility shims
export function executeMigrationShim(
  operation: string,
  ...args: any[]
): any {
  try {
    switch (operation) {
      case 'jwt_callback':
        return legacyJwtCallback(args[0], args[1], args[2], args[3])
      
      case 'session_callback':
        return legacySessionCallback(args[0], args[1], args[2], args[3])
      
      case 'sign_in_callback':
        return legacySignInCallback(args[0], args[1], args[2], args[3])
      
      case 'sign_in_event':
        return legacySignInEvent(args[0], args[1], args[2], args[3])
      
      case 'sign_out_event':
        return legacySignOutEvent(args[0], args[1], args[2])
      
      default:
        console.warn(`Unknown migration shim operation: ${operation}`)
        return null
    }
  } catch (error) {
    console.error(`Migration shim error for ${operation}:`, error)
    
    if (migrationConfig.auditMigrationEvents) {
      auditAuthError(
        `Migration shim failed for ${operation}: ${error}`,
        args[0]?.sub || args[0]?.user?.id,
        args[0]?.email || args[0]?.user?.email,
        args[3] // appType
      )
    }
    
    return null
  }
}

// Legacy callback implementations
function legacyJwtCallback(
  token: JWT,
  user: User | undefined,
  account: Account | null,
  appType: AppType
) {
  // Legacy JWT callback logic
  if (user) {
    token.id = user.id
    token.email = user.email
    token.name = user.name
    token.role = (user as any).role || 'user'
  }
  
  if (account) {
    token.accessToken = (account as any).access_token
    token.refreshToken = (account as any).refresh_token
  }
  
  return token
}

function legacySessionCallback(
  session: Session,
  token: JWT,
  appType: AppType,
  requiredRoles?: string[]
) {
  // Legacy session callback logic
  if (token) {
    session.user = {
      ...session.user,
      id: token.sub || token.id as string,
      email: token.email as string,
      name: token.name as string,
      role: token.role as string
    }
    
    // Add legacy accessToken to session
    ;(session as any).accessToken = token.accessToken
  }
  
  return session
}

function legacySignInCallback(
  user: User,
  account: Account | null,
  profile: Profile | undefined,
  appType: AppType
) {
  // Legacy sign-in validation
  return true
}

function legacySignInEvent(
  user: User,
  account: Account | null,
  profile: Profile | undefined,
  appType: AppType
) {
  // Legacy sign-in event handling
  console.log(`[Legacy] User signed in to ${appType}:`, user.email)
}

function legacySignOutEvent(
  session: Session | undefined,
  token: JWT,
  appType: AppType
) {
  // Legacy sign-out event handling
  console.log(`[Legacy] User signed out from ${appType}:`, session?.user?.email)
}

// Migration validation utilities
export function validateAuthConfiguration(config: NextAuthOptions): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validate providers
  if (!config.providers || config.providers.length === 0) {
    errors.push('No authentication providers configured')
  }
  
  // Validate callbacks
  if (!config.callbacks) {
    warnings.push('No callbacks configured - using defaults')
  } else {
    if (!config.callbacks.jwt) {
      warnings.push('No JWT callback configured')
    }
    if (!config.callbacks.session) {
      warnings.push('No session callback configured')
    }
  }
  
  // Validate session configuration
  if (!config.session) {
    warnings.push('No session configuration - using defaults')
  } else {
    if (config.session.strategy !== 'jwt') {
      warnings.push('Non-JWT session strategy may not be fully supported')
    }
  }
  
  // Validate security settings
  if (process.env.NODE_ENV === 'production') {
    if (!config.secret && !process.env.NEXTAUTH_SECRET) {
      errors.push('No secret configured for production environment')
    }
    
    if (config.cookies) {
      Object.entries(config.cookies).forEach(([name, cookie]) => {
        if (cookie.options && !cookie.options.secure) {
          warnings.push(`Cookie ${name} is not secure in production`)
        }
      })
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Gradual migration helpers
export function shouldUseNewFeature(featureName: string, userId?: string): boolean {
  if (!isInMigrationMode()) {
    return true // Use new features when not in migration mode
  }
  
  // Gradual rollout based on percentage
  if (migrationConfig.gradualRolloutPercentage === 0) {
    return false
  }
  
  if (migrationConfig.gradualRolloutPercentage === 100) {
    return true
  }
  
  // Use user ID for consistent rollout
  if (userId) {
    const hash = simpleHash(userId + featureName)
    return (hash % 100) < migrationConfig.gradualRolloutPercentage
  }
  
  // Fallback to random
  return Math.random() * 100 < migrationConfig.gradualRolloutPercentage
}

export function incrementRolloutPercentage(increment: number = 10) {
  const newPercentage = Math.min(100, migrationConfig.gradualRolloutPercentage + increment)
  migrationConfig.gradualRolloutPercentage = newPercentage
  
  if (migrationConfig.auditMigrationEvents) {
    auditMigrationEvent('rollout_percentage_increased', {
      previousPercentage: migrationConfig.gradualRolloutPercentage - increment,
      newPercentage,
      timestamp: Date.now()
    })
  }
}

export function rollbackMigration() {
  if (!migrationState.rollbackEnabled) {
    throw new Error('Migration rollback is disabled')
  }
  
  migrationConfig.gradualRolloutPercentage = 0
  migrationConfig.fallbackToLegacy = true
  
  if (migrationConfig.auditMigrationEvents) {
    auditMigrationEvent('migration_rolled_back', {
      timestamp: Date.now(),
      reason: 'Manual rollback'
    })
  }
}

export function completeMigration() {
  migrationState.isActive = false
  migrationState.phase = 'completion'
  migrationConfig.enableLegacySupport = false
  migrationConfig.fallbackToLegacy = false
  
  if (migrationConfig.auditMigrationEvents) {
    auditMigrationEvent('migration_completed', {
      duration: Date.now() - migrationState.startTime,
      timestamp: Date.now()
    })
  }
}

// Utility functions
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

// Export migration state for monitoring
export function getMigrationStatus() {
  return {
    ...migrationState,
    config: migrationConfig
  }
}