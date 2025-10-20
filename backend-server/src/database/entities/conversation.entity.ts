import { UserEntity } from '@/auth/entities/user.entity';
import { BaseModel } from '@/database/models/base.model';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';
import { BookingEntity } from './booking.entity';
import { PartnerEntity } from './partner.entity';

@Entity('conversations')
export class ConversationEntity extends BaseModel {
  @Index()
  @Column({ type: 'uuid', name: 'booking_id' })
  bookingId: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Index()
  @Column({ type: 'uuid', name: 'partner_id' })
  partnerId: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_activity' })
  lastActivity: Date;

  // Relations
  @ManyToOne(() => BookingEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: BookingEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => PartnerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: PartnerEntity;

  protected getEntityType(): EntityType {
    return EntityType.USER;
  }
}
