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
import { CityEntity } from './city.entity';
import { NeighborhoodEntity } from './neighborhood.entity';
import { PartnerListingEntity } from './partner-listing.entity';

export enum PrivacyLevel {
  PUBLIC = 'public',
  NEIGHBORHOOD = 'neighborhood',
  CITY = 'city',
}

@Entity('partner_locations')
@Index(['partner_id'])
@Index(['city_id'])
@Index(['neighborhood_id'])
@Index(['privacy_level'])
@Index(['is_active'])
export class PartnerLocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  partner_id: string;

  @Column({ type: 'uuid', nullable: false })
  city_id: string;

  @Column({ type: 'uuid', nullable: false })
  neighborhood_id: string;

  @Column({ type: 'text', nullable: false })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: false })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: false })
  longitude: number;

  @Column({
    type: 'enum',
    enum: PrivacyLevel,
    default: PrivacyLevel.NEIGHBORHOOD,
  })
  privacy_level: PrivacyLevel;

  @Column({ type: 'jsonb', nullable: true })
  operating_hours: Record<string, any>;

  @Column({ type: 'varchar', array: true, default: '{}' })
  amenities: string[];

  @Column({ type: 'varchar', array: true, default: '{}' })
  images: string[];

  @Column({ type: 'jsonb', nullable: true })
  contact_info: {
    phone?: string;
    email?: string;
    website?: string;
  };

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  location_metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relationships
  @ManyToOne('PartnerEntity', 'locations', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partner_id' })
  partner: any;

  @ManyToOne(() => CityEntity, (city) => city.partner_locations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'city_id' })
  city: CityEntity;

  @ManyToOne(
    () => NeighborhoodEntity,
    (neighborhood) => neighborhood.partner_locations,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'neighborhood_id' })
  neighborhood: NeighborhoodEntity;

  @OneToMany(() => PartnerListingEntity, (listing) => listing.location)
  listings: PartnerListingEntity[];

  // Helper methods
  getFullAddress(): string {
    return `${this.address}, ${this.neighborhood?.name}, ${this.city?.name}, ${this.city?.state}`;
  }

  getCoordinates(): [number, number] {
    return [this.longitude, this.latitude];
  }

  isPubliclyVisible(): boolean {
    return this.privacy_level === PrivacyLevel.PUBLIC && this.is_active;
  }

  getPrivacyDisplayAddress(): string {
    switch (this.privacy_level) {
      case PrivacyLevel.PUBLIC:
        return this.getFullAddress();
      case PrivacyLevel.NEIGHBORHOOD:
        return `${this.neighborhood?.name}, ${this.city?.name}`;
      case PrivacyLevel.CITY:
        return `${this.city?.name}, ${this.city?.state}`;
      default:
        return `${this.city?.name}, ${this.city?.state}`;
    }
  }
}
