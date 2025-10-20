import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  TransactionStatus,
  TransactionType,
  WalletStatus,
} from '../../../common/enums/wallet.enum';

export enum WalletTransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  COMMISSION = 'commission',
  PAYOUT = 'payout',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
  FEE = 'fee',
}

export const WalletTransactionStatus = TransactionStatus;

export class CreateWalletDto {
  @ApiProperty({ description: 'Partner ID' })
  @IsUUID()
  partnerId: string;

  @ApiPropertyOptional({ description: 'Initial balance', default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  initialBalance?: number = 0;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string = 'INR';

  @ApiPropertyOptional({ description: 'Minimum balance threshold' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minBalanceThreshold?: number;

  @ApiPropertyOptional({ description: 'Maximum balance limit' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxBalanceLimit?: number;

  @ApiPropertyOptional({ description: 'Auto payout enabled', default: false })
  @IsOptional()
  @IsBoolean()
  autoPayoutEnabled?: boolean = false;

  @ApiPropertyOptional({ description: 'Auto payout threshold' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  autoPayoutThreshold?: number;
}

export class UpdateWalletDto {
  @ApiPropertyOptional({ enum: WalletStatus })
  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;

  @ApiPropertyOptional({ description: 'Minimum balance threshold' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minBalanceThreshold?: number;

  @ApiPropertyOptional({ description: 'Maximum balance limit' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxBalanceLimit?: number;

  @ApiPropertyOptional({ description: 'Auto payout enabled' })
  @IsOptional()
  @IsBoolean()
  autoPayoutEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Auto payout threshold' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  autoPayoutThreshold?: number;

  @ApiPropertyOptional({ description: 'Notes for update' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class WalletTransactionDto {
  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: WalletTransactionType })
  @IsEnum(WalletTransactionType)
  type: WalletTransactionType;

  @ApiPropertyOptional({ description: 'Transaction description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Reference ID (booking, payment, etc.)' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Reference type' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class GetWalletTransactionsDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: WalletTransactionType })
  @IsOptional()
  @IsEnum(WalletTransactionType)
  type?: WalletTransactionType;

  @ApiPropertyOptional({ enum: WalletTransactionStatus })
  @IsOptional()
  @IsEnum(WalletTransactionStatus)
  status?: keyof typeof WalletTransactionStatus;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort by field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class WalletResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  partnerId: string;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  availableBalance: number;

  @ApiProperty()
  pendingBalance: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: WalletStatus })
  status: WalletStatus;

  @ApiPropertyOptional()
  minBalanceThreshold?: number;

  @ApiPropertyOptional()
  maxBalanceLimit?: number;

  @ApiProperty()
  autoPayoutEnabled: boolean;

  @ApiPropertyOptional()
  autoPayoutThreshold?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  lastTransactionAt?: Date;

  @ApiPropertyOptional()
  partner?: {
    id: string;
    businessName: string;
    email: string;
  };
}

export class WalletStatsDto {
  @ApiProperty()
  totalCredits: number;

  @ApiProperty()
  totalDebits: number;

  @ApiProperty()
  totalCommissions: number;

  @ApiProperty()
  totalPayouts: number;

  @ApiProperty()
  totalTransactions: number;

  @ApiProperty()
  averageTransactionAmount: number;

  @ApiProperty()
  currentBalance: number;

  @ApiProperty()
  pendingAmount: number;

  @ApiProperty()
  monthlyGrowth: number;

  @ApiProperty()
  transactionsByType: Record<WalletTransactionType, number>;

  @ApiProperty()
  transactionsByStatus: Record<keyof typeof WalletTransactionStatus, number>;

  @ApiProperty()
  dailyTrends: Array<{
    date: string;
    credits: number;
    debits: number;
    balance: number;
    transactionCount: number;
  }>;
}

export class WalletSummaryDto {
  @ApiProperty()
  currentBalance: number;

  @ApiProperty()
  availableBalance: number;

  @ApiProperty()
  pendingBalance: number;

  @ApiProperty()
  totalEarnings: number;

  @ApiProperty()
  totalPayouts: number;

  @ApiProperty()
  thisMonthEarnings: number;

  @ApiProperty()
  thisMonthPayouts: number;

  @ApiProperty()
  pendingPayoutRequests: number;

  @ApiProperty()
  lastPayoutDate?: Date;

  @ApiProperty()
  nextPayoutDate?: Date;

  @ApiProperty()
  recentTransactions: Array<{
    id: string;
    type: WalletTransactionType;
    amount: number;
    description: string;
    createdAt: Date;
    status: keyof typeof WalletTransactionStatus;
  }>;

  @ApiProperty()
  quickStats: {
    totalTransactions: number;
    successRate: number;
    averageTransactionAmount: number;
    monthlyGrowthRate: number;
  };
}

export class WalletTransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  walletId: string;

  @ApiProperty()
  partnerId: string;

  @ApiProperty({ enum: WalletTransactionType })
  type: WalletTransactionType;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  balanceBefore: number;

  @ApiProperty()
  balanceAfter: number;

  @ApiProperty({ enum: WalletTransactionStatus })
  status: keyof typeof WalletTransactionStatus;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  referenceId?: string;

  @ApiPropertyOptional()
  referenceType?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  processedBy?: string;

  @ApiPropertyOptional()
  processedAt?: Date;
}
