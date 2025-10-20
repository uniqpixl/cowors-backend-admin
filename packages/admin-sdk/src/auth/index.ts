/**
 * Auth types and interfaces for Admin SDK
 * Note: This module provides types and interfaces for authentication.
 * The actual authentication implementation should be provided by the consuming application.
 */

// User role enum - duplicated here to avoid circular dependency
export enum UserRole {
  User = 'User',
  Partner = 'Partner',
  Admin = 'Admin',
  SuperAdmin = 'SuperAdmin',
  Moderator = 'Moderator',
}

export interface AdminSession {
  user: {
    id: string;
    email: string;
    name?: string;
    emailVerified: boolean;
    role?: UserRole;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

// Auth client interface - to be implemented by consuming application
export interface AuthClient {
  signIn: (email: string, password: string) => Promise<{ data: AdminSession | null; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  getSession: () => Promise<{ data: AdminSession | null; error: Error | null }>;
}

// Helper function to check if user has admin access
export const checkAdminAccess = (session: AdminSession | null): boolean => {
  if (!session?.user) return false;
  const role = session.user.role;
  return role === UserRole.Admin || role === UserRole.SuperAdmin;
};

// Helper function to get user role
export const getUserRole = (session: AdminSession | null): UserRole | null => {
  return session?.user?.role || null;
};

// Default implementation that should be overridden by consuming application
let authClientInstance: AuthClient | null = null;

export const setAuthClient = (client: AuthClient): void => {
  authClientInstance = client;
};

export const getSession = async (): Promise<{ data: AdminSession | null; error: Error | null }> => {
  if (!authClientInstance) {
    throw new Error('Auth client not configured. Call setAuthClient() with your auth implementation.');
  }
  return authClientInstance.getSession();
};

export const signIn = async (email: string, password: string): Promise<{ data: AdminSession | null; error: Error | null }> => {
  if (!authClientInstance) {
    throw new Error('Auth client not configured. Call setAuthClient() with your auth implementation.');
  }
  return authClientInstance.signIn(email, password);
};

export const signOut = async (): Promise<{ error: Error | null }> => {
  if (!authClientInstance) {
    throw new Error('Auth client not configured. Call setAuthClient() with your auth implementation.');
  }
  return authClientInstance.signOut();
};