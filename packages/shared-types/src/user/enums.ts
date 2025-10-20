/**
 * User-related enums and types
 * Source of truth: backend-server/src/api/user/user.enum.ts
 */

/**
 * User roles in the system
 * Uses PascalCase to match backend implementation
 */
export enum UserRole {
  User = 'User',
  Partner = 'Partner', 
  Admin = 'Admin',
  SuperAdmin = 'SuperAdmin',
  Moderator = 'Moderator',
}

/**
 * User status in the system
 * Uses lowercase to match backend implementation
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive', 
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

/**
 * KYC verification status
 */
export enum KycStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

/**
 * User activity status
 */
export enum UserActivityStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  BUSY = 'busy',
}

// Type guards for runtime type checking
export const isValidUserRole = (role: any): role is UserRole => {
  return Object.values(UserRole).includes(role);
};

export const isValidUserStatus = (status: any): status is UserStatus => {
  return Object.values(UserStatus).includes(status);
};

export const isValidKycStatus = (status: any): status is KycStatus => {
  return Object.values(KycStatus).includes(status);
};