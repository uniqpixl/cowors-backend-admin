/**
 * Authentication utility functions
 */

import type {
  Session,
  SessionData,
  TokenPayload,
  Permission,
  RolePermissions
} from './types';
import type { User, UserRole } from '@cowors/shared-types';

/**
 * Validate JWT token structure and expiration
 */
export function validateToken(token: string): boolean {
  try {
    const payload = parseToken(token);
    return !isTokenExpired(payload);
  } catch {
    return false;
  }
}

/**
 * Parse JWT token payload
 */
export function parseToken(token: string): TokenPayload {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8')
    );
    
    return payload as TokenPayload;
  } catch (error) {
    throw new Error('Failed to parse token');
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(payload: TokenPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Create session data from user and token
 */
export function createSessionData(
  user: User,
  accessToken?: string,
  expiresAt?: Date
): SessionData {
  return {
    user,
    expires: (expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString(),
    accessToken,
  };
}

/**
 * Validate session data
 */
export function validateSession(sessionData: SessionData): boolean {
  try {
    const expiresAt = new Date(sessionData.expires);
    const now = new Date();
    
    return (
      sessionData.user &&
      sessionData.user.id &&
      sessionData.user.email &&
      expiresAt > now
    );
  } catch {
    return false;
  }
}

/**
 * Role-based access control permissions
 */
export const ROLE_PERMISSIONS: RolePermissions = {
  SuperAdmin: [
    { resource: '*', action: 'manage' },
  ],
  Admin: [
    { resource: 'users', action: 'manage' },
    { resource: 'organizations', action: 'manage' },
    { resource: 'projects', action: 'manage' },
    { resource: 'analytics', action: 'read' },
    { resource: 'settings', action: 'manage' },
  ],
  Moderator: [
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'organizations', action: 'read' },
    { resource: 'projects', action: 'manage' },
    { resource: 'analytics', action: 'read' },
  ],
  User: [
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'projects', action: 'read' },
    { resource: 'projects', action: 'create' },
  ],
  Partner: [
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'partner-dashboard', action: 'read' },
    { resource: 'partner-projects', action: 'manage' },
    { resource: 'partner-analytics', action: 'read' },
  ],
};

/**
 * Check if user has specific role
 */
export function hasRole(user: User | undefined, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User | undefined, roles: UserRole[]): boolean {
  return user?.role ? roles.includes(user.role) : false;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  user: User | undefined,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
): boolean {
  if (!user?.role) return false;
  
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  
  // Check for wildcard permission (SuperAdmin)
  const hasWildcard = permissions.some(
    p => p.resource === '*' && (p.action === 'manage' || p.action === action)
  );
  
  if (hasWildcard) return true;
  
  // Check for specific resource permission
  const hasSpecific = permissions.some(
    p => p.resource === resource && (p.action === 'manage' || p.action === action)
  );
  
  return hasSpecific;
}

/**
 * Check if user can access resource
 */
export function canAccess(
  user: User | undefined,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' = 'read'
): boolean {
  return hasPermission(user, resource, action);
}

/**
 * Get user permissions for a specific resource
 */
export function getUserPermissions(user: User | undefined, resource: string): string[] {
  if (!user?.role) return [];
  
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  const actions: string[] = [];
  
  // Check for wildcard permission
  const wildcardPermission = permissions.find(p => p.resource === '*');
  if (wildcardPermission) {
    if (wildcardPermission.action === 'manage') {
      return ['create', 'read', 'update', 'delete', 'manage'];
    }
    actions.push(wildcardPermission.action);
  }
  
  // Check for specific resource permissions
  const resourcePermissions = permissions.filter(p => p.resource === resource);
  resourcePermissions.forEach(p => {
    if (p.action === 'manage') {
      actions.push('create', 'read', 'update', 'delete', 'manage');
    } else {
      actions.push(p.action);
    }
  });
  
  return [...new Set(actions)];
}

/**
 * Create basic auth header
 */
export function createBasicAuthHeader(username: string, password: string): string {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Parse basic auth header
 */
export function parseBasicAuthHeader(authHeader: string): { username: string; password: string } | null {
  try {
    const base64Credentials = authHeader.replace('Basic ', '');
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    
    if (!username || !password) {
      return null;
    }
    
    return { username, password };
  } catch {
    return null;
  }
}

/**
 * Generate secure random string for tokens
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Sanitize user data for client-side use
 */
export function sanitizeUser(user: User): Omit<User, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
} {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/**
 * Check if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if password meets requirements
 */
export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Get password strength score (0-4)
 */
export function getPasswordStrength(password: string): number {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;
  
  return Math.min(score, 4);
}