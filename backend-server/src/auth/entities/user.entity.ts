import { Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';
import { Role, UserStatus } from '../../api/user/user.enum';
import { BaseModel } from '../../database/models/base.model';
import { EntityType } from '../../utils/id-generator.service';

// https://www.better-auth.com/docs/concepts/database#core-schema
@Entity('user')
export class UserEntity extends BaseModel {
  @Index({ unique: true, where: '"deletedAt" IS NULL' })
  @Column()
  username: string;

  @Index({ where: '"deletedAt" IS NULL' })
  @Column({ nullable: true })
  displayUsername: string;

  @Index({ unique: true, where: '"deletedAt" IS NULL' })
  @Column()
  email: string;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User,
  })
  role: Role;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ nullable: true })
  adminNotes?: string;

  @Column({ nullable: true })
  bannedAt?: Date;

  @Column({ nullable: true })
  banExpiresAt?: Date;

  @Column({ nullable: true })
  suspendedAt?: Date;

  @Column({ nullable: true })
  suspensionExpiresAt?: Date;

  // KYC-related fields
  @Column({ type: 'boolean', default: false })
  kycVerified: boolean;

  @Column({ nullable: true })
  kycProvider?: string;

  @Column({ type: 'timestamp', nullable: true })
  kycVerifiedAt?: Date;

  @Column({ nullable: true })
  kycVerificationId?: string;

  // Relations
  @OneToOne('PartnerEntity', 'user')
  partner?: any;

  @OneToMany('BookingEntity', 'user')
  bookings?: any[];

  @OneToMany('PaymentEntity', 'user')
  payments?: any[];

  @OneToMany('WalletTransactionEntity', 'user')
  walletTransactions?: any[];

  protected getEntityType(): EntityType {
    return EntityType.USER;
  }
}
