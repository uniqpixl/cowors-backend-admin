import { Session, JWT } from 'next-auth';
import { User, UserRole } from '@cowors/shared-types';

// Cross-app session validation interface
export interface SessionValidationResult {
  isValid: boolean;
  user?: User;
  error?: string;
  source: 'local' | 'remote' | 'fallback';
}

// Audit log entry interface
export interface AuditLogEntry {
  userId: string;
  action: string;
  app: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// Session validation configuration
export interface ValidationConfig {
  apiUrl: string;
  timeout?: number;
  enableFallback?: boolean;
  enableAuditLog?: boolean;
}

// Cross-app session validator
export class SessionValidator {
  private config: ValidationConfig;
  private auditLogs: AuditLogEntry[] = [];

  constructor(config: ValidationConfig) {
    this.config = {
      timeout: 5000,
      enableFallback: true,
      enableAuditLog: true,
      ...config,
    };
  }

  // Validate session across apps
  async validateSession(
    session: Session | null,
    token: JWT | null,
    appName: string
  ): Promise<SessionValidationResult> {
    try {
      // Local validation first
      if (!session || !token) {
        return {
          isValid: false,
          error: 'No session or token provided',
          source: 'local',
        };
      }

      // Check token expiration
      if (token.accessTokenExpires && Date.now() >= token.accessTokenExpires) {
        if (this.config.enableFallback) {
          return await this.attemptTokenRefresh(token, appName);
        }
        return {
          isValid: false,
          error: 'Token expired',
          source: 'local',
        };
      }

      // Remote validation
      const remoteValidation = await this.validateRemoteSession(token, appName);
      if (remoteValidation.isValid) {
        this.logAudit({
          userId: session.user.id,
          action: 'session_validated',
          app: appName,
          timestamp: new Date(),
        });
      }

      return remoteValidation;
    } catch (error) {
      console.error('Session validation error:', error);
      
      if (this.config.enableFallback) {
        return {
          isValid: true, // Fallback to allow access
          user: session?.user as User,
          error: 'Validation failed, using fallback',
          source: 'fallback',
        };
      }

      return {
        isValid: false,
        error: 'Session validation failed',
        source: 'local',
      };
    }
  }

  // Validate session against remote API
  private async validateRemoteSession(
    token: JWT,
    appName: string
  ): Promise<SessionValidationResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.apiUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.accessToken}`,
        },
        body: JSON.stringify({ app: appName }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          isValid: false,
          error: `Remote validation failed: ${response.status}`,
          source: 'remote',
        };
      }

      const data = await response.json();
      return {
        isValid: data.valid,
        user: data.user,
        source: 'remote',
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        return {
          isValid: false,
          error: 'Remote validation timeout',
          source: 'remote',
        };
      }
      throw error;
    }
  }

  // Attempt to refresh expired token
  private async attemptTokenRefresh(
    token: JWT,
    appName: string
  ): Promise<SessionValidationResult> {
    try {
      const response = await fetch(`${this.config.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: token.refreshToken,
          app: appName,
        }),
      });

      if (!response.ok) {
        return {
          isValid: false,
          error: 'Token refresh failed',
          source: 'remote',
        };
      }

      const data = await response.json();
      return {
        isValid: true,
        user: data.user,
        source: 'remote',
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Token refresh error',
        source: 'fallback',
      };
    }
  }

  // Log audit entry
  private logAudit(entry: AuditLogEntry): void {
    if (!this.config.enableAuditLog) return;

    this.auditLogs.push(entry);
    console.log('Audit log:', entry);

    // Keep only last 1000 entries in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }
  }

  // Get audit logs
  getAuditLogs(userId?: string): AuditLogEntry[] {
    if (userId) {
      return this.auditLogs.filter(log => log.userId === userId);
    }
    return [...this.auditLogs];
  }

  // Clear audit logs
  clearAuditLogs(): void {
    this.auditLogs = [];
  }
}

// Utility functions for role-based access control
export function hasRole(user: User | undefined, role: UserRole): boolean {
  return user?.role === role;
}

export function hasAnyRole(user: User | undefined, roles: UserRole[]): boolean {
  return user?.role ? roles.includes(user.role) : false;
}

export function isAdmin(user: User | undefined): boolean {
  return hasRole(user, UserRole.ADMIN);
}

export function isPartner(user: User | undefined): boolean {
  return hasRole(user, UserRole.PARTNER);
}

// Create session validator instance
export function createSessionValidator(config: ValidationConfig): SessionValidator {
  return new SessionValidator(config);
}

// Default validator for quick setup
export const defaultValidator = createSessionValidator({
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  enableFallback: true,
  enableAuditLog: true,
});