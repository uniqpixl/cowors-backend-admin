// API Response Types matching backend interfaces
import React from 'react';

export interface AdminUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: 'User' | 'Admin' | 'SuperAdmin';
  status: 'Active' | 'Suspended' | 'Banned' | 'Pending';
  phoneNumber?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  kycStatus?: 'Pending' | 'Submitted' | 'UnderReview' | 'Verified' | 'Rejected';
  totalBookings?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AdminUserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'User' | 'Admin' | 'SuperAdmin';
  status?: 'Active' | 'Suspended' | 'Banned' | 'Pending';
  kycStatus?: 'Pending' | 'Submitted' | 'UnderReview' | 'Verified' | 'Rejected';
  sortBy?: 'createdAt' | 'lastLoginAt' | 'email';
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
}

export interface AdminUserUpdate {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: 'User' | 'Admin' | 'SuperAdmin';
}

export interface AdminUserBan {
  reason: string;
  duration?: number; // days, null for permanent
  notes?: string;
}

export interface AdminUserSuspend {
  reason: string;
  duration: number; // days
  notes?: string;
}

// Partner Types
export interface Partner {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  businessName: string;
  businessType: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
  verificationStatus: 'Pending' | 'Verified' | 'Rejected';
  createdAt: string;
  updatedAt: string;
  spacesCount: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating?: number;
  totalReviews?: number;
}

export interface PartnerQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected';
  sortBy?: 'createdAt' | 'businessName' | 'totalRevenue';
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
}

export interface PartnerUpdate {
  businessName?: string;
  businessType?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status?: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected';
}

// Location Data Types
export interface City {
  id: string; // Cowors ID with 'CTY' prefix
  name: string;
  state?: string;
  gst_state_code?: string;
  launch_status?: string;
  tier_classification?: string;
  expansion_priority?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Locality {
  id: string; // Cowors ID with 'LOC' or legacy 'NBH' prefix
  city_id: string; // Cowors ID with 'CTY' prefix
  name: string;
  display_name?: string;
  popular_tags?: string[];
  is_popular?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Booking Types
export interface Booking {
  id: string;
  orderNumber?: string;
  userId: string;
  partnerId?: string;
  spaceId: string;
  spaceName?: string;
  partnerName?: string;
  userName?: string;
  userEmail?: string;
  startTime: string;
  endTime: string;
  duration?: number;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  paymentMethod?: string;
  totalAmount: number;
  bookingType?: string;
  guests?: number;
  amenities?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  user?: AdminUser;
  space?: Space;
}

export interface SpacePackage {
  id: string;
  name: string;
  description: string;
  hourlyRate: number;
  dailyRate: number;
  capacity: number;
  features: string[];
}

export interface SpaceAddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'food' | 'beverage' | 'service' | 'equipment';
  available: boolean;
}

export interface SpaceAmenity {
  id: string;
  name: string;
  icon: string;
  available: boolean;
}

export interface SpaceReview {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

// Review Management Types
export interface Review {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  spaceId: string;
  spaceName: string;
  partnerId: string;
  partnerName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  type: 'space' | 'partner' | 'booking';
  flaggedReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  createdAt: string;
  updatedAt: string;
  helpful: number;
  reported: number;
  verified: boolean;
}

export interface ReviewQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'flagged';
  type?: 'space' | 'partner' | 'booking';
  rating?: number;
  userId?: string;
  spaceId?: string;
  partnerId?: string;
  sortBy?: 'createdAt' | 'rating' | 'helpful';
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
}

export interface ReviewUpdate {
  status?: 'pending' | 'approved' | 'rejected' | 'flagged';
  flaggedReason?: string;
  moderatedBy?: string;
}

export interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  reviewsByStatus: {
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
  };
  reviewsByRating: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  reviewsByType: {
    space: number;
    partner: number;
    booking: number;
  };
  recentReviews: Review[];
  topRatedSpaces: Array<{
    spaceId: string;
    spaceName: string;
    averageRating: number;
    totalReviews: number;
  }>;
}

// Settings Types
export interface AdminProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
  location: string;
  bio: string;
  avatar: string;
  role: string;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  weeklyReports: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
  updatedAt?: string;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  updatedAt?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordChangeResponse {
  message: string;
  updatedAt: string;
}

export interface AvatarUploadResponse {
  avatar: string;
  message: string;
  updatedAt: string;
}

// Audit Logs Types
export interface AuditLog {
  id: string;
  timestamp: string;
  adminUser: string;
  adminRole: string;
  action: string;
  category: "user_management" | "finance" | "system" | "security" | "content";
  targetType: string;
  targetId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogsStats {
  total: number;
  critical: number;
  finance: number;
  security: number;
}

export interface AuditLogsFilters {
  search?: string;
  category?: string;
  severity?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
  page?: number;
  limit?: number;
}

// Finance Settings Types
export interface CommissionSettings {
  globalCommission: number;
  categoryOverrides: { category: string; commission: number }[];
}

export interface PayoutSettings {
  autoPayouts: boolean;
  payoutCycle: 'weekly' | 'biweekly' | 'monthly';
  minimumThreshold: number;
  processingDay: string;
}

export interface TaxSettings {
  tdsRate: number;
  gstRate: number;
  taxEnabled: boolean;
}

export interface FinanceSettings {
  commission: CommissionSettings;
  payout: PayoutSettings;
  tax: TaxSettings;
}

// Security Settings Types
export interface LoginPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  value: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginPolicies: LoginPolicy[];
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

export interface SpaceGalleryImage {
  id: string;
  url: string;
  alt: string;
  category: 'interior' | 'exterior' | 'amenities' | 'food' | 'workspace' | 'meeting' | 'office' | 'collaborative' | 'lounge';
}

export interface Space {
  id: string;
  name: string;
  description: string;
  type?: 'cafe' | 'coworking' | 'office' | 'meeting' | 'event' | 'restobar';
  spaceType?: string; // Primary field from API
  location?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  partner?: {
    id: string;
    name?: string;
    businessName?: string;
    avatar?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'Active' | 'Inactive' | 'Maintenance';
  pricing?: {
    startingPrice?: number;
    hourlyRate?: number;
    currency?: string;
  };
  capacity?: {
    total?: number;
    seating?: number;
    standing?: number;
  };
  operatingHours?: {
    monday?: { open: string; close: string; };
    tuesday?: { open: string; close: string; };
    wednesday?: { open: string; close: string; };
    thursday?: { open: string; close: string; };
    friday?: { open: string; close: string; };
    saturday?: { open: string; close: string; };
    sunday?: { open: string; close: string; };
  };
  packages?: SpacePackage[];
  addOns?: SpaceAddOn[];
  amenities?: SpaceAmenity[];
  gallery?: SpaceGalleryImage[];
  reviews?: SpaceReview[];
  rating?: {
    average: number;
    totalReviews: number;
  };
  featured?: boolean;
  verified?: boolean;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  // Legacy fields for backward compatibility
  partnerId?: string;
  pricePerHour?: number;
  address?: string;
  city?: string;
  state?: string;
  hourlyRate?: number; // For backward compatibility
}

export interface SpaceQuery {
  page?: number;
  limit?: number;
  search?: string;
  spaceType?: string;
  status?: 'Active' | 'Inactive' | 'Maintenance';
  partnerId?: string;
  city?: string;
  state?: string;
  minCapacity?: number;
  maxCapacity?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  sortBy?: 'createdAt' | 'name' | 'pricePerHour' | 'capacity';
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
}

export interface BookingQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  paymentStatus?: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  userId?: string;
  spaceId?: string;
  sortBy?: 'createdAt' | 'startTime' | 'amount';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface BookingUpdate {
  status?: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  paymentStatus?: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  amount?: number;
}

// Dashboard KPI Types
export interface DashboardKPIs {
  totalUsers: number;
  totalPartners: number;
  totalSpaces: number;
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  newUsersThisMonth: number;
  newPartnersThisMonth: number;
  bookingsThisMonth: number;
  revenueThisMonth: number;
  averageBookingValue: number;
  platformCommission: number;
}

// Analytics Types
export interface PlatformStats {
  users: {
    total: number;
    active: number;
    new: number;
    verified: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  spaces: {
    total: number;
    active: number;
    inactive: number;
  };
  partners: {
    total: number;
    active: number;
    pending: number;
  };
}

export interface BookingAnalytics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  bookingsByStatus: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  bookingsByTimeRange: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  usersByRole: {
    user: number;
    admin: number;
    superAdmin: number;
  };
  usersByStatus: {
    active: number;
    suspended: number;
    banned: number;
    pending: number;
  };
  userGrowthByTimeRange: Array<{
    date: string;
    count: number;
  }>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  dailyRevenue: number;
  averageOrderValue: number;
  revenueByTimeRange: Array<{
    date: string;
    amount: number;
  }>;
  revenueBySource: {
    bookings: number;
    addOns: number;
    fees: number;
  };
}

// Transaction Types
export interface Transaction {
  id: string;
  userId: string;
  type: 'booking' | 'payout' | 'refund' | 'fee' | 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference?: string;
  bookingId?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Activity Feed Types
export interface Activity {
  id: string;
  type: "booking" | "payout" | "ticket" | "partner";
  title: string;
  description: string;
  timestamp: string;
  status: "completed" | "pending" | "processing" | "new";
  amount?: string;
  user?: string;
  location?: string;
}

// KYC Types
export interface KycVerification {
  id: string;
  userId: string;
  provider: 'Jumio' | 'Onfido' | 'Veriff' | 'Sumsub';
  status: 'Pending' | 'Submitted' | 'UnderReview' | 'Verified' | 'Rejected';
  documentType: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  fraudScore?: number;
  confidenceScore?: number;
  user?: AdminUser;
}

export interface KycVerificationQuery {
  page?: number;
  limit?: number;
  status?: 'Pending' | 'Submitted' | 'UnderReview' | 'Verified' | 'Rejected';
  provider?: 'Jumio' | 'Onfido' | 'Veriff' | 'Sumsub';
  userId?: string;
  sortBy?: 'submittedAt' | 'reviewedAt';
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
}

export interface BulkKycReview {
  verificationIds: string[];
  action: 'approve' | 'reject';
  reason?: string;
  notes?: string;
}

export interface BulkKycReviewResult {
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{
    verificationId: string;
    error: string;
  }>;
}

// Payout Types
export interface PartnerPayout {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  requestedAmount: number;
  walletBalance: number;
  dateTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  payoutGateway: string;
  account: string;
  isAutomated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPayouts {
  payouts: PartnerPayout[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PayoutAnalytics {
  totalRequests: number;
  totalPending: number;
  totalProcessed: number;
  totalAmount: number;
  averageAmount: number;
  payoutsByStatus: {
    pending: number;
    approved: number;
    rejected: number;
    processed: number;
  };
  payoutsByTimeRange: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
}

// Common API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

// Booking Timeline and Notes Types
export interface BookingTimelineEvent {
  id: string;
  bookingId: string;
  type: 'created' | 'confirmed' | 'modified' | 'cancelled' | 'completed' | 'payment' | 'refund' | 'note_added';
  title: string;
  description: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    role: 'user' | 'partner' | 'admin';
  };
  metadata?: {
    ipAddress?: string;
    device?: string;
    browser?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
  };
}

export interface BookingNote {
  id: string;
  bookingId: string;
  content: string;
  type: 'admin' | 'system' | 'customer' | 'partner';
  author: {
    id: string;
    name: string;
    role: 'user' | 'partner' | 'admin';
  };
  createdAt: string;
  updatedAt: string;
  isInternal: boolean;
}

export interface CreateBookingNoteRequest {
  content: string;
  type: 'admin' | 'system' | 'customer' | 'partner';
  isInternal?: boolean;
}

// Tax Types
export interface TaxMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  description: string;
  icon: React.ReactNode;
}

export interface TaxLedgerEntry {
  id: string;
  date: string;
  transactionId: string;
  partnerName: string;
  amount: number;
  taxAmount: number;
  taxRate: number;
  status: 'pending' | 'paid' | 'overdue';
  description: string;
}

export interface TaxDashboardData {
  metrics: TaxMetric[];
  ledgerEntries: TaxLedgerEntry[];
  totalTaxCollected: number;
  totalTaxPending: number;
  totalTransactions: number;
}

export interface GSTData extends TaxDashboardData {}
export interface TDSData extends TaxDashboardData {}
export interface TCSData extends TaxDashboardData {}

// Error response type
export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
  statusCode: number;
}