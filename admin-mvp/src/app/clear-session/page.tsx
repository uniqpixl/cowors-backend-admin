'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClearSessionPage() {
  const router = useRouter()

  useEffect(() => {
    console.log('ClearSessionPage: Clearing admin session')
    localStorage.removeItem('admin_user')
    window.dispatchEvent(new Event('localStorageChange'))
    
    // Redirect to signin after a short delay
    const timer = setTimeout(() => {
      router.push('/auth/login')
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Clearing Session...</h1>
        <p className="mt-2 text-gray-600">Redirecting to signin page</p>
      </div>
    </div>
  )
}