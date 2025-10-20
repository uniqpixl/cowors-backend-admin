import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateCrossAppSession } from '../audit'
import { sessionCallbackWithRefresh } from '../refresh'
import type { EnhancedJWT, EnhancedSession } from '../refresh'
import { Session } from 'next-auth'
import { UserRole } from '../types'

// Mock the features module
vi.mock('../features', () => ({
  shouldValidateCrossApp: vi.fn(() => true),
  shouldAuditLog: vi.fn(() => true),
  shouldUseEnhancedJWT: vi.fn(() => true),
}))

// Mock the audit module partially
vi.mock('../audit', async () => {
  const actual = await vi.importActual('../audit')
  return {
    ...actual,
    auditAuthError: vi.fn(),
    auditTokenRefresh: vi.fn(),
  }
})

// Helper function to create session with roles
function createSessionWithRoles(baseUser: any, roles: string[]): Session {
  const session: Session = {
    user: {
      ...baseUser,
      role: baseUser.role || UserRole.USER
    },
    expires: new Date(Date.now() + 3600000).toISOString()
  }
  // Add roles property that validation logic expects
  ;(session.user as any).roles = roles
  return session
}

describe('Cross-Application Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.setSystemTime(new Date('2022-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Cross-App Session Validation', () => {
    it('should validate session for frontend app with user role', () => {
      const session = createSessionWithRoles({
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.USER,
        permissions: ['read:profile', 'update:profile']
      }, ['user'])

      const token: EnhancedJWT = {
        sub: 'user-123',
        email: 'user@example.com',
        accessToken: 'access-token',
        accessTokenExpires: Date.now() + 3600000
      }

      const result = validateCrossAppSession(session, token, 'frontend')

      expect(result.isValid).toBe(true)
    })

    it('should validate session for admin app with admin role', () => {
      const session = createSessionWithRoles({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
        permissions: ['read:users', 'manage:users', 'read:analytics']
      }, ['admin'])

      const token: EnhancedJWT = {
        sub: 'admin-123',
        email: 'admin@example.com',
        accessToken: 'admin-access-token',
        accessTokenExpires: Date.now() + 3600000
      }

      const result = validateCrossAppSession(session, token, 'admin', ['admin'])

      expect(result.isValid).toBe(true)
    })

    it('should validate session for partner app with partner role', () => {
      const session = createSessionWithRoles({
        id: 'partner-123',
        email: 'partner@example.com',
        name: 'Partner User',
        role: UserRole.PARTNER,
        permissions: ['read:partner_data', 'manage:partner_content']
      }, ['partner'])

      const token: EnhancedJWT = {
        sub: 'partner-123',
        email: 'partner@example.com',
        accessToken: 'partner-access-token',
        accessTokenExpires: Date.now() + 3600000
      }

      const result = validateCrossAppSession(session, token, 'partner', ['partner'])

      expect(result.isValid).toBe(true)
    })

    it('should reject user trying to access admin app without admin role', () => {
      const session = createSessionWithRoles({
        id: 'user-123',
        email: 'user@example.com',
        name: 'Regular User',
        role: UserRole.USER,
        permissions: ['read:profile']
      }, ['user'])

      const token: EnhancedJWT = {
        sub: 'user-123',
        email: 'user@example.com',
        accessToken: 'access-token',
        accessTokenExpires: Date.now() + 3600000
      }

      const result = validateCrossAppSession(session, token, 'admin', ['admin'])

      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('Missing required roles for admin')
    })

    it('should reject partner trying to access admin app without admin role', () => {
      const session = createSessionWithRoles({
        id: 'partner-123',
        email: 'partner@example.com',
        name: 'Partner User',
        role: UserRole.PARTNER,
        permissions: ['read:partner_data']
      }, ['partner'])

      const token: EnhancedJWT = {
        sub: 'partner-123',
        email: 'partner@example.com',
        accessToken: 'partner-access-token',
        accessTokenExpires: Date.now() + 3600000
      }

      const result = validateCrossAppSession(session, token, 'admin', ['admin'])

      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('Missing required roles for admin')
    })

    it('should allow super admin to access any app', () => {
      const session = createSessionWithRoles({
        id: 'superadmin-123',
        email: 'superadmin@example.com',
        name: 'Super Admin',
        role: UserRole.SUPER_ADMIN,
        permissions: ['*']
      }, ['super_admin', 'admin'])

      const token: EnhancedJWT = {
        sub: 'superadmin-123',
        email: 'superadmin@example.com',
        accessToken: 'superadmin-access-token',
        accessTokenExpires: Date.now() + 3600000
      }

      const apps = ['frontend', 'admin', 'partner']
      const requiredRoles = [['user'], ['admin'], ['partner']]

      apps.forEach((app, index) => {
        const result = validateCrossAppSession(session, token, app, requiredRoles[index])
        expect(result.isValid).toBe(true)
      })
    })

    it('should handle expired session in cross-app validation', () => {
      const session: Session = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        expires: new Date(Date.now() - 3600000).toISOString() // Expired 1 hour ago
      }

      const token: EnhancedJWT = {
        sub: 'user-123',
        email: 'user@example.com',
        accessToken: 'access-token',
        accessTokenExpires: Date.now() - 3600000 // Expired
      }

      const result = validateCrossAppSession(session, token, 'frontend')

      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('expired')
    })

    it('should handle mismatched user IDs between session and token', () => {
      const session: Session = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const token: EnhancedJWT = {
        sub: 'different-user-456', // Different user ID
        email: 'user@example.com',
        accessToken: 'access-token',
        accessTokenExpires: Date.now() + 3600000
      }

      const result = validateCrossAppSession(session, token, 'frontend')

      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('User ID mismatch')
    })
  })

  describe('Enhanced Session Callback with Cross-App Validation', () => {
    it('should create enhanced session with cross-app validation for frontend', async () => {
      const session: Session = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const token: EnhancedJWT = {
        sub: 'user-123',
        email: 'user@example.com',
        accessToken: 'access-token',
        roles: ['user'],
        permissions: ['read:profile', 'update:profile'],
        appType: 'frontend',
        isActive: true
      }

      const result = await sessionCallbackWithRefresh(
        { session, token },
        'frontend'
      )

      expect(result.accessToken).toBe('access-token')
      expect(result.user?.roles).toEqual(['user'])
      expect(result.user?.appType).toBe('frontend')
      expect(result.error).toBeUndefined()
    })

    it('should create enhanced session with cross-app validation for admin', async () => {
      const session: Session = {
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: UserRole.ADMIN
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const token: EnhancedJWT = {
        sub: 'admin-123',
        email: 'admin@example.com',
        accessToken: 'admin-access-token',
        roles: ['admin'],
        permissions: ['manage:users', 'read:analytics'],
        appType: 'admin',
        isActive: true
      }

      const result = await sessionCallbackWithRefresh(
        { session, token },
        'admin',
        ['admin']
      )

      expect(result.accessToken).toBe('admin-access-token')
      expect(result.user?.roles).toEqual(['admin'])
      expect(result.user?.appType).toBe('admin')
      expect(result.error).toBeUndefined()
    })

    it('should fail cross-app validation when user lacks required roles', async () => {
      // Mock validateCrossAppSession to return failure
      const { validateCrossAppSession } = await import('../audit')
      vi.mocked(validateCrossAppSession).mockReturnValueOnce({
        isValid: false,
        reason: 'Missing required roles for admin: admin. User has: user'
      })

      const session: Session = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Regular User',
          role: UserRole.USER
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const token: EnhancedJWT = {
        sub: 'user-123',
        email: 'user@example.com',
        accessToken: 'access-token',
        roles: ['user'],
        permissions: ['read:profile'],
        appType: 'frontend',
        isActive: true
      }

      const result = await sessionCallbackWithRefresh(
        { session, token },
        'admin',
        ['admin']
      )

      expect(result.error).toBe('Missing required roles for admin: admin. User has: user')
    })
  })

  describe('Multi-App Session Scenarios', () => {
    it('should handle user switching between apps with same session', async () => {
      const baseSession: Session = {
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: UserRole.ADMIN
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const baseToken: EnhancedJWT = {
        sub: 'admin-123',
        email: 'admin@example.com',
        accessToken: 'admin-access-token',
        roles: ['admin', 'user'],
        permissions: ['manage:users', 'read:profile'],
        isActive: true
      }

      // Test access to frontend app
      const frontendResult = await sessionCallbackWithRefresh(
        { session: baseSession, token: { ...baseToken, appType: 'frontend' } },
        'frontend'
      )

      expect(frontendResult.error).toBeUndefined()
      expect(frontendResult.user?.appType).toBe('frontend')

      // Test access to admin app
      const adminResult = await sessionCallbackWithRefresh(
        { session: baseSession, token: { ...baseToken, appType: 'admin' } },
        'admin',
        ['admin']
      )

      expect(adminResult.error).toBeUndefined()
      expect(adminResult.user?.appType).toBe('admin')
    })

    it('should handle concurrent sessions across multiple apps', async () => {
      const sessions = [
        {
          appType: 'frontend' as const,
          requiredRoles: undefined,
          expectedValid: true
        },
        {
          appType: 'admin' as const,
          requiredRoles: ['admin'],
          expectedValid: true
        },
        {
          appType: 'partner' as const,
          requiredRoles: ['partner'],
          expectedValid: false // Admin doesn't have partner role
        }
      ]

      const baseSession = createSessionWithRoles({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
        permissions: ['manage:users']
      }, ['admin'])

      const baseToken: EnhancedJWT = {
        sub: 'admin-123',
        email: 'admin@example.com',
        accessToken: 'admin-access-token',
        roles: ['admin'],
        permissions: ['manage:users'],
        isActive: true
      }

      const results = await Promise.all(
        sessions.map(({ appType, requiredRoles }) =>
          sessionCallbackWithRefresh(
            { session: baseSession, token: { ...baseToken, appType } },
            appType,
            requiredRoles
          )
        )
      )

      // Frontend should work (no required roles)
      expect(results[0].error).toBeUndefined()
      
      // Admin should work (user has admin role)
      expect(results[1].error).toBeUndefined()
      
      // Partner should fail (admin doesn't have partner role)
      expect(results[2].error).toContain('Missing required roles for partner')
    })

    it('should handle app-specific permissions and features', async () => {
      const partnerSession: Session = {
        user: {
          id: 'partner-123',
          email: 'partner@example.com',
          name: 'Partner User',
          role: UserRole.PARTNER
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const partnerToken: EnhancedJWT = {
        sub: 'partner-123',
        email: 'partner@example.com',
        accessToken: 'partner-access-token',
        roles: ['partner'],
        permissions: [
          'read:partner_data',
          'manage:partner_content',
          'read:partner_analytics'
        ],
        appType: 'partner',
        metadata: {
          partnerTier: 'premium',
          features: ['analytics', 'advanced_reporting']
        },
        isActive: true
      }

      const result = await sessionCallbackWithRefresh(
        { session: partnerSession, token: partnerToken },
        'partner',
        ['partner']
      )

      expect(result.error).toBeUndefined()
      expect(result.user?.roles).toEqual(['partner'])
      expect(result.user?.permissions).toContain('read:partner_data')
      expect(result.user?.metadata?.partnerTier).toBe('premium')
    })
  })

  describe('Cross-App Security Edge Cases', () => {
    it('should prevent session hijacking across apps', () => {
      const legitimateSession: Session = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Legitimate User',
          role: UserRole.USER
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const maliciousToken: EnhancedJWT = {
        sub: 'attacker-456', // Different user ID
        email: 'attacker@example.com',
        accessToken: 'stolen-token',
        accessTokenExpires: Date.now() + 3600000
      }

      const result = validateCrossAppSession(legitimateSession, maliciousToken, 'frontend')

      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('User ID mismatch')
    })

    it('should handle token tampering attempts', () => {
      const session: Session = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const tamperedToken: EnhancedJWT = {
        sub: 'user-123',
        email: 'user@example.com',
        accessToken: 'tampered-token',
        accessTokenExpires: Date.now() + 86400000, // Extended expiry
        roles: ['admin'], // Elevated roles
        permissions: ['manage:users'] // Elevated permissions
      }

      // The validation should still pass basic checks but the elevated permissions
      // should be validated against the actual user's role in the session
      const result = validateCrossAppSession(session, tamperedToken, 'admin', ['admin'])

      // This should fail because the user in session has USER role, not ADMIN
      expect(result.isValid).toBe(false)
    })

    it('should handle rapid app switching attempts', async () => {
      const session: Session = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const token: EnhancedJWT = {
        sub: 'user-123',
        email: 'user@example.com',
        accessToken: 'access-token',
        roles: ['user'],
        permissions: ['read:profile'],
        isActive: true
      }

      // Simulate rapid switching between apps
      const rapidSwitchPromises = Array.from({ length: 10 }, (_, i) => 
        sessionCallbackWithRefresh(
          { session, token: { ...token, appType: i % 2 === 0 ? 'frontend' : 'partner' } },
          i % 2 === 0 ? 'frontend' : 'partner'
        )
      )

      const results = await Promise.all(rapidSwitchPromises)

      // All frontend requests should succeed
      results.forEach((result, index) => {
        if (index % 2 === 0) { // Frontend
          expect(result.error).toBeUndefined()
        }
        // Partner app results depend on validation logic
      })
    })
  })
})