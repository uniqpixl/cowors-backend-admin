import { UserEntity } from '@/auth/entities/user.entity';
import {
  AfterLoad,
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
import { BankAccountStatus } from '../dto/partner-payout.dto';
// Removed circular import - using string reference instead
@Entity('bank_accounts')
@Index(['partnerId', 'isPrimary'])
@Index(['status'])
@Index(['ifscCode'])
export class BankAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'partner_id', type: 'uuid' })
  @Index()
  partnerId: string;

  @Column({ name: 'account_holder_name', type: 'varchar', length: 100 })
  accountHolderName: string;

  @Column({ name: 'account_number', type: 'varchar', length: 20 })
  accountNumber: string;

  @Column({ name: 'account_number_encrypted', type: 'text' })
  accountNumberEncrypted: string;

  @Column({ name: 'ifsc_code', type: 'varchar', length: 11 })
  ifscCode: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 100 })
  bankName: string;

  @Column({ name: 'branch_name', type: 'varchar', length: 100 })
  branchName: string;

  @Column({
    name: 'account_type',
    type: 'varchar',
    length: 20,
    default: 'savings',
  })
  accountType: string;

  @Column({
    type: 'enum',
    enum: BankAccountStatus,
    default: BankAccountStatus.PENDING,
  })
  status: BankAccountStatus;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({
    name: 'verification_code',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  verificationCode: string;

  @Column({ name: 'verification_attempts', type: 'int', default: 0 })
  verificationAttempts: number;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'partner_id' })
  partner: UserEntity;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'verified_by' })
  verifier: UserEntity;

  @OneToMany('PayoutRequestEntity', (payout: any) => payout.bankAccount)
  payoutRequests: any[];

  // Hooks
  @AfterLoad()
  maskAccountNumber() {
    if (this.accountNumber && this.accountNumber.length > 4) {
      const lastFour = this.accountNumber.slice(-4);
      this.accountNumber = `****${lastFour}`;
    }
  }

  // Helper methods
  isVerified(): boolean {
    return this.status === BankAccountStatus.VERIFIED;
  }

  canBeVerified(): boolean {
    return this.status === BankAccountStatus.PENDING;
  }

  canBeRejected(): boolean {
    return [BankAccountStatus.PENDING, BankAccountStatus.VERIFIED].includes(
      this.status,
    );
  }

  getFormattedAccountNumber(): string {
    if (this.accountNumber && this.accountNumber.length > 4) {
      const lastFour = this.accountNumber.slice(-4);
      return `****${lastFour}`;
    }
    return this.accountNumber || '';
  }

  getStatusColor(): string {
    const colors = {
      [BankAccountStatus.PENDING]: '#FFA500',
      [BankAccountStatus.VERIFIED]: '#4CAF50',
      [BankAccountStatus.REJECTED]: '#F44336',
      [BankAccountStatus.SUSPENDED]: '#9E9E9E',
    };
    return colors[this.status] || '#9E9E9E';
  }
}
