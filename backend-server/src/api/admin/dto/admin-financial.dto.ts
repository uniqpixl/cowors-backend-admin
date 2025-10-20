import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class FinancialStatsDto {
  @ApiProperty({ description: 'Total platform revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Total platform commission earned' })
  totalCommission: number;

  @ApiProperty({ description: 'Total partner earnings' })
  totalPartnerEarnings: number;

  @ApiProperty({ description: 'Total payouts processed' })
  totalPayouts: number;

  @ApiProperty({ description: 'Pending payouts amount' })
  pendingPayouts: number;

  @ApiProperty({ description: 'Total transaction volume' })
  totalTransactionVolume: number;

  @ApiProperty({ description: 'Average transaction value' })
  averageTransactionValue: number;

  @ApiProperty({ description: 'Total refunds processed' })
  totalRefunds: number;

  @ApiProperty({ description: 'Revenue growth rate percentage' })
  revenueGrowthRate: number;

  @ApiProperty({ description: 'Commission rate percentage' })
  commissionRate: number;

  @ApiProperty({ description: 'Monthly recurring revenue' })
  monthlyRecurringRevenue: number;

  @ApiProperty({ description: 'Customer lifetime value' })
  customerLifetimeValue: number;
}

export class FinancialConfigStatsDto {
  @ApiProperty({ description: 'Total number of financial configurations' })
  totalConfigurations: number;

  @ApiProperty({ description: 'Active configurations count' })
  activeConfigurations: number;

  @ApiProperty({ description: 'Pending configurations count' })
  pendingConfigurations: number;

  @ApiProperty({ description: 'Configuration types breakdown' })
  configurationTypes: {
    commission: number;
    tax: number;
    fee: number;
    discount: number;
    other: number;
  };

  @ApiProperty({ description: 'Recent configuration changes' })
  recentChanges: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };

  @ApiProperty({ description: 'Configuration health status' })
  healthStatus: {
    healthy: number;
    warning: number;
    critical: number;
  };

  @ApiProperty({ description: 'Last configuration update timestamp' })
  lastUpdated: Date;
}

export class RealtimeFinancialStatsDto {
  @ApiProperty({ description: 'Real-time revenue for today' })
  todayRevenue: number;

  @ApiProperty({ description: 'Real-time bookings count for today' })
  todayBookings: number;

  @ApiProperty({ description: 'Real-time transactions count for today' })
  todayTransactions: number;

  @ApiProperty({ description: 'Active sessions count' })
  activeSessions: number;

  @ApiProperty({ description: 'Pending payments count' })
  pendingPayments: number;

  @ApiProperty({ description: 'Failed transactions count for today' })
  failedTransactions: number;

  @ApiProperty({ description: 'Average response time in milliseconds' })
  averageResponseTime: number;

  @ApiProperty({ description: 'System load percentage' })
  systemLoad: number;

  @ApiProperty({ description: 'Last 24 hours revenue trend' })
  revenuetrend: {
    hour: string;
    revenue: number;
  }[];

  @ApiProperty({ description: 'Payment gateway status' })
  paymentGatewayStatus: {
    stripe: 'online' | 'offline' | 'degraded';
    paypal: 'online' | 'offline' | 'degraded';
    lastChecked: Date;
  };

  @ApiProperty({ description: 'Data refresh timestamp' })
  lastRefreshed: Date;
}

export class FinancialQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for financial data (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for financial data (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Time period for analysis' })
  @IsOptional()
  @IsString()
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year';

  @ApiPropertyOptional({ description: 'Currency filter' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Partner ID filter' })
  @IsOptional()
  @IsString()
  partnerId?: string;
}

export class FinancialConfigOverviewDto {
  @ApiProperty({ description: 'Configuration overview statistics' })
  overview: FinancialConfigStatsDto;

  @ApiProperty({ description: 'Configuration effectiveness metrics' })
  effectiveness: {
    averageCommissionRate: number;
    averageTaxRate: number;
    totalConfiguredPartners: number;
    configurationCompliance: number;
  };

  @ApiProperty({ description: 'Recent configuration activities' })
  recentActivities: {
    id: string;
    type: string;
    action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated';
    timestamp: Date;
    adminId: string;
    description: string;
  }[];

  @ApiProperty({ description: 'Configuration performance metrics' })
  performance: {
    configurationLoadTime: number;
    cacheHitRate: number;
    errorRate: number;
    lastOptimized: Date;
  };
}
