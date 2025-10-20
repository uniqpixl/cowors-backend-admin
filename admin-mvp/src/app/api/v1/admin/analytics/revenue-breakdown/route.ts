import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock revenue breakdown data for demonstration
    const revenueBreakdown = {
      revenueSources: [
        {
          id: 1,
          name: "Coworking Spaces",
          value: 1245000,
          formatted: "₹12,45,000",
          percentage: 43.7,
          change: 12.5,
          changeType: "increase",
          color: "#3B82F6"
        },
        {
          id: 2,
          name: "Event Spaces",
          value: 856000,
          formatted: "₹8,56,000",
          percentage: 30.1,
          change: 18.2,
          changeType: "increase",
          color: "#10B981"
        },
        {
          id: 3,
          name: "Office Spaces",
          value: 567000,
          formatted: "₹5,67,000",
          percentage: 19.9,
          change: 8.7,
          changeType: "increase",
          color: "#F59E0B"
        },
        {
          id: 4,
          name: "Cafe Spaces",
          value: 179650,
          formatted: "₹1,79,650",
          percentage: 6.3,
          change: -2.1,
          changeType: "decrease",
          color: "#EF4444"
        }
      ],
      topPerformingSpaces: [
        {
          id: 1,
          name: "Tech Hub Coworking",
          location: "Bangalore",
          revenue: 245000,
          formatted: "₹2,45,000",
          bookings: 156,
          rating: 4.8,
          category: "Coworking"
        },
        {
          id: 2,
          name: "Grand Event Center",
          location: "Mumbai",
          revenue: 189000,
          formatted: "₹1,89,000",
          bookings: 23,
          rating: 4.9,
          category: "Event"
        },
        {
          id: 3,
          name: "Corporate Office Suite",
          location: "Delhi",
          revenue: 167000,
          formatted: "₹1,67,000",
          bookings: 45,
          rating: 4.7,
          category: "Office"
        },
        {
          id: 4,
          name: "Artisan Cafe",
          location: "Pune",
          revenue: 89000,
          formatted: "₹89,000",
          bookings: 234,
          rating: 4.6,
          category: "Cafe"
        }
      ],
      monthlyTrends: [
        { month: "Jan", revenue: 2100000 },
        { month: "Feb", revenue: 2250000 },
        { month: "Mar", revenue: 2400000 },
        { month: "Apr", revenue: 2300000 },
        { month: "May", revenue: 2600000 },
        { month: "Jun", revenue: 2847650 }
      ],
      alerts: [
        {
          id: 1,
          type: "warning",
          title: "Revenue Decline in Cafe Category",
          message: "Cafe spaces revenue decreased by 2.1% this month",
          timestamp: "2024-01-15T10:30:00Z"
        },
        {
          id: 2,
          type: "success",
          title: "Event Spaces Performing Well",
          message: "Event spaces revenue increased by 18.2% this month",
          timestamp: "2024-01-14T15:45:00Z"
        }
      ]
    };

    return NextResponse.json(revenueBreakdown);
  } catch (error) {
    console.error('Revenue breakdown API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue breakdown' },
      { status: 500 }
    );
  }
}