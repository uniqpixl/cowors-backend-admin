import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsIP,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AuditAction, AuditSeverity } from '../entities/audit-log.entity';

export class CreateAuditLogDto {
  @ApiPropertyOptional({ description: 'User ID who performed the action' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ enum: AuditAction, description: 'Action performed' })
  @IsEnum(AuditAction)
  action: AuditAction;

  @ApiPropertyOptional({ description: 'Type of resource affected' })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({ description: 'ID of the resource affected' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Description of the action' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Previous values before the action' })
  @IsOptional()
  @IsObject()
  oldValues?: Record<string, any>;

  @ApiPropertyOptional({ description: 'New values after the action' })
  @IsOptional()
  @IsObject()
  newValues?: Record<string, any>;

  @ApiPropertyOptional({ description: 'IP address of the user' })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent string' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({
    enum: AuditSeverity,
    description: 'Severity level of the action',
    default: AuditSeverity.LOW,
  })
  @IsOptional()
  @IsEnum(AuditSeverity)
  severity?: AuditSeverity;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Request ID for tracing' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional({ description: 'API endpoint accessed' })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({ description: 'HTTP method used' })
  @IsOptional()
  @IsString()
  httpMethod?: string;

  @ApiPropertyOptional({ description: 'HTTP response status code' })
  @IsOptional()
  @IsNumber()
  responseStatus?: number;

  @ApiPropertyOptional({ description: 'Execution time in milliseconds' })
  @IsOptional()
  @IsNumber()
  executionTime?: number;

  @ApiPropertyOptional({
    description: 'Whether the action was successful',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isSuccessful?: boolean;

  @ApiPropertyOptional({ description: 'Error message if action failed' })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}
