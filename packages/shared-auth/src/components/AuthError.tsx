'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

interface AuthErrorProps {
  error?: string
  title?: string
  description?: string
  showRetry?: boolean
  onRetry?: () => void
  className?: string
}

const ERROR_MESSAGES = {
  SessionExpired: {
    title: 'Session Expired',
    description: 'Your session has expired. Please sign in again to continue.',
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to access this resource.',
  },
  Verification: {
    title: 'Verification Required',
    description: 'Please verify your email address to continue.',
  },
  RefreshAccessTokenError: {
    title: 'Authentication Error',
    description: 'There was a problem with your authentication. Please sign in again.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An unexpected error occurred. Please try again.',
  },
}

export function AuthError({ 
  error = 'Default',
  title,
  description,
  showRetry = true,
  onRetry,
  className = ''
}: AuthErrorProps) {
  const router = useRouter()
  const errorInfo = ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.Default

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      router.push('/auth/login')
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className={`flex items-center justify-center min-h-screen ${className}`}>
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
            <svg 
              className="h-6 w-6 text-red-600 dark:text-red-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title || errorInfo.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {description || errorInfo.description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showRetry && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={handleGoHome}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}

interface AuthErrorBannerProps {
  error: string
  onDismiss?: () => void
  className?: string
}

export function AuthErrorBanner({ 
  error, 
  onDismiss, 
  className = '' 
}: AuthErrorBannerProps) {
  const errorInfo = ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.Default

  return (
    <div className={`bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-red-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            {errorInfo.title}
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {errorInfo.description}
          </p>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex text-red-400 hover:text-red-600 focus:outline-none focus:text-red-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthError