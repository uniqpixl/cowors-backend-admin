import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  DisputeEntity,
  DisputePriority,
  DisputeResolution,
  DisputeStatus,
  DisputeType,
} from '../entities/dispute.entity';

export class EvidenceDto {
  @ApiPropertyOptional({ type: [String], description: 'File URLs or paths' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Screenshot URLs or paths',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  screenshots?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Communication records' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  communications?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Witness information' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  witnesses?: string[];
}

export class TimelineEventDto {
  @ApiProperty({ description: 'Event description' })
  @IsString()
  event: string;

  @ApiProperty({ description: 'Event timestamp' })
  @IsDateString()
  timestamp: Date;

  @ApiProperty({ description: 'Actor who performed the event' })
  @IsString()
  actor: string;

  @ApiPropertyOptional({ description: 'Additional event details' })
  @IsOptional()
  @IsString()
  details?: string;
}

export class CreateDisputeDto {
  @ApiProperty({ enum: DisputeType, description: 'Type of dispute' })
  @IsEnum(DisputeType)
  type: DisputeType;

  @ApiProperty({ description: 'Dispute title', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Detailed description of the dispute' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'ID of the user filing the dispute' })
  @IsUUID()
  complainantId: string;

  @ApiProperty({ description: 'ID of the user being disputed against' })
  @IsUUID()
  respondentId: string;

  @ApiPropertyOptional({ description: 'Related booking ID' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({
    enum: DisputePriority,
    description: 'Dispute priority',
  })
  @IsOptional()
  @IsEnum(DisputePriority)
  priority?: DisputePriority;

  @ApiPropertyOptional({
    type: EvidenceDto,
    description: 'Supporting evidence',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EvidenceDto)
  evidence?: EvidenceDto;

  @ApiPropertyOptional({ description: 'Disputed amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  disputedAmount?: number;

  @ApiPropertyOptional({ description: 'Due date for resolution' })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateDisputeDto extends PartialType(CreateDisputeDto) {
  @ApiPropertyOptional({ enum: DisputeStatus, description: 'Dispute status' })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @ApiPropertyOptional({ description: 'Assign dispute to admin/moderator' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Resolved amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  resolvedAmount?: number;

  @ApiPropertyOptional({
    enum: DisputeResolution,
    description: 'Resolution type',
  })
  @IsOptional()
  @IsEnum(DisputeResolution)
  resolution?: DisputeResolution;

  @ApiPropertyOptional({ description: 'Resolution notes' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiPropertyOptional({ description: 'Mark as escalated' })
  @IsOptional()
  @IsBoolean()
  isEscalated?: boolean;

  @ApiPropertyOptional({ description: 'Requires legal action' })
  @IsOptional()
  @IsBoolean()
  requiresLegalAction?: boolean;

  @ApiPropertyOptional({ description: 'Internal notes for admins' })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({
    type: [TimelineEventDto],
    description: 'Timeline events',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineEventDto)
  timeline?: TimelineEventDto[];
}

export class DisputeQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({
    enum: DisputeType,
    description: 'Filter by dispute type',
  })
  @IsOptional()
  @IsEnum(DisputeType)
  type?: DisputeType;

  @ApiPropertyOptional({ enum: DisputeStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @ApiPropertyOptional({
    enum: DisputePriority,
    description: 'Filter by priority',
  })
  @IsOptional()
  @IsEnum(DisputePriority)
  priority?: DisputePriority;

  @ApiPropertyOptional({ description: 'Filter by complainant ID' })
  @IsOptional()
  @IsUUID()
  complainantId?: string;

  @ApiPropertyOptional({ description: 'Filter by respondent ID' })
  @IsOptional()
  @IsUUID()
  respondentId?: string;

  @ApiPropertyOptional({ description: 'Filter by booking ID' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Filter by assigned admin/moderator' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Filter escalated disputes' })
  @IsOptional()
  @IsBoolean()
  isEscalated?: boolean;

  @ApiPropertyOptional({ description: 'Search in title and description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by creation date (from)' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by creation date (to)' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;
}

export class EscalateDisputeDto {
  @ApiProperty({ description: 'Reason for escalation' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Assign to specific admin' })
  @IsOptional()
  @IsUUID()
  assignTo?: string;

  @ApiPropertyOptional({
    enum: DisputePriority,
    description: 'New priority level',
  })
  @IsOptional()
  @IsEnum(DisputePriority)
  newPriority?: DisputePriority;
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: DisputeResolution, description: 'Resolution type' })
  @IsEnum(DisputeResolution)
  resolution: DisputeResolution;

  @ApiProperty({ description: 'Resolution notes' })
  @IsString()
  resolutionNotes: string;

  @ApiPropertyOptional({ description: 'Resolved amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  resolvedAmount?: number;
}

export class DisputeStatsDto {
  @ApiProperty({ description: 'Total number of disputes' })
  total: number;

  @ApiProperty({ description: 'Pending disputes' })
  pending: number;

  @ApiProperty({ description: 'Under review disputes' })
  underReview: number;

  @ApiProperty({ description: 'Escalated disputes' })
  escalated: number;

  @ApiProperty({ description: 'Resolved disputes' })
  resolved: number;

  @ApiProperty({ description: 'Average resolution time in hours' })
  avgResolutionTime: number;

  @ApiProperty({ description: 'Disputes by type' })
  byType: Record<DisputeType, number>;

  @ApiProperty({ description: 'Disputes by priority' })
  byPriority: Record<DisputePriority, number>;
}

export class DisputeDto {
  @ApiProperty({ description: 'Dispute ID' })
  id: string;

  @ApiProperty({ enum: DisputeType, description: 'Dispute type' })
  type: DisputeType;

  @ApiProperty({ enum: DisputeStatus, description: 'Dispute status' })
  status: DisputeStatus;

  @ApiProperty({ enum: DisputePriority, description: 'Dispute priority' })
  priority: DisputePriority;

  @ApiProperty({ description: 'Dispute title' })
  title: string;

  @ApiProperty({ description: 'Dispute description' })
  description: string;

  @ApiProperty({ description: 'Complainant ID' })
  complainantId: string;

  @ApiProperty({ description: 'Respondent ID' })
  respondentId: string;

  @ApiPropertyOptional({ description: 'Booking ID' })
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Assigned to' })
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Resolved by' })
  resolvedBy?: string;

  @ApiPropertyOptional({ description: 'Evidence' })
  evidence?: EvidenceDto;

  @ApiPropertyOptional({ description: 'Timeline events' })
  timeline?: TimelineEventDto[];

  @ApiPropertyOptional({ description: 'Disputed amount' })
  disputedAmount?: number;

  @ApiPropertyOptional({ description: 'Resolved amount' })
  resolvedAmount?: number;

  @ApiPropertyOptional({
    enum: DisputeResolution,
    description: 'Resolution type',
  })
  resolution?: DisputeResolution;

  @ApiPropertyOptional({ description: 'Resolution notes' })
  resolutionNotes?: string;

  @ApiPropertyOptional({ description: 'Resolved at' })
  resolvedAt?: Date;

  @ApiPropertyOptional({ description: 'Escalated at' })
  escalatedAt?: Date;

  @ApiPropertyOptional({ description: 'Due date' })
  dueDate?: Date;

  @ApiProperty({ description: 'Is escalated' })
  isEscalated: boolean;

  @ApiProperty({ description: 'Requires legal action' })
  requiresLegalAction: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  constructor(dispute: DisputeEntity) {
    this.id = dispute.id;
    this.type = dispute.type;
    this.status = dispute.status;
    this.priority = dispute.priority;
    this.title = dispute.title;
    this.description = dispute.description;
    this.complainantId = dispute.complainantId;
    this.respondentId = dispute.respondentId;
    this.bookingId = dispute.bookingId;
    this.assignedTo = dispute.assignedTo;
    this.resolvedBy = dispute.resolvedBy;
    this.evidence = dispute.evidence;
    this.timeline = dispute.timeline;
    this.disputedAmount = dispute.disputedAmount
      ? Number(dispute.disputedAmount)
      : undefined;
    this.resolvedAmount = dispute.resolvedAmount
      ? Number(dispute.resolvedAmount)
      : undefined;
    this.resolution = dispute.resolution;
    this.resolutionNotes = dispute.resolutionNotes;
    this.resolvedAt = dispute.resolvedAt;
    this.escalatedAt = dispute.escalatedAt;
    this.dueDate = dispute.dueDate;
    this.isEscalated = dispute.isEscalated;
    this.requiresLegalAction = dispute.requiresLegalAction;
    this.createdAt = dispute.createdAt;
    this.updatedAt = dispute.updatedAt;
  }
}
