import { UserEntity } from '@/auth/entities/user.entity';
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
import { CommissionPayoutStatus } from '../dto/commission-tracking.dto';

@Entity('commission_payouts')
@Index(['partnerId', 'status'])
@Index(['status', 'scheduledDate'])
@Index(['createdAt'])
export class CommissionPayoutEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partnerId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'simple-array' })
  commissionIds: string[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledDate: Date;

  @Column({
    type: 'enum',
    enum: CommissionPayoutStatus,
    default: CommissionPayoutStatus.PENDING,
  })
  status: CommissionPayoutStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentReference: string;

  @Column({ type: 'timestamp', nullable: true })
  processedDate: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ type: 'uuid', nullable: true })
  processedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'partnerId' })
  partner: UserEntity;

  @OneToMany('PartnerCommissionEntity', (commission: any) => commission.payout)
  commissions: any[];

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'processedBy' })
  processor: UserEntity;

  // Helper methods
  canBeProcessed(): boolean {
    return this.status === CommissionPayoutStatus.PENDING;
  }

  canBeCompleted(): boolean {
    return this.status === CommissionPayoutStatus.PROCESSING;
  }

  process(userId: string, paymentReference?: string): void {
    if (!this.canBeProcessed()) {
      throw new Error('Payout cannot be processed in current status');
    }
    this.status = CommissionPayoutStatus.PROCESSING;
    this.processedBy = userId;
    this.processedDate = new Date();
    if (paymentReference) {
      this.paymentReference = paymentReference;
    }
    this.updatedBy = userId;
  }

  complete(userId: string, paymentReference?: string): void {
    if (!this.canBeCompleted()) {
      throw new Error('Payout cannot be completed in current status');
    }
    this.status = CommissionPayoutStatus.COMPLETED;
    if (paymentReference) {
      this.paymentReference = paymentReference;
    }
    this.updatedBy = userId;
  }

  fail(userId: string, reason?: string): void {
    if (this.status === CommissionPayoutStatus.COMPLETED) {
      throw new Error('Cannot fail a completed payout');
    }
    this.status = CommissionPayoutStatus.FAILED;
    if (reason) {
      this.description = (this.description || '') + ` Failed: ${reason}`;
    }
    this.updatedBy = userId;
  }

  cancel(userId: string, reason?: string): void {
    if (
      [
        CommissionPayoutStatus.COMPLETED,
        CommissionPayoutStatus.FAILED,
      ].includes(this.status)
    ) {
      throw new Error('Cannot cancel a completed or failed payout');
    }
    this.status = CommissionPayoutStatus.CANCELLED;
    if (reason) {
      this.description = (this.description || '') + ` Cancelled: ${reason}`;
    }
    this.updatedBy = userId;
  }
}
