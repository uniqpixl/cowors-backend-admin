// Utility functions for formatting data

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format a date string to include time
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format a date string to time only
 */
export const formatTime = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid Time';
  }
};

/**
 * Format a number as currency
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  if (typeof amount !== 'number') return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Get status color for badges
 */
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    blocked: 'bg-red-100 text-red-800',
    frozen: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    processing: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    paid: 'bg-green-100 text-green-800',
    unpaid: 'bg-red-100 text-red-800',
    overdue: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
  };
  
  return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

/**
 * Format a number with commas
 */
export const formatNumber = (num: number): string => {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString();
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  if (typeof value !== 'number') return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

/**
 * Format a Cowors ID for display
 */
export const formatCoworsId = (id: string): string => {
  if (!id) return 'N/A';
  
  // Check if it's already in the correct format
  if (id.match(/^(CUS|CPT|CSP|BK)-[A-Z0-9]{6}$/)) {
    return id;
  }
  
  // Legacy format conversion
  if (id.startsWith('CW-')) {
    return id.replace('CW-', 'CUS-');
  }
  
  // Convert legacy formats to new formats
  if (id.startsWith('USR-')) {
    return id.replace('USR-', 'CUS-');
  }
  
  if (id.startsWith('PTR-')) {
    return id.replace('PTR-', 'CPT-');
  }
  
  if (id.startsWith('SPC-')) {
    return id.replace('SPC-', 'CSP-');
  }
  
  if (id.startsWith('BKG-')) {
    return id.replace('BKG-', 'BK-');
  }
  
  // Handle legacy CP- format (should be CPT-)
  if (id.startsWith('CP-')) {
    return id.replace('CP-', 'CPT-');
  }
  
  // If it's a raw ID without prefix, try to determine type from context
  // For now, assume it's a user ID (this could be improved with context)
  return `CUS-${id.padStart(6, '0')}`;
};

/**
 * Format a Booking ID for display
 */
export const formatBookingId = (id: string): string => {
  if (!id) return 'N/A';
  
  // Check if it's already in the correct BK- format
  if (id.startsWith('BK-')) {
    return id;
  }
  
  // Convert legacy BKG- format to BK-
  if (id.startsWith('BKG-')) {
    return id.replace('BKG-', 'BK-');
  }
  
  // Check if it's a UUID and convert it
  if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    // Generate a 6-character alphanumeric code from the UUID
    const hash = id.replace(/-/g, '').toUpperCase();
    const code = hash.substring(0, 6);
    return `BK-${code}`;
  }
  
  // If it's a raw hexadecimal ID, convert it
  if (id.match(/^[0-9a-f]+$/i) && id.length >= 6) {
    const code = id.toUpperCase().substring(0, 6);
    return `BK-${code}`;
  }
  
  // If it's a raw ID without prefix, add BK- prefix
  return `BK-${id}`;
};

/**
 * Check if a string is a valid Cowors ID
 */
export const isValidCoworsId = (id: string): boolean => {
  if (!id) return false;
  // Check if it matches the correct format patterns
  return /^(CUS|CPT|CSP|BK)-[A-Z0-9]{6}$/i.test(id);
};

/**
 * Get the type of ID (user, partner, booking, etc.)
 */
export const getIdType = (id: string): string => {
  if (!id) return 'unknown';
  
  // Check for current format
  if (id.startsWith('CUS-')) return 'user';
  if (id.startsWith('CPT-')) return 'partner';
  if (id.startsWith('BK-')) return 'booking';
  if (id.startsWith('CSP-')) return 'space';
  if (id.startsWith('TXN-')) return 'transaction';
  
  // Legacy format support
  if (id.startsWith('USR-')) return 'user';
  if (id.startsWith('PTR-')) return 'partner';
  if (id.startsWith('BKG-')) return 'booking';
  if (id.startsWith('SPC-')) return 'space';
  if (id.startsWith('CW-')) return 'user'; // CW- was for users
  
  // Check for UUID format
  if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    return 'uuid';
  }
  
  return 'unknown';
};

/**
 * Format a User ID for display
 */
export const formatUserId = (id: string): string => {
  if (!id) return 'N/A';
  
  // Check if it's already in the correct format
  if (id.match(/^CUS-[A-Z0-9]{6}$/)) {
    return id;
  }
  
  // Legacy format conversion
  if (id.startsWith('CW-') || id.startsWith('USR-')) {
    const numericPart = id.split('-')[1];
    return `CUS-${numericPart.padStart(6, '0')}`;
  }
  
  // If it's a raw ID without prefix
  return `CUS-${id.padStart(6, '0')}`;
};

/**
 * Format a Partner ID for display
 */
export const formatPartnerId = (id: string): string => {
  if (!id) return 'N/A';
  
  // Check if it's already in the correct format
  if (id.match(/^CPT-[A-Z0-9]{6}$/)) {
    return id;
  }
  
  // Legacy format conversion
  if (id.startsWith('CP-') || id.startsWith('PTR-')) {
    const numericPart = id.split('-')[1];
    return `CPT-${numericPart.padStart(6, '0')}`;
  }
  
  // If it's a raw ID without prefix
  return `CPT-${id.padStart(6, '0')}`;
};

/**
 * Format a Space ID for display
 */
export const formatSpaceId = (id: string): string => {
  if (!id) return 'N/A';
  
  // Check if it's already in the correct format
  if (id.match(/^CSP-[A-Z0-9]{6}$/)) {
    return id;
  }
  
  // Legacy format conversion
  if (id.startsWith('SPC-')) {
    const numericPart = id.split('-')[1];
    return `CSP-${numericPart.padStart(6, '0')}`;
  }
  
  // If it's a raw ID without prefix
  return `CSP-${id.padStart(6, '0')}`;
};