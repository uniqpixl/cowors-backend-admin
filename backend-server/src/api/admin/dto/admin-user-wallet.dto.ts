import { BalanceType } from '@/common/enums/wallet.enum';
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

export enum UserWalletSortField {
  USER_NAME = 'userName',
  USER_EMAIL = 'userEmail',
  BALANCE = 'balance',
  TOTAL_SPENT = 'totalSpent',
  TOTAL_TOPUPS = 'totalTopups',
  LAST_ACTIVITY = 'lastActivity',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class AdminUserWalletQueryDto {
  @ApiPropertyOptional({
    description: 'Search by user name, email, or user ID',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: BalanceType,
    description: 'Filter by balance type',
  })
  @IsOptional()
  @IsEnum(BalanceType)
  balanceType?: BalanceType;

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

  @ApiPropertyOptional({ enum: UserWalletSortField, description: 'Sort field' })
  @IsOptional()
  @IsEnum(UserWalletSortField)
  sortBy?: UserWalletSortField;

  @ApiPropertyOptional({ enum: SortOrder, description: 'Sort order' })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}

export class AdminUserWalletListResponseDto {
  @ApiProperty({ description: 'List of user wallets' })
  data: AdminUserWalletDto[];

  @ApiProperty({ description: 'Total number of records' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;
}

export class AdminUserWalletDto {
  @ApiProperty({ description: 'Wallet ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User name' })
  userName: string;

  @ApiProperty({ description: 'User email' })
  userEmail: string;

  @ApiProperty({ description: 'Balance type', enum: BalanceType })
  balanceType: BalanceType;

  @ApiProperty({ description: 'Current wallet balance' })
  balance: number;

  @ApiProperty({ description: 'Locked balance' })
  lockedBalance: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Total amount spent by user' })
  totalSpent: number;

  @ApiProperty({ description: 'Total amount topped up by user' })
  totalTopups: number;

  @ApiProperty({ description: 'Last transaction date' })
  lastActivity: string;

  @ApiProperty({ description: 'Wallet creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;
}
