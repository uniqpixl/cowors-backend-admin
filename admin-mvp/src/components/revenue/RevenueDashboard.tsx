'use client'

import React from 'react'
import RevenueMetrics from '@/components/revenue/RevenueMetrics'
import RevenueBreakdown from '@/components/revenue/RevenueBreakdown'
import RevenueAlerts from '@/components/revenue/RevenueAlerts'

const RevenueDashboard = () => {
  return (
    <div className="space-y-6">
      <RevenueMetrics />
      <RevenueBreakdown />
      <RevenueAlerts />
    </div>
  )
}

export default RevenueDashboard