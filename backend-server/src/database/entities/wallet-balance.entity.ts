import { UserEntity } from '@/auth/entities/user.entity';
import { BalanceType } from '@/common/enums/wallet.enum';
import { BaseModel } from '@/database/models/base.model';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';
@Entity('wallet_balance')
@Unique(['userId', 'balanceType'])
export class WalletBalanceEntity extends BaseModel {
  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({
    type: 'enum',
    enum: () => BalanceType,
  })
  balanceType: BalanceType;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  lockedBalance: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column({ type: 'timestamp', nullable: true })
  lastTransactionAt: Date;

  @Column('jsonb', { nullable: true })
  limits: {
    dailySpendLimit?: number;
    monthlySpendLimit?: number;
    maxBalance?: number;
    minBalance?: number;
  };

  @Column('jsonb', { nullable: true })
  metadata: {
    source?: string;
    expiryDate?: Date; // for promotional balances
    restrictions?: {
      usageType?: string[];
      partnerIds?: string[];
      minimumOrderValue?: number;
    };
    earnedFrom?: {
      referrals?: number;
      cashback?: number;
      promotions?: number;
      refunds?: number;
    };
  };

  @OneToMany('WalletTransactionEntity', 'walletBalance')
  transactions: any[];

  // Composite index for efficient balance queries
  @Index(['userId', 'balanceType'])
  static userBalanceTypeIndex: void;

  protected getEntityType(): EntityType {
    return EntityType.USER;
  }
}
