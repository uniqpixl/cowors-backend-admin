import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ExtrasCategory } from '../../common/enums/booking.enum';
import { EntityType } from '../../utils/id-generator.service';
import { BaseModel } from '../models/base.model';

export enum BookingItemType {
  EXTRAS = 'extras',
  SERVICE = 'service',
  EQUIPMENT = 'equipment',
  CATERING = 'catering',
}

@Entity('booking_item')
export class BookingItemEntity extends BaseModel {
  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  bookingId: string;

  @ManyToOne('BookingEntity', 'items', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookingId' })
  booking: any;

  @Column({
    type: 'enum',
    enum: () => BookingItemType,
    default: BookingItemType.EXTRAS,
  })
  type: BookingItemType;

  @Column({
    type: 'enum',
    enum: () => ExtrasCategory,
  })
  category: ExtrasCategory;

  @Column({ length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column('jsonb', { nullable: true })
  specifications: {
    duration?: number; // for time-based services
    capacity?: number; // for equipment with capacity
    requirements?: string[];
    notes?: string;
  };

  @Column('jsonb', { nullable: true })
  metadata: {
    providerId?: string;
    providerName?: string;
    externalId?: string;
    scheduledTime?: Date;
    deliveryInstructions?: string;
  };

  // Index for efficient queries
  @Index(['bookingId', 'type'])
  static bookingTypeIndex: void;

  protected getEntityType(): EntityType {
    return EntityType.BOOKING;
  }
}
