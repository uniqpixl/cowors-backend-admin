import { JWT } from 'next-auth/jwt'
import { Session } from 'next-auth'
import { Account, User } from 'next-auth'
import { shouldUseEnhancedJWT, shouldValidateCrossApp, shouldAuditLog } from './features'
import { auditTokenRefresh, auditAuthError, validateCrossAppSession } from './audit'

// Enhanced user interface with roles and permissions
export interface EnhancedUser extends User {
  id: string
  email: string
  roles?: string[]
  permissions?: string[]
  metadata?: Record<string, any>
  appType?: 'frontend' | 'partner' | 'admin'
  lastLoginAt?: Date
  isActive?: boolean
}

// Enhanced JWT interface
export interface EnhancedJWT extends JWT {
  roles?: string[]
  permissions?: string[]
  appType?: 'frontend' | 'partner' | 'admin'
  metadata?: Record<string, any>
  refreshToken?: string
  accessTokenExpires?: number
  lastRefresh?: number
  isActive?: boolean
}

// Enhanced session interface
export interface EnhancedSession extends Session {
  user: EnhancedUser
  accessToken?: string
  error?: string
}

// Token refresh configuration
interface RefreshTokenConfig {
  refreshThreshold: number // Minutes before expiry to refresh
  maxRetries: number
  retryDelay: number // Milliseconds
}

/**
 * Refreshes the access token using the refresh token
 */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      accessTokenExpires: Date.now() + refreshedTokens.expiresIn * 1000,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    return handleAuthError('RefreshAccessTokenError', (token as EnhancedJWT).appType)
  }
}

/**
 * Checks if the access token is expired
 */
export function isTokenExpired(token: JWT): boolean {
  if (!token.accessTokenExpires) return false
  const expiresAt = token.accessTokenExpires as number
  if (!expiresAt || typeof expiresAt !== 'number') return false
  return Date.now() >= expiresAt
}

/**
 * Enhanced JWT callback with automatic token refresh and role enrichment
 */
export async function jwtCallbackWithRefresh(
  { token, user, account }: any,
  appType?: 'frontend' | 'partner' | 'admin'
): Promise<EnhancedJWT> {
  let enhancedToken: EnhancedJWT = token as EnhancedJWT

  // Initial sign in
  if (user) {
    // For credentials provider, account might be null or undefined
    enhancedToken = {
      ...token,
      accessToken: account?.access_token || 'credentials-token',
      accessTokenExpires: Date.now() + (account?.expires_in || 3600) * 1000,
      refreshToken: account?.refresh_token || null,
      user,
      appType: appType || 'frontend',
      lastRefresh: Date.now()
    }

    // Enrich with roles and permissions if feature is enabled
    if (shouldUseEnhancedJWT()) {
      enhancedToken = await enrichJWTWithRoles(enhancedToken, user, appType)
    }

    // Audit token creation
    if (shouldAuditLog()) {
      auditTokenRefresh(enhancedToken, appType)
    }

    return enhancedToken
  }

  // Return previous token if the access token has not expired yet
  // For credentials provider, we don't have real token expiration, so just return the token
  if (!enhancedToken.accessTokenExpires || !isTokenExpired(enhancedToken)) {
    return enhancedToken
  }

  // Access token has expired, try to update it
  const refreshedToken = await refreshAccessToken(enhancedToken)
  
  // Re-enrich with roles if feature is enabled
  if (shouldUseEnhancedJWT() && refreshedToken.sub) {
    return await enrichJWTWithRoles(refreshedToken as EnhancedJWT, undefined, appType)
  }

  return refreshedToken as EnhancedJWT
}

/**
 * Enhanced session callback with automatic refresh handling and cross-app validation
 */
export async function sessionCallbackWithRefresh(
  { session, token }: { session: Session; token: JWT },
  appType?: 'frontend' | 'partner' | 'admin',
  requiredRoles?: string[]
): Promise<EnhancedSession> {
  const enhancedToken = token as EnhancedJWT
  let enhancedSession: EnhancedSession = session as EnhancedSession

  if (enhancedToken.error) {
    // Force sign out if refresh failed
    return {
      ...enhancedSession,
      error: 'RefreshAccessTokenError',
    }
  }

  // Send properties to the client
  enhancedSession.accessToken = enhancedToken.accessToken as string
  enhancedSession.error = enhancedToken.error as string || undefined
  
  // Include enhanced user information from token
  if (enhancedToken.user || enhancedToken.sub) {
    enhancedSession.user = {
      ...enhancedSession.user,
      id: enhancedToken.sub || enhancedSession.user?.id || '',
      email: enhancedToken.email || enhancedSession.user?.email || '',
      roles: (enhancedToken.roles || []).map((role: string) => role.toLowerCase()),
      permissions: enhancedToken.permissions || [],
      appType: enhancedToken.appType || appType || 'frontend',
      metadata: enhancedToken.metadata || {},
      isActive: enhancedToken.isActive !== false,
      ...enhancedToken.user as User
    }
  }

  // Perform cross-app validation if enabled
  if (shouldValidateCrossApp() && appType) {
    const validationResult = validateCrossAppSession(
      enhancedSession,
      enhancedToken,
      appType,
      requiredRoles
    )

    if (!validationResult.isValid) {
      enhancedSession.error = validationResult.reason || 'Session validation failed'
      
      if (shouldAuditLog()) {
        auditAuthError(
          `Cross-app validation failed: ${validationResult.reason}`,
          enhancedSession.user?.id,
          enhancedSession.user?.email,
          appType
        )
      }
    }
  }

  return enhancedSession
}

/**
 * Enrich JWT with roles and permissions based on user data
 */
export async function enrichJWTWithRoles(
  token: EnhancedJWT,
  user?: User,
  appType?: 'frontend' | 'partner' | 'admin'
): Promise<EnhancedJWT> {
  try {
    const userId = token.sub || user?.id
    const userEmail = token.email || user?.email

    if (!userId) {
      return token
    }

    // Use roles from the user object if available (from backend authentication)
    // Otherwise fall back to mock data based on app type and user email
    let roles: string[]
    if (user && (user as any).roles && Array.isArray((user as any).roles)) {
      // Use actual roles from backend authentication
      roles = (user as any).roles.map((role: string) => role.toLowerCase())
      console.log(`[enrichJWTWithRoles] Using backend roles for ${userEmail}:`, roles)
    } else {
      // Fall back to mock data
      roles = await getUserRoles(userId, userEmail as string, appType)
      console.log(`[enrichJWTWithRoles] Using mock roles for ${userEmail}:`, roles)
    }
    
    const permissions = await getUserPermissions(userId, roles, appType)
    const metadata = await getUserMetadata(userId)

    return {
      ...token,
      roles,
      permissions,
      appType: appType || token.appType || 'frontend',
      metadata,
      isActive: true,
      lastRefresh: Date.now()
    }
  } catch (error) {
    console.error('Error enriching JWT with roles:', error)
    
    if (shouldAuditLog()) {
      auditAuthError(
        `JWT enrichment failed: ${error}`,
        token.sub,
        token.email as string,
        appType
      )
    }
    
    return token
  }
}

/**
 * Get user roles based on user ID and app type
 */
export async function getUserRoles(
  userId: string,
  email: string,
  appType?: 'frontend' | 'partner' | 'admin'
): Promise<string[]> {
  // Mock implementation - replace with actual database query
  const defaultRoles: string[] = ['user']
  
  console.log(`[getUserRoles] Processing user: ${email}, appType: ${appType}`);
  
  // Admin app gets admin roles
  if (appType === 'admin') {
    if (email.includes('admin') || email.includes('support')) {
      console.log(`[getUserRoles] Assigning admin roles to ${email}`);
      return ['admin', 'user']
    }
    console.log(`[getUserRoles] Assigning viewer roles to ${email}`);
    return ['viewer', 'user']
  }
  
  // Partner app gets partner roles
  if (appType === 'partner') {
    if (email.includes('partner') || email.includes('business')) {
      console.log(`[getUserRoles] Assigning partner roles to ${email}`);
      return ['partner', 'business_user', 'user']
    }
    console.log(`[getUserRoles] Assigning user roles to ${email}`);
    return ['user']
  }
  
  // Frontend app gets basic roles
  console.log(`[getUserRoles] Assigning default roles to ${email}`);
  return defaultRoles
}

/**
 * Get user permissions based on roles and app type
 */
export async function getUserPermissions(
  userId: string,
  roles: string[],
  appType?: 'frontend' | 'partner' | 'admin'
): Promise<string[]> {
  // Mock implementation - replace with actual permission mapping
  const permissions: string[] = []
  
  // Basic permissions for all users
  permissions.push('read:profile', 'update:profile')
  
  // Role-based permissions
  if (roles.includes('admin')) {
    permissions.push(
      'read:users',
      'create:users',
      'update:users',
      'delete:users',
      'read:analytics',
      'manage:system'
    )
  }
  
  if (roles.includes('partner')) {
    permissions.push(
      'read:partner_data',
      'update:partner_data',
      'create:partner_content',
      'read:partner_analytics'
    )
  }
  
  if (roles.includes('business_user')) {
    permissions.push(
      'read:business_data',
      'update:business_data',
      'create:business_content'
    )
  }
  
  // App-specific permissions
  if (appType === 'admin') {
    permissions.push('access:admin_panel')
  }
  
  if (appType === 'partner') {
    permissions.push('access:partner_portal')
  }
  
  return [...new Set(permissions)] // Remove duplicates
}

/**
 * Get user metadata
 */
export async function getUserMetadata(userId: string): Promise<Record<string, any>> {
  // Mock implementation - replace with actual database query
  return {
    lastLoginAt: new Date().toISOString(),
    loginCount: 1,
    preferences: {
      theme: 'light',
      language: 'en'
    }
  }
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: string, appType?: string): EnhancedJWT {
  console.error('Authentication error:', error)
  
  if (shouldAuditLog()) {
    auditAuthError(error, undefined, undefined, appType)
  }
  
  return {
    error: 'RefreshAccessTokenError',
  } as EnhancedJWT
}

/**
 * Error handler for authentication errors
 */
export function handleAuthErrorRedirect(error: any): string {
  console.error('Authentication error:', error)
  
  switch (error.type) {
    case 'RefreshAccessTokenError':
      return '/auth/login?error=SessionExpired'
    case 'AccessDenied':
      return '/auth/error?error=AccessDenied'
    case 'Verification':
      return '/auth/error?error=Verification'
    default:
      return '/auth/error?error=Default'
  }
}