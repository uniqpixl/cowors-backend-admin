import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NeighborhoodEntity } from './neighborhood.entity';
import { PartnerLocationEntity } from './partner-location.entity';

export enum LaunchStatus {
  PLANNING = 'planning',
  LAUNCHING = 'launching',
  ACTIVE = 'active',
  PAUSED = 'paused',
}

export enum TierClassification {
  TIER_1 = 'tier_1',
  TIER_2 = 'tier_2',
  TIER_3 = 'tier_3',
}

@Entity('cities')
@Index(['launch_status'])
@Index(['tier_classification'])
@Index(['name', 'state'], { unique: true })
export class CityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  state: string;

  @Column({
    type: 'enum',
    enum: LaunchStatus,
    default: LaunchStatus.PLANNING,
  })
  launch_status: LaunchStatus;

  @Column({
    type: 'enum',
    enum: TierClassification,
    default: TierClassification.TIER_3,
  })
  tier_classification: TierClassification;

  @Column({ type: 'varchar', length: 2, nullable: false })
  gst_state_code: string;

  @Column({ type: 'integer', default: 0 })
  expansion_priority: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relationships
  @OneToMany(() => NeighborhoodEntity, (neighborhood) => neighborhood.city)
  neighborhoods: NeighborhoodEntity[];

  @OneToMany(() => PartnerLocationEntity, (location) => location.city)
  partner_locations: PartnerLocationEntity[];
}
