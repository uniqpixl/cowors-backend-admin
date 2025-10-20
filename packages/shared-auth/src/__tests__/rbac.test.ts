import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  getUserRoles, 
  getUserPermissions, 
  hasRole, 
  hasPermission, 
  hasAnyRole, 
  hasAllRoles,
  hasAnyPermission,
  hasAllPermissions,
  validateRoleHierarchy,
  enrichJWTWithRoles,
  checkResourceAccess,
  validateAppAccess
} from '../refresh'
import { 
  mockUsers, 
  mockSessions, 
  createTestUser,
  createTestSession,
  expectUserToHaveRole,
  expectUserToHavePermission
} from './utils/test-helpers'

describe('RBAC (Role-Based Access Control) Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Role Management', () => {
    it('should get user roles correctly', () => {
      const adminUser = mockUsers.admin
      const roles = getUserRoles(adminUser)

      expect(roles).toContain('admin')
      expect(Array.isArray(roles)).toBe(true)
      expect(roles.length).toBeGreaterThan(0)
    })

    it('should handle user with no roles', () => {
      const userWithoutRoles = createTestUser({
        id: 'no-roles-user',
        email: 'noroles@test.com',
        roles: []
      })

      const roles = getUserRoles(userWithoutRoles)
      expect(roles).toEqual([])
    })

    it('should handle user with multiple roles', () => {
      const multiRoleUser = createTestUser({
        id: 'multi-role-user',
        email: 'multi@test.com',
        roles: ['admin', 'partner', 'user', 'moderator']
      })

      const roles = getUserRoles(multiRoleUser)
      expect(roles).toEqual(['admin', 'partner', 'user', 'moderator'])
      expect(roles.length).toBe(4)
    })

    it('should validate role existence', () => {
      const adminUser = mockUsers.admin

      expect(hasRole(adminUser, 'admin')).toBe(true)
      expect(hasRole(adminUser, 'nonexistent')).toBe(false)
      expect(hasRole(adminUser, '')).toBe(false)
      expect(hasRole(adminUser, null as any)).toBe(false)
    })

    it('should check multiple roles with hasAnyRole', () => {
      const adminUser = mockUsers.admin

      expect(hasAnyRole(adminUser, ['admin', 'moderator'])).toBe(true)
      expect(hasAnyRole(adminUser, ['moderator', 'guest'])).toBe(false)
      expect(hasAnyRole(adminUser, [])).toBe(false)
    })

    it('should check all roles with hasAllRoles', () => {
      const multiRoleUser = createTestUser({
        id: 'multi-role-user',
        email: 'multi@test.com',
        roles: ['admin', 'moderator', 'user']
      })

      expect(hasAllRoles(multiRoleUser, ['admin', 'user'])).toBe(true)
      expect(hasAllRoles(multiRoleUser, ['admin', 'guest'])).toBe(false)
      expect(hasAllRoles(multiRoleUser, [])).toBe(true) // Empty array should return true
    })
  })

  describe('Permission Management', () => {
    it('should get user permissions correctly', () => {
      const adminUser = mockUsers.admin
      const permissions = getUserPermissions(adminUser)

      expect(Array.isArray(permissions)).toBe(true)
      expect(permissions).toContain('read')
      expect(permissions).toContain('write')
      expect(permissions).toContain('delete')
    })

    it('should handle user with no permissions', () => {
      const userWithoutPermissions = createTestUser({
        id: 'no-perms-user',
        email: 'noperms@test.com',
        roles: ['guest'],
        permissions: []
      })

      const permissions = getUserPermissions(userWithoutPermissions)
      expect(permissions).toEqual([])
    })

    it('should validate permission existence', () => {
      const adminUser = mockUsers.admin

      expect(hasPermission(adminUser, 'read')).toBe(true)
      expect(hasPermission(adminUser, 'write')).toBe(true)
      expect(hasPermission(adminUser, 'nonexistent')).toBe(false)
      expect(hasPermission(adminUser, '')).toBe(false)
    })

    it('should check multiple permissions with hasAnyPermission', () => {
      const userWithLimitedPerms = createTestUser({
        id: 'limited-user',
        email: 'limited@test.com',
        roles: ['user'],
        permissions: ['read', 'comment']
      })

      expect(hasAnyPermission(userWithLimitedPerms, ['read', 'write'])).toBe(true)
      expect(hasAnyPermission(userWithLimitedPerms, ['write', 'delete'])).toBe(false)
      expect(hasAnyPermission(userWithLimitedPerms, [])).toBe(false)
    })

    it('should check all permissions with hasAllPermissions', () => {
      const adminUser = mockUsers.admin

      expect(hasAllPermissions(adminUser, ['read', 'write'])).toBe(true)
      expect(hasAllPermissions(adminUser, ['read', 'nonexistent'])).toBe(false)
      expect(hasAllPermissions(adminUser, [])).toBe(true)
    })
  })

  describe('Role Hierarchy Validation', () => {
    it('should validate admin role hierarchy', () => {
      const adminUser = mockUsers.admin
      
      // Admin should have access to all lower-level permissions
      expect(validateRoleHierarchy(adminUser, 'admin')).toBe(true)
      expect(validateRoleHierarchy(adminUser, 'partner')).toBe(true)
      expect(validateRoleHierarchy(adminUser, 'user')).toBe(true)
    })

    it('should validate partner role hierarchy', () => {
      const partnerUser = mockUsers.partner
      
      // Partner should have access to user-level permissions but not admin
      expect(validateRoleHierarchy(partnerUser, 'partner')).toBe(true)
      expect(validateRoleHierarchy(partnerUser, 'user')).toBe(true)
      expect(validateRoleHierarchy(partnerUser, 'admin')).toBe(false)
    })

    it('should validate user role hierarchy', () => {
      const regularUser = mockUsers.user
      
      // User should only have access to user-level permissions
      expect(validateRoleHierarchy(regularUser, 'user')).toBe(true)
      expect(validateRoleHierarchy(regularUser, 'partner')).toBe(false)
      expect(validateRoleHierarchy(regularUser, 'admin')).toBe(false)
    })

    it('should handle invalid role hierarchy checks', () => {
      const regularUser = mockUsers.user
      
      expect(validateRoleHierarchy(regularUser, 'nonexistent')).toBe(false)
      expect(validateRoleHierarchy(regularUser, '')).toBe(false)
      expect(validateRoleHierarchy(regularUser, null as any)).toBe(false)
    })
  })

  describe('JWT Role Enrichment', () => {
    it('should enrich JWT with user roles and permissions', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          roles: ['admin', 'moderator'],
          permissions: ['read', 'write', 'delete', 'moderate']
        }), { status: 200 })
      )

      const baseJWT = {
        sub: 'user-123',
        email: 'admin@test.com',
        accessToken: 'token-123'
      }

      const enrichedJWT = await enrichJWTWithRoles(baseJWT, 'admin')

      expect(enrichedJWT.roles).toEqual(['admin', 'moderator'])
      expect(enrichedJWT.permissions).toEqual(['read', 'write', 'delete', 'moderate'])
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/roles'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token-123'
          })
        })
      )
    })

    it('should handle role enrichment failure gracefully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Role service unavailable'))

      const baseJWT = {
        sub: 'user-123',
        email: 'admin@test.com',
        accessToken: 'token-123'
      }

      const enrichedJWT = await enrichJWTWithRoles(baseJWT, 'admin')

      // Should fallback to default roles
      expect(enrichedJWT.roles).toBeDefined()
      expect(Array.isArray(enrichedJWT.roles)).toBe(true)
    })

    it('should cache role enrichment results', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          roles: ['admin'],
          permissions: ['read', 'write']
        }), { status: 200 })
      )

      const baseJWT = {
        sub: 'user-123',
        email: 'admin@test.com',
        accessToken: 'token-123'
      }

      // First call
      await enrichJWTWithRoles(baseJWT, 'admin')
      
      // Second call should use cache
      await enrichJWTWithRoles(baseJWT, 'admin')

      // Should only make one API call
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Resource Access Control', () => {
    it('should validate resource access for admin users', () => {
      const adminUser = mockUsers.admin
      
      expect(checkResourceAccess(adminUser, 'users', 'read')).toBe(true)
      expect(checkResourceAccess(adminUser, 'users', 'write')).toBe(true)
      expect(checkResourceAccess(adminUser, 'users', 'delete')).toBe(true)
      expect(checkResourceAccess(adminUser, 'settings', 'write')).toBe(true)
    })

    it('should validate resource access for partner users', () => {
      const partnerUser = mockUsers.partner
      
      expect(checkResourceAccess(partnerUser, 'partners', 'read')).toBe(true)
      expect(checkResourceAccess(partnerUser, 'partners', 'write')).toBe(true)
      expect(checkResourceAccess(partnerUser, 'users', 'read')).toBe(true)
      expect(checkResourceAccess(partnerUser, 'users', 'delete')).toBe(false)
      expect(checkResourceAccess(partnerUser, 'settings', 'write')).toBe(false)
    })

    it('should validate resource access for regular users', () => {
      const regularUser = mockUsers.user
      
      expect(checkResourceAccess(regularUser, 'profile', 'read')).toBe(true)
      expect(checkResourceAccess(regularUser, 'profile', 'write')).toBe(true)
      expect(checkResourceAccess(regularUser, 'users', 'read')).toBe(false)
      expect(checkResourceAccess(regularUser, 'users', 'write')).toBe(false)
      expect(checkResourceAccess(regularUser, 'settings', 'write')).toBe(false)
    })

    it('should handle invalid resource access checks', () => {
      const regularUser = mockUsers.user
      
      expect(checkResourceAccess(regularUser, '', 'read')).toBe(false)
      expect(checkResourceAccess(regularUser, 'users', '')).toBe(false)
      expect(checkResourceAccess(regularUser, null as any, 'read')).toBe(false)
    })

    it('should validate owner-based resource access', () => {
      const regularUser = mockUsers.user
      const resourceOwnerId = regularUser.id
      
      // User should have access to their own resources
      expect(checkResourceAccess(regularUser, 'profile', 'write', resourceOwnerId)).toBe(true)
      expect(checkResourceAccess(regularUser, 'profile', 'delete', resourceOwnerId)).toBe(true)
      
      // User should not have access to other users' resources
      expect(checkResourceAccess(regularUser, 'profile', 'write', 'other-user-id')).toBe(false)
    })
  })

  describe('Application Access Control', () => {
    it('should validate admin app access', () => {
      const adminUser = mockUsers.admin
      
      expect(validateAppAccess(adminUser, 'admin')).toBe(true)
      expect(validateAppAccess(adminUser, 'partner')).toBe(true)
      expect(validateAppAccess(adminUser, 'user')).toBe(true)
    })

    it('should validate partner app access', () => {
      const partnerUser = mockUsers.partner
      
      expect(validateAppAccess(partnerUser, 'admin')).toBe(false)
      expect(validateAppAccess(partnerUser, 'partner')).toBe(true)
      expect(validateAppAccess(partnerUser, 'user')).toBe(true)
    })

    it('should validate user app access', () => {
      const regularUser = mockUsers.user
      
      expect(validateAppAccess(regularUser, 'admin')).toBe(false)
      expect(validateAppAccess(regularUser, 'partner')).toBe(false)
      expect(validateAppAccess(regularUser, 'user')).toBe(true)
    })

    it('should handle invalid app access checks', () => {
      const regularUser = mockUsers.user
      
      expect(validateAppAccess(regularUser, '')).toBe(false)
      expect(validateAppAccess(regularUser, 'nonexistent')).toBe(false)
      expect(validateAppAccess(regularUser, null as any)).toBe(false)
    })

    it('should validate app access with specific permissions', () => {
      const partnerUser = mockUsers.partner
      
      expect(validateAppAccess(partnerUser, 'partner', ['partner_read'])).toBe(true)
      expect(validateAppAccess(partnerUser, 'partner', ['admin_write'])).toBe(false)
    })
  })

  describe('Dynamic Role Assignment', () => {
    it('should handle dynamic role assignment', () => {
      const user = createTestUser({
        id: 'dynamic-user',
        email: 'dynamic@test.com',
        roles: ['user']
      })

      // Simulate dynamic role assignment
      user.roles.push('moderator')
      
      expect(hasRole(user, 'user')).toBe(true)
      expect(hasRole(user, 'moderator')).toBe(true)
      expect(hasAnyRole(user, ['moderator', 'admin'])).toBe(true)
    })

    it('should handle role removal', () => {
      const user = createTestUser({
        id: 'role-removal-user',
        email: 'removal@test.com',
        roles: ['user', 'moderator', 'partner']
      })

      // Remove moderator role
      user.roles = user.roles.filter(role => role !== 'moderator')
      
      expect(hasRole(user, 'user')).toBe(true)
      expect(hasRole(user, 'partner')).toBe(true)
      expect(hasRole(user, 'moderator')).toBe(false)
    })

    it('should validate role changes in real-time', () => {
      const user = createTestUser({
        id: 'realtime-user',
        email: 'realtime@test.com',
        roles: ['user']
      })

      // Initial state
      expect(validateAppAccess(user, 'admin')).toBe(false)
      
      // Promote to admin
      user.roles.push('admin')
      
      // Should now have admin access
      expect(validateAppAccess(user, 'admin')).toBe(true)
    })
  })

  describe('Security Edge Cases', () => {
    it('should handle null/undefined user objects', () => {
      expect(hasRole(null as any, 'admin')).toBe(false)
      expect(hasRole(undefined as any, 'admin')).toBe(false)
      expect(getUserRoles(null as any)).toEqual([])
      expect(getUserPermissions(undefined as any)).toEqual([])
    })

    it('should handle malformed role arrays', () => {
      const userWithMalformedRoles = {
        id: 'malformed-user',
        email: 'malformed@test.com',
        roles: 'not-an-array' as any
      }

      expect(getUserRoles(userWithMalformedRoles)).toEqual([])
      expect(hasRole(userWithMalformedRoles, 'admin')).toBe(false)
    })

    it('should handle case sensitivity in roles', () => {
      const user = createTestUser({
        id: 'case-user',
        email: 'case@test.com',
        roles: ['Admin', 'USER', 'partner']
      })

      // Should be case-sensitive
      expect(hasRole(user, 'admin')).toBe(false)
      expect(hasRole(user, 'Admin')).toBe(true)
      expect(hasRole(user, 'user')).toBe(false)
      expect(hasRole(user, 'USER')).toBe(true)
    })

    it('should prevent role injection attacks', () => {
      const maliciousRoles = ['admin', 'super_admin', '../../admin', '<script>alert("xss")</script>']
      const user = createTestUser({
        id: 'malicious-user',
        email: 'malicious@test.com',
        roles: maliciousRoles
      })

      // Should sanitize or reject malicious roles
      const sanitizedRoles = getUserRoles(user)
      expect(sanitizedRoles).not.toContain('../../admin')
      expect(sanitizedRoles).not.toContain('<script>alert("xss")</script>')
    })

    it('should handle extremely large role arrays', () => {
      const largeRoleArray = Array(1000).fill(0).map((_, i) => `role_${i}`)
      const user = createTestUser({
        id: 'large-roles-user',
        email: 'large@test.com',
        roles: largeRoleArray
      })

      // Should handle large arrays efficiently
      const roles = getUserRoles(user)
      expect(roles.length).toBe(1000)
      expect(hasRole(user, 'role_500')).toBe(true)
    })
  })

  describe('Performance Tests', () => {
    it('should perform role checks efficiently', () => {
      const user = createTestUser({
        id: 'perf-user',
        email: 'perf@test.com',
        roles: Array(100).fill(0).map((_, i) => `role_${i}`)
      })

      const startTime = performance.now()
      
      // Perform multiple role checks
      for (let i = 0; i < 1000; i++) {
        hasRole(user, `role_${i % 100}`)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(100) // 100ms
    })

    it('should cache permission lookups', () => {
      const user = mockUsers.admin
      
      // First lookup
      const startTime1 = performance.now()
      getUserPermissions(user)
      const endTime1 = performance.now()
      
      // Second lookup (should be cached)
      const startTime2 = performance.now()
      getUserPermissions(user)
      const endTime2 = performance.now()
      
      // Second lookup should be faster (cached)
      expect(endTime2 - startTime2).toBeLessThanOrEqual(endTime1 - startTime1)
    })
  })
})