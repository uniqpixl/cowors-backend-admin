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
import { PartnerLocationEntity } from './partner-location.entity';

@Entity('neighborhoods')
@Index(['city_id'])
export class NeighborhoodEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  city_id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  display_name: string;

  @Column({ type: 'jsonb', default: '[]' })
  popular_tags: string[];

  @Column({ type: 'boolean', default: false })
  is_popular: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relationships
  @ManyToOne('CityEntity', 'neighborhoods', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'city_id' })
  city: any;

  @OneToMany(() => PartnerLocationEntity, (location) => location.neighborhood)
  partner_locations: PartnerLocationEntity[];
}
