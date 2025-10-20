/**
 * @cowors/shared-auth
 * 
 * Shared authentication types for Cowors applications
 */

import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT } from 'next-auth/jwt'

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: UserRole
      permissions?: string[]
      organizationId?: string
      accessToken?: string
    } & DefaultSession['user']
    accessToken?: string
    error?: string
    sessionId?: string
    appContext?: AppContext
  }

  interface User extends DefaultUser {
    id: string
    email: string
    name?: string
    role: UserRole
    permissions?: string[]
    organizationId?: string
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
  }
}

// Extend the built-in JWT types
declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    user?: {
      id: string
      email: string
      name?: string
      role: UserRole
      permissions?: string[]
      organizationId?: string
    }
    error?: string
    sessionId?: string
    appContext?: AppContext
  }
}

// User roles
export enum UserRole {
  USER = 'user',
  PARTNER = 'partner',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// App context for cross-app session management
export interface AppContext {
  appId: 'frontend' | 'partner' | 'admin'
  domain: string
  features: string[]
}

// Feature flags
export interface FeatureFlags {
  enableAuditLogging: boolean
  enableCrossDomainAuth: boolean
  enableRoleBasedAccess: boolean
  enableSessionValidation: boolean
  enableMigrationShims: boolean
  [key: string]: boolean
}

// Audit event types
export interface AuditEvent {
  id: string
  userId: string
  sessionId: string
  action: AuditAction
  resource?: string
  metadata?: Record<string, any>
  timestamp: Date
  appContext: AppContext
  ipAddress?: string
  userAgent?: string
}

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  TOKEN_REFRESH = 'token_refresh',
  SESSION_CREATED = 'session_created',
  SESSION_DESTROYED = 'session_destroyed',
  PERMISSION_DENIED = 'permission_denied',
  ROLE_CHANGED = 'role_changed',
  CROSS_APP_ACCESS = 'cross_app_access'
}

// Audit hook function type
export type AuditHook = (event: AuditEvent) => Promise<void> | void

// Enhanced auth configuration
export interface EnterpriseAuthConfig {
  apiUrl: string
  secret: string
  pages?: {
    signIn?: string
    signUp?: string
    error?: string
  }
  features?: FeatureFlags
  audit?: {
    enabled: boolean
    hooks: AuditHook[]
  }
  cookies?: {
    secure: boolean
    sameSite: 'strict' | 'lax' | 'none'
    domain?: string
    httpOnly: boolean
  }
  session?: {
    crossDomain: boolean
    maxAge: number
    updateAge: number
  }
}

// Legacy auth config for backward compatibility
export interface AuthConfig {
  apiUrl: string
  secret: string
  pages?: {
    signIn?: string
    signUp?: string
    error?: string
  }
}

// Auth provider types
export interface AuthProvider {
  id: string
  name: string
  type: 'credentials' | 'oauth'
  options?: Record<string, any>
}

// Enhanced auth error types
export interface AuthError {
  type: string
  message: string
  code?: string
  context?: AppContext
  timestamp?: Date
}

// Enhanced token payload
export interface TokenPayload {
  sub: string
  email: string
  role: UserRole
  permissions?: string[]
  organizationId?: string
  sessionId?: string
  appContext?: AppContext
  iat: number
  exp: number
}

// Enhanced session data
export interface SessionData {
  user: {
    id: string
    email: string
    name?: string
    role: UserRole
    permissions?: string[]
    organizationId?: string
  }
  accessToken?: string
  refreshToken?: string
  expires: string
  sessionId?: string
  appContext?: AppContext
}

// Session validation result
export interface SessionValidationResult {
  isValid: boolean
  reason?: string
  shouldRefresh?: boolean
  errors?: AuthError[]
}

// Migration shim types
export interface MigrationShim {
  enabled: boolean
  fallbackToLegacy: boolean
  gradualRollout: {
    enabled: boolean
    percentage: number
  }
}

/**
 * NextAuth specific configuration
 */
export interface NextAuthConfig extends AuthConfig {
  adapter?: any;
  callbacks?: {
    jwt?: (params: any) => Promise<any>;
    session?: (params: any) => Promise<any>;
    signIn?: (params: any) => Promise<boolean>;
    redirect?: (params: any) => Promise<string>;
  };
}



/**
 * Authentication error types
 */
export interface AuthError {
  type: 'CredentialsSignin' | 'EmailSignin' | 'OAuthSignin' | 'SessionRequired' | 'AccessDenied' | 'Verification' | 'Default';
  message: string;
  code?: string;
}

/**
 * Sign in credentials
 */
export interface SignInCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * Sign up data
 */
export interface SignUpData {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}

/**
 * Password reset data
 */
export interface PasswordResetData {
  email: string;
  token?: string;
  newPassword?: string;
}

/**
 * Auth state for client components
 */
export interface AuthState {
  user: User | null;
  session: SessionData | null;
  loading: boolean;
  error: AuthError | null;
}

/**
 * Auth actions
 */
export interface AuthActions {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  resetPassword: (data: PasswordResetData) => Promise<void>;
  refreshSession: () => Promise<void>;
}

/**
 * Complete auth context
 */
export interface AuthContext extends AuthState, AuthActions {}

/**
 * Role-based access control
 */
export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export interface RolePermissions {
  [key: string]: Permission[];
}