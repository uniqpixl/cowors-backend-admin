import { Role as UserRole, UserStatus } from '@/api/user/user.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class AdminUserUpdateDto {
  @ApiPropertyOptional({
    description: 'Update user status',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED'],
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Update user role',
    enum: ['User', 'Partner', 'Admin', 'SuperAdmin'],
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Set email verification status' })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({ description: 'Admin notes about the user' })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  statusReason?: string;
}

export class AdminUserBanDto {
  @ApiProperty({ description: 'Reason for banning the user' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Duration of ban in days (permanent if not specified)',
  })
  @IsOptional()
  banDuration?: number;
}

export class AdminUserSuspendDto {
  @ApiProperty({ description: 'Reason for suspending the user' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Duration of suspension in days' })
  @IsOptional()
  suspensionDuration?: number;
}
