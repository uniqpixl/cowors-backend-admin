import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock KPI data for demonstration
    const kpis = {
      totalRevenue: {
        value: 2847650,
        formatted: "₹28,47,650",
        change: 15.2,
        changeType: "increase",
        period: "vs last month"
      },
      totalBookings: {
        value: 1216,
        formatted: "1,216",
        change: 23.5,
        changeType: "increase",
        period: "vs last month"
      },
      activeUsers: {
        value: 8945,
        formatted: "8,945",
        change: 12.8,
        changeType: "increase",
        period: "vs last month"
      },
      totalPartners: {
        value: 342,
        formatted: "342",
        change: 8.3,
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
      customerSatisfaction: {
        value: 4.7,
        formatted: "4.7/5",
        change: 0.2,
        changeType: "increase",
        period: "vs last month"
      },
      platformUtilization: {
        value: 78.5,
        formatted: "78.5%",
        change: 5.3,
        changeType: "increase",
        period: "vs last month"
      }
    };

    return NextResponse.json({
      success: true,
      data: kpis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard KPIs API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch dashboard KPIs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}