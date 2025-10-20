import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock platform statistics data for demonstration
    const platformStats = {
      overview: {
        totalUsers: 12847,
        totalPartners: 456,
        totalSpaces: 2134,
        totalBookings: 8923,
        totalRevenue: 4567890,
        activeUsers: 3421,
        activePartners: 234,
        activeSpaces: 1876
      },
      growth: {
        userGrowth: {
          thisMonth: 234,
          lastMonth: 189,
          percentageChange: 23.8
        },
        partnerGrowth: {
          thisMonth: 12,
          lastMonth: 8,
          percentageChange: 50.0
        },
        spaceGrowth: {
          thisMonth: 45,
          lastMonth: 38,
          percentageChange: 18.4
        },
        bookingGrowth: {
          thisMonth: 567,
          lastMonth: 489,
          percentageChange: 15.9
        },
        revenueGrowth: {
          thisMonth: 234567,
          lastMonth: 198432,
          percentageChange: 18.2
        }
      },
      performance: {
        averageBookingValue: 512,
        averageSessionDuration: 24.5, // minutes
        conversionRate: 3.2, // percentage
        customerSatisfaction: 4.6, // out of 5
        platformUptime: 99.8, // percentage
        responseTime: 245 // milliseconds
      },
      demographics: {
        usersByCity: [
          { city: 'Mumbai', count: 3456, percentage: 26.9 },
          { city: 'Delhi', count: 2789, percentage: 21.7 },
          { city: 'Bangalore', count: 2234, percentage: 17.4 },
          { city: 'Pune', count: 1567, percentage: 12.2 },
          { city: 'Chennai', count: 1234, percentage: 9.6 },
          { city: 'Others', count: 1567, percentage: 12.2 }
        ],
        usersByAge: [
          { ageGroup: '18-25', count: 2569, percentage: 20.0 },
          { ageGroup: '26-35', count: 5139, percentage: 40.0 },
          { ageGroup: '36-45', count: 3854, percentage: 30.0 },
          { ageGroup: '46-55', count: 1028, percentage: 8.0 },
          { ageGroup: '55+', count: 257, percentage: 2.0 }
        ],
        usersByProfession: [
          { profession: 'Software Developer', count: 3854, percentage: 30.0 },
          { profession: 'Entrepreneur', count: 2569, percentage: 20.0 },
          { profession: 'Freelancer', count: 2054, percentage: 16.0 },
          { profession: 'Consultant', count: 1542, percentage: 12.0 },
          { profession: 'Student', count: 1285, percentage: 10.0 },
          { profession: 'Others', count: 1543, percentage: 12.0 }
        ]
      },
      usage: {
        peakHours: [
          { hour: '09:00', bookings: 234 },
          { hour: '10:00', bookings: 345 },
          { hour: '11:00', bookings: 456 },
          { hour: '14:00', bookings: 389 },
          { hour: '15:00', bookings: 423 },
          { hour: '16:00', bookings: 367 }
        ],
        popularSpaceTypes: [
          { type: 'Hot Desk', bookings: 3456, percentage: 38.7 },
          { type: 'Meeting Room', bookings: 2234, percentage: 25.0 },
          { type: 'Private Office', bookings: 1567, percentage: 17.6 },
          { type: 'Conference Room', bookings: 1123, percentage: 12.6 },
          { type: 'Event Space', bookings: 543, percentage: 6.1 }
        ],
        averageBookingDuration: {
          hotDesk: 4.5, // hours
          meetingRoom: 2.0,
          privateOffice: 8.0,
          conferenceRoom: 3.5,
          eventSpace: 6.0
        }
      },
      financial: {
        monthlyRevenue: [
          { month: 'Jan', revenue: 345678 },
          { month: 'Feb', revenue: 389234 },
          { month: 'Mar', revenue: 423567 },
          { month: 'Apr', revenue: 456789 },
          { month: 'May', revenue: 478923 },
          { month: 'Jun', revenue: 512345 }
        ],
        revenueBySpaceType: [
          { type: 'Hot Desk', revenue: 1234567, percentage: 27.0 },
          { type: 'Meeting Room', revenue: 1567890, percentage: 34.3 },
          { type: 'Private Office', revenue: 1123456, percentage: 24.6 },
          { type: 'Conference Room', revenue: 456789, percentage: 10.0 },
          { type: 'Event Space', revenue: 185188, percentage: 4.1 }
        ],
        commissionEarned: 456789,
        partnerPayouts: 4111101
      }
    };

    // Handle query parameters for filtering
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'month';
    const category = searchParams.get('category');

    let responseData = platformStats;

    // Filter by category if specified
    if (category) {
      const validCategories = ['overview', 'growth', 'performance', 'demographics', 'usage', 'financial'];
      if (validCategories.includes(category)) {
        responseData = { [category]: platformStats[category as keyof typeof platformStats] };
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      metadata: {
        timeframe,
        category: category || 'all',
        lastUpdated: new Date().toISOString(),
        dataPoints: Object.keys(responseData).length
      }
    });
  } catch (error) {
    console.error('Platform stats API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch platform statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}