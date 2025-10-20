import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock notifications data for demonstration
    const notifications = [
      {
        id: 1,
        type: 'booking',
        title: 'New Booking Received',
        message: 'John Doe has booked Tech Hub Coworking for ₹2,500',
        timestamp: '2024-01-15T10:30:00Z',
        read: false,
        priority: 'medium',
        actionUrl: '/admin/bookings/BKG-A1B2C3'
      },
      {
        id: 2,
        type: 'partner',
        title: 'New Partner Registration',
        message: 'WorkSpace Solutions has registered as a new partner',
        timestamp: '2024-01-15T09:15:00Z',
        read: false,
        priority: 'high',
        actionUrl: '/admin/partners/PTR-M5N6O7'
      },
      {
        id: 3,
        type: 'payment',
        title: 'Payment Received',
        message: 'Payment of ₹3,200 received for booking BKG-D4E5F6',
        timestamp: '2024-01-15T08:45:00Z',
        read: true,
        priority: 'low',
        actionUrl: '/admin/payments/PAY-X1Y2Z3'
      },
      {
        id: 4,
        type: 'system',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight at 2:00 AM',
        timestamp: '2024-01-14T16:00:00Z',
        read: false,
        priority: 'high',
        actionUrl: null
      },
      {
        id: 5,
        type: 'review',
        title: 'New Review Submitted',
        message: 'Mike Johnson left a 5-star review for Meeting Room Pro',
        timestamp: '2024-01-14T14:30:00Z',
        read: true,
        priority: 'low',
        actionUrl: '/admin/reviews/REV-A1B2C3'
      },
      {
        id: 6,
        type: 'alert',
        title: 'High Booking Volume',
        message: 'Booking volume is 35% higher than usual today',
        timestamp: '2024-01-14T12:00:00Z',
        read: false,
        priority: 'medium',
        actionUrl: '/admin/analytics/booking-trends'
      }
    ];

    // Filter by query parameters if provided
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredNotifications = notifications;

    if (unreadOnly) {
      filteredNotifications = filteredNotifications.filter(n => !n.read);
    }

    if (type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }

    // Apply limit
    filteredNotifications = filteredNotifications.slice(0, limit);

    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {
        booking: notifications.filter(n => n.type === 'booking').length,
        partner: notifications.filter(n => n.type === 'partner').length,
        payment: notifications.filter(n => n.type === 'payment').length,
        system: notifications.filter(n => n.type === 'system').length,
        review: notifications.filter(n => n.type === 'review').length,
        alert: notifications.filter(n => n.type === 'alert').length
      },
      byPriority: {
        high: notifications.filter(n => n.priority === 'high').length,
        medium: notifications.filter(n => n.priority === 'medium').length,
        low: notifications.filter(n => n.priority === 'low').length
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        notifications: filteredNotifications,
        stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard notifications API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch dashboard notifications',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}