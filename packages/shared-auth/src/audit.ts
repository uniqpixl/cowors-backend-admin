import { NextAuthOptions } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import { Session } from 'next-auth'

// Audit event types
export type AuditEventType = 
  | 'sign_in'
  | 'sign_out'
  | 'session_created'
  | 'session_updated'
  | 'session_expired'
  | 'token_refresh'
  | 'auth_error'
  | 'permission_denied'
  | 'migration_event'

// Audit event data structure
export interface AuditEvent {
  type: AuditEventType
  userId?: string
  email?: string
  userAgent?: string
  ip?: string
  timestamp: Date
  metadata?: Record<string, any>
  appType?: 'frontend' | 'partner' | 'admin'
  sessionId?: string
  error?: string
}

// Audit logger interface
export interface AuditLogger {
  log(event: AuditEvent): Promise<void> | void
}

// Default console audit logger
export class ConsoleAuditLogger implements AuditLogger {
  log(event: AuditEvent): void {
    console.log(`[AUDIT] ${event.type}:`, {
      userId: event.userId,
      email: event.email,
      timestamp: event.timestamp.toISOString(),
      appType: event.appType,
      metadata: event.metadata
    })
  }
}

// Database audit logger (placeholder for implementation)
export class DatabaseAuditLogger implements AuditLogger {
  constructor(private dbConnection: any) {}
  
  async log(event: AuditEvent): Promise<void> {
    // Implementation would depend on your database setup
    // Example: await this.dbConnection.auditLogs.create({ data: event })
    console.log('[DB_AUDIT]', event)
  }
}

// Global audit logger instance
let globalAuditLogger: AuditLogger = new ConsoleAuditLogger()

// Set the global audit logger
export function setAuditLogger(logger: AuditLogger): void {
  globalAuditLogger = logger
}

// Get the current audit logger
export function getAuditLogger(): AuditLogger {
  return globalAuditLogger
}

// Audit hook functions
export function auditSignIn(user: any, account: any, profile: any, appType?: string): void {
  const event: AuditEvent = {
    type: 'sign_in',
    userId: user.id,
    email: user.email,
    timestamp: new Date(),
    appType: appType as any,
    metadata: {
      provider: account?.provider,
      accountType: account?.type,
      profileId: profile?.id
    }
  }
  globalAuditLogger.log(event)
}

export function auditSignOut(token: JWT, appType?: string): void {
  const event: AuditEvent = {
    type: 'sign_out',
    userId: token.sub,
    email: token.email as string,
    timestamp: new Date(),
    appType: appType as any,
    sessionId: token.jti
  }
  globalAuditLogger.log(event)
}

export function auditSessionCreated(session: Session, token: JWT, appType?: string): void {
  const event: AuditEvent = {
    type: 'session_created',
    userId: session.user?.id,
    email: session.user?.email || undefined,
    timestamp: new Date(),
    appType: appType as any,
    sessionId: token.jti,
    metadata: {
      expires: session.expires,
      roles: (session.user as any)?.roles,
      permissions: (session.user as any)?.permissions
    }
  }
  globalAuditLogger.log(event)
}

export function auditSessionUpdated(session: Session, token: JWT, appType?: string): void {
  const event: AuditEvent = {
    type: 'session_updated',
    userId: session.user?.id,
    email: session.user?.email || undefined,
    timestamp: new Date(),
    appType: appType as any,
    sessionId: token.jti
  }
  globalAuditLogger.log(event)
}

export function auditTokenRefresh(token: JWT, appType?: string): void {
  const event: AuditEvent = {
    type: 'token_refresh',
    userId: token.sub,
    email: token.email as string,
    timestamp: new Date(),
    appType: appType as any,
    sessionId: token.jti,
    metadata: {
      expiresAt: token.exp ? new Date(token.exp * 1000) : undefined
    }
  }
  globalAuditLogger.log(event)
}

export function auditAuthError(error: string, userId?: string, email?: string, appType?: string): void {
  const event: AuditEvent = {
    type: 'auth_error',
    userId,
    email,
    timestamp: new Date(),
    appType: appType as any,
    error,
    metadata: {
      errorType: 'authentication'
    }
  }
  globalAuditLogger.log(event)
}

export function auditMigrationEvent(eventName: string, metadata?: Record<string, any>): void {
  const event: AuditEvent = {
    type: 'migration_event',
    timestamp: new Date(),
    metadata: {
      eventName,
      ...metadata
    }
  }
  globalAuditLogger.log(event)
}

// Session validation utilities
export interface SessionValidationResult {
  isValid: boolean
  reason?: string
  shouldRefresh?: boolean
}

export function validateSession(session: Session | null, token: JWT | null): SessionValidationResult {
  if (!session || !token) {
    return {
      isValid: false,
      reason: 'Missing session or token'
    }
  }

  // Check if token is expired
  if (token.exp && Date.now() >= token.exp * 1000) {
    return {
      isValid: false,
      reason: 'Token expired',
      shouldRefresh: true
    }
  }

  // Check if session is expired
  if (session.expires && Date.now() >= new Date(session.expires).getTime()) {
    return {
      isValid: false,
      reason: 'Session expired',
      shouldRefresh: true
    }
  }

  // Validate user data consistency
  if (session.user?.id !== token.sub) {
    return {
      isValid: false,
      reason: 'User ID mismatch between session and token'
    }
  }

  return {
    isValid: true
  }
}

// Cross-app session validation
export function validateCrossAppSession(
  session: Session | null, 
  token: JWT | null, 
  requiredAppType: string,
  requiredRoles?: string[]
): SessionValidationResult {
  console.log(`[validateCrossAppSession] Validating for app: ${requiredAppType}`);
  console.log(`[validateCrossAppSession] Required roles:`, requiredRoles);
  console.log(`[validateCrossAppSession] Session user:`, session?.user);
  
  const baseValidation = validateSession(session, token)
  if (!baseValidation.isValid) {
    console.log(`[validateCrossAppSession] Base validation failed:`, baseValidation.reason);
    return baseValidation
  }

  // Check app type authorization
  const userRoles = (session?.user as any)?.roles || []
  const userPermissions = (session?.user as any)?.permissions || []
  
  console.log(`[validateCrossAppSession] User roles:`, userRoles);
  console.log(`[validateCrossAppSession] User permissions:`, userPermissions);
  
  // Check if user has required roles for this app type
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role))
    console.log(`[validateCrossAppSession] Has required role:`, hasRequiredRole);
    if (!hasRequiredRole) {
      const reason = `Missing required roles for ${requiredAppType}: ${requiredRoles.join(', ')}. User has: ${userRoles.join(', ')}`;
      console.log(`[validateCrossAppSession] Validation failed:`, reason);
      return {
        isValid: false,
        reason
      }
    }
  }

  console.log(`[validateCrossAppSession] Validation successful`);
  return {
    isValid: true
  }
}

// Monitoring metrics
export interface AuthMetrics {
  signInCount: number
  signOutCount: number
  activeSessionCount: number
  errorCount: number
  lastActivity: Date
}

// Simple in-memory metrics store (replace with Redis/database in production)
class MetricsStore {
  private metrics: Map<string, AuthMetrics> = new Map()

  incrementSignIn(appType: string): void {
    const current = this.getMetrics(appType)
    current.signInCount++
    current.lastActivity = new Date()
    this.metrics.set(appType, current)
  }

  incrementSignOut(appType: string): void {
    const current = this.getMetrics(appType)
    current.signOutCount++
    current.lastActivity = new Date()
    this.metrics.set(appType, current)
  }

  incrementError(appType: string): void {
    const current = this.getMetrics(appType)
    current.errorCount++
    current.lastActivity = new Date()
    this.metrics.set(appType, current)
  }

  updateActiveSessionCount(appType: string, count: number): void {
    const current = this.getMetrics(appType)
    current.activeSessionCount = count
    current.lastActivity = new Date()
    this.metrics.set(appType, current)
  }

  getMetrics(appType: string): AuthMetrics {
    return this.metrics.get(appType) || {
      signInCount: 0,
      signOutCount: 0,
      activeSessionCount: 0,
      errorCount: 0,
      lastActivity: new Date()
    }
  }

  getAllMetrics(): Record<string, AuthMetrics> {
    const result: Record<string, AuthMetrics> = {}
    this.metrics.forEach((metrics, appType) => {
      result[appType] = metrics
    })
    return result
  }
}

export const metricsStore = new MetricsStore()

// Monitoring hooks
export function trackSignIn(appType: string): void {
  metricsStore.incrementSignIn(appType)
}

export function trackSignOut(appType: string): void {
  metricsStore.incrementSignOut(appType)
}

export function trackAuthError(appType: string): void {
  metricsStore.incrementError(appType)
}

export function updateActiveSessionCount(appType: string, count: number): void {
  metricsStore.updateActiveSessionCount(appType, count)
}

export function getAuthMetrics(appType?: string): AuthMetrics | Record<string, AuthMetrics> {
  if (appType) {
    return metricsStore.getMetrics(appType)
  }
  return metricsStore.getAllMetrics()
}