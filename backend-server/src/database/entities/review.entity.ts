import { ReviewType } from '@/common/enums/review.enum';
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
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('reviews')
@Index(['spaceId', 'rating'])
@Index(['partnerId', 'rating'])
@Index(['userId', 'createdAt'])
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: () => ReviewType })
  type: ReviewType;

  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: false })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @Column({ type: 'text', nullable: true })
  response: string;

  @Column({ type: 'timestamp', nullable: true })
  responseDate: Date;

  @Column({ type: 'boolean', default: false })
  isFlagged: boolean;

  @Column({ type: 'text', nullable: true })
  flagReason: string;

  @Column({ type: 'uuid', nullable: true })
  flaggedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  flaggedAt: Date;

  @Column({ type: 'int', default: 0 })
  helpfulCount: number;

  // Relations
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  spaceId: string;

  @ManyToOne('SpaceEntity', 'reviews', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'spaceId' })
  space: any;

  @Column({ type: 'uuid', nullable: true })
  partnerId: string;

  @ManyToOne('PartnerEntity', 'reviews', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: any;

  @Column({ type: 'uuid', nullable: true })
  bookingId: string;

  @ManyToOne('BookingEntity', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bookingId' })
  booking: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
