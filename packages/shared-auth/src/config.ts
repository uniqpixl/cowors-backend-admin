/**
 * Authentication configuration utilities
 */

import type {
  AuthConfig,
  NextAuthConfig,
  AuthProvider
} from './types';

/**
 * Default authentication configuration
 */
export const DEFAULT_AUTH_CONFIG: Partial<AuthConfig> = {
  providers: ['credentials'],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
};

/**
 * Create NextAuth configuration
 */
export function createNextAuthConfig(
  config: Partial<NextAuthConfig>
): NextAuthConfig {
  return {
    ...DEFAULT_AUTH_CONFIG,
    ...config,
    providers: config.providers || DEFAULT_AUTH_CONFIG.providers!,
    secret: config.secret || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || '',
    baseUrl: config.baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000',
    session: {
      ...DEFAULT_AUTH_CONFIG.session!,
      ...config.session,
    },
    jwt: {
      ...DEFAULT_AUTH_CONFIG.jwt!,
      ...config.jwt,
      secret: config.jwt?.secret || config.secret || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || '',
    },
    pages: {
      ...DEFAULT_AUTH_CONFIG.pages!,
      ...config.pages,
    },
    callbacks: {
      async jwt({ token, user, account }) {
        // Persist user data to token
        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.email = user.email;
          token.name = user.name;
        }
        
        // Call custom jwt callback if provided
        if (config.callbacks?.jwt) {
          return await config.callbacks.jwt({ token, user, account });
        }
        
        return token;
      },
      async session({ session, token }) {
        // Send properties to the client
        if (token) {
          session.user.id = token.id as string;
          session.user.role = token.role as any;
          session.user.email = token.email as string;
          session.user.name = token.name as string;
        }
        
        // Call custom session callback if provided
        if (config.callbacks?.session) {
          return await config.callbacks.session({ session, token });
        }
        
        return session;
      },
      async signIn({ user, account, profile }) {
        // Call custom signIn callback if provided
        if (config.callbacks?.signIn) {
          return await config.callbacks.signIn({ user, account, profile });
        }
        
        return true;
      },
      async redirect({ url, baseUrl }) {
        // Call custom redirect callback if provided
        if (config.callbacks?.redirect) {
          return await config.callbacks.redirect({ url, baseUrl });
        }
        
        // Allows relative callback URLs
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        // Allows callback URLs on the same origin
        else if (new URL(url).origin === baseUrl) return url;
        return baseUrl;
      },
      ...config.callbacks,
    },
  };
}



/**
 * Get authentication configuration based on environment
 */
export function getAuthConfig(): AuthConfig {
  const baseConfig = {
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '',
    baseUrl: process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',
  };

  return createNextAuthConfig(baseConfig);
}

/**
 * Environment-specific configuration helpers
 */
export const AuthEnvironment = {
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isProduction: () => process.env.NODE_ENV === 'production',
  isTest: () => process.env.NODE_ENV === 'test',
  
  getBackendUrl: () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.BACKEND_URL || 'https://api.cowors.com';
    }
    return process.env.BACKEND_URL || 'http://localhost:5001';
  },
  
  getFrontendUrl: () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.FRONTEND_URL || 'https://cowors.com';
    }
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  },
  
  getAdminUrl: () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.ADMIN_URL || 'https://admin.cowors.com';
    }
    return process.env.ADMIN_URL || 'http://localhost:3001';
  },
  
  getPartnerUrl: () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.PARTNER_URL || 'https://partner.cowors.com';
    }
    return process.env.PARTNER_URL || 'http://localhost:3002';
  },
};