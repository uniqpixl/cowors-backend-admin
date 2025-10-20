import { Session } from "next-auth"
import { getSession as getNextAuthSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"
import { getToken } from "next-auth/jwt"
import { UserRole } from '@cowors/shared-types'

// Extend the Session type to include accessToken
declare module "next-auth" {
  interface Session {
    accessToken?: string
  }
  interface User {
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    role?: string;
    userId?: string;
    accessTokenExpires?: number;
  }
}

interface AdminSession {
  user: {
    id: string;
    email: string;
    name?: string;
    emailVerified: boolean;
    role?: string;
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

// Function to get session from NextAuth
const getSession = async (): Promise<{ data: AdminSession | null }> => {
  try {
    // Use NextAuth's getSession
    const session: Session | null = await getNextAuthSession()
    
    if (session?.user) {
      // Get the JWT token from NextAuth session
      const jwtToken = (session as any).accessToken;
      
      return {
        data: {
          user: {
            id: (session.user as any).id || '',
            email: session.user.email || '',
            name: session.user.name || undefined,
            emailVerified: true, // Assume verified for now
            role: (session.user as any).role as UserRole || UserRole.User,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: {
            id: 'session-id', // Placeholder
            userId: (session.user as any).id || '',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            token: jwtToken || 'no-token-available',
            ipAddress: undefined,
            userAgent: undefined,
          },
        },
      };
    }
    
    return { data: null };
  } catch (error) {
    console.error('Error getting session:', error);
    return { data: null };
  }
};

// Sign in function using NextAuth
const performSignIn = async (email: string, password: string): Promise<any> => {
  try {
    console.log('Attempting signIn with credentials:', { email });
    const result = await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    });
    
    console.log('NextAuth signIn result:', result);
    
    if (result?.error) {
      throw new Error(result.error);
    }
    
    // Check if we have a successful login
    if (result?.ok && !result?.error) {
      return { data: result };
    }
    
    // If we get here, something went wrong
    throw new Error('Sign in failed. Please check your credentials and try again.');
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign out function using NextAuth
const performSignOut = async (): Promise<any> => {
  try {
    const result = await nextAuthSignOut({ redirect: false });
    return { data: result };
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Hook to use session (using NextAuth's useSession)
const useSession = () => {
  return getNextAuthSession();
};

// Helper function to check if user has admin access
const checkAdminAccess = (session: AdminSession | null): boolean => {
  if (!session?.user) return false;
  const role = session.user.role;
  return role === UserRole.Admin || role === UserRole.SuperAdmin;
};

// Helper function to get user role
const getUserRole = (session: AdminSession | null): string | null => {
  return session?.user?.role || null;
};

// Helper function to decode JWT token and check if it's expired
const isTokenExpired = (token: string): boolean => {
  try {
    // Handle mock token for development
    if (token === 'mock-jwt-token-for-development') {
      console.log('🔍 isTokenExpired: Mock token detected, treating as valid');
      return false; // Mock tokens never expire
    }
    
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true; // Invalid token format
    }
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expiration time
    if (!payload.exp) {
      return true; // No expiration time means invalid
    }
    
    // Check if current time is past expiration (exp is in seconds, Date.now() is in milliseconds)
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= payload.exp;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // If we can't decode it, consider it expired
  }
};

// Helper function to clear expired tokens from localStorage
const clearExpiredTokens = (): void => {
  try {
    if (typeof window === 'undefined') return;
    
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken && isTokenExpired(adminToken)) {
      console.log('🔑 Clearing expired admin_token from localStorage');
      localStorage.removeItem('admin_token');
    }
  } catch (error) {
    console.error('Error clearing expired tokens:', error);
  }
};

// Helper function to get auth token from localStorage or NextAuth session
const getAuthToken = async (): Promise<string | null> => {
  try {
    console.log('🔍 getAuthToken: Starting token retrieval...');
    
    // First clear any expired tokens
    clearExpiredTokens();
    
    // PRIORITY 1: Check localStorage for admin_token (AuthContext system)
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('admin_token');
      console.log('🔍 getAuthToken: adminToken from localStorage:', adminToken ? 'exists' : 'null');
      
      if (adminToken && !isTokenExpired(adminToken)) {
        console.log('✅ getAuthToken: Using valid admin token from localStorage');
        return adminToken;
      }
      
      // If admin token is expired or doesn't exist, clear it
      if (adminToken) {
        console.log('⚠️ getAuthToken: Admin token expired, clearing localStorage');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }

    // PRIORITY 2: Fallback to NextAuth session (only if AuthContext token not available)
    console.log('🔍 getAuthToken: No valid AuthContext token, checking NextAuth session...');
    const session: Session | null = await getNextAuthSession();
    console.log('🔍 getAuthToken: NextAuth session:', session ? 'exists' : 'null');
    
    // Check if accessToken is nested in user object (this is where NextAuth stores it)
    if ((session?.user as any)?.accessToken) {
      const userToken = (session?.user as any).accessToken;
      console.log('🔍 getAuthToken: Found accessToken in session.user:', userToken ? 'exists' : 'null');
      if (userToken && !isTokenExpired(userToken)) {
        console.log('✅ getAuthToken: Using valid NextAuth user token');
        return userToken;
      }
    }
    
    // Check for accessToken in the session (fallback)
    if (session?.accessToken) {
      const sessionToken = session.accessToken as string;
      if (!isTokenExpired(sessionToken)) {
        console.log('✅ getAuthToken: Using valid NextAuth token');
        return sessionToken;
      }
    }
    
    // Fallback: check if the user ID contains the JWT token
    if (session?.user) {
      const userId = (session.user as any)?.id;
      if (userId && typeof userId === 'string' && userId.startsWith('eyJ')) {
        if (!isTokenExpired(userId)) {
          console.log('✅ getAuthToken: Using valid user ID token');
          return userId;
        }
      }
    }
    
    console.log('❌ getAuthToken: No valid token found');
    return null;
  } catch (error) {
    console.error('❌ getAuthToken: Error getting auth token:', error);
    return null;
  }
};

// Export the session type for use in components
export type { AdminSession };

export {
  performSignIn as signIn,
  performSignOut as signOut,
  useSession,
  getSession,
  checkAdminAccess,
  getUserRole,
  getAuthToken,
  isTokenExpired,
  clearExpiredTokens,
};

// Export for use in API client error handling
export { isTokenExpired as validateToken, clearExpiredTokens as clearTokens };