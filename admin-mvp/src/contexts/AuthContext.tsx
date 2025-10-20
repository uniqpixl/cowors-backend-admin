'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  hasAdminAccess: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user
  const hasAdminAccess = user?.role === 'Admin' || user?.role === 'admin' || user?.role === 'SuperAdmin'

  useEffect(() => {
    // Check for existing session on mount
    console.log('🔍 AuthContext: Checking for existing session...')
    try {
      const storedToken = localStorage.getItem('admin_token')
      const storedUser = localStorage.getItem('admin_user')
      
      console.log('🔍 AuthContext: storedToken:', storedToken ? 'exists' : 'null')
      console.log('🔍 AuthContext: storedUser:', storedUser ? 'exists' : 'null')
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setToken(storedToken)
          setUser(parsedUser)
          console.log('✅ AuthContext: User authenticated from localStorage:', parsedUser.email)
        } catch (error) {
          console.log('❌ AuthContext: Error parsing stored user, clearing localStorage')
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user')
        }
      }
    } catch (error) {
      console.log('❌ AuthContext: localStorage access error:', error)
    }
    
    setIsLoading(false)
    console.log('🔍 AuthContext: Initialization complete, isLoading set to false')
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const { apiRequest } = await import('@/lib/api/client')
      
      const data = await apiRequest<{
        success: boolean
        user: User
        token: string
        message?: string
      }>({
        url: '/api/v1/auth/login',
        method: 'POST',
        data: { email, password },
      }, false) // Don't require auth for login

      if (!data.success) {
        throw new Error(data.message || 'Authentication failed')
      }

      // Check if user has admin role
      if (data.user.role !== 'Admin' && data.user.role !== 'admin' && data.user.role !== 'SuperAdmin') {
        throw new Error('Access denied. Admin privileges required.')
      }

      // Set http-only backend auth cookie via Next.js API to satisfy middleware
      try {
        const cookieResp = await fetch('/api/auth/manual-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (!cookieResp.ok) {
          console.log('⚠️ Failed to set auth cookie via manual-login route')
        } else {
          console.log('🍪 Auth cookie set successfully')
        }
      } catch (cookieErr) {
        console.log('⚠️ Error setting auth cookie:', cookieErr)
      }

      // Store authentication data
      setUser(data.user)
      setToken(data.token)
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_user', JSON.stringify(data.user))
      console.log('✅ Authentication successful')
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error. Please try again.')
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    router.push('/auth/login')
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    hasAdminAccess,
    login,
    logout,
    token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}