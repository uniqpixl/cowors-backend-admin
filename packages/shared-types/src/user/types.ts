import { UserRole, UserStatus, KycStatus, UserActivityStatus } from './enums';

/**
 * Base user interface with common fields
 */
export interface BaseUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Detailed user interface with all fields
 */
export interface User extends BaseUser {
  username: string;
  displayUsername?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  bio?: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  adminNotes?: string;
  bannedAt?: Date;
  banExpiresAt?: Date;
  suspendedAt?: Date;
  suspensionExpiresAt?: Date;
  kycVerified: boolean;
  kycProvider?: string;
  kycVerifiedAt?: Date;
  activityStatus?: UserActivityStatus;
}

/**
 * Admin-specific user interface with management fields
 */
export interface AdminUser extends User {
  // Additional admin-specific fields
  permissions?: string[];
  lastAdminActionAt?: Date;
  adminLevel?: number;
}

/**
 * Partner-specific user interface
 */
export interface PartnerUser extends User {
  businessName: string;
  businessType: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  taxId?: string;
  isVerified: boolean;
  verificationDocuments?: string[];
  partnerSince?: Date;
}

/**
 * User profile for public display
 */
export interface PublicUserProfile {
  id: string;
  username: string;
  displayUsername?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  bio?: string;
  activityStatus?: UserActivityStatus;
}

/**
 * User creation DTO
 */
export interface CreateUserDto {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  password?: string; // Optional for admin creation
}

/**
 * User update DTO
 */
export interface UpdateUserDto {
  username?: string;
  displayUsername?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  bio?: string;
  twoFactorEnabled?: boolean;
}

/**
 * Admin user update DTO
 */
export interface AdminUserUpdateDto {
  status?: UserStatus;
  role?: UserRole;
  emailVerified?: boolean;
  adminNotes?: string;
  statusReason?: string;
}

/**
 * User query parameters for filtering
 */
export interface UserQueryDto {
  query?: string;
  status?: UserStatus;
  role?: UserRole;
  emailVerified?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  lastLoginAfter?: string;
  sortBy?: 'username' | 'email' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

/**
 * User ban DTO
 */
export interface UserBanDto {
  reason: string;
  banDuration?: number; // days, null for permanent
  notes?: string;
}

/**
 * User suspension DTO
 */
export interface UserSuspendDto {
  reason: string;
  suspensionDuration?: number; // days
  notes?: string;
}