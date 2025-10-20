import { vi } from 'vitest'
import type { Session, JWT } from 'next-auth'
import type { User, UserRole } from '@cowors/shared-types'
import type { EnhancedUser, EnhancedJWT, EnhancedSession } from '../../refresh'

// Mock user data
export const mockUsers = {
  admin: {
    id: 'admin-user-id',
    email: 'admin@cowors.com',
    name: 'Admin User',
    roles: ['admin'],
    permissions: ['read', 'write', 'delete'],
    appType: 'admin' as const,
    isActive: true,
    lastLoginAt: new Date('2022-01-01T00:00:00.000Z'),
  } as EnhancedUser,
  
  partner: {
    id: 'partner-user-id',
    email: 'partner@cowors.com',
    name: 'Partner User',
    roles: ['partner'],
    permissions: ['read', 'write'],
    appType: 'partner' as const,
    isActive: true,
    lastLoginAt: new Date('2022-01-01T00:00:00.000Z'),
  } as EnhancedUser,
  
  user: {
    id: 'regular-user-id',
    email: 'user@cowors.com',
    name: 'Regular User',
    roles: ['user'],
    permissions: ['read'],
    appType: 'frontend' as const,
    isActive: true,
    lastLoginAt: new Date('2022-01-01T00:00:00.000Z'),
  } as EnhancedUser,
  
  inactive: {
    id: 'inactive-user-id',
    email: 'inactive@cowors.com',
    name: 'Inactive User',
    roles: ['user'],
    permissions: [],
    appType: 'frontend' as const,
    isActive: false,
    lastLoginAt: new Date('2021-12-01T00:00:00.000Z'),
  } as EnhancedUser,
}

// Mock JWT tokens
export const mockTokens = {
  valid: {
    sub: 'admin-user-id',
    email: 'admin@cowors.com',
    roles: ['admin'],
    permissions: ['read', 'write', 'delete'],
    appType: 'admin',
    accessToken: 'valid-access-token',
    accessTokenExpires: Date.now() + 3600000, // 1 hour from now
    refreshToken: 'valid-refresh-token',
    lastRefresh: Date.now(),
    isActive: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + 3600000) / 1000),
  } as EnhancedJWT,
  
  expired: {
    sub: 'admin-user-id',
    email: 'admin@cowors.com',
    roles: ['admin'],
    permissions: ['read', 'write', 'delete'],
    appType: 'admin',
    accessToken: 'expired-access-token',
    accessTokenExpires: Date.now() - 3600000, // 1 hour ago
    refreshToken: 'expired-refresh-token',
    lastRefresh: Date.now() - 7200000, // 2 hours ago
    isActive: true,
    iat: Math.floor((Date.now() - 7200000) / 1000),
    exp: Math.floor((Date.now() - 3600000) / 1000),
  } as EnhancedJWT,
  
  noExpiry: {
    sub: 'admin-user-id',
    email: 'admin@cowors.com',
    roles: ['admin'],
    permissions: ['read', 'write', 'delete'],
    appType: 'admin',
    accessToken: 'no-expiry-token',
    refreshToken: 'no-expiry-refresh-token',
    lastRefresh: Date.now(),
    isActive: true,
    iat: Math.floor(Date.now() / 1000),
  } as EnhancedJWT,
}

// Mock sessions
export const mockSessions = {
  admin: {
    user: mockUsers.admin,
    accessToken: 'valid-access-token',
    expires: new Date(Date.now() + 3600000).toISOString(),
  } as EnhancedSession,
  
  partner: {
    user: mockUsers.partner,
    accessToken: 'partner-access-token',
    expires: new Date(Date.now() + 3600000).toISOString(),
  } as EnhancedSession,
  
  user: {
    user: mockUsers.user,
    accessToken: 'user-access-token',
    expires: new Date(Date.now() + 3600000).toISOString(),
  } as EnhancedSession,
  
  expired: {
    user: mockUsers.user,
    accessToken: 'expired-access-token',
    expires: new Date(Date.now() - 3600000).toISOString(),
    error: 'RefreshAccessTokenError',
  } as EnhancedSession,
}

// Mock API responses
export const mockApiResponses = {
  validationSuccess: {
    valid: true,
    user: mockUsers.admin,
  },
  
  validationFailure: {
    valid: false,
    error: 'Invalid token',
  },
  
  refreshSuccess: {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    expiresIn: 3600,
    user: mockUsers.admin,
  },
  
  refreshFailure: {
    error: 'invalid_grant',
    error_description: 'Refresh token is invalid',
  },
  
  authError: {
    error: 'unauthorized',
    message: 'Authentication failed',
  },
}

// Mock fetch responses
export const createMockFetchResponse = (data: any, status = 200, ok = true) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
    redirected: false,
    statusText: ok ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: '',
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
  } as Response)
}

// Test utilities
export const createTestUser = (overrides: Partial<EnhancedUser> = {}): EnhancedUser => ({
  ...mockUsers.user,
  ...overrides,
})

export const createTestToken = (overrides: Partial<EnhancedJWT> = {}): EnhancedJWT => ({
  ...mockTokens.valid,
  ...overrides,
})

export const createTestSession = (overrides: Partial<EnhancedSession> = {}): EnhancedSession => ({
  ...mockSessions.admin,
  ...overrides,
})

// Mock NextAuth account
export const mockAccount = {
  provider: 'credentials',
  type: 'credentials' as const,
  providerAccountId: 'test-provider-account-id',
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  token_type: 'Bearer',
}

// Mock credentials
export const mockCredentials = {
  email: 'admin@cowors.com',
  password: 'test-password',
}

// Time utilities
export const advanceTime = (milliseconds: number) => {
  vi.advanceTimersByTime(milliseconds)
}

export const setMockTime = (timestamp: number) => {
  vi.mocked(Date.now).mockReturnValue(timestamp)
}

// Assertion helpers
export const expectTokenToBeValid = (token: EnhancedJWT) => {
  expect(token).toBeDefined()
  expect(token.sub).toBeDefined()
  expect(token.accessToken).toBeDefined()
  expect(token.roles).toBeDefined()
  expect(Array.isArray(token.roles)).toBe(true)
}

export const expectSessionToBeValid = (session: EnhancedSession) => {
  expect(session).toBeDefined()
  expect(session.user).toBeDefined()
  expect(session.user.id).toBeDefined()
  expect(session.user.email).toBeDefined()
  expect(session.accessToken).toBeDefined()
}

export const expectUserToHaveRole = (user: EnhancedUser, role: string) => {
  expect(user.roles).toBeDefined()
  expect(user.roles).toContain(role)
}

export const expectUserToHavePermission = (user: EnhancedUser, permission: string) => {
  expect(user.permissions).toBeDefined()
  expect(user.permissions).toContain(permission)
}