import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PayoutSchedule {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

@Entity('partner_commission_settings')
export class PartnerCommissionSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'partner_id' })
  partnerId: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'commission_rate',
  })
  commissionRate?: number;

  @Column({ type: 'jsonb', nullable: true, name: 'custom_rates' })
  customRates?: Record<string, any>;

  @Column({
    type: 'enum',
    enum: PayoutSchedule,
    nullable: true,
    name: 'payout_schedule',
  })
  payoutSchedule?: PayoutSchedule;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'minimum_payout',
  })
  minimumPayout?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
