'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import KPISnapshot from '@/components/dashboard/KPISnapshot'
import QuickActions from '@/components/dashboard/QuickActions'
import RevenueBookingCharts from '@/components/dashboard/RevenueBookingCharts'
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show dashboard content for authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Snapshot Section */}
      <ErrorBoundary>
        <KPISnapshot />
      </ErrorBoundary>
      
      {/* Quick Actions Section */}
      <QuickActions />
      
      {/* Revenue & Booking Charts Section */}
      <RevenueBookingCharts />
      
      {/* Recent Activity Feed */}
      <RecentActivityFeed />
    </div>
  )
}