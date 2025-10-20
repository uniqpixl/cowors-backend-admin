import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ListingType {
  CAFE = 'cafe',
  COWORKING_SPACE = 'coworking_space',
  OFFICE_SPACE = 'office_space',
  RESTOBAR = 'restobar',
  EVENT_SPACE = 'event_space',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

@Entity('partner_listings')
@Index(['partner_id'])
@Index(['location_id'])
@Index(['listing_type'])
@Index(['approval_status'])
@Index(['is_active'])
export class PartnerListingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  partner_id: string;

  @Column({ type: 'uuid', nullable: false })
  location_id: string;

  @Column({
    type: 'enum',
    enum: ListingType,
    nullable: false,
  })
  listing_type: ListingType;

  @Column({ type: 'varchar', length: 200, nullable: false })
  listing_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  approval_status: ApprovalStatus;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  listing_metadata: Record<string, any>;

  @Column({ type: 'varchar', array: true, default: '{}' })
  images: string[];

  @Column({ type: 'varchar', array: true, default: '{}' })
  amenities: string[];

  @Column({ type: 'jsonb', nullable: true })
  operating_hours: Record<string, any>;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'integer', default: 0 })
  review_count: number;

  @Column({ type: 'integer', default: 0 })
  total_bookings: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relationships
  @ManyToOne('PartnerEntity', 'listings', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partner_id' })
  partner: any;

  @ManyToOne('PartnerLocationEntity', 'listings', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'location_id' })
  location: any;

  @OneToMany('SpaceEntity', 'listing')
  spaces: any[];

  @OneToMany('PartnerAddonEntity', 'listing')
  addons: any[];

  // Helper methods
  getListingTypeDisplay(): string {
    const displayNames = {
      [ListingType.CAFE]: 'Cafe',
      [ListingType.COWORKING_SPACE]: 'Coworking Space',
      [ListingType.OFFICE_SPACE]: 'Office Space',
      [ListingType.RESTOBAR]: 'Restaurant & Bar',
      [ListingType.EVENT_SPACE]: 'Event Space',
    };
    return displayNames[this.listing_type] || this.listing_type;
  }

  isApproved(): boolean {
    return this.approval_status === ApprovalStatus.APPROVED;
  }

  canAcceptBookings(): boolean {
    return this.is_active && this.isApproved();
  }
}
