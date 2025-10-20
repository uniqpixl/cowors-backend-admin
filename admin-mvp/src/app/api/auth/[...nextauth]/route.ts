import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { NextAuthOptions } from 'next-auth'
import { UserRole } from '@cowors/shared-types'

console.log('[NEXTAUTH ROUTE] Initializing NextAuth handler...')

const authOptions: NextAuthOptions = {
  debug: true,
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        console.log('=== AUTHORIZE FUNCTION CALLED IN ROUTE ===')
        console.log('[ROUTE AUTH] Credentials received:', credentials)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[ROUTE AUTH] Missing credentials')
          return null
        }
        
        try {
          console.log('[ROUTE AUTH] Making request to backend...')
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
          
          console.log('[ROUTE AUTH] Backend response status:', response.status)
          
          if (!response.ok) {
            console.log('[ROUTE AUTH] Backend authentication failed')
            return null
          }
          
          const data = await response.json()
          console.log('[ROUTE AUTH] Backend response data:', data)
          
          if (data.success && data.user && (data.user.role === 'admin' || data.user.role === 'Admin')) {
            console.log('[ROUTE AUTH] Admin user authenticated successfully')
            return {
              id: data.user.id,
              email: data.user.email,
              name: `${data.user.firstName} ${data.user.lastName}`,
              role: data.user.role,
              accessToken: data.token,
            }
          } else {
            console.log('[ROUTE AUTH] User is not admin or authentication failed')
            return null
          }
        } catch (error) {
          console.error('[ROUTE AUTH] Authentication error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('[ROUTE JWT] JWT callback called with:', { token, user })
      if (user) {
        token.role = user.role
        token.accessToken = user.accessToken
      }
      return token
    },
    async session({ session, token }) {
      console.log('[ROUTE SESSION] Session callback called with:', { session, token })
      if (token) {
        session.user.role = token.role as any
        session.user.accessToken = token.accessToken
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }