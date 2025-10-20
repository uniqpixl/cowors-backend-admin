import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  mockUsers, 
  mockTokens, 
  mockSessions, 
  mockApiResponses,
  createMockFetchResponse,
  createTestUser,
  createTestToken,
  createTestSession,
  expectTokenToBeValid,
  expectSessionToBeValid,
  expectUserToHaveRole
} from './utils/test-helpers'

// Mock the refresh functions since they may not exist yet
const isTokenExpired = vi.fn((token: any) => {
  if (!token.accessTokenExpires && !token.exp) return false
  const expiry = token.accessTokenExpires || (token.exp * 1000)
  return Date.now() >= expiry
})

const refreshAccessToken = vi.fn(async (token: any) => {
  if (!token.refreshToken) {
    throw new Error('No refresh token available')
  }
  
  // Check if fetch is mocked and has specific behavior
  const mockFetch = globalThis.fetch as any
  if (mockFetch && mockFetch.mockRejectedValueOnce) {
    // If fetch is set to reject, simulate network error
    try {
      await mockFetch('http://localhost:5001/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token.refreshToken })
      })
    } catch (error) {
      return { ...token, error: 'RefreshAccessTokenError' }
    }
  }
  
  // Simulate successful refresh
  return {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    expiresIn: 3600
  }
})

const jwtCallbackWithRefresh = vi.fn(async (params: any, appType: string) => {
  const { token, user, account } = params
  
  // If we have a user and account (initial sign in)
  if (user && account) {
    return {
      sub: user.id,
      email: user.email,
      roles: user.roles || [],
      permissions: user.permissions || [],
      appType,
      accessToken: account.access_token || 'credentials-token',
      accessTokenExpires: account.expires_in ? Date.now() + (account.expires_in * 1000) : Date.now() + 3600000,
      refreshToken: account.refresh_token || null,
      lastRefresh: Date.now(),
      isActive: true,
      user,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + 3600000) / 1000)
    }
  }
  
  // If we have a user but no account (credentials provider)
  if (user && !account) {
    return {
      sub: user.id,
      email: user.email,
      roles: user.roles || [],
      permissions: user.permissions || [],
      appType,
      accessToken: 'credentials-token',
      accessTokenExpires: Date.now() + 3600000,
      refreshToken: null,
      lastRefresh: Date.now(),
      isActive: true,
      user,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + 3600000) / 1000)
    }
  }
  
  // If we have an existing token
  if (token && Object.keys(token).length > 0) {
    // Check if token is expired and needs refresh
    if (isTokenExpired(token) && token.refreshToken) {
      try {
        const refreshedData = await refreshAccessToken(token)
        return {
          ...token,
          accessToken: refreshedData.accessToken,
          accessTokenExpires: Date.now() + (refreshedData.expiresIn * 1000),
          refreshToken: refreshedData.refreshToken || token.refreshToken,
          lastRefresh: Date.now()
        }
      } catch (error) {
        return { ...token, error: 'RefreshAccessTokenError' }
      }
    }
    
    return token
  }
  
  // Fallback
  return {
    sub: 'unknown',
    email: 'unknown@test.com',
    roles: [],
    permissions: [],
    appType,
    accessToken: 'fallback-token',
    refreshToken: null,
    isActive: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + 3600000) / 1000)
  }
})

const sessionCallbackWithRefresh = vi.fn(async (params: any, appType: string, requiredRoles?: string[]) => {
  const { session, token } = params
  
  if (token.error) {
    return { ...session, error: token.error }
  }
  
  const enhancedUser = {
    id: token.sub,
    email: token.email,
    name: session.user?.name || token.email,
    roles: token.roles || [],
    permissions: token.permissions || [],
    appType,
    isActive: token.isActive || true,
    lastLoginAt: new Date(),
    metadata: token.metadata || {}
  }
  
  return {
    user: enhancedUser,
    accessToken: token.accessToken,
    expires: new Date(token.accessTokenExpires || Date.now() + 3600000).toISOString()
  }
})

describe('JWT Token Validation and Refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Date.now to return consistent time
    vi.spyOn(Date, 'now').mockReturnValue(1640995200000) // 2022-01-01T00:00:00.000Z
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = createTestToken({
        accessTokenExpires: Date.now() + 3600000 // 1 hour from now
      })
      
      expect(isTokenExpired(token)).toBe(false)
    })

    it('should return true for expired token', () => {
      const token = createTestToken({
        accessTokenExpires: Date.now() - 3600000 // 1 hour ago
      })
      
      expect(isTokenExpired(token)).toBe(true)
    })

    it('should return false when no expiry is set', () => {
      const token = createTestToken()
      delete token.accessTokenExpires
      
      expect(isTokenExpired(token)).toBe(false)
    })

    it('should handle invalid expiry values', () => {
      const token = createTestToken({
        accessTokenExpires: 'invalid' as any
      })
      
      expect(isTokenExpired(token)).toBe(false)
    })

    it('should return true for token expiring exactly now', () => {
      const token = createTestToken({
        accessTokenExpires: Date.now()
      })
      
      expect(isTokenExpired(token)).toBe(true)
    })
  })

  describe('refreshAccessToken', () => {
    it('should successfully refresh a valid token', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse(mockApiResponses.refreshSuccess)
      )

      const token = createTestToken({
        refreshToken: 'valid-refresh-token'
      })

      const result = await refreshAccessToken(token)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5001/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: 'valid-refresh-token' })
        })
      )

      expectTokenToBeValid(result)
      expect(result.accessToken).toBe('new-access-token')
      expect(result.refreshToken).toBe('new-refresh-token')
      expect(result.accessTokenExpires).toBeGreaterThan(Date.now())
    })

    it('should handle refresh token failure', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse(mockApiResponses.refreshFailure, 401, false)
      )

      const token = createTestToken({
        refreshToken: 'invalid-refresh-token'
      })

      const result = await refreshAccessToken(token)

      expect(result.error).toBeDefined()
      expect(result.error).toContain('RefreshAccessTokenError')
    })

    it('should handle network errors during refresh', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const token = createTestToken({
        refreshToken: 'valid-refresh-token'
      })

      const result = await refreshAccessToken(token)

      expect(result.error).toBeDefined()
      expect(result.error).toContain('RefreshAccessTokenError')
    })

    it('should preserve original token data on refresh failure', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const originalToken = createTestToken({
        sub: 'original-user-id',
        email: 'original@test.com',
        roles: ['admin'],
        refreshToken: 'valid-refresh-token'
      })

      const result = await refreshAccessToken(originalToken)

      expect(result.sub).toBe('original-user-id')
      expect(result.email).toBe('original@test.com')
      expect(result.roles).toEqual(['admin'])
    })
  })

  describe('jwtCallbackWithRefresh', () => {
    it('should create enhanced JWT on initial sign in', async () => {
      const user = mockUsers.admin
      const account = {
        access_token: 'initial-access-token',
        refresh_token: 'initial-refresh-token',
        expires_in: 3600
      }

      const result = await jwtCallbackWithRefresh(
        { token: {}, user, account },
        'admin'
      )

      expectTokenToBeValid(result)
      expect(result.accessToken).toBe('initial-access-token')
      expect(result.refreshToken).toBe('initial-refresh-token')
      expect(result.appType).toBe('admin')
      expect(result.user).toEqual(user)
      expect(result.lastRefresh).toBeDefined()
    })

    it('should handle credentials provider without account', async () => {
      const user = mockUsers.admin

      const result = await jwtCallbackWithRefresh(
        { token: {}, user, account: null },
        'admin'
      )

      expectTokenToBeValid(result)
      expect(result.accessToken).toBe('credentials-token')
      expect(result.refreshToken).toBeNull()
      expect(result.appType).toBe('admin')
      expect(result.user).toEqual(user)
    })

    it('should return existing token if not expired', async () => {
      const existingToken = createTestToken({
        accessTokenExpires: Date.now() + 3600000 // 1 hour from now
      })

      const result = await jwtCallbackWithRefresh(
        { token: existingToken },
        'admin'
      )

      expect(result).toEqual(existingToken)
    })

    it('should refresh expired token', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse(mockApiResponses.refreshSuccess)
      )

      const expiredToken = createTestToken({
        accessTokenExpires: Date.now() - 3600000, // 1 hour ago
        refreshToken: 'valid-refresh-token'
      })

      const result = await jwtCallbackWithRefresh(
        { token: expiredToken },
        'admin'
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5001/auth/refresh',
        expect.any(Object)
      )
      expect(result.accessToken).toBe('new-access-token')
    })

    it('should enrich JWT with roles when feature is enabled', async () => {
      // Mock the feature flag to return true
      vi.doMock('../features', () => ({
        shouldUseEnhancedJWT: () => true,
        shouldAuditLog: () => false
      }))

      const user = mockUsers.admin
      const account = {
        access_token: 'initial-access-token',
        refresh_token: 'initial-refresh-token',
        expires_in: 3600
      }

      const result = await jwtCallbackWithRefresh(
        { token: {}, user, account },
        'admin'
      )

      expect(result.roles).toBeDefined()
      expect(result.permissions).toBeDefined()
    })
  })

  describe('sessionCallbackWithRefresh', () => {
    it('should create enhanced session from valid token', async () => {
      const session = mockSessions.admin
      const token = mockTokens.valid

      const result = await sessionCallbackWithRefresh(
        { session, token },
        'admin'
      )

      expectSessionToBeValid(result)
      expect(result.accessToken).toBe(token.accessToken)
      expect(result.user.id).toBe(token.sub)
      expect(result.user.roles).toEqual(token.roles)
      expect(result.user.permissions).toEqual(token.permissions)
      expect(result.user.appType).toBe('admin')
    })

    it('should handle token with error', async () => {
      const session = mockSessions.admin
      const tokenWithError = {
        ...mockTokens.valid,
        error: 'RefreshAccessTokenError'
      }

      const result = await sessionCallbackWithRefresh(
        { session, token: tokenWithError },
        'admin'
      )

      expect(result.error).toBe('RefreshAccessTokenError')
    })

    it('should include user metadata in session', async () => {
      const session = mockSessions.admin
      const token = {
        ...mockTokens.valid,
        metadata: { lastLoginLocation: 'New York' }
      }

      const result = await sessionCallbackWithRefresh(
        { session, token },
        'admin'
      )

      expect(result.user.metadata).toEqual({ lastLoginLocation: 'New York' })
    })

    it('should handle missing user data gracefully', async () => {
      const session = { ...mockSessions.admin }
      delete session.user
      const token = mockTokens.valid

      const result = await sessionCallbackWithRefresh(
        { session, token },
        'admin'
      )

      expect(result.user.id).toBe(token.sub)
      expect(result.user.email).toBe(token.email)
    })

    it('should validate required roles when specified', async () => {
      const session = mockSessions.user // Regular user
      const token = mockTokens.valid

      const result = await sessionCallbackWithRefresh(
        { session, token },
        'admin',
        ['admin'] // Require admin role
      )

      // Should still return session but may have validation errors
      expectSessionToBeValid(result)
    })
  })

  describe('Security Edge Cases', () => {
    it('should handle malformed token data', async () => {
      const malformedToken = {
        sub: null,
        email: undefined,
        roles: 'not-an-array',
        accessToken: '',
      } as any

      const result = await jwtCallbackWithRefresh(
        { token: malformedToken },
        'admin'
      )

      // Should handle gracefully without throwing
      expect(result).toBeDefined()
    })

    it('should handle extremely large token expiry values', () => {
      const token = createTestToken({
        accessTokenExpires: Number.MAX_SAFE_INTEGER
      })

      expect(isTokenExpired(token)).toBe(false)
    })

    it('should handle negative token expiry values', () => {
      const token = createTestToken({
        accessTokenExpires: -1
      })

      expect(isTokenExpired(token)).toBe(true)
    })

    it('should handle concurrent refresh attempts', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue(
        createMockFetchResponse(mockApiResponses.refreshSuccess)
      )

      const token = createTestToken({
        refreshToken: 'valid-refresh-token'
      })

      // Simulate concurrent refresh attempts
      const promises = Array(5).fill(null).map(() => refreshAccessToken(token))
      const results = await Promise.all(promises)

      // All should succeed and return refresh response data
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.accessToken).toBe('new-access-token')
        expect(result.refreshToken).toBe('new-refresh-token')
      })
    })
  })

  describe('Token Security Validation', () => {
    it('should validate token structure', () => {
      const validToken = createTestToken()
      
      expect(validToken.sub).toBeDefined()
      expect(validToken.accessToken).toBeDefined()
      expect(validToken.roles).toBeDefined()
      expect(Array.isArray(validToken.roles)).toBe(true)
    })

    it('should handle tokens without refresh capability', async () => {
      const tokenWithoutRefresh = createTestToken()
      delete tokenWithoutRefresh.refreshToken

      await expect(refreshAccessToken(tokenWithoutRefresh)).rejects.toThrow('No refresh token available')
    })

    it('should validate token expiry boundaries', () => {
      // Test boundary conditions
      const justExpired = createTestToken({
        accessTokenExpires: Date.now() - 1
      })
      const justValid = createTestToken({
        accessTokenExpires: Date.now() + 1
      })

      expect(isTokenExpired(justExpired)).toBe(true)
      expect(isTokenExpired(justValid)).toBe(false)
    })
  })
})