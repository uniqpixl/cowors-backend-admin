import {
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from '@/common/enums/notification.enum';
import {
  NotificationCategory,
  NotificationEntity,
} from '@/database/entities/notification.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  Length,
  Max,
  Min,
} from 'class-validator';
export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID to send notification to',
    example: 'uuid-string',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Notification category',
    enum: NotificationCategory,
  })
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @ApiPropertyOptional({
    description: 'Notification priority',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiProperty({
    description: 'Notification title',
    example: 'Booking Confirmed',
    maxLength: 200,
  })
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Your booking has been confirmed for tomorrow at 10 AM.',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Reference ID for related entity',
    example: 'booking-123',
  })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({
    description: 'Reference type for related entity',
    example: 'booking',
  })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({
    description: 'Additional notification data',
  })
  @IsOptional()
  @IsObject()
  data?: {
    actionUrl?: string;
    imageUrl?: string;
    buttonText?: string;
    templateId?: string;
    variables?: Record<string, any>;
  };

  @ApiPropertyOptional({
    description: 'Notification channels configuration',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  channels?: {
    email?: {
      to: string;
      subject: string;
      template?: string;
      attachments?: {
        filename: string;
        content: string;
        contentType?: string;
      }[];
    };
    sms?: {
      to: string;
      template?: string;
    };
    push?: {
      deviceTokens?: string[];
      sound?: string;
      badge?: number;
    };
    inApp?: {
      showBadge?: boolean;
      autoRead?: boolean;
    };
  };

  @ApiPropertyOptional({
    description: 'Schedule notification for later',
    example: '2024-01-01T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: 'Notification expiration time',
    example: '2024-01-07T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    source?: string;
    campaign?: string;
    tags?: string[];
  };
}

export class UpdateNotificationStatusDto {
  @ApiProperty({
    description: 'New notification status',
    enum: NotificationStatus,
  })
  @IsEnum(NotificationStatus)
  status: NotificationStatus;

  @ApiPropertyOptional({
    description: 'Failure reason if status is failed',
  })
  @IsOptional()
  @IsString()
  failureReason?: string;
}

export class NotificationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by notification type',
    enum: NotificationType,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    description: 'Filter by notification category',
    enum: NotificationCategory,
  })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiPropertyOptional({
    description: 'Filter by notification status',
    enum: NotificationStatus,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({
    description: 'Filter by priority',
    enum: NotificationPriority,
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Include read notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeRead?: boolean;
}

export class NotificationResponseDto {
  @ApiProperty({
    description: 'Internal ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Notification ID',
    example: 'notif_123456789',
  })
  notificationId: string;

  @ApiProperty({
    description: 'User ID',
    example: 'uuid-string',
  })
  userId: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Notification category',
    enum: NotificationCategory,
  })
  category: NotificationCategory;

  @ApiProperty({
    description: 'Notification priority',
    enum: NotificationPriority,
  })
  priority: NotificationPriority;

  @ApiProperty({
    description: 'Notification title',
    example: 'Booking Confirmed',
  })
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Your booking has been confirmed.',
  })
  message: string;

  @ApiProperty({
    description: 'Notification status',
    enum: NotificationStatus,
  })
  status: NotificationStatus;

  @ApiPropertyOptional({
    description: 'Reference ID',
    example: 'booking-123',
  })
  referenceId?: string;

  @ApiPropertyOptional({
    description: 'Reference type',
    example: 'booking',
  })
  referenceType?: string;

  @ApiPropertyOptional({
    description: 'Additional data',
  })
  data?: any;

  @ApiPropertyOptional({
    description: 'Notification channels',
  })
  channels?: any;

  @ApiPropertyOptional({
    description: 'Sent timestamp',
    example: '2024-01-01T10:00:00Z',
  })
  sentAt?: Date;

  @ApiPropertyOptional({
    description: 'Delivered timestamp',
    example: '2024-01-01T10:02:00Z',
  })
  deliveredAt?: Date;

  @ApiPropertyOptional({
    description: 'Read timestamp',
    example: '2024-01-01T10:05:00Z',
  })
  readAt?: Date;

  @ApiPropertyOptional({
    description: 'Scheduled timestamp',
    example: '2024-01-01T11:00:00Z',
  })
  scheduledAt?: Date;

  @ApiPropertyOptional({
    description: 'Expiration timestamp',
    example: '2024-01-01T23:59:59Z',
  })
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Failure reason if notification failed',
    example: 'Email delivery failed',
  })
  failureReason?: string;

  @ApiPropertyOptional({
    description: 'Number of retry attempts',
    example: 0,
  })
  retryCount?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of retries allowed',
    example: 3,
  })
  maxRetries?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata for the notification',
    example: { source: 'system', version: '1.0' },
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-01-01T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2024-01-01T10:00:00Z',
  })
  updatedAt: Date;
}

export class BulkNotificationDto {
  @ApiProperty({
    description: 'Array of user IDs',
    type: [String],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  userIds: string[];

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Notification category',
    enum: NotificationCategory,
  })
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @ApiProperty({
    description: 'Notification title',
    example: 'System Maintenance',
  })
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'System will be under maintenance from 2 AM to 4 AM.',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional data',
  })
  @IsOptional()
  @IsObject()
  data?: any;

  @ApiPropertyOptional({
    description: 'Schedule for later',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
