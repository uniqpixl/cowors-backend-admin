import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Mock bookings data for demonstration
    const mockBookings = [
      {
        id: 'BKG-A1B2C3',
        customerId: 'CUS-DP45W7',
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        spaceId: 'SPC-X9Y8Z7',
        spaceName: 'Tech Hub Coworking',
        spaceType: 'Coworking',
        partnerId: 'PTR-M5N6O7',
        partnerName: 'WorkSpace Solutions',
        bookingDate: '2024-01-15',
        startTime: '09:00',
        endTime: '17:00',
        duration: 8,
        amount: 2500,
        status: 'confirmed',
        paymentStatus: 'paid',
        createdAt: '2024-01-15T08:30:00Z',
        updatedAt: '2024-01-15T08:30:00Z'
      },
      {
        id: 'BKG-D4E5F6',
        customerId: 'CUS-K8M3N9',
        customerName: 'Jane Smith',
        customerEmail: 'jane.smith@example.com',
        spaceId: 'SPC-P1Q2R3',
        spaceName: 'Creative Studio',
        spaceType: 'Event Space',
        partnerId: 'PTR-S4T5U6',
        partnerName: 'Event Masters',
        bookingDate: '2024-01-16',
        startTime: '14:00',
        endTime: '18:00',
        duration: 4,
        amount: 3200,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: '2024-01-16T10:15:00Z',
        updatedAt: '2024-01-16T10:15:00Z'
      },
      {
        id: 'BKG-G7H8I9',
        customerId: 'CUS-R7Q2X5',
        customerName: 'Mike Johnson',
        customerEmail: 'mike.johnson@example.com',
        spaceId: 'SPC-V7W8X9',
        spaceName: 'Meeting Room Pro',
        spaceType: 'Meeting Room',
        partnerId: 'PTR-Y1Z2A3',
        partnerName: 'Business Centers Inc',
        bookingDate: '2024-01-17',
        startTime: '10:00',
        endTime: '12:00',
        duration: 2,
        amount: 800,
        status: 'confirmed',
        paymentStatus: 'paid',
        createdAt: '2024-01-17T09:45:00Z',
        updatedAt: '2024-01-17T09:45:00Z'
      }
    ];

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBookings = mockBookings.slice(startIndex, endIndex);

    // Sort bookings
    const sortedBookings = paginatedBookings.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : 1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    const response = {
      success: true,
      data: {
        bookings: sortedBookings,
        pagination: {
          page,
          limit,
          total: mockBookings.length,
          totalPages: Math.ceil(mockBookings.length / limit),
          hasNext: endIndex < mockBookings.length,
          hasPrev: page > 1
        },
        sorting: {
          sortBy,
          sortOrder
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Bookings API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch bookings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}