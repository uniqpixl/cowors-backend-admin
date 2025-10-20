import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateSession, validateCrossAppSession } from '../audit'
import type { EnhancedJWT, EnhancedSession, EnhancedUser } from '../refresh'
import { Session } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import { UserRole } from '../types'

// Mock the features module
vi.mock('../features', () => ({
  shouldValidateCrossApp: vi.fn(() => true),
  shouldAuditLog: vi.fn(() => true),
}))

describe('Session Management and Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.setSystemTime(new Date('2022-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Session Validation', () => {
    it('should validate a valid session', () => {
      const validSession: Session = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        expires: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      }

      const validToken: JWT = {
        sub: 'user-123',
        email: 'test@example.com',
        exp: Math.floor((Date.now() + 3600000) / 1000) // 1 hour from now in seconds
      }

      const result = validateSession(validSession, validToken)
      expect(result.isValid).toBe(true)
    })

    it('should invalidate an expired session', () => {
      const expiredSession: Session = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        expires: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      }

      const validToken: JWT = {
        sub: 'user-123',
        email: 'test@example.com',
        exp: Math.floor((Date.now() + 3600000) / 1000) // Token still valid
      }

      const result = validateSession(expiredSession, validToken)
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('expired')
    })

    it('should invalidate session with expired token', () => {
      const validSession: Session = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const expiredToken: JWT = {
        sub: 'user-123',
        email: 'test@example.com',
        exp: Math.floor((Date.now() - 3600000) / 1000) // 1 hour ago in seconds
      }

      const result = validateSession(validSession, expiredToken)
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('Token expired')
    })

    it('should invalidate session with user ID mismatch', () => {
      const session: Session = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const mismatchedToken: JWT = {
        sub: 'different-user-456',
        email: 'test@example.com',
        exp: Math.floor((Date.now() + 3600000) / 1000)
      }

      const result = validateSession(session, mismatchedToken)
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('User ID mismatch')
    })
  })

  describe('Cross-Application Session Validation', () => {
    it('should validate cross-app session with valid data', () => {
      const session: EnhancedSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER,
          roles: ['user'],
          permissions: ['read'],
          appType: 'frontend'
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const token: EnhancedJWT = {
        sub: 'user-123',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read'],
        appType: 'frontend',
        exp: Math.floor((Date.now() + 3600000) / 1000)
      }

      const result = validateCrossAppSession(session, token, 'frontend', ['user'])
      expect(result.isValid).toBe(true)
    })

    it('should invalidate cross-app session with insufficient roles', () => {
      const session: EnhancedSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER,
          roles: ['user'],
          permissions: ['read'],
          appType: 'frontend'
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const token: EnhancedJWT = {
        sub: 'user-123',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read'],
        appType: 'frontend',
        exp: Math.floor((Date.now() + 3600000) / 1000)
      }

      const result = validateCrossAppSession(session, token, 'admin', ['admin'])
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('role')
    })

    it('should handle missing token data gracefully', () => {
      const session: EnhancedSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const token: EnhancedJWT = {
        sub: 'user-123',
        email: 'test@example.com',
        exp: Math.floor((Date.now() + 3600000) / 1000)
      }

      const result = validateCrossAppSession(session, token, 'frontend')
      expect(result.isValid).toBe(true) // Should pass with basic validation
    })
  })

  describe('Security Edge Cases', () => {
    it('should handle null/undefined session gracefully', () => {
      const validToken: JWT = {
        sub: 'user-123',
        email: 'test@example.com',
        exp: Math.floor((Date.now() + 3600000) / 1000)
      }

      expect(() => validateSession(null, validToken)).not.toThrow()
      expect(() => validateSession(undefined as any, validToken)).not.toThrow()
      
      const nullResult = validateSession(null, validToken)
      expect(nullResult.isValid).toBe(false)
      expect(nullResult.reason).toContain('Missing session or token')
    })

    it('should handle null/undefined token gracefully', () => {
      const validSession: Session = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      expect(() => validateSession(validSession, null)).not.toThrow()
      expect(() => validateSession(validSession, undefined as any)).not.toThrow()
      
      const nullResult = validateSession(validSession, null)
      expect(nullResult.isValid).toBe(false)
      expect(nullResult.reason).toContain('Missing session or token')
    })

    it('should validate session with minimal required data', () => {
      const minimalSession: Session = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: UserRole.USER
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const minimalToken: JWT = {
        sub: 'user-123',
        exp: Math.floor((Date.now() + 3600000) / 1000)
      }

      const result = validateSession(minimalSession, minimalToken)
      expect(result.isValid).toBe(true)
    })

    it('should handle cross-app validation with empty roles', () => {
      const session: EnhancedSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER,
          roles: [],
          permissions: [],
          appType: 'frontend'
        },
        expires: new Date(Date.now() + 3600000).toISOString()
      }

      const token: EnhancedJWT = {
        sub: 'user-123',
        email: 'test@example.com',
        roles: [],
        permissions: [],
        appType: 'frontend',
        exp: Math.floor((Date.now() + 3600000) / 1000)
      }

      const result = validateCrossAppSession(session, token, 'frontend', [])
      expect(result.isValid).toBe(true)
    })
  })
})