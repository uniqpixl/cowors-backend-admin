'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface User {
  id: string
  email: string
  name?: string
  role?: 'user' | 'admin' | 'superadmin' | 'partner'
  roles?: string[]
  emailVerified?: boolean
}

interface SessionContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  hasAdminAccess: boolean
  userRole: string | null
  session: any
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hasAdminAccess: false,
  userRole: null,
  session: null,
})

export const useAuth = () => {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useAuth must be used within a SessionProvider')
  }
  return context
}

interface SessionProviderProps {
  children: React.ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const sessionResult = useSession()
  const session = sessionResult?.data
  const status = sessionResult?.status
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    console.log('AppSessionProvider: Session status changed', { status, session });
    console.log('AppSessionProvider: Session user details:', session?.user);
    
    if (status === 'loading') {
      return
    }
    
    if (session?.user) {
      // User is authenticated
      const sessionUser: any = session.user
      console.log('AppSessionProvider: Creating user from session:', sessionUser);
      console.log('AppSessionProvider: Raw role from session:', sessionUser.role, typeof sessionUser.role);
      console.log('AppSessionProvider: Raw roles array from session:', sessionUser.roles);
      
      // Convert role to lowercase if it exists
      const normalizedRole = sessionUser.role ? sessionUser.role.toLowerCase() : 'user';
      console.log('AppSessionProvider: Normalized role:', normalizedRole);
      
      const user: User = {
        id: sessionUser.id || sessionUser.sub || 'unknown',
        email: sessionUser.email,
        name: sessionUser.name || undefined,
        role: normalizedRole,
        emailVerified: true // Assuming verified since they're logged in
      }
      console.log('AppSessionProvider: Created user object:', user);
      setUser(user)
    } else {
      // No user session
      console.log('AppSessionProvider: No session user, setting user to null');
      setUser(null)
    }
  }, [session, status])

  // Calculate derived values
  const isLoading = status === 'loading'
  const isAuthenticated = !!user && !!session
  const hasAdminAccess = user?.role === 'admin' || user?.role === 'superadmin'
  const userRole = user?.role || 'user'

  const value: SessionContextType = {
    user,
    isLoading,
    isAuthenticated,
    hasAdminAccess,
    userRole,
    session,
  }

  console.log('AppSessionProvider render:', { isLoading, isAuthenticated, hasAdminAccess, userRole, user, session })
  console.log('LOGGED IN USER EMAIL:', user?.email, 'SESSION EMAIL:', session?.user?.email)

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export default SessionProvider