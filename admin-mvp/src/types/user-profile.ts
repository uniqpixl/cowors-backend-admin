// TypeScript interfaces for User Profile components

// User Summary & KPI Cards
export interface KPIMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

// Bookings History
export interface Booking {
  id: string;
  service: string;
  partner: string;
  date: string;
  amount: string;
  status: "confirmed" | "completed" | "cancelled" | "pending";
  duration?: string;
  location?: string;
}

// Financial Transactions
export interface Transaction {
  id: string;
  type: "payment" | "refund" | "fee" | "commission";
  description: string;
  amount: string;
  date: string;
  method: "credit_card" | "debit_card" | "bank_transfer" | "wallet";
  status: "completed" | "pending" | "failed" | "cancelled";
  reference?: string;
}

// User Reviews
export interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  service: string;
  partner: string;
  status: "published" | "pending" | "flagged" | "removed";
  helpfulVotes: number;
  verified: boolean;
}

export type ReviewFilter = "all" | "recent" | "positive" | "negative";

// Disputes & Complaints
export interface Dispute {
  id: string;
  type: "dispute" | "complaint" | "refund" | "escalation";
  title: string;
  description: string;
  timestamp: string;
  status: "open" | "resolved" | "pending" | "escalated" | "closed";
  amount?: string;
  service?: string;
  partner?: string;
  priority: "low" | "medium" | "high" | "urgent";
}

// Activity Log & Audit Trail
export interface ActivityLogEntry {
  id: string;
  type: "login" | "booking" | "payment" | "profile" | "system" | "security";
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

// User profile component props
export interface UserProfileComponentProps {
  userId: string;
}

// Enhanced user data structure (for future use)
export interface EnhancedUserData {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bio?: string;
    avatar?: string;
  };
  accountInfo: {
    status: CommonStatus;
    joinDate: string;
    lastLogin: string;
    verificationLevel: "basic" | "verified" | "premium";
  };
  metrics: {
    totalBookings: number;
    totalSpent: number;
    averageRating: number;
    reviewCount: number;
    disputeCount: number;
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