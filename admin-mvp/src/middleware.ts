import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/error',
  '/auth/forgot-password',
  '/auth/two-factor-auth'
]

// Define API auth routes
const apiAuthRoutes = ['/api/auth']

export default withAuth(
  function middleware(req) {
    // Strict dev port enforcement: Admin must run on 3001 in non-production
    try {
      const isProd = process.env.NODE_ENV === 'production'
      const strictAdminPort = process.env.NEXT_PUBLIC_ADMIN_PORT || '3001'
      const hostname = req.nextUrl.hostname
      const hostHeader = req.headers.get('host') || ''
      const headerPort = hostHeader.includes(':') ? hostHeader.split(':')[1] : ''
      const reqPort = req.nextUrl.port || headerPort || ''

      if (!isProd && ['localhost', '127.0.0.1'].includes(hostname)) {
        if (reqPort && reqPort !== strictAdminPort) {
          return new NextResponse(
            `Admin must run on port ${strictAdminPort}. Current: ${reqPort}`,
            { status: 403 }
          )
        }
      }
    } catch (_) {
      // Fail open if any parsing issue, but logs appear in server
    }
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    const hasBackendAuthCookie = req.cookies.get('auth-token')
    
    // Allow access to auth pages, API routes, static files, and unauthorized page
    if (
      publicRoutes.some(route => pathname.startsWith(route)) ||
      apiAuthRoutes.some(route => pathname.startsWith(route)) ||
      pathname.startsWith('/_next') ||
      pathname === '/favicon.ico' ||
      pathname.startsWith('/images') ||
      pathname.startsWith('/icons') ||
      pathname === '/unauthorized'
    ) {
      return NextResponse.next()
    }
    
    // If authenticated via NextAuth but doesn't have proper role, redirect to unauthorized
    if (token && token.role) {
      // Accept both lowercase and enum-style roles
      const allowedRoles = ['admin', 'super_admin', 'Admin', 'SuperAdmin']
      if (!allowedRoles.includes(token.role as string)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        const hasBackendAuthCookie = req.cookies.get('auth-token')
        
        // Allow access to public routes
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }
        
        // Allow access to API auth routes
        if (apiAuthRoutes.some(route => pathname.startsWith(route))) {
          return true
        }
        
        // Allow access to static files and unauthorized page
        if (
          pathname.startsWith('/_next') ||
          pathname === '/favicon.ico' ||
          pathname.startsWith('/images') ||
          pathname.startsWith('/icons') ||
          pathname === '/unauthorized'
        ) {
          return true
        }
        
        // Allow access if authenticated via backend cookie (AuthContext uses this)
        if (hasBackendAuthCookie) {
          return true
        }

        // Require NextAuth authentication and admin/super_admin role for all other routes
        if (!token || !token.role) {
          return false
        }
        
        // Check if user has admin or super_admin role (support enum-style values)
        const allowedRoles = ['admin', 'super_admin', 'Admin', 'SuperAdmin']
        return allowedRoles.includes(token.role as string)
      },
    },
    pages: {
      signIn: '/auth/login',
      error: '/auth/error',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Protect all routes except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}