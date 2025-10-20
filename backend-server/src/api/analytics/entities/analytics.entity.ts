import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AnalyticsType {
  USER_BEHAVIOR = 'user_behavior',
  BOOKING_METRICS = 'booking_metrics',
  REVENUE_METRICS = 'revenue_metrics',
  PLATFORM_METRICS = 'platform_metrics',
  PARTNER_METRICS = 'partner_metrics',
  LOCATION_METRICS = 'location_metrics',
  MARKETING_METRICS = 'marketing_metrics',
  PERFORMANCE_METRICS = 'performance_metrics',
}

export enum MetricCategory {
  ACQUISITION = 'acquisition',
  ENGAGEMENT = 'engagement',
  RETENTION = 'retention',
  CONVERSION = 'conversion',
  REVENUE = 'revenue',
  OPERATIONAL = 'operational',
  SATISFACTION = 'satisfaction',
  GROWTH = 'growth',
}

export enum TimeGranularity {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('analytics')
@Index(['type', 'category', 'date'])
@Index(['entityType', 'entityId', 'date'])
@Index(['metricName', 'date'])
export class AnalyticsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AnalyticsType,
    comment: 'Type of analytics data',
  })
  type: AnalyticsType;

  @Column({
    type: 'enum',
    enum: MetricCategory,
    comment: 'Category of the metric',
  })
  category: MetricCategory;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Name of the metric being tracked',
  })
  metricName: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment:
      'Type of entity this metric relates to (user, booking, partner, etc.)',
  })
  entityType?: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID of the specific entity this metric relates to',
  })
  entityId?: string;

  @Column({
    type: 'date',
    comment: 'Date for which this metric is recorded',
  })
  @Index()
  date: Date;

  @Column({
    type: 'enum',
    enum: TimeGranularity,
    default: TimeGranularity.DAILY,
    comment: 'Time granularity of the metric',
  })
  granularity: TimeGranularity;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'Numeric value of the metric',
  })
  value: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    comment: 'Previous period value for comparison',
  })
  previousValue?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
    comment: 'Percentage change from previous period',
  })
  changePercentage?: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional dimensions and breakdowns',
  })
  dimensions?: {
    country?: string;
    city?: string;
    userSegment?: string;
    deviceType?: string;
    platform?: string;
    source?: string;
    campaign?: string;
    ageGroup?: string;
    gender?: string;
    [key: string]: any;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Detailed breakdown of the metric',
  })
  breakdown?: {
    hourly?: Record<string, number>;
    bySegment?: Record<string, number>;
    byChannel?: Record<string, number>;
    byLocation?: Record<string, number>;
    byDevice?: Record<string, number>;
    [key: string]: any;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Goals and targets for this metric',
  })
  targets?: {
    daily?: number;
    weekly?: number;
    monthly?: number;
    quarterly?: number;
    yearly?: number;
    [key: string]: number;
  };

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'Currency code for monetary metrics',
  })
  currency?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Unit of measurement (count, percentage, currency, etc.)',
  })
  unit?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Description or notes about this metric',
  })
  description?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Data quality indicators',
  })
  quality?: {
    confidence?: number; // 0-100
    completeness?: number; // 0-100
    accuracy?: number; // 0-100
    timeliness?: number; // 0-100
    source?: string;
    methodology?: string;
    [key: string]: any;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Alerts and thresholds configuration',
  })
  alerts?: {
    enabled?: boolean;
    thresholds?: {
      critical?: { min?: number; max?: number };
      warning?: { min?: number; max?: number };
    };
    recipients?: string[];
    [key: string]: any;
  };

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Whether this metric is currently active',
  })
  isActive: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether this metric is publicly visible',
  })
  isPublic: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional metadata',
  })
  metadata?: Record<string, any>;

  @CreateDateColumn({
    type: 'timestamptz',
    comment: 'Timestamp when the record was created',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    comment: 'Timestamp when the record was last updated',
  })
  updatedAt: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
    comment: 'Timestamp when the data was collected',
  })
  collectedAt?: Date;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Source system or process that generated this data',
  })
  dataSource?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Version of the data collection schema',
  })
  schemaVersion?: string;
}

// Predefined metric configurations
export const PREDEFINED_METRICS = {
  // User Behavior Metrics
  DAILY_ACTIVE_USERS: {
    type: AnalyticsType.USER_BEHAVIOR,
    category: MetricCategory.ENGAGEMENT,
    metricName: 'daily_active_users',
    unit: 'count',
    description: 'Number of unique users active in a day',
  },
  MONTHLY_ACTIVE_USERS: {
    type: AnalyticsType.USER_BEHAVIOR,
    category: MetricCategory.ENGAGEMENT,
    metricName: 'monthly_active_users',
    unit: 'count',
    description: 'Number of unique users active in a month',
  },
  USER_RETENTION_RATE: {
    type: AnalyticsType.USER_BEHAVIOR,
    category: MetricCategory.RETENTION,
    metricName: 'user_retention_rate',
    unit: 'percentage',
    description: 'Percentage of users who return after first visit',
  },
  SESSION_DURATION: {
    type: AnalyticsType.USER_BEHAVIOR,
    category: MetricCategory.ENGAGEMENT,
    metricName: 'avg_session_duration',
    unit: 'minutes',
    description: 'Average time users spend in a session',
  },

  // Booking Metrics
  TOTAL_BOOKINGS: {
    type: AnalyticsType.BOOKING_METRICS,
    category: MetricCategory.CONVERSION,
    metricName: 'total_bookings',
    unit: 'count',
    description: 'Total number of bookings made',
  },
  BOOKING_CONVERSION_RATE: {
    type: AnalyticsType.BOOKING_METRICS,
    category: MetricCategory.CONVERSION,
    metricName: 'booking_conversion_rate',
    unit: 'percentage',
    description: 'Percentage of searches that result in bookings',
  },
  AVERAGE_BOOKING_VALUE: {
    type: AnalyticsType.BOOKING_METRICS,
    category: MetricCategory.REVENUE,
    metricName: 'avg_booking_value',
    unit: 'currency',
    description: 'Average monetary value per booking',
  },
  CANCELLATION_RATE: {
    type: AnalyticsType.BOOKING_METRICS,
    category: MetricCategory.OPERATIONAL,
    metricName: 'cancellation_rate',
    unit: 'percentage',
    description: 'Percentage of bookings that are cancelled',
  },

  // Revenue Metrics
  TOTAL_REVENUE: {
    type: AnalyticsType.REVENUE_METRICS,
    category: MetricCategory.REVENUE,
    metricName: 'total_revenue',
    unit: 'currency',
    description: 'Total revenue generated',
  },
  REVENUE_PER_USER: {
    type: AnalyticsType.REVENUE_METRICS,
    category: MetricCategory.REVENUE,
    metricName: 'revenue_per_user',
    unit: 'currency',
    description: 'Average revenue generated per user',
  },
  COMMISSION_REVENUE: {
    type: AnalyticsType.REVENUE_METRICS,
    category: MetricCategory.REVENUE,
    metricName: 'commission_revenue',
    unit: 'currency',
    description: 'Revenue from commissions',
  },

  // Platform Metrics
  TOTAL_USERS: {
    type: AnalyticsType.PLATFORM_METRICS,
    category: MetricCategory.GROWTH,
    metricName: 'total_users',
    unit: 'count',
    description: 'Total number of registered users',
  },
  NEW_USER_SIGNUPS: {
    type: AnalyticsType.PLATFORM_METRICS,
    category: MetricCategory.ACQUISITION,
    metricName: 'new_user_signups',
    unit: 'count',
    description: 'Number of new user registrations',
  },
  TOTAL_PROPERTIES: {
    type: AnalyticsType.PLATFORM_METRICS,
    category: MetricCategory.GROWTH,
    metricName: 'total_properties',
    unit: 'count',
    description: 'Total number of properties listed',
  },
} as const;
