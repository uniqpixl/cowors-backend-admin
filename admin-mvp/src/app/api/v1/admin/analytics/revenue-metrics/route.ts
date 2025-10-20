import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock revenue metrics data for demonstration
    const revenueMetrics = {
      totalRevenue: {
        value: 2847650,
        formatted: "₹28,47,650",
        change: 15.2,
        changeType: "increase",
        period: "vs last month"
      },
      monthlyRecurringRevenue: {
        value: 1245000,
        formatted: "₹12,45,000",
        change: 8.7,
        changeType: "increase",
        period: "vs last month"
      },
      averageRevenuePerUser: {
        value: 2340,
        formatted: "₹2,340",
        change: -2.1,
        changeType: "decrease",
        period: "vs last month"
      },
      revenueGrowthRate: {
        value: 15.2,
        formatted: "15.2%",
        change: 3.4,
        changeType: "increase",
        period: "vs last quarter"
      },
      totalBookings: {
        value: 1216,
        formatted: "1,216",
        change: 23.5,
        changeType: "increase",
        period: "vs last month"
      },
      averageBookingValue: {
        value: 2342,
        formatted: "₹2,342",
        change: -5.8,
        changeType: "decrease",
        period: "vs last month"
      },
      conversionRate: {
        value: 3.2,
        formatted: "3.2%",
        change: 0.8,
        changeType: "increase",
        period: "vs last month"
      },
      churnRate: {
        value: 2.1,
        formatted: "2.1%",
        change: -0.3,
        changeType: "decrease",
        period: "vs last month"
      }
    };

    return NextResponse.json(revenueMetrics);
  } catch (error) {
    console.error('Revenue metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue metrics' },
      { status: 500 }
    );
  }
}