import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { jwtCallbackWithRefresh, sessionCallbackWithRefresh, EnhancedJWT, EnhancedSession } from './refresh'
import { 
  initializeFeatureFlags, 
  shouldAuditLog, 
  shouldMaintainLegacyCompatibility,
  isInMigrationMode,
  executeMigrationShim,
  getFeatureFlags
} from './features'
import { 
  auditSignIn, 
  auditSignOut, 
  auditSessionCreated, 
  auditAuthError,
  trackSignIn,
  trackSignOut,
  trackAuthError
} from './audit'
import { FeatureFlagManager } from './feature-flags'
import { AuthConfig, AppType, UserRole } from './types'

interface SharedAuthConfig {
  appType: 'frontend' | 'partner' | 'admin'
  credentials?: {
    authorize: (credentials: any) => Promise<any>
  }
  additionalProviders?: any[]
  customCallbacks?: Partial<NextAuthOptions['callbacks']>
  requiredRoles?: string[]
  environment?: string
  userId?: string
}

// Enhanced shared authentication configuration
function createSharedAuthOptions(config: SharedAuthConfig): NextAuthOptions {
  // Initialize feature flags for this app
  initializeFeatureFlags({
    environment: config.environment || process.env.NODE_ENV || 'development',
    appType: config.appType,
    userId: config.userId
  });

  // Enhanced cookie configuration
  const cookieConfig = getFeatureFlags().shouldUseSecureCookies() ? {
    sessionToken: {
      name: `${config.appType}.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.COOKIE_DOMAIN || undefined
      }
    },
    callbackUrl: {
      name: `${config.appType}.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `${config.appType}.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  } : {};

  return {
    providers: [
      CredentialsProvider({
        name: 'credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' }
        },
        async authorize(credentials) {
          console.log('🔍 [SHARED-AUTH] authorize function called with:', credentials);
          
          try {
            console.log('🔍 [SHARED-AUTH] config.credentials?.authorize exists:', !!config.credentials?.authorize);
            
            if (config.credentials?.authorize) {
              console.log('🔍 [SHARED-AUTH] Calling config.credentials.authorize');
              const user = await config.credentials.authorize(credentials);
              console.log('🔍 [SHARED-AUTH] authorize result:', user);
              
              // Track successful sign-in
              if (user && shouldAuditLog()) {
                trackSignIn(config.appType);
              }
              
              return user;
            }
            
            console.log('🔍 [SHARED-AUTH] No credentials authorize function found');
            return null;
          } catch (error) {
            console.log('🔍 [SHARED-AUTH] authorize error:', error);
            
            // Track authentication error
            if (shouldAuditLog()) {
              trackAuthError(config.appType);
              auditAuthError(
                `Authorization failed: ${error}`,
                undefined,
                credentials?.email as string,
                config.appType
              );
            }
            
            throw error;
          }
        }
      }),
      ...(config.additionalProviders || [])
    ],
    
    callbacks: {
      async jwt({ token, user, account }) {
        try {
          // Use migration shim if in migration mode
          if (isInMigrationMode() && shouldMaintainLegacyCompatibility()) {
            return executeMigrationShim('jwt_callback', token, user, account, config.appType)
          }
          
          return await jwtCallbackWithRefresh({ token, user, account }, config.appType)
        } catch (error) {
          console.error('JWT callback error:', error)
          
          if (shouldAuditLog()) {
            auditAuthError(
              `JWT callback failed: ${error}`,
              token.sub,
              token.email as string,
              config.appType
            )
          }
          
          return { ...token, error: 'JWTCallbackError' }
        }
      },
      
      async session({ session, token }) {
        try {
          // Use migration shim if in migration mode
          if (isInMigrationMode() && shouldMaintainLegacyCompatibility()) {
            return executeMigrationShim('session_callback', session, token, config.appType, config.requiredRoles)
          }
          
          const enhancedSession = await sessionCallbackWithRefresh(
            { session, token }, 
            config.appType, 
            config.requiredRoles
          )
          
          // Audit session creation/update
          if (shouldAuditLog() && !enhancedSession.error) {
            auditSessionCreated(enhancedSession, token as EnhancedJWT, config.appType)
          }
          
          return enhancedSession
        } catch (error) {
          console.error('Session callback error:', error)
          
          if (shouldAuditLog()) {
            auditAuthError(
              `Session callback failed: ${error}`,
              session.user?.id,
              session.user?.email,
              config.appType
            )
          }
          
          return { ...session, error: 'SessionCallbackError' }
        }
      },
      
      async signIn({ user, account, profile }) {
        try {
          // Use migration shim if in migration mode
          if (isInMigrationMode() && shouldMaintainLegacyCompatibility()) {
            return executeMigrationShim('sign_in_callback', user, account, profile, config.appType)
          }
          
          // Audit sign-in event
          if (shouldAuditLog()) {
            auditSignIn(user, account, profile, config.appType)
            trackSignIn(config.appType)
          }
          
          return true
        } catch (error) {
          console.error('Sign-in callback error:', error)
          
          if (shouldAuditLog()) {
            auditAuthError(
              `Sign-in failed: ${error}`,
              user.id,
              user.email,
              config.appType
            )
            trackAuthError(config.appType)
          }
          
          return false
        }
      },
      
      ...config.customCallbacks
    },
    
    pages: {
      signIn: '/auth/login',
      error: '/auth/error'
    },
    
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      updateAge: 24 * 60 * 60 // 24 hours
    },
    
    // Apply enhanced cookie configuration if feature is enabled
    ...(Object.keys(cookieConfig).length > 0 && { cookies: cookieConfig }),
    
    events: {
      async signIn({ user, account, profile }) {
        try {
          // Use migration shim if in migration mode
          if (isInMigrationMode() && shouldMaintainLegacyCompatibility()) {
            await executeMigrationShim('sign_in_event', user, account, profile, config.appType)
            return
          }
          
          if (shouldAuditLog()) {
            auditSignIn(user, account, profile, config.appType)
            trackSignIn(config.appType)
          }
          
          console.log(`[${config.appType}] User signed in:`, user.email)
        } catch (error) {
          console.error('Sign-in event error:', error)
          
          if (shouldAuditLog()) {
            auditAuthError(
              `Sign-in event failed: ${error}`,
              user.id,
              user.email,
              config.appType
            )
          }
        }
      },
      
      async signOut({ session, token }) {
        try {
          // Use migration shim if in migration mode
          if (isInMigrationMode() && shouldMaintainLegacyCompatibility()) {
            await executeMigrationShim('sign_out_event', session, token, config.appType)
            return
          }
          
          if (shouldAuditLog()) {
            auditSignOut(session, token as EnhancedJWT, config.appType)
            trackSignOut(config.appType)
          }
          
          console.log(`[${config.appType}] User signed out:`, session?.user?.email)
        } catch (error) {
          console.error('Sign-out event error:', error)
          
          if (shouldAuditLog()) {
            auditAuthError(
              `Sign-out event failed: ${error}`,
              session?.user?.id,
              session?.user?.email,
              config.appType
            )
          }
        }
      },
      
      async session({ session, token }) {
        try {
          // Track session activity
          if (shouldAuditLog()) {
            console.log(`[${config.appType}] Session activity tracked for user:`, session.user?.email)
          }
        } catch (error) {
          console.error('Session event error:', error)
          
          if (shouldAuditLog()) {
            auditAuthError(
              `Session event failed: ${error}`,
              session?.user?.id,
              session?.user?.email,
              config.appType
            )
          }
        }
      }
    },
    
    // Enhanced error handling
    logger: {
      error(code, metadata) {
        console.error(`[${config.appType}] NextAuth Error [${code}]:`, metadata)
        
        if (shouldAuditLog()) {
          auditAuthError(
            `NextAuth Error [${code}]: ${JSON.stringify(metadata)}`,
            metadata?.user?.id,
            metadata?.user?.email,
            config.appType
          )
          trackAuthError(config.appType)
        }
      },
      warn(code) {
        console.warn(`[${config.appType}] NextAuth Warning [${code}]`)
      },
      debug(code, metadata) {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[${config.appType}] NextAuth Debug [${code}]:`, metadata)
        }
      }
    },
    
    // Enhanced debug mode
    debug: process.env.NODE_ENV === 'development'
  };
}

// Default configurations for different apps
export function getFrontendAuthOptions(): NextAuthOptions {
  return createSharedAuthOptions({
    appType: 'frontend',
    environment: process.env.NODE_ENV || 'development'
  });
}

export function getPartnerAuthOptions(): NextAuthOptions {
  return createSharedAuthOptions({
    appType: 'partner',
    environment: process.env.NODE_ENV || 'development'
  });
}

export function getAdminAuthOptions(): NextAuthOptions {
  return createSharedAuthOptions({
    appType: 'admin',
    environment: process.env.NODE_ENV || 'development',
    requiredRoles: ['admin']
  });
}

export { createSharedAuthOptions };