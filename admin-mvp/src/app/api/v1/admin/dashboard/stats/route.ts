import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock dashboard stats data for demonstration
    const stats = {
      overview: {
        totalUsers: 8945,
        totalPartners: 342,
        totalSpaces: 1567,
        totalBookings: 12456,
        totalRevenue: 2847650
      },
      recentActivity: {
        newUsersToday: 23,
        newPartnersToday: 2,
        bookingsToday: 45,
        revenueToday: 89650
      },
      trends: {
        userGrowthRate: 12.8,
        partnerGrowthRate: 8.3,
        bookingGrowthRate: 23.5,
        revenueGrowthRate: 15.2
      },
      topPerformingSpaces: [
        {
          id: 'SPC-X9Y8Z7',
          name: 'Tech Hub Coworking',
          location: 'Bangalore',
          bookings: 156,
          revenue: 245000,
          rating: 4.8
        },
        {
          id: 'SPC-P1Q2R3',
          name: 'Creative Studio',
          location: 'Mumbai',
          bookings: 89,
          revenue: 189000,
          rating: 4.9
        },
        {
          id: 'SPC-V7W8X9',
          name: 'Meeting Room Pro',
          location: 'Delhi',
          bookings: 134,
          revenue: 167000,
          rating: 4.7
        }
      ],
      recentBookings: [
        {
          id: 'BKG-A1B2C3',
          customerName: 'John Doe',
          spaceName: 'Tech Hub Coworking',
          amount: 2500,
          status: 'confirmed',
          createdAt: '2024-01-15T08:30:00Z'
        },
        {
          id: 'BKG-D4E5F6',
          customerName: 'Jane Smith',
          spaceName: 'Creative Studio',
          amount: 3200,
          status: 'pending',
          createdAt: '2024-01-16T10:15:00Z'
        },
        {
          id: 'BKG-G7H8I9',
          customerName: 'Mike Johnson',
          spaceName: 'Meeting Room Pro',
          amount: 800,
          status: 'confirmed',
          createdAt: '2024-01-17T09:45:00Z'
        }
      ],
      alerts: [
        {
          id: 1,
          type: 'warning',
          title: 'High Booking Volume',
          message: 'Booking volume is 35% higher than usual today',
          timestamp: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          type: 'info',
          title: 'New Partner Onboarded',
          message: 'WorkSpace Solutions has been successfully onboarded',
          timestamp: '2024-01-14T15:45:00Z'
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch dashboard stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}