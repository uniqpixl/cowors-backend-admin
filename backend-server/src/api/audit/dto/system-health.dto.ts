import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { AuditAction, AuditSeverity } from '../entities/audit-log.entity';
import { HealthStatus, ServiceType } from '../entities/system-health.entity';

export class CreateSystemHealthDto {
  @ApiProperty({ description: 'Name of the service being monitored' })
  @IsString()
  serviceName: string;

  @ApiProperty({ enum: ServiceType, description: 'Type of service' })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({ enum: HealthStatus, description: 'Current health status' })
  @IsEnum(HealthStatus)
  status: HealthStatus;

  @ApiPropertyOptional({ description: 'Response time in milliseconds' })
  @IsOptional()
  @IsNumber()
  responseTime?: number;

  @ApiPropertyOptional({ description: 'CPU usage percentage' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  cpuUsage?: number;

  @ApiPropertyOptional({ description: 'Memory usage percentage' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  memoryUsage?: number;

  @ApiPropertyOptional({ description: 'Disk usage percentage' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  diskUsage?: number;

  @ApiPropertyOptional({ description: 'Number of active connections' })
  @IsOptional()
  @IsNumber()
  activeConnections?: number;

  @ApiPropertyOptional({ description: 'Error rate percentage' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  errorRate?: number;

  @ApiPropertyOptional({ description: 'Throughput (requests per minute)' })
  @IsOptional()
  @IsNumber()
  throughput?: number;

  @ApiPropertyOptional({ description: 'Health check message' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Additional metrics data' })
  @IsOptional()
  @IsObject()
  metrics?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Duration of health check in milliseconds',
  })
  @IsOptional()
  @IsNumber()
  checkDuration?: number;

  @ApiPropertyOptional({
    description: 'Whether alert has been sent',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAlertSent?: boolean;
}

export class QueryAuditLogsDto {
  @ApiPropertyOptional({ description: 'User ID to filter by' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    enum: AuditAction,
    description: 'Action to filter by',
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: string;

  @ApiPropertyOptional({ description: 'Resource type to filter by' })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({ description: 'Resource ID to filter by' })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({
    enum: AuditSeverity,
    description: 'Severity to filter by',
  })
  @IsOptional()
  @IsEnum(AuditSeverity)
  severity?: string;

  @ApiPropertyOptional({ description: 'Start date for filtering (ISO string)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (ISO string)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'IP address to filter by' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', default: 'DESC' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class QuerySystemHealthDto {
  @ApiPropertyOptional({ description: 'Service name to filter by' })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({
    enum: ServiceType,
    description: 'Service type to filter by',
  })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @ApiPropertyOptional({
    enum: HealthStatus,
    description: 'Health status to filter by',
  })
  @IsOptional()
  @IsEnum(HealthStatus)
  status?: HealthStatus;

  @ApiPropertyOptional({ description: 'Start date for filtering (ISO string)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (ISO string)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number = 20;
}
