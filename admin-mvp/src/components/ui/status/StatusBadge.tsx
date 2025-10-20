import React from 'react';
import Badge from '@/components/ui/badge/Badge';

/**
 * Predefined status configurations
 */
export const STATUS_CONFIGS = {
  // User statuses
  USER_STATUS: {
    active: { color: 'success' as const, label: 'Active' },
    inactive: { color: 'error' as const, label: 'Inactive' },
    suspended: { color: 'warning' as const, label: 'Suspended' },
    pending: { color: 'warning' as const, label: 'Pending' }
  },

  // Partner statuses
  PARTNER_STATUS: {
    active: { color: 'success' as const, label: 'Active' },
    inactive: { color: 'error' as const, label: 'Inactive' },
    suspended: { color: 'error' as const, label: 'Suspended' },
    pending: { color: 'warning' as const, label: 'Pending' }
  },

  // Verification statuses
  VERIFICATION_STATUS: {
    verified: { color: 'success' as const, label: 'Verified' },
    pending: { color: 'warning' as const, label: 'Pending' },
    rejected: { color: 'error' as const, label: 'Rejected' },
    unverified: { color: 'light' as const, label: 'Unverified' }
  },

  // Payment/Invoice statuses
  PAYMENT_STATUS: {
    paid: { color: 'success' as const, label: 'Paid' },
    pending: { color: 'warning' as const, label: 'Pending' },
    overdue: { color: 'error' as const, label: 'Overdue' },
    cancelled: { color: 'light' as const, label: 'Cancelled' },
    draft: { color: 'light' as const, label: 'Draft' },
    settled: { color: 'success' as const, label: 'Settled' }
  },

  // Transaction statuses
  TRANSACTION_STATUS: {
    completed: { color: 'success' as const, label: 'Completed' },
    pending: { color: 'warning' as const, label: 'Pending' },
    failed: { color: 'error' as const, label: 'Failed' },
    cancelled: { color: 'light' as const, label: 'Cancelled' },
    refunded: { color: 'info' as const, label: 'Refunded' }
  },

  // Booking statuses
  BOOKING_STATUS: {
    confirmed: { color: 'success' as const, label: 'Confirmed' },
    pending: { color: 'warning' as const, label: 'Pending' },
    cancelled: { color: 'error' as const, label: 'Cancelled' },
    completed: { color: 'success' as const, label: 'Completed' },
    ongoing: { color: 'info' as const, label: 'Ongoing' }
  },

  // Space statuses
  SPACE_STATUS: {
    approved: { color: 'success' as const, label: 'Approved' },
    pending: { color: 'warning' as const, label: 'Pending' },
    rejected: { color: 'error' as const, label: 'Rejected' },
    suspended: { color: 'dark' as const, label: 'Suspended' },
    active: { color: 'success' as const, label: 'Active' },
    inactive: { color: 'light' as const, label: 'Inactive' }
  },

  // Support ticket statuses
  SUPPORT_STATUS: {
    open: { color: 'info' as const, label: 'Open' },
    pending: { color: 'warning' as const, label: 'Pending' },
    resolved: { color: 'success' as const, label: 'Resolved' },
    closed: { color: 'success' as const, label: 'Closed' },
    escalated: { color: 'error' as const, label: 'Escalated' }
  },

  // Review statuses
  REVIEW_STATUS: {
    published: { color: 'success' as const, label: 'Published' },
    pending: { color: 'warning' as const, label: 'Pending' },
    flagged: { color: 'error' as const, label: 'Flagged' },
    rejected: { color: 'error' as const, label: 'Rejected' }
  },

  // Activity/Log statuses
  ACTIVITY_STATUS: {
    success: { color: 'success' as const, label: 'Success' },
    failed: { color: 'error' as const, label: 'Failed' },
    warning: { color: 'warning' as const, label: 'Warning' },
    info: { color: 'info' as const, label: 'Info' },
    completed: { color: 'success' as const, label: 'Completed' },
    pending: { color: 'warning' as const, label: 'Pending' }
  },

  // Performance statuses
  PERFORMANCE_STATUS: {
    good: { color: 'success' as const, label: 'Good' },
    warning: { color: 'warning' as const, label: 'Warning' },
    error: { color: 'error' as const, label: 'Error' },
    critical: { color: 'error' as const, label: 'Critical' }
  }
} as const;

/**
 * Status configuration type
 */
export type StatusConfig = {
  color: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'light' | 'dark';
  label: string;
};

/**
 * Props for the StatusBadge component
 */
interface StatusBadgeProps {
  /** Status value */
  status: string;
  /** Status configuration type */
  type?: keyof typeof STATUS_CONFIGS;
  /** Custom status configuration */
  customConfig?: Record<string, StatusConfig>;
  /** Badge variant */
  variant?: 'light' | 'solid';
  /** Badge size */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
  /** Custom label override */
  label?: string;
  /** Fallback configuration for unknown statuses */
  fallback?: StatusConfig;
}

/**
 * Reusable StatusBadge component with predefined status configurations
 * 
 * @example
 * ```tsx
 * // Using predefined configuration
 * <StatusBadge status="active" type="USER_STATUS" />
 * 
 * // Using custom configuration
 * <StatusBadge 
 *   status="custom" 
 *   customConfig={{ custom: { color: 'success', label: 'Custom Status' } }}
 * />
 * 
 * // With custom label
 * <StatusBadge status="paid" type="PAYMENT_STATUS" label="Fully Paid" />
 * ```
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type,
  customConfig,
  variant = 'light',
  size = 'sm',
  className = '',
  label,
  fallback = { color: 'light', label: 'Unknown' }
}) => {
  // Get status configuration
  const getStatusConfig = (): StatusConfig => {
    const normalizedStatus = status?.toLowerCase() || '';
    
    // Try custom config first
    if (customConfig && customConfig[normalizedStatus]) {
      return customConfig[normalizedStatus];
    }
    
    // Try predefined config
    if (type && STATUS_CONFIGS[type]) {
      const config = STATUS_CONFIGS[type] as Record<string, StatusConfig>;
      if (config[normalizedStatus]) {
        return config[normalizedStatus];
      }
    }
    
    // Return fallback
    return fallback;
  };

  const config = getStatusConfig();
  const displayLabel = label || config.label;

  return (
    <div className={className}>
      <Badge
        variant={variant}
        color={config.color}
        size={size}
      >
        {displayLabel}
      </Badge>
    </div>
  );
};

/**
 * Utility function to get status color for custom implementations
 */
export const getStatusColor = (
  status: string,
  type?: keyof typeof STATUS_CONFIGS,
  customConfig?: Record<string, StatusConfig>
): StatusConfig['color'] => {
  const normalizedStatus = status?.toLowerCase() || '';
  
  if (customConfig && customConfig[normalizedStatus]) {
    return customConfig[normalizedStatus].color;
  }
  
  if (type && STATUS_CONFIGS[type]) {
    const config = STATUS_CONFIGS[type] as Record<string, StatusConfig>;
    if (config[normalizedStatus]) {
      return config[normalizedStatus].color;
    }
  }
  
  return 'light';
};

/**
 * Utility function to get status label for custom implementations
 */
export const getStatusLabel = (
  status: string,
  type?: keyof typeof STATUS_CONFIGS,
  customConfig?: Record<string, StatusConfig>
): string => {
  const normalizedStatus = status?.toLowerCase() || '';
  
  if (customConfig && customConfig[normalizedStatus]) {
    return customConfig[normalizedStatus].label;
  }
  
  if (type && STATUS_CONFIGS[type]) {
    const config = STATUS_CONFIGS[type] as Record<string, StatusConfig>;
    if (config[normalizedStatus]) {
      return config[normalizedStatus].label;
    }
  }
  
  // Fallback to capitalized status
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
};

export default StatusBadge;