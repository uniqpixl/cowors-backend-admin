import { BaseModel } from '@/database/models/base.model';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';
export enum AvailabilityType {
  AVAILABLE = 'available',
  BLOCKED = 'blocked',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

@Entity('space_availability')
export class SpaceAvailabilityEntity extends BaseModel {
  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  spaceId: string;

  @ManyToOne('SpaceEntity', 'availability', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'spaceId' })
  space: any;

  @Index()
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({
    type: 'enum',
    enum: () => AvailabilityType,
    default: AvailabilityType.AVAILABLE,
  })
  type: AvailabilityType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceOverride: number;

  @Column({ type: 'int', nullable: true })
  capacityOverride: number;

  @Column('text', { nullable: true })
  notes: string;

  @Column('jsonb', { nullable: true })
  metadata: {
    reason?: string;
    recurringRule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      interval: number;
      endDate?: string;
      daysOfWeek?: number[];
    };
  };

  // Composite index for efficient availability queries
  @Index(['spaceId', 'date', 'startTime', 'endTime'])
  static availabilityIndex: void;

  protected getEntityType(): EntityType {
    return EntityType.SPACE;
  }
}
