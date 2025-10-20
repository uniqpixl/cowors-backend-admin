import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum AnalyticsTimeframe {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum AnalyticsPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export enum AnalyticsGranularity {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class AdminAnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Start date for analytics (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for analytics (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: AnalyticsTimeframe,
    description: 'Timeframe for grouping data (legacy)',
  })
  @IsOptional()
  @IsEnum(AnalyticsTimeframe)
  timeframe?: AnalyticsTimeframe = AnalyticsTimeframe.DAILY;

  @ApiPropertyOptional({
    enum: AnalyticsPeriod,
    description: 'Time period for filtering data',
  })
  @IsOptional()
  @IsEnum(AnalyticsPeriod)
  period?: AnalyticsPeriod;

  @ApiPropertyOptional({
    enum: AnalyticsGranularity,
    description: 'Data granularity for time-series',
  })
  @IsOptional()
  @IsEnum(AnalyticsGranularity)
  granularity?: AnalyticsGranularity = AnalyticsGranularity.DAY;

  @ApiPropertyOptional({ description: 'Filter by specific partner ID' })
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Filter by specific space ID' })
  @IsOptional()
  @IsString()
  spaceId?: string;

  @ApiPropertyOptional({ description: 'Group results by field' })
  @IsOptional()
  @IsString()
  groupBy?: string;

  @ApiPropertyOptional({ description: 'Metric to analyze' })
  @IsOptional()
  @IsString()
  metric?: string;
}

export class PlatformStatsDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ description: 'Total number of partners' })
  totalPartners: number;

  @ApiProperty({ description: 'Total number of spaces' })
  totalSpaces: number;

  @ApiProperty({ description: 'Total number of bookings' })
  totalBookings: number;

  @ApiProperty({ description: 'Total revenue generated' })
  totalRevenue: number;

  @ApiProperty({ description: 'Active users in the last 30 days' })
  activeUsers: number;

  @ApiProperty({ description: 'New users this month' })
  newUsersThisMonth: number;

  @ApiProperty({ description: 'New partners this month' })
  newPartnersThisMonth: number;

  @ApiProperty({ description: 'Bookings this month' })
  bookingsThisMonth: number;

  @ApiProperty({ description: 'Revenue this month' })
  revenueThisMonth: number;

  @ApiProperty({ description: 'Average booking value' })
  averageBookingValue: number;

  @ApiProperty({ description: 'Platform commission earned' })
  platformCommission: number;
}

export class BookingAnalyticsDto {
  @ApiProperty({ description: 'Date of the data point' })
  date: string;

  @ApiProperty({ description: 'Number of bookings' })
  bookingCount: number;

  @ApiProperty({ description: 'Total revenue for the period' })
  revenue: number;

  @ApiProperty({ description: 'Average booking value' })
  averageValue: number;

  @ApiProperty({ description: 'Number of unique users who booked' })
  uniqueUsers: number;
}

export class UserAnalyticsDto {
  @ApiProperty({ description: 'Date of the data point' })
  date: string;

  @ApiProperty({ description: 'Number of new user registrations' })
  newUsers: number;

  @ApiProperty({ description: 'Number of active users' })
  activeUsers: number;

  @ApiProperty({ description: 'Number of users who made their first booking' })
  firstTimeBookers: number;
}

export class RevenueAnalyticsDto {
  @ApiProperty({ description: 'Date of the data point' })
  date: string;

  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Platform commission' })
  platformCommission: number;

  @ApiProperty({ description: 'Partner earnings' })
  partnerEarnings: number;

  @ApiProperty({ description: 'Number of transactions' })
  transactionCount: number;
}

export class SpaceUtilizationDto {
  @ApiProperty({ description: 'Date of the data point' })
  date: string;

  @ApiProperty({ description: 'Total number of spaces' })
  totalSpaces: number;

  @ApiProperty({ description: 'Number of booked spaces' })
  bookedSpaces: number;

  @ApiProperty({ description: 'Utilization rate as percentage' })
  utilizationRate: number;

  @ApiProperty({ description: 'Average booking duration in hours' })
  averageBookingDuration: number;

  @ApiProperty({ description: 'Peak utilization hour' })
  peakHour?: string;
}

export class TimeSeriesDataPoint {
  @ApiProperty({ description: 'Date/time of the data point' })
  date: string;

  @ApiProperty({ description: 'Value for this data point' })
  value: number;

  @ApiProperty({ description: 'Additional metadata', required: false })
  metadata?: Record<string, any>;
}
