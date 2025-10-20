// TypeScript interfaces for Partner Profile components

// Partner Summary & KPI Cards
export interface KPIMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

// Partner Bookings History
export interface Booking {
  id: string;
  service: string;
  customer: string;
  date: string;
  amount: string;
  status: "confirmed" | "completed" | "cancelled" | "pending";
  duration?: string;
  location?: string;
  space?: string;
}

// Partner Financial Transactions
export interface Transaction {
  id: string;
  type: "payment" | "refund" | "fee" | "commission" | "payout";
  description: string;
  amount: string;
  date: string;
  method: "credit_card" | "debit_card" | "bank_transfer" | "wallet";
  status: "completed" | "pending" | "failed" | "cancelled";
  reference?: string;
  customer?: string;
}

// Partner Reviews
export interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  service: string;
  customer: string;
  status: "published" | "pending" | "flagged" | "removed";
  helpfulVotes: number;
  verified: boolean;
  space?: string;
}

export type ReviewFilter = "all" | "recent" | "positive" | "negative";

// Partner Disputes & Complaints
export interface Dispute {
  id: string;
  type: "dispute" | "complaint" | "refund" | "escalation" | "payment_dispute" | "service_quality";
  title: string;
  description: string;
  timestamp: string;
  status: "open" | "resolved" | "pending" | "escalated" | "closed";
  amount?: string;
  service?: string;
  customer?: string;
  priority: "low" | "medium" | "high" | "urgent";
  space?: string;
}

// Partner Activity Log & Audit Trail
export interface ActivityLogEntry {
  id: string;
  type: "login" | "booking" | "payment" | "profile" | "system" | "security" | "space_update";
  action: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
  device?: string;
  location?: string;
  status: "success" | "failed" | "warning" | "info";
  details?: string;
  resourceId?: string;
}

// Common status types
export type CommonStatus = "active" | "inactive" | "pending" | "suspended" | "verified" | "unverified";

// Common priority levels
export type Priority = "low" | "medium" | "high" | "urgent";

// Partner profile component props
export interface PartnerProfileComponentProps {
  partnerId: string;
}

// Enhanced partner data structure (for future use)
export interface EnhancedPartnerData {
  id: string;
  businessInfo: {
    businessName: string;
    businessType: string;
    contactName: string;
    email: string;
    phone: string;
    description?: string;
    logo?: string;
  };
  accountInfo: {
    status: CommonStatus;
    joinDate: string;
    lastLogin: string;
    verificationLevel: "basic" | "verified" | "premium";
  };
  metrics: {
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    reviewCount: number;
    disputeCount: number;
    totalSpaces: number;
  };
  preferences: {
    notifications: boolean;
    marketing: boolean;
    dataSharing: boolean;
  };
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter and sort options
export interface FilterOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string[];
  type?: string[];
  amount?: {
    min: number;
    max: number;
  };
}

export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

// Legacy compatibility - keeping UserProfileComponentProps for backward compatibility
export interface UserProfileComponentProps {
  userId: string;
}