'use client'

import React from 'react'

interface AuthLoadingProps {
  message?: string
  className?: string
}

export function AuthLoading({ 
  message = 'Authenticating...', 
  className = '' 
}: AuthLoadingProps) {
  return (
    <div className={`flex items-center justify-center min-h-screen ${className}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  )
}

interface AuthButtonLoadingProps {
  isLoading: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function AuthButtonLoading({ 
  isLoading, 
  children, 
  className = '',
  disabled = false
}: AuthButtonLoadingProps) {
  return (
    <button 
      className={`relative ${className}`}
      disabled={isLoading || disabled}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        </div>
      )}
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  )
}

interface AuthCardLoadingProps {
  title?: string
  description?: string
  className?: string
}

export function AuthCardLoading({ 
  title = 'Loading...', 
  description = 'Please wait while we process your request.',
  className = ''
}: AuthCardLoadingProps) {
  return (
    <div className={`max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  )
}

export default AuthLoading