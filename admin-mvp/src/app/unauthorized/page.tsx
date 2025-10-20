"use client"

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UnauthorizedPage() {
  const router = useRouter()

  useEffect(() => {
    // Strict: unauthorized always goes to login
    router.replace('/auth/login')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  )
}