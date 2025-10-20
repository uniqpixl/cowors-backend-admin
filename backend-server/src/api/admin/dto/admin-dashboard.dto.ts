import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class DashboardKpisDto {
  @ApiProperty({ description: 'Total revenue for the period' })
  totalRevenue: number;

  @ApiProperty({ description: 'Total bookings for the period' })
  totalBookings: number;

  @ApiProperty({ description: 'Total active users' })
  activeUsers: number;

  @ApiProperty({ description: 'Total partners' })
  totalPartners: number;

  @ApiProperty({ description: 'Revenue growth percentage' })
  revenueGrowth: number;

  @ApiProperty({ description: 'Booking growth percentage' })
  bookingGrowth: number;

  @ApiProperty({ description: 'User growth percentage' })
  userGrowth: number;

  @ApiProperty({ description: 'Partner growth percentage' })
  partnerGrowth: number;

  @ApiProperty({ description: 'Average booking value' })
  averageBookingValue: number;

  @ApiProperty({ description: 'Platform commission earned' })
  platformCommission: number;

  @ApiProperty({ description: 'Conversion rate percentage' })
  conversionRate: number;

  @ApiProperty({ description: 'Customer satisfaction score' })
  customerSatisfaction: number;
}

export class DashboardNotificationDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;

  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification message' })
  message: string;

  @ApiProperty({ description: 'Notification type' })
  type: 'info' | 'warning' | 'error' | 'success';

  @ApiProperty({ description: 'Priority level' })
  priority: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({ description: 'Whether notification is read' })
  isRead: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Related entity ID', required: false })
  entityId?: string;

  @ApiProperty({ description: 'Related entity type', required: false })
  entityType?: string;

  @ApiProperty({ description: 'Action URL', required: false })
  actionUrl?: string;
}

export class DashboardNotificationsResponseDto {
  @ApiProperty({
    description: 'List of notifications',
    type: [DashboardNotificationDto],
  })
  notifications: DashboardNotificationDto[];

  @ApiProperty({ description: 'Total count of notifications' })
  totalCount: number;

  @ApiProperty({ description: 'Count of unread notifications' })
  unreadCount: number;
}

export class DashboardStatsDto {
  @ApiProperty({ description: "Today's statistics" })
  today: {
    revenue: number;
    bookings: number;
    newUsers: number;
    newPartners: number;
  };

  @ApiProperty({ description: "This week's statistics" })
  thisWeek: {
    revenue: number;
    bookings: number;
    newUsers: number;
    newPartners: number;
  };

  @ApiProperty({ description: "This month's statistics" })
  thisMonth: {
    revenue: number;
    bookings: number;
    newUsers: number;
    newPartners: number;
  };

  @ApiProperty({ description: 'Year to date statistics' })
  yearToDate: {
    revenue: number;
    bookings: number;
    newUsers: number;
    newPartners: number;
  };

  @ApiProperty({ description: 'Recent activity summary' })
  recentActivity: {
    recentBookings: number;
    pendingPayouts: number;
    activeSpaces: number;
    pendingReviews: number;
  };

  @ApiProperty({ description: 'System health indicators' })
  systemHealth: {
    serverStatus: 'healthy' | 'warning' | 'critical';
    databaseStatus: 'healthy' | 'warning' | 'critical';
    paymentGatewayStatus: 'healthy' | 'warning' | 'critical';
    lastUpdated: Date;
  };
}

export class DashboardQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for dashboard data (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for dashboard data (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Time period for comparison' })
  @IsOptional()
  @IsString()
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
}
