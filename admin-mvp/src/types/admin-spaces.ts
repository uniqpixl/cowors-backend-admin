import { Space } from '@/lib/api/types';

// Extended space types for admin operations
export interface AdminSpace extends Space {
  // Additional admin-specific fields
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'under_review';
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  moderationNotes?: string;
  
  // Enhanced partner information
  partner: {
    id: string;
    name: string;
    businessName: string;
    email: string;
    phoneNumber?: string;
    status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
    verificationStatus: 'Pending' | 'Verified' | 'Rejected';
    avatar?: string;
  };
  
  // Analytics data
  analytics?: {
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    utilizationRate: number;
    lastBookingDate?: string;
  };
  
  // Compliance and safety
  compliance?: {
    safetyChecked: boolean;
    safetyCheckDate?: string;
    insuranceValid: boolean;
    insuranceExpiryDate?: string;
    licenseValid: boolean;
    licenseExpiryDate?: string;
  };
}

export interface AdminSpaceQuery {
  page?: number;
  limit?: number;
  search?: string;
  spaceType?: string;
  status?: 'Active' | 'Inactive' | 'Maintenance' | 'pending' | 'approved' | 'rejected' | 'suspended';
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'under_review';
  partnerId?: string;
  partnerStatus?: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
  city?: string;
  state?: string;
  minCapacity?: number;
  maxCapacity?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  sortBy?: 'createdAt' | 'name' | 'pricePerHour' | 'capacity' | 'totalBookings' | 'totalRevenue' | 'rating';
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
  featured?: boolean;
  verified?: boolean;
  hasIssues?: boolean;
}

export interface AdminSpaceUpdate {
  name?: string;
  description?: string;
  status?: 'Active' | 'Inactive' | 'Maintenance';
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'under_review';
  featured?: boolean;
  verified?: boolean;
  moderationNotes?: string;
  rejectionReason?: string;
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
}

export interface SpaceApprovalData {
  approvalStatus: 'approved' | 'rejected';
  moderationNotes?: string;
  rejectionReason?: string;
  notifyPartner?: boolean;
  emailTemplate?: string;
}

export interface SpaceBulkAction {
  action: 'approve' | 'reject' | 'activate' | 'deactivate' | 'suspend' | 'delete' | 'feature' | 'unfeature';
  spaceIds: string[];
  reason?: string;
  notes?: string;
  notifyPartners?: boolean;
}

export interface AdminSpaceStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  featured: number;
  verified: number;
  
  // Analytics
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  averageUtilization: number;
  
  // Trends
  newThisMonth: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  
  // By type
  byType: Record<string, number>;
  byCity: Record<string, number>;
  byPartnerStatus: Record<string, number>;
}

export interface SpaceAnalytics {
  spaceId: string;
  spaceName: string;
  
  // Booking metrics
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  
  // Revenue metrics
  totalRevenue: number;
  averageBookingValue: number;
  revenueGrowth: number;
  
  // Performance metrics
  utilizationRate: number;
  averageRating: number;
  totalReviews: number;
  responseTime: number;
  
  // Time-based data
  bookingsByMonth: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  
  peakHours: Array<{
    hour: number;
    bookings: number;
  }>;
  
  // Comparison data
  rankInCategory: number;
  rankInCity: number;
  competitorComparison?: {
    averagePrice: number;
    averageRating: number;
    averageUtilization: number;
  };
}

export interface AdminSpaceFilters {
  search: string;
  status: string;
  approvalStatus: string;
  spaceType: string;
  partnerId: string;
  partnerStatus: string;
  city: string;
  featured: boolean | null;
  verified: boolean | null;
  hasIssues: boolean | null;
  dateRange: {
    start: string;
    end: string;
  } | null;
  priceRange: {
    min: number;
    max: number;
  } | null;
  capacityRange: {
    min: number;
    max: number;
  } | null;
}