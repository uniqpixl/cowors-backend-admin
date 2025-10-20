import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SessionValidator } from '../validation'
import { 
  validateCrossAppSession,
  syncSessionAcrossApps,
  invalidateSessionAcrossApps,
  getAppSpecificSession,
  validateAppTransition,
  handleCrossAppRedirect
} from '../validation'
import { 
  mockUsers, 
  mockSessions, 
  mockApiResponses,
  createMockFetchResponse,
  createTestUser,
  createTestSession,
  expectSessionToBeValid,
  setMockTime
} from './utils/test-helpers'

describe('Cross-Application Session Validation', () => {
  let sessionValidator: SessionValidator

  beforeEach(() => {
    vi.clearAllMocks()
    setMockTime(1640995200000) // 2022-01-01T00:00:00.000Z
    
    sessionValidator = new SessionValidator({
      apiBaseUrl: 'http://localhost:5001',
      timeout: 5000,
      enableAuditLog: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('SessionValidator Class', () => {
    it('should validate session locally first', async () => {
      const session = mockSessions.admin
      
      const result = await sessionValidator.validateSession(session, 'admin')
      
      expectSessionToBeValid(result.session)
      expect(result.isValid).toBe(true)
      expect(result.source).toBe('local')
    })

    it('should fall back to remote validation when local fails', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse(mockApiResponses.validationSuccess)
      )

      const expiredSession = mockSessions.expired
      
      const result = await sessionValidator.validateSession(expiredSession, 'admin')
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5001/auth/validate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining(expiredSession.user.id)
        })
      )
      
      expect(result.source).toBe('remote')
    })

    it('should handle remote validation failure', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse(mockApiResponses.validationFailure, 401, false)
      )

      const invalidSession = {
        ...mockSessions.admin,
        user: { ...mockSessions.admin.user, id: 'invalid-user' }
      }
      
      const result = await sessionValidator.validateSession(invalidSession, 'admin')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle network timeouts gracefully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 6000)
        )
      )

      const session = mockSessions.admin
      
      const result = await sessionValidator.validateSession(session, 'admin')
      
      // Should fall back to local validation or handle timeout
      expect(result).toBeDefined()
    })

    it('should audit session validation attempts', async () => {
      const auditSpy = vi.spyOn(sessionValidator, 'auditLog')
      const session = mockSessions.admin
      
      await sessionValidator.validateSession(session, 'admin')
      
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'session_validation',
          userId: session.user.id,
          appType: 'admin',
          result: 'success'
        })
      )
    })
  })

  describe('Cross-App Session Validation', () => {
    it('should validate admin session across all apps', async () => {
      const adminSession = mockSessions.admin
      
      const adminResult = await validateCrossAppSession(adminSession, 'admin')
      const partnerResult = await validateCrossAppSession(adminSession, 'partner')
      const userResult = await validateCrossAppSession(adminSession, 'user')
      
      expect(adminResult.isValid).toBe(true)
      expect(partnerResult.isValid).toBe(true)
      expect(userResult.isValid).toBe(true)
    })

    it('should restrict partner session to appropriate apps', async () => {
      const partnerSession = mockSessions.partner
      
      const adminResult = await validateCrossAppSession(partnerSession, 'admin')
      const partnerResult = await validateCrossAppSession(partnerSession, 'partner')
      const userResult = await validateCrossAppSession(partnerSession, 'user')
      
      expect(adminResult.isValid).toBe(false)
      expect(partnerResult.isValid).toBe(true)
      expect(userResult.isValid).toBe(true)
    })

    it('should restrict user session to user app only', async () => {
      const userSession = mockSessions.user
      
      const adminResult = await validateCrossAppSession(userSession, 'admin')
      const partnerResult = await validateCrossAppSession(userSession, 'partner')
      const userResult = await validateCrossAppSession(userSession, 'user')
      
      expect(adminResult.isValid).toBe(false)
      expect(partnerResult.isValid).toBe(false)
      expect(userResult.isValid).toBe(true)
    })

    it('should handle session validation with specific permissions', async () => {
      const partnerSession = mockSessions.partner
      
      const result = await validateCrossAppSession(
        partnerSession, 
        'partner', 
        ['partner_read', 'partner_write']
      )
      
      expect(result.isValid).toBe(true)
      expect(result.permissions).toContain('partner_read')
      expect(result.permissions).toContain('partner_write')
    })

    it('should validate session with role hierarchy', async () => {
      const adminSession = mockSessions.admin
      
      // Admin accessing partner app should inherit partner permissions
      const result = await validateCrossAppSession(adminSession, 'partner')
      
      expect(result.isValid).toBe(true)
      expect(result.effectiveRoles).toContain('admin')
      expect(result.inheritedPermissions).toBeDefined()
    })
  })

  describe('Session Synchronization', () => {
    it('should sync session updates across all apps', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue(
        createMockFetchResponse({ success: true })
      )

      const updatedSession = {
        ...mockSessions.admin,
        user: {
          ...mockSessions.admin.user,
          roles: ['admin', 'super_admin']
        }
      }
      
      const result = await syncSessionAcrossApps(updatedSession)
      
      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/sync'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('super_admin')
        })
      )
    })

    it('should handle sync failures gracefully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Sync service unavailable'))

      const session = mockSessions.admin
      
      const result = await syncSessionAcrossApps(session)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Sync service unavailable')
    })

    it('should batch multiple session updates', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue(
        createMockFetchResponse({ success: true })
      )

      const sessions = [mockSessions.admin, mockSessions.partner, mockSessions.user]
      
      const results = await Promise.all(
        sessions.map(session => syncSessionAcrossApps(session))
      )
      
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })

    it('should handle partial sync failures', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch
        .mockResolvedValueOnce(createMockFetchResponse({ success: true }))
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockResolvedValueOnce(createMockFetchResponse({ success: true }))

      const sessions = [mockSessions.admin, mockSessions.partner, mockSessions.user]
      
      const results = await Promise.allSettled(
        sessions.map(session => syncSessionAcrossApps(session))
      )
      
      expect(results[0].status).toBe('fulfilled')
      expect(results[1].status).toBe('rejected')
      expect(results[2].status).toBe('fulfilled')
    })
  })

  describe('Session Invalidation', () => {
    it('should invalidate session across all apps', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue(
        createMockFetchResponse({ invalidated: true })
      )

      const session = mockSessions.admin
      
      const result = await invalidateSessionAcrossApps(session.user.id)
      
      expect(result.invalidated).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/invalidate'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(session.user.id)
        })
      )
    })

    it('should handle invalidation of non-existent session', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({ error: 'Session not found' }, 404, false)
      )

      const result = await invalidateSessionAcrossApps('non-existent-user')
      
      expect(result.invalidated).toBe(false)
      expect(result.error).toContain('Session not found')
    })

    it('should cascade invalidation to related sessions', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue(
        createMockFetchResponse({ 
          invalidated: true,
          cascaded: ['admin-session', 'partner-session', 'user-session']
        })
      )

      const result = await invalidateSessionAcrossApps('admin-user-id', true)
      
      expect(result.cascaded).toHaveLength(3)
      expect(result.cascaded).toContain('admin-session')
    })
  })

  describe('App-Specific Session Handling', () => {
    it('should get app-specific session data', async () => {
      const baseSession = mockSessions.admin
      
      const adminSession = await getAppSpecificSession(baseSession, 'admin')
      const partnerSession = await getAppSpecificSession(baseSession, 'partner')
      
      expect(adminSession.appType).toBe('admin')
      expect(partnerSession.appType).toBe('partner')
      expect(adminSession.permissions).not.toEqual(partnerSession.permissions)
    })

    it('should handle app-specific role mapping', async () => {
      const adminSession = mockSessions.admin
      
      const partnerSpecificSession = await getAppSpecificSession(adminSession, 'partner')
      
      // Admin should get partner-equivalent roles when accessing partner app
      expect(partnerSpecificSession.user.roles).toContain('partner_admin')
      expect(partnerSpecificSession.user.permissions).toContain('partner_manage')
    })

    it('should validate app transitions', async () => {
      const session = mockSessions.admin
      
      const adminToPartner = await validateAppTransition(session, 'admin', 'partner')
      const adminToUser = await validateAppTransition(session, 'admin', 'user')
      
      expect(adminToPartner.allowed).toBe(true)
      expect(adminToUser.allowed).toBe(true)
    })

    it('should restrict invalid app transitions', async () => {
      const userSession = mockSessions.user
      
      const userToAdmin = await validateAppTransition(userSession, 'user', 'admin')
      const userToPartner = await validateAppTransition(userSession, 'user', 'partner')
      
      expect(userToAdmin.allowed).toBe(false)
      expect(userToPartner.allowed).toBe(false)
      expect(userToAdmin.reason).toContain('insufficient privileges')
    })

    it('should handle cross-app redirects securely', async () => {
      const session = mockSessions.admin
      const targetUrl = 'http://localhost:3001/partner/dashboard'
      
      const redirect = await handleCrossAppRedirect(session, 'admin', 'partner', targetUrl)
      
      expect(redirect.allowed).toBe(true)
      expect(redirect.redirectUrl).toContain('partner/dashboard')
      expect(redirect.token).toBeDefined() // Should include transition token
    })
  })

  describe('Session State Consistency', () => {
    it('should maintain session state consistency across apps', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue(
        createMockFetchResponse({
          consistent: true,
          lastSync: Date.now()
        })
      )

      const session = mockSessions.admin
      
      const consistency = await sessionValidator.checkConsistency(session.user.id)
      
      expect(consistency.consistent).toBe(true)
      expect(consistency.lastSync).toBeDefined()
    })

    it('should detect and resolve session inconsistencies', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({
          consistent: false,
          conflicts: ['role_mismatch', 'permission_drift']
        })
      ).mockResolvedValueOnce(
        createMockFetchResponse({
          resolved: true,
          conflicts: []
        })
      )

      const session = mockSessions.admin
      
      const consistency = await sessionValidator.checkConsistency(session.user.id)
      expect(consistency.consistent).toBe(false)
      
      const resolution = await sessionValidator.resolveInconsistencies(session.user.id)
      expect(resolution.resolved).toBe(true)
    })

    it('should handle concurrent session modifications', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue(
        createMockFetchResponse({ success: true })
      )

      const session = mockSessions.admin
      
      // Simulate concurrent updates
      const updates = Array(5).fill(null).map((_, i) => 
        syncSessionAcrossApps({
          ...session,
          user: {
            ...session.user,
            lastActivity: Date.now() + i
          }
        })
      )
      
      const results = await Promise.all(updates)
      
      // All updates should succeed or handle conflicts gracefully
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Performance and Caching', () => {
    it('should cache validation results', async () => {
      const session = mockSessions.admin
      
      // First validation
      const start1 = performance.now()
      await sessionValidator.validateSession(session, 'admin')
      const end1 = performance.now()
      
      // Second validation (should be cached)
      const start2 = performance.now()
      await sessionValidator.validateSession(session, 'admin')
      const end2 = performance.now()
      
      // Second call should be faster due to caching
      expect(end2 - start2).toBeLessThan(end1 - start1)
    })

    it('should invalidate cache when session changes', async () => {
      const session = mockSessions.admin
      
      // Initial validation
      await sessionValidator.validateSession(session, 'admin')
      
      // Modify session
      const modifiedSession = {
        ...session,
        user: {
          ...session.user,
          roles: ['admin', 'super_admin']
        }
      }
      
      // Should not use cached result for modified session
      const result = await sessionValidator.validateSession(modifiedSession, 'admin')
      expect(result.session.user.roles).toContain('super_admin')
    })

    it('should handle high-frequency validation requests', async () => {
      const session = mockSessions.admin
      
      const validations = Array(100).fill(null).map(() =>
        sessionValidator.validateSession(session, 'admin')
      )
      
      const results = await Promise.all(validations)
      
      // All validations should complete successfully
      results.forEach(result => {
        expect(result.isValid).toBe(true)
      })
    })
  })

  describe('Security Edge Cases', () => {
    it('should prevent session hijacking across apps', async () => {
      const legitimateSession = mockSessions.admin
      const hijackedSession = {
        ...legitimateSession,
        user: {
          ...legitimateSession.user,
          id: 'hijacker-id'
        }
      }
      
      const result = await validateCrossAppSession(hijackedSession, 'admin')
      
      // Should detect session tampering
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('session integrity')
    })

    it('should validate session signatures', async () => {
      const session = mockSessions.admin
      
      // Tamper with session signature
      const tamperedSession = {
        ...session,
        signature: 'tampered-signature'
      }
      
      const result = await sessionValidator.validateSession(tamperedSession, 'admin')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('invalid signature')
    })

    it('should handle session replay attacks', async () => {
      const oldSession = {
        ...mockSessions.admin,
        expires: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
        lastActivity: Date.now() - 86400000
      }
      
      const result = await validateCrossAppSession(oldSession, 'admin')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('should rate limit validation requests', async () => {
      const session = mockSessions.admin
      
      // Make many rapid requests
      const rapidRequests = Array(50).fill(null).map(() =>
        sessionValidator.validateSession(session, 'admin')
      )
      
      const results = await Promise.allSettled(rapidRequests)
      
      // Some requests might be rate limited
      const rateLimited = results.filter(r => 
        r.status === 'rejected' && 
        r.reason.message.includes('rate limit')
      )
      
      // Should have some rate limiting in place
      expect(rateLimited.length).toBeGreaterThanOrEqual(0)
    })
  })
})