import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { UserRole } from './types'

export interface RouteConfig {
  path: string
  allowedRoles: UserRole[]
  redirectTo?: string
}

export interface MiddlewareConfig {
  routes: RouteConfig[]
  publicRoutes: string[]
  authRoutes: string[]
  defaultRedirect: string
  secret: string
}

export function createAuthMiddleware(config: MiddlewareConfig) {
  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    
    // Allow public routes
    if (config.publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }
    
    // Get the token
    const token = await getToken({
      req: request,
      secret: config.secret,
    })
    
    // If no token and not on auth route, redirect to sign in
    if (!token) {
      if (!config.authRoutes.some(route => pathname.startsWith(route))) {
        const signInUrl = new URL(config.defaultRedirect, request.url)
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
      }
      return NextResponse.next()
    }
    
    // If authenticated and on auth route, redirect to dashboard
    if (config.authRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // Check role-based access
    const userRole = token.user?.role as UserRole
    const matchedRoute = config.routes.find(route => pathname.startsWith(route.path))
    
    if (matchedRoute && userRole) {
      if (!matchedRoute.allowedRoles.includes(userRole)) {
        // Redirect to unauthorized page or default redirect
        const redirectUrl = matchedRoute.redirectTo || config.defaultRedirect
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }
    }
    
    return NextResponse.next()
  }
}

// Predefined role configurations
export const ADMIN_ROUTES: RouteConfig[] = [
  {
    path: '/dashboard',
    allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
  {
    path: '/admin',
    allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
  {
    path: '/partners',
    allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
  {
    path: '/users',
    allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
  {
    path: '/analytics',
    allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
  {
    path: '/settings',
    allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
]

export const PARTNER_ROUTES: RouteConfig[] = [
  {
    path: '/dashboard',
    allowedRoles: [UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
  {
    path: '/bookings',
    allowedRoles: [UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
  {
    path: '/profile',
    allowedRoles: [UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
  {
    path: '/settings',
    allowedRoles: [UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
]

export const USER_ROUTES: RouteConfig[] = [
  {
    path: '/dashboard',
    allowedRoles: [UserRole.USER, UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
  {
    path: '/my-account',
    allowedRoles: [UserRole.USER, UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
  {
    path: '/bookings',
    allowedRoles: [UserRole.USER, UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
]