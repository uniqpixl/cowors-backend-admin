import { UserEntity } from '@/auth/entities/user.entity';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from '@/common/enums/notification.enum';
import { BaseModel } from '@/database/models/base.model';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';

export enum NotificationCategory {
  BOOKING = 'booking',
  PAYMENT = 'payment',
  WALLET = 'wallet',
  PARTNER = 'partner',
  SYSTEM = 'system',
  MARKETING = 'marketing',
  VERIFICATION = 'verification',
}

@Entity('notification')
export class NotificationEntity extends BaseModel {
  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ length: 100, unique: true })
  notificationId: string;

  @Column({
    type: 'enum',
    enum: () => NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: () => NotificationCategory,
  })
  category: NotificationCategory;

  @Column({
    type: 'enum',
    enum: () => NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({ length: 200 })
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: () => NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column({ length: 100, nullable: true })
  referenceId: string;

  @Column({ length: 50, nullable: true })
  referenceType: string;

  @Column('jsonb', { nullable: true })
  data: {
    actionUrl?: string;
    imageUrl?: string;
    buttonText?: string;
    templateId?: string;
    variables?: Record<string, any>;
  };

  @Column('jsonb', { nullable: true })
  channels: {
    email?: {
      to: string;
      subject: string;
      template?: string;
      attachments?: any[];
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

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column('text', { nullable: true })
  failureReason: string;

  @Column({ type: 'integer', default: 0 })
  retryCount: number;

  @Column({ type: 'integer', default: 3 })
  maxRetries: number;

  @Column('jsonb', { nullable: true })
  metadata: {
    source?: string;
    campaign?: string;
    tags?: string[];
    analytics?: {
      opened?: boolean;
      clicked?: boolean;
      openedAt?: Date;
      clickedAt?: Date;
    };
  };

  // Indexes for efficient queries
  @Index(['userId', 'status'])
  static userStatusIndex: void;

  @Index(['type', 'status'])
  static typeStatusIndex: void;

  @Index(['category', 'createdAt'])
  static categoryTimeIndex: void;

  @Index(['scheduledAt'])
  static scheduledIndex: void;

  @Index(['referenceType', 'referenceId'])
  static referenceIndex: void;

  protected getEntityType(): EntityType {
    return EntityType.USER;
  }
}
