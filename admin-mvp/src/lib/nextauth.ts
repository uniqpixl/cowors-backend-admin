import { NextAuthOptions, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Extend the Session type to include role as string
declare module "next-auth" {
  interface Session {
    user: {
      role?: string
      accessToken?: string
    } & DefaultSession["user"]
  }
}

console.log('[NEXTAUTH CONFIG] Loading NextAuth configuration...')

export const authOptions: NextAuthOptions = {
  debug: true,
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, metadata) {
      console.error('[NEXTAUTH ERROR]', code, metadata)
    },
    warn(code) {
      console.warn('[NEXTAUTH WARN]', code)
    },
    debug(code, metadata) {
      console.log('[NEXTAUTH DEBUG]', code, metadata)
    }
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@cowors.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        console.log('=== AUTHORIZE FUNCTION CALLED ===')
        console.log('[ADMIN AUTH] Authorize function called with credentials:', credentials)
        console.log('[ADMIN AUTH] Request object:', req)
        console.log('[ADMIN AUTH] Credentials type:', typeof credentials)
        console.log('[ADMIN AUTH] Credentials keys:', credentials ? Object.keys(credentials) : 'null')
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[ADMIN AUTH] Missing credentials')
          return null
        }
        
        try {
          console.log('[ADMIN AUTH] Making request to backend...')
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
          const response = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })
          
          console.log('[ADMIN AUTH] Backend response status:', response.status)
          
          if (!response.ok) {
            console.log('[ADMIN AUTH] Backend authentication failed')
            return null
          }
          
          const data = await response.json()
          console.log('[ADMIN AUTH] Backend response data:', data)
          
          if (data.success && data.user && (data.user.role === 'admin' || data.user.role === 'Admin')) {
            console.log('[ADMIN AUTH] Admin user authenticated successfully')
            return {
              id: data.user.id,
              email: data.user.email,
              name: `${data.user.firstName} ${data.user.lastName}`,
              role: data.user.role,
              accessToken: data.token,
            }
          } else {
            console.log('[ADMIN AUTH] User is not admin or authentication failed')
            return null
          }
        } catch (error) {
          console.error('[ADMIN AUTH] Authentication error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.accessToken = user.accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string
        session.accessToken = token.accessToken as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to the dashboard after successful login
      if (url.startsWith('/auth/login') || url === '/auth/signin') {
        return `${baseUrl}/`
      }
      // Allow relative callback URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url
      }
      return baseUrl
    },
  },
  pages: {
    signIn: '/auth/login',
  },
}