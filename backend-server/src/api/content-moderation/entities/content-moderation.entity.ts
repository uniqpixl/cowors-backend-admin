import { UserEntity } from '@/auth/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ContentType {
  REVIEW = 'review',
  MESSAGE = 'message',
  SPACE_DESCRIPTION = 'space_description',
  USER_PROFILE = 'user_profile',
  PARTNER_PROFILE = 'partner_profile',
}

export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

export enum ModerationAction {
  AUTO_APPROVED = 'auto_approved',
  AUTO_REJECTED = 'auto_rejected',
  MANUAL_REVIEW = 'manual_review',
  USER_REPORTED = 'user_reported',
}

@Entity('content_moderation')
@Index(['contentType', 'status'])
@Index(['createdAt'])
@Index(['moderatorId'])
export class ContentModerationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ContentType })
  contentType: ContentType;

  @Column({ type: 'uuid' })
  contentId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'authorId' })
  author: UserEntity;

  @Column({
    type: 'enum',
    enum: ModerationStatus,
    default: ModerationStatus.PENDING,
  })
  status: ModerationStatus;

  @Column({ type: 'enum', enum: ModerationAction })
  action: ModerationAction;

  @Column({ type: 'uuid', nullable: true })
  moderatorId?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'moderatorId' })
  moderator?: UserEntity;

  @Column({ type: 'text', nullable: true })
  moderationReason?: string;

  @Column({ type: 'json', nullable: true })
  flaggedKeywords?: string[];

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  toxicityScore?: number;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  moderatedAt?: Date;
}
