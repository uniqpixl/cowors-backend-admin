import { WalletStatus } from '@/common/enums/wallet.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum WalletSortField {
  PARTNER_NAME = 'partnerName',
  CURRENT_BALANCE = 'currentBalance',
  PENDING_EARNINGS = 'pendingEarnings',
  LAST_PAYOUT_DATE = 'lastPayoutDate',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class AdminWalletQueryDto {
  @ApiPropertyOptional({
    description: 'Search by partner name, email, or partner ID',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: WalletStatus,
    description: 'Filter by wallet status',
  })
  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;

  @ApiPropertyOptional({ description: 'Minimum balance filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  balanceMin?: number;

  @ApiPropertyOptional({ description: 'Maximum balance filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  balanceMax?: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: WalletSortField, description: 'Sort field' })
  @IsOptional()
  @IsEnum(WalletSortField)
  sortBy?: WalletSortField;

  @ApiPropertyOptional({ enum: SortOrder, description: 'Sort order' })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}

export class AdminWalletListResponseDto {
  @ApiProperty({ description: 'List of partner wallets' })
  data: AdminPartnerWalletDto[];

  @ApiProperty({ description: 'Total number of records' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;
}

export class AdminPartnerWalletDto {
  @ApiProperty({ description: 'Wallet ID' })
  id: string;

  @ApiProperty({ description: 'Partner ID' })
  partnerId: string;

  @ApiProperty({ description: 'Partner name' })
  partnerName: string;

  @ApiProperty({ description: 'Partner email' })
  partnerEmail: string;

  @ApiProperty({ description: 'Partner phone' })
  partnerPhone: string;

  @ApiProperty({ description: 'Partner avatar URL' })
  partnerAvatar: string;

  @ApiProperty({ description: 'Current wallet balance' })
  currentBalance: number;

  @ApiProperty({ description: 'Pending earnings' })
  pendingEarnings: number;

  @ApiProperty({ description: 'Commission rate percentage' })
  commissionRate: number;

  @ApiProperty({ description: 'Last payout date' })
  lastPayoutDate: string;

  @ApiProperty({ enum: WalletStatus, description: 'Wallet status' })
  status: WalletStatus;

  @ApiProperty({ description: 'Wallet creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;

  @ApiProperty({ description: 'Last activity date' })
  lastActivity: string;
}

export class UpdateWalletStatusDto {
  @ApiProperty({ enum: WalletStatus, description: 'New wallet status' })
  @IsEnum(WalletStatus)
  status: WalletStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ForcePayoutDto {
  @ApiProperty({ description: 'Payout amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Payout reason/notes' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Payment method' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class ManualAdjustmentDto {
  @ApiProperty({
    description: 'Adjustment amount (positive for credit, negative for debit)',
  })
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Adjustment type' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class BulkWalletActionDto {
  @ApiProperty({ description: 'Array of wallet IDs' })
  @IsArray()
  @IsString({ each: true })
  walletIds: string[];

  @ApiProperty({ enum: WalletStatus, description: 'Action to perform' })
  @IsEnum(WalletStatus)
  action: WalletStatus;

  @ApiPropertyOptional({ description: 'Reason for bulk action' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class WalletStatsDto {
  @ApiProperty({ description: 'Total number of partner wallets' })
  totalWallets: number;

  @ApiProperty({ description: 'Number of active wallets' })
  activeWallets: number;

  @ApiProperty({ description: 'Number of frozen wallets' })
  frozenWallets: number;

  @ApiProperty({ description: 'Number of blocked wallets' })
  blockedWallets: number;

  @ApiProperty({ description: 'Total balance across all wallets' })
  totalBalance: number;

  @ApiProperty({ description: 'Total pending earnings' })
  totalPendingEarnings: number;

  @ApiProperty({ description: 'Average wallet balance' })
  averageBalance: number;
}
