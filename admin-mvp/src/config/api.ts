// API Configuration for Admin Dashboard
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const API_ENDPOINTS = {
  // Admin Category Management
  ADMIN_CATEGORIES: '/api/v1/admin/partner-categories',
  ADMIN_SUBCATEGORIES: '/api/v1/admin/partner-subcategories',
  ADMIN_CATEGORY_HIERARCHY: '/api/v1/admin/partner-categories/hierarchy',
  
  // Admin Partner Management
  ADMIN_PARTNERS: '/api/v1/admin/partners',
  ADMIN_PARTNER_VERIFICATION: '/api/v1/admin/partners/verification',
  
  // Admin Analytics
  ADMIN_ANALYTICS: '/api/v1/admin/analytics',
  ADMIN_REPORTS: '/api/v1/admin/reports',
  
  // Admin Settings
  ADMIN_SETTINGS: '/api/v1/admin/settings',
  ADMIN_USERS: '/api/v1/admin/users',
  
  // Admin Bookings
  ADMIN_BOOKINGS: '/api/v1/admin/bookings',
};

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export function buildApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}

export function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}