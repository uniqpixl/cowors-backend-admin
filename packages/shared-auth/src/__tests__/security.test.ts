import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  handleAuthError,
  auditLog,
  sanitizeUserInput,
  validateSecurityHeaders,
  detectSuspiciousActivity,
  implementFallbackAuth,
  encryptSensitiveData,
  validateCSRFToken,
  preventSessionFixation,
  rateLimitAuth
} from '../utils'
import { SessionValidator } from '../validation'
import { 
  mockUsers, 
  mockSessions, 
  createMockFetchResponse,
  createTestUser,
  setMockTime
} from './utils/test-helpers'

describe('Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setMockTime(1640995200000) // 2022-01-01T00:00:00.000Z
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Error Handling', () => {
    it('should handle authentication errors securely', () => {
      const sensitiveError = new Error('Database connection failed: password=secret123')
      
      const sanitizedError = handleAuthError(sensitiveError, 'login')
      
      expect(sanitizedError.message).not.toContain('password=secret123')
      expect(sanitizedError.message).toContain('Authentication failed')
      expect(sanitizedError.code).toBe('AUTH_ERROR')
      expect(sanitizedError.timestamp).toBeDefined()
    })

    it('should categorize different error types', () => {
      const networkError = new Error('Network timeout')
      const validationError = new Error('Invalid credentials')
      const systemError = new Error('Internal server error')
      
      const categorizedNetwork = handleAuthError(networkError, 'login')
      const categorizedValidation = handleAuthError(validationError, 'login')
      const categorizedSystem = handleAuthError(systemError, 'login')
      
      expect(categorizedNetwork.category).toBe('network')
      expect(categorizedValidation.category).toBe('validation')
      expect(categorizedSystem.category).toBe('system')
    })

    it('should not expose sensitive information in error messages', () => {
      const errors = [
        new Error('SQL injection attempt: SELECT * FROM users WHERE id=1; DROP TABLE users;'),
        new Error('API key leaked: sk-1234567890abcdef'),
        new Error('Database password: mysecretpassword123'),
        new Error('JWT secret: super-secret-key-12345')
      ]
      
      errors.forEach(error => {
        const sanitized = handleAuthError(error, 'validation')
        expect(sanitized.message).not.toContain('SELECT')
        expect(sanitized.message).not.toContain('sk-1234567890abcdef')
        expect(sanitized.message).not.toContain('mysecretpassword123')
        expect(sanitized.message).not.toContain('super-secret-key-12345')
      })
    })

    it('should implement error rate limiting', () => {
      const userId = 'test-user-123'
      
      // Simulate multiple rapid errors
      for (let i = 0; i < 10; i++) {
        handleAuthError(new Error('Failed login'), 'login', userId)
      }
      
      const rateLimitedError = handleAuthError(new Error('Another failed login'), 'login', userId)
      
      expect(rateLimitedError.rateLimited).toBe(true)
      expect(rateLimitedError.retryAfter).toBeGreaterThan(0)
    })

    it('should handle concurrent error processing', async () => {
      const errors = Array(20).fill(null).map((_, i) => 
        new Error(`Concurrent error ${i}`)
      )
      
      const promises = errors.map(error => 
        Promise.resolve(handleAuthError(error, 'validation'))
      )
      
      const results = await Promise.all(promises)
      
      // All errors should be processed without race conditions
      results.forEach((result, index) => {
        expect(result.message).toContain('Authentication failed')
        expect(result.originalIndex).toBe(index)
      })
    })
  })

  describe('Audit Logging', () => {
    it('should log authentication events with proper structure', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      auditLog({
        action: 'login_attempt',
        userId: 'user-123',
        appType: 'admin',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        result: 'success',
        metadata: { loginMethod: 'credentials' }
      })
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
          action: 'login_attempt',
          userId: 'user-123',
          appType: 'admin',
          ipAddress: '192.168.1.100',
          result: 'success'
        })
      )
    })

    it('should sanitize sensitive data in audit logs', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      auditLog({
        action: 'password_change',
        userId: 'user-123',
        metadata: {
          oldPassword: 'secret123',
          newPassword: 'newsecret456',
          sessionToken: 'jwt-token-12345'
        }
      })
      
      const loggedData = logSpy.mock.calls[0][0]
      expect(loggedData.metadata.oldPassword).toBe('[REDACTED]')
      expect(loggedData.metadata.newPassword).toBe('[REDACTED]')
      expect(loggedData.metadata.sessionToken).toBe('[REDACTED]')
    })

    it('should handle high-volume audit logging', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // Generate many audit events
      for (let i = 0; i < 1000; i++) {
        auditLog({
          action: 'api_access',
          userId: `user-${i}`,
          result: 'success'
        })
      }
      
      expect(logSpy).toHaveBeenCalledTimes(1000)
    })

    it('should implement audit log rotation', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // Mock log rotation trigger
      const largeLogEntry = {
        action: 'bulk_operation',
        userId: 'admin-user',
        metadata: {
          data: 'x'.repeat(10000) // Large data
        }
      }
      
      auditLog(largeLogEntry)
      
      // Should trigger log rotation or compression
      expect(logSpy).toHaveBeenCalled()
    })

    it('should handle audit logging failures gracefully', () => {
      const originalConsole = console.log
      console.log = vi.fn().mockImplementation(() => {
        throw new Error('Logging service unavailable')
      })
      
      // Should not throw error even if logging fails
      expect(() => {
        auditLog({
          action: 'critical_operation',
          userId: 'user-123',
          result: 'success'
        })
      }).not.toThrow()
      
      console.log = originalConsole
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize user input to prevent XSS', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert("xss")</script>',
        "'; DROP TABLE users; --"
      ]
      
      maliciousInputs.forEach(input => {
        const sanitized = sanitizeUserInput(input)
        expect(sanitized).not.toContain('<script>')
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).not.toContain('onerror=')
        expect(sanitized).not.toContain('DROP TABLE')
      })
    })

    it('should preserve safe user input', () => {
      const safeInputs = [
        'john.doe@example.com',
        'John Doe',
        '123-456-7890',
        'Valid password with special chars!@#',
        'https://example.com/safe-url'
      ]
      
      safeInputs.forEach(input => {
        const sanitized = sanitizeUserInput(input)
        expect(sanitized).toBe(input)
      })
    })

    it('should handle Unicode and international characters', () => {
      const unicodeInputs = [
        'José María',
        '北京市',
        'Москва',
        'العربية',
        '🔒 Secure Password 🔑'
      ]
      
      unicodeInputs.forEach(input => {
        const sanitized = sanitizeUserInput(input)
        expect(sanitized).toBeDefined()
        expect(typeof sanitized).toBe('string')
      })
    })

    it('should limit input length to prevent DoS', () => {
      const longInput = 'a'.repeat(100000)
      
      const sanitized = sanitizeUserInput(longInput)
      
      expect(sanitized.length).toBeLessThanOrEqual(10000) // Reasonable limit
    })
  })

  describe('Security Headers Validation', () => {
    it('should validate required security headers', () => {
      const headers = {
        'Content-Security-Policy': "default-src 'self'",
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Strict-Transport-Security': 'max-age=31536000',
        'X-XSS-Protection': '1; mode=block'
      }
      
      const validation = validateSecurityHeaders(headers)
      
      expect(validation.valid).toBe(true)
      expect(validation.missing).toEqual([])
    })

    it('should detect missing security headers', () => {
      const incompleteHeaders = {
        'Content-Type': 'application/json'
      }
      
      const validation = validateSecurityHeaders(incompleteHeaders)
      
      expect(validation.valid).toBe(false)
      expect(validation.missing).toContain('Content-Security-Policy')
      expect(validation.missing).toContain('X-Frame-Options')
    })

    it('should validate CSP directives', () => {
      const weakCSP = {
        'Content-Security-Policy': "default-src *; script-src 'unsafe-eval'"
      }
      
      const validation = validateSecurityHeaders(weakCSP)
      
      expect(validation.warnings).toContain('Weak CSP policy detected')
    })
  })

  describe('Suspicious Activity Detection', () => {
    it('should detect brute force attacks', () => {
      const userId = 'target-user'
      const ipAddress = '192.168.1.100'
      
      // Simulate multiple failed login attempts
      for (let i = 0; i < 10; i++) {
        detectSuspiciousActivity({
          action: 'login_failed',
          userId,
          ipAddress,
          timestamp: Date.now() + i * 1000
        })
      }
      
      const detection = detectSuspiciousActivity({
        action: 'login_failed',
        userId,
        ipAddress,
        timestamp: Date.now() + 11000
      })
      
      expect(detection.suspicious).toBe(true)
      expect(detection.reason).toContain('brute_force')
      expect(detection.riskLevel).toBe('high')
    })

    it('should detect unusual login patterns', () => {
      const userId = 'user-123'
      
      // Normal login from usual location
      detectSuspiciousActivity({
        action: 'login_success',
        userId,
        ipAddress: '192.168.1.100',
        location: 'New York, US'
      })
      
      // Unusual login from different continent
      const detection = detectSuspiciousActivity({
        action: 'login_success',
        userId,
        ipAddress: '203.0.113.1',
        location: 'Beijing, China',
        timestamp: Date.now() + 60000 // 1 minute later
      })
      
      expect(detection.suspicious).toBe(true)
      expect(detection.reason).toContain('unusual_location')
    })

    it('should detect session hijacking attempts', () => {
      const sessionId = 'session-123'
      
      // Normal session activity
      detectSuspiciousActivity({
        action: 'api_access',
        sessionId,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      })
      
      // Same session from different IP/User-Agent
      const detection = detectSuspiciousActivity({
        action: 'api_access',
        sessionId,
        ipAddress: '203.0.113.1',
        userAgent: 'curl/7.68.0'
      })
      
      expect(detection.suspicious).toBe(true)
      expect(detection.reason).toContain('session_hijacking')
    })

    it('should implement adaptive thresholds', () => {
      const userId = 'adaptive-user'
      
      // Establish normal behavior pattern
      for (let i = 0; i < 100; i++) {
        detectSuspiciousActivity({
          action: 'api_access',
          userId,
          timestamp: Date.now() + i * 60000 // Every minute
        })
      }
      
      // Sudden spike in activity
      for (let i = 0; i < 50; i++) {
        detectSuspiciousActivity({
          action: 'api_access',
          userId,
          timestamp: Date.now() + 6000000 + i * 1000 // Every second
        })
      }
      
      const detection = detectSuspiciousActivity({
        action: 'api_access',
        userId,
        timestamp: Date.now() + 6050000
      })
      
      expect(detection.suspicious).toBe(true)
      expect(detection.reason).toContain('unusual_activity_spike')
    })
  })

  describe('Fallback Authentication Mechanisms', () => {
    it('should implement fallback when primary auth fails', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Primary auth service down'))
      
      const credentials = {
        email: 'user@test.com',
        password: 'password123'
      }
      
      const result = await implementFallbackAuth(credentials, 'admin')
      
      expect(result.method).toBe('fallback')
      expect(result.success).toBe(true)
      expect(result.limitations).toBeDefined()
    })

    it('should limit fallback authentication capabilities', async () => {
      const credentials = {
        email: 'user@test.com',
        password: 'password123'
      }
      
      const result = await implementFallbackAuth(credentials, 'admin')
      
      expect(result.limitations).toContain('read_only')
      expect(result.limitations).toContain('temporary_session')
      expect(result.expiresIn).toBeLessThanOrEqual(3600) // 1 hour max
    })

    it('should gracefully degrade functionality', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValue(new Error('All auth services down'))
      
      const result = await implementFallbackAuth({
        email: 'admin@test.com',
        password: 'password123'
      }, 'admin')
      
      expect(result.degradedMode).toBe(true)
      expect(result.availableFeatures).toContain('view_profile')
      expect(result.availableFeatures).not.toContain('admin_functions')
    })

    it('should maintain security during fallback', async () => {
      const result = await implementFallbackAuth({
        email: 'user@test.com',
        password: 'password123'
      }, 'admin')
      
      expect(result.securityLevel).toBe('reduced')
      expect(result.requiresReauth).toBe(true)
      expect(result.auditLogged).toBe(true)
    })
  })

  describe('Data Encryption', () => {
    it('should encrypt sensitive user data', () => {
      const sensitiveData = {
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111',
        password: 'secretpassword123'
      }
      
      const encrypted = encryptSensitiveData(sensitiveData)
      
      expect(encrypted.ssn).not.toBe(sensitiveData.ssn)
      expect(encrypted.creditCard).not.toBe(sensitiveData.creditCard)
      expect(encrypted.password).not.toBe(sensitiveData.password)
      expect(encrypted.ssn).toMatch(/^[a-f0-9]+$/) // Hex string
    })

    it('should use different encryption keys for different data types', () => {
      const data1 = { password: 'password123' }
      const data2 = { ssn: '123-45-6789' }
      
      const encrypted1 = encryptSensitiveData(data1)
      const encrypted2 = encryptSensitiveData(data2)
      
      // Same input should produce different outputs with different keys
      expect(encrypted1.password).not.toBe(encrypted2.ssn)
    })

    it('should handle encryption failures gracefully', () => {
      // Mock encryption failure
      const originalCrypto = global.crypto
      global.crypto = undefined as any
      
      const result = encryptSensitiveData({ password: 'test123' })
      
      expect(result.error).toBeDefined()
      expect(result.fallback).toBe(true)
      
      global.crypto = originalCrypto
    })
  })

  describe('CSRF Protection', () => {
    it('should validate CSRF tokens', () => {
      const validToken = 'csrf-token-12345'
      const sessionToken = 'session-token-67890'
      
      const isValid = validateCSRFToken(validToken, sessionToken)
      
      expect(isValid).toBe(true)
    })

    it('should reject invalid CSRF tokens', () => {
      const invalidToken = 'invalid-csrf-token'
      const sessionToken = 'session-token-67890'
      
      const isValid = validateCSRFToken(invalidToken, sessionToken)
      
      expect(isValid).toBe(false)
    })

    it('should handle missing CSRF tokens', () => {
      const isValid = validateCSRFToken(null, 'session-token')
      
      expect(isValid).toBe(false)
    })

    it('should implement token rotation', () => {
      const sessionToken = 'session-token-67890'
      
      const token1 = generateCSRFToken(sessionToken)
      const token2 = generateCSRFToken(sessionToken)
      
      expect(token1).not.toBe(token2)
      expect(validateCSRFToken(token1, sessionToken)).toBe(true)
      expect(validateCSRFToken(token2, sessionToken)).toBe(true)
    })
  })

  describe('Session Security', () => {
    it('should prevent session fixation attacks', () => {
      const oldSessionId = 'old-session-123'
      const userId = 'user-456'
      
      const newSession = preventSessionFixation(oldSessionId, userId)
      
      expect(newSession.id).not.toBe(oldSessionId)
      expect(newSession.userId).toBe(userId)
      expect(newSession.created).toBeDefined()
    })

    it('should implement secure session storage', () => {
      const session = {
        id: 'session-123',
        userId: 'user-456',
        data: { role: 'admin' }
      }
      
      const stored = storeSecureSession(session)
      
      expect(stored.encrypted).toBe(true)
      expect(stored.httpOnly).toBe(true)
      expect(stored.secure).toBe(true)
      expect(stored.sameSite).toBe('strict')
    })

    it('should implement session timeout', () => {
      const session = {
        id: 'session-123',
        lastActivity: Date.now() - 7200000, // 2 hours ago
        maxAge: 3600000 // 1 hour
      }
      
      const isExpired = checkSessionTimeout(session)
      
      expect(isExpired).toBe(true)
    })
  })

  describe('Rate Limiting', () => {
    it('should implement authentication rate limiting', () => {
      const ipAddress = '192.168.1.100'
      
      // Make multiple rapid authentication attempts
      for (let i = 0; i < 10; i++) {
        rateLimitAuth(ipAddress, 'login')
      }
      
      const rateLimited = rateLimitAuth(ipAddress, 'login')
      
      expect(rateLimited.allowed).toBe(false)
      expect(rateLimited.retryAfter).toBeGreaterThan(0)
    })

    it('should implement different limits for different actions', () => {
      const ipAddress = '192.168.1.101'
      
      // Login attempts should have stricter limits
      for (let i = 0; i < 5; i++) {
        rateLimitAuth(ipAddress, 'login')
      }
      
      // Password reset should have different limits
      for (let i = 0; i < 3; i++) {
        rateLimitAuth(ipAddress, 'password_reset')
      }
      
      const loginLimited = rateLimitAuth(ipAddress, 'login')
      const resetLimited = rateLimitAuth(ipAddress, 'password_reset')
      
      expect(loginLimited.allowed).toBe(false)
      expect(resetLimited.allowed).toBe(false)
    })

    it('should implement sliding window rate limiting', () => {
      const ipAddress = '192.168.1.102'
      
      // Make requests at the edge of the time window
      rateLimitAuth(ipAddress, 'login')
      
      // Advance time
      setMockTime(Date.now() + 60000) // 1 minute later
      
      const result = rateLimitAuth(ipAddress, 'login')
      
      expect(result.allowed).toBe(true)
    })
  })
})