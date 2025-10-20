import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  AnalyticsEntity,
  AnalyticsType,
  MetricCategory,
  TimeGranularity,
} from '../entities/analytics.entity';

export class DimensionsDto {
  @ApiPropertyOptional({ description: 'Country code' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'City name' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'User segment' })
  @IsOptional()
  @IsString()
  userSegment?: string;

  @ApiPropertyOptional({ description: 'Device type' })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({ description: 'Platform' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ description: 'Traffic source' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Marketing campaign' })
  @IsOptional()
  @IsString()
  campaign?: string;

  @ApiPropertyOptional({ description: 'Age group' })
  @IsOptional()
  @IsString()
  ageGroup?: string;

  @ApiPropertyOptional({ description: 'Gender' })
  @IsOptional()
  @IsString()
  gender?: string;
}

export class BreakdownDto {
  @ApiPropertyOptional({ description: 'Hourly breakdown', type: 'object' })
  @IsOptional()
  @IsObject()
  hourly?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Breakdown by segment', type: 'object' })
  @IsOptional()
  @IsObject()
  bySegment?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Breakdown by channel', type: 'object' })
  @IsOptional()
  @IsObject()
  byChannel?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Breakdown by location', type: 'object' })
  @IsOptional()
  @IsObject()
  byLocation?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Breakdown by device', type: 'object' })
  @IsOptional()
  @IsObject()
  byDevice?: Record<string, number>;
}

export class TargetsDto {
  @ApiPropertyOptional({ description: 'Daily target' })
  @IsOptional()
  @IsNumber()
  daily?: number;

  @ApiPropertyOptional({ description: 'Weekly target' })
  @IsOptional()
  @IsNumber()
  weekly?: number;

  @ApiPropertyOptional({ description: 'Monthly target' })
  @IsOptional()
  @IsNumber()
  monthly?: number;

  @ApiPropertyOptional({ description: 'Quarterly target' })
  @IsOptional()
  @IsNumber()
  quarterly?: number;

  @ApiPropertyOptional({ description: 'Yearly target' })
  @IsOptional()
  @IsNumber()
  yearly?: number;

  [key: string]: number | undefined;
}

export class QualityDto {
  @ApiPropertyOptional({
    description: 'Confidence level (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence?: number;

  @ApiPropertyOptional({
    description: 'Data completeness (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completeness?: number;

  @ApiPropertyOptional({
    description: 'Data accuracy (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  accuracy?: number;

  @ApiPropertyOptional({
    description: 'Data timeliness (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  timeliness?: number;

  @ApiPropertyOptional({ description: 'Data source' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Collection methodology' })
  @IsOptional()
  @IsString()
  methodology?: string;
}

export class ThresholdDto {
  @ApiPropertyOptional({ description: 'Minimum threshold value' })
  @IsOptional()
  @IsNumber()
  min?: number;

  @ApiPropertyOptional({ description: 'Maximum threshold value' })
  @IsOptional()
  @IsNumber()
  max?: number;
}

export class AlertsDto {
  @ApiPropertyOptional({ description: 'Whether alerts are enabled' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Alert thresholds' })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  thresholds?: {
    critical?: ThresholdDto;
    warning?: ThresholdDto;
  };

  @ApiPropertyOptional({ description: 'Alert recipients', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[];
}

export class CreateAnalyticsDto {
  @ApiProperty({ description: 'Type of analytics data', enum: AnalyticsType })
  @IsEnum(AnalyticsType)
  type: AnalyticsType;

  @ApiProperty({ description: 'Category of the metric', enum: MetricCategory })
  @IsEnum(MetricCategory)
  category: MetricCategory;

  @ApiProperty({ description: 'Name of the metric being tracked' })
  @IsString()
  metricName: string;

  @ApiPropertyOptional({ description: 'Type of entity this metric relates to' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'ID of the specific entity this metric relates to',
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiProperty({ description: 'Date for which this metric is recorded' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Time granularity of the metric',
    enum: TimeGranularity,
  })
  @IsOptional()
  @IsEnum(TimeGranularity)
  granularity?: TimeGranularity;

  @ApiProperty({ description: 'Numeric value of the metric' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'Previous period value for comparison' })
  @IsOptional()
  @IsNumber()
  previousValue?: number;

  @ApiPropertyOptional({
    description: 'Percentage change from previous period',
  })
  @IsOptional()
  @IsNumber()
  changePercentage?: number;

  @ApiPropertyOptional({ description: 'Additional dimensions and breakdowns' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;

  @ApiPropertyOptional({ description: 'Detailed breakdown of the metric' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BreakdownDto)
  breakdown?: BreakdownDto;

  @ApiPropertyOptional({ description: 'Goals and targets for this metric' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TargetsDto)
  targets?: TargetsDto;

  @ApiPropertyOptional({ description: 'Currency code for monetary metrics' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    description: 'Description or notes about this metric',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Data quality indicators' })
  @IsOptional()
  @ValidateNested()
  @Type(() => QualityDto)
  quality?: QualityDto;

  @ApiPropertyOptional({ description: 'Alerts and thresholds configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AlertsDto)
  alerts?: AlertsDto;

  @ApiPropertyOptional({
    description: 'Whether this metric is currently active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this metric is publicly visible',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata', type: 'object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Timestamp when the data was collected' })
  @IsOptional()
  @IsDateString()
  collectedAt?: string;

  @ApiPropertyOptional({
    description: 'Source system or process that generated this data',
  })
  @IsOptional()
  @IsString()
  dataSource?: string;

  @ApiPropertyOptional({ description: 'Version of the data collection schema' })
  @IsOptional()
  @IsString()
  schemaVersion?: string;
}

export class UpdateAnalyticsDto {
  @ApiPropertyOptional({ description: 'Numeric value of the metric' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ description: 'Previous period value for comparison' })
  @IsOptional()
  @IsNumber()
  previousValue?: number;

  @ApiPropertyOptional({
    description: 'Percentage change from previous period',
  })
  @IsOptional()
  @IsNumber()
  changePercentage?: number;

  @ApiPropertyOptional({ description: 'Additional dimensions and breakdowns' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;

  @ApiPropertyOptional({ description: 'Detailed breakdown of the metric' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BreakdownDto)
  breakdown?: BreakdownDto;

  @ApiPropertyOptional({ description: 'Goals and targets for this metric' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TargetsDto)
  targets?: TargetsDto;

  @ApiPropertyOptional({
    description: 'Description or notes about this metric',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Data quality indicators' })
  @IsOptional()
  @ValidateNested()
  @Type(() => QualityDto)
  quality?: QualityDto;

  @ApiPropertyOptional({ description: 'Alerts and thresholds configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AlertsDto)
  alerts?: AlertsDto;

  @ApiPropertyOptional({
    description: 'Whether this metric is currently active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this metric is publicly visible',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata', type: 'object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Source system or process that generated this data',
  })
  @IsOptional()
  @IsString()
  dataSource?: string;

  @ApiPropertyOptional({ description: 'Version of the data collection schema' })
  @IsOptional()
  @IsString()
  schemaVersion?: string;
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by analytics type',
    enum: AnalyticsType,
  })
  @IsOptional()
  @IsEnum(AnalyticsType)
  type?: AnalyticsType;

  @ApiPropertyOptional({
    description: 'Filter by metric category',
    enum: MetricCategory,
  })
  @IsOptional()
  @IsEnum(MetricCategory)
  category?: MetricCategory;

  @ApiPropertyOptional({ description: 'Filter by metric name' })
  @IsOptional()
  @IsString()
  metricName?: string;

  @ApiPropertyOptional({ description: 'Filter by entity type' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter by entity ID' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Start date for filtering (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by time granularity',
    enum: TimeGranularity,
  })
  @IsOptional()
  @IsEnum(TimeGranularity)
  granularity?: TimeGranularity;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by public visibility' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', default: 'date' })
  @IsOptional()
  @IsString()
  @IsIn([
    'date',
    'value',
    'metricName',
    'type',
    'category',
    'createdAt',
    'updatedAt',
  ])
  sortBy?: string = 'date';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class AnalyticsStatsDto {
  @ApiProperty({ description: 'Total number of analytics records' })
  total: number;

  @ApiProperty({ description: 'Number of active metrics' })
  activeMetrics: number;

  @ApiProperty({ description: 'Number of public metrics' })
  publicMetrics: number;

  @ApiProperty({ description: 'Metrics by type', type: 'object' })
  byType: Record<AnalyticsType, number>;

  @ApiProperty({ description: 'Metrics by category', type: 'object' })
  byCategory: Record<MetricCategory, number>;

  @ApiProperty({ description: 'Metrics by granularity', type: 'object' })
  byGranularity: Record<TimeGranularity, number>;

  @ApiProperty({ description: 'Date range of available data' })
  dateRange: {
    earliest: Date;
    latest: Date;
  };

  @ApiProperty({ description: 'Top performing metrics', type: [Object] })
  topMetrics: Array<{
    metricName: string;
    type: AnalyticsType;
    category: MetricCategory;
    avgValue: number;
    totalRecords: number;
  }>;

  @ApiProperty({ description: 'Data quality summary' })
  qualitySummary: {
    avgConfidence: number;
    avgCompleteness: number;
    avgAccuracy: number;
    avgTimeliness: number;
  };
}

export class AnalyticsDto {
  @ApiProperty({ description: 'Analytics record ID' })
  id: string;

  @ApiProperty({ description: 'Type of analytics data', enum: AnalyticsType })
  type: AnalyticsType;

  @ApiProperty({ description: 'Category of the metric', enum: MetricCategory })
  category: MetricCategory;

  @ApiProperty({ description: 'Name of the metric being tracked' })
  metricName: string;

  @ApiPropertyOptional({ description: 'Type of entity this metric relates to' })
  entityType?: string;

  @ApiPropertyOptional({
    description: 'ID of the specific entity this metric relates to',
  })
  entityId?: string;

  @ApiProperty({ description: 'Date for which this metric is recorded' })
  date: Date;

  @ApiProperty({
    description: 'Time granularity of the metric',
    enum: TimeGranularity,
  })
  granularity: TimeGranularity;

  @ApiProperty({ description: 'Numeric value of the metric' })
  value: number;

  @ApiPropertyOptional({ description: 'Previous period value for comparison' })
  previousValue?: number;

  @ApiPropertyOptional({
    description: 'Percentage change from previous period',
  })
  changePercentage?: number;

  @ApiPropertyOptional({ description: 'Additional dimensions and breakdowns' })
  dimensions?: DimensionsDto;

  @ApiPropertyOptional({ description: 'Detailed breakdown of the metric' })
  breakdown?: BreakdownDto;

  @ApiPropertyOptional({ description: 'Goals and targets for this metric' })
  targets?: TargetsDto;

  @ApiPropertyOptional({ description: 'Currency code for monetary metrics' })
  currency?: string;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  unit?: string;

  @ApiPropertyOptional({
    description: 'Description or notes about this metric',
  })
  description?: string;

  @ApiPropertyOptional({ description: 'Data quality indicators' })
  quality?: QualityDto;

  @ApiPropertyOptional({ description: 'Alerts and thresholds configuration' })
  alerts?: AlertsDto;

  @ApiProperty({ description: 'Whether this metric is currently active' })
  isActive: boolean;

  @ApiProperty({ description: 'Whether this metric is publicly visible' })
  isPublic: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Timestamp when the record was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when the record was last updated' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Timestamp when the data was collected' })
  collectedAt?: Date;

  @ApiPropertyOptional({
    description: 'Source system or process that generated this data',
  })
  dataSource?: string;

  @ApiPropertyOptional({ description: 'Version of the data collection schema' })
  schemaVersion?: string;

  constructor(entity: AnalyticsEntity) {
    this.id = entity.id;
    this.type = entity.type;
    this.category = entity.category;
    this.metricName = entity.metricName;
    this.entityType = entity.entityType;
    this.entityId = entity.entityId;
    this.date = entity.date;
    this.granularity = entity.granularity;
    this.value = entity.value;
    this.previousValue = entity.previousValue;
    this.changePercentage = entity.changePercentage;
    this.dimensions = entity.dimensions;
    this.breakdown = entity.breakdown;
    this.targets = entity.targets;
    this.currency = entity.currency;
    this.unit = entity.unit;
    this.description = entity.description;
    this.quality = entity.quality;
    this.alerts = entity.alerts;
    this.isActive = entity.isActive;
    this.isPublic = entity.isPublic;
    this.metadata = entity.metadata;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
    this.collectedAt = entity.collectedAt;
    this.dataSource = entity.dataSource;
    this.schemaVersion = entity.schemaVersion;
  }
}

export class BulkCreateAnalyticsDto {
  @ApiProperty({
    description: 'Array of analytics records to create',
    type: [CreateAnalyticsDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnalyticsDto)
  records: CreateAnalyticsDto[];

  @ApiPropertyOptional({
    description:
      'Whether to skip validation errors and continue with valid records',
  })
  @IsOptional()
  @IsBoolean()
  skipErrors?: boolean;
}

export class MetricTrendDto {
  @ApiProperty({ description: 'Metric name' })
  metricName: string;

  @ApiProperty({ description: 'Time series data points', type: [Object] })
  dataPoints: Array<{
    date: Date;
    value: number;
    changePercentage?: number;
  }>;

  @ApiProperty({ description: 'Trend analysis' })
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    significance: 'high' | 'medium' | 'low';
  };

  @ApiProperty({ description: 'Statistical summary' })
  summary: {
    min: number;
    max: number;
    avg: number;
    median: number;
    stdDev: number;
  };
}

export class DashboardDto {
  @ApiProperty({ description: 'Key performance indicators', type: [Object] })
  kpis: Array<{
    name: string;
    value: number;
    unit: string;
    change: number;
    trend: 'up' | 'down' | 'stable';
  }>;

  @ApiProperty({ description: 'Metric trends', type: [MetricTrendDto] })
  trends: MetricTrendDto[];

  @ApiProperty({ description: 'Alerts and notifications', type: [Object] })
  alerts: Array<{
    metricName: string;
    type: 'critical' | 'warning';
    message: string;
    timestamp: Date;
  }>;

  @ApiProperty({ description: 'Performance summary' })
  summary: {
    totalMetrics: number;
    activeAlerts: number;
    dataQualityScore: number;
    lastUpdated: Date;
  };
}
