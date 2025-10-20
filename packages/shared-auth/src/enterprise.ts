/**
 * @cowors/shared-auth/enterprise
 * 
 * Enterprise-grade authentication features
 */

import { NextAuthOptions } from 'next-auth'
import { v4 as uuidv4 } from 'uuid'
import {
  EnterpriseAuthConfig,
  FeatureFlags,
  AuditEvent,
  AuditAction,
  AuditHook,
  AppContext,
  UserRole,
  MigrationShim
} from './types'
import { jwtCallbackWithRefresh, sessionCallbackWithRefresh } from './refresh'
import CredentialsProvider from 'next-auth/providers/credentials'

// Default feature flags
const DEFAULT_FEATURES: FeatureFlags = {
  enableAuditLogging: true,
  enableCrossDomainAuth: true,
  enableRoleBasedAccess: true,
  enableSessionValidation: true,
  enableMigrationShims: true
}

// Default audit hooks
const DEFAULT_AUDIT_HOOKS: AuditHook[] = [
  // Console logging hook
  async (event: AuditEvent) => {
    console.log(`[AUDIT] ${event.action}:`, {
      userId: event.userId,
      sessionId: event.sessionId,
      app: event.appContext.appId,
      timestamp: event.timestamp.toISOString()
    })
  }
]

// Migration shim configuration
const DEFAULT_MIGRATION_SHIM: MigrationShim = {
  enabled: true,
  fallbackToLegacy: true,
  gradualRollout: {
    enabled: true,
    percentage: 50 // Start with 50% rollout
  }
}

/**
 * Create enterprise NextAuth configuration
 */
export function createEnterpriseAuthOptions(config: EnterpriseAuthConfig): NextAuthOptions {
  const features = { ...DEFAULT_FEATURES, ...config.features }
  const auditHooks = config.audit?.hooks || DEFAULT_AUDIT_HOOKS
  
  return {
    providers: [
      CredentialsProvider({
        name: 'credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials, req) {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          try {
            const response = await fetch(`${config.apiUrl}/auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            })

            const data = await response.json()

            if (!response.ok || !data.user) {
              return null
            }

            const sessionId = uuidv4()
            const user = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              permissions: data.user.permissions || [],
              organizationId: data.user.organizationId,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              accessTokenExpires: Date.now() + (data.expiresIn * 1000),
            }

            // Audit login event
            if (features.enableAuditLogging && config.audit?.enabled) {
              const auditEvent: AuditEvent = {
                id: uuidv4(),
                userId: user.id,
                sessionId,
                action: AuditAction.LOGIN,
                timestamp: new Date(),
                appContext: getAppContext(req),
                ipAddress: getClientIP(req),
                userAgent: req?.headers?.['user-agent']
              }
              
              await Promise.all(auditHooks.map(hook => hook(auditEvent)))
            }

            return user
          } catch (error) {
            console.error('Authentication error:', error)
            return null
          }
        },
      }),
    ],
    callbacks: {
      jwt: async ({ token, user, account }) => {
        // Enhanced JWT callback with audit logging
        const enhancedToken = await jwtCallbackWithRefresh({ token, user, account })
        
        if (features.enableAuditLogging && config.audit?.enabled && user) {
          const auditEvent: AuditEvent = {
            id: uuidv4(),
            userId: user.id,
            sessionId: enhancedToken.sessionId || uuidv4(),
            action: AuditAction.SESSION_CREATED,
            timestamp: new Date(),
            appContext: enhancedToken.appContext || getDefaultAppContext()
          }
          
          await Promise.all(auditHooks.map(hook => hook(auditEvent)))
        }
        
        return enhancedToken
      },
      session: async ({ session, token }) => {
        // Enhanced session callback with enriched data
        const enhancedSession = await sessionCallbackWithRefresh({ session, token })
        
        // Add session ID and app context
        enhancedSession.sessionId = token.sessionId || uuidv4()
        enhancedSession.appContext = token.appContext || getDefaultAppContext()
        
        return enhancedSession
      },
    },
    pages: config.pages || {
      signIn: '/auth/login',
      error: '/auth/error',
    },
    secret: config.secret,
    session: {
      strategy: 'jwt',
      maxAge: config.session?.maxAge || 30 * 24 * 60 * 60, // 30 days
      updateAge: config.session?.updateAge || 24 * 60 * 60, // 24 hours
    },
    jwt: {
      maxAge: config.session?.maxAge || 30 * 24 * 60 * 60, // 30 days
    },
    cookies: {
      sessionToken: {
        name: 'next-auth.session-token',
        options: {
          httpOnly: config.cookies?.httpOnly ?? true,
          sameSite: config.cookies?.sameSite || 'lax',
          path: '/',
          secure: config.cookies?.secure ?? process.env.NODE_ENV === 'production',
          domain: config.cookies?.domain,
        },
      },
      callbackUrl: {
        name: 'next-auth.callback-url',
        options: {
          sameSite: config.cookies?.sameSite || 'lax',
          path: '/',
          secure: config.cookies?.secure ?? process.env.NODE_ENV === 'production',
          domain: config.cookies?.domain,
        },
      },
      csrfToken: {
        name: 'next-auth.csrf-token',
        options: {
          httpOnly: true,
          sameSite: config.cookies?.sameSite || 'lax',
          path: '/',
          secure: config.cookies?.secure ?? process.env.NODE_ENV === 'production',
          domain: config.cookies?.domain,
        },
      },
    },
  }
}

/**
 * Get app context from request
 */
function getAppContext(req?: any): AppContext {
  const host = req?.headers?.host || 'localhost'
  
  // Determine app based on host or other factors
  let appId: 'frontend' | 'partner' | 'admin' = 'frontend'
  if (host.includes('partner')) appId = 'partner'
  else if (host.includes('admin')) appId = 'admin'
  
  return {
    appId,
    domain: host,
    features: Object.keys(DEFAULT_FEATURES)
  }
}

/**
 * Get default app context
 */
function getDefaultAppContext(): AppContext {
  return {
    appId: 'frontend',
    domain: 'localhost',
    features: Object.keys(DEFAULT_FEATURES)
  }
}

/**
 * Extract client IP from request
 */
function getClientIP(req?: any): string | undefined {
  return req?.headers?.['x-forwarded-for']?.split(',')[0] ||
         req?.headers?.['x-real-ip'] ||
         req?.connection?.remoteAddress ||
         req?.socket?.remoteAddress
}

/**
 * Create audit hook for external logging service
 */
export function createExternalAuditHook(endpoint: string, apiKey: string): AuditHook {
  return async (event: AuditEvent) => {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(event)
      })
    } catch (error) {
      console.error('Failed to send audit event to external service:', error)
    }
  }
}

/**
 * Create database audit hook
 */
export function createDatabaseAuditHook(dbClient: any): AuditHook {
  return async (event: AuditEvent) => {
    try {
      await dbClient.auditLog.create({
        data: {
          id: event.id,
          userId: event.userId,
          sessionId: event.sessionId,
          action: event.action,
          resource: event.resource,
          metadata: event.metadata,
          timestamp: event.timestamp,
          appId: event.appContext.appId,
          domain: event.appContext.domain,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent
        }
      })
    } catch (error) {
      console.error('Failed to save audit event to database:', error)
    }
  }
}

/**
 * Feature flag utilities
 */
export class FeatureFlagManager {
  private flags: FeatureFlags
  
  constructor(flags: FeatureFlags = DEFAULT_FEATURES) {
    this.flags = flags
  }
  
  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature] ?? false
  }
  
  enable(feature: keyof FeatureFlags): void {
    this.flags[feature] = true
  }
  
  disable(feature: keyof FeatureFlags): void {
    this.flags[feature] = false
  }
  
  getAll(): FeatureFlags {
    return { ...this.flags }
  }
  
  update(flags: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...flags }
  }
}

/**
 * Migration utilities
 */
export function shouldUseLegacyAuth(migrationShim: MigrationShim, userId?: string): boolean {
  if (!migrationShim.enabled) return false
  if (!migrationShim.gradualRollout.enabled) return migrationShim.fallbackToLegacy
  
  // Simple hash-based rollout
  if (userId) {
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    const percentage = Math.abs(hash) % 100
    return percentage >= migrationShim.gradualRollout.percentage
  }
  
  return Math.random() * 100 >= migrationShim.gradualRollout.percentage
}

export { DEFAULT_FEATURES, DEFAULT_AUDIT_HOOKS, DEFAULT_MIGRATION_SHIM }