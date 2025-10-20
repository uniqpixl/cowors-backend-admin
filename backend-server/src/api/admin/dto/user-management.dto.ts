import { Role as UserRole, UserStatus } from '@/api/user/user.enum';
import { UserEntity } from '@/auth/entities/user.entity';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserListItemDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Display name' })
  displayName?: string;

  @ApiProperty({ enum: UserRole, description: 'User role' })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, description: 'User status' })
  status: UserStatus;

  @ApiProperty({ description: 'Email verification status' })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last login date' })
  lastLoginAt?: Date;

  @ApiPropertyOptional({ description: 'Status reason' })
  statusReason?: string;

  @ApiPropertyOptional({ description: 'Suspension expiry date' })
  suspensionExpiresAt?: Date;

  @ApiPropertyOptional({ description: 'Ban expiry date' })
  banExpiresAt?: Date;
}

export class UserListResponseDto extends OffsetPaginatedDto<UserListItemDto> {
  @ApiProperty({ type: [UserListItemDto], description: 'List of users' })
  @IsArray()
  @Type(() => UserListItemDto)
  declare data: UserListItemDto[];
}

export class UserDetailsDto extends UserListItemDto {
  @ApiPropertyOptional({ description: 'Phone number' })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  dateOfBirth?: Date;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  image?: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  adminNotes?: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Deletion date' })
  deletedAt?: Date;

  @ApiPropertyOptional({ description: 'Suspended date' })
  suspendedAt?: Date;

  @ApiPropertyOptional({ description: 'Banned date' })
  bannedAt?: Date;

  // Related data
  @ApiPropertyOptional({ description: 'Total bookings count' })
  totalBookings?: number;

  @ApiPropertyOptional({ description: 'Total spent amount' })
  totalSpent?: number;

  @ApiPropertyOptional({ description: 'Partner profile if exists' })
  partnerProfile?: any;
}

export class UserStatsDto {
  @ApiProperty({ description: 'Total number of users' })
  @IsNumber()
  totalUsers: number;

  @ApiProperty({ description: 'Number of active users' })
  @IsNumber()
  activeUsers: number;

  @ApiProperty({ description: 'Number of verified users' })
  @IsNumber()
  verifiedUsers: number;

  @ApiProperty({ description: 'Number of users pending verification' })
  @IsNumber()
  pendingVerification: number;

  @ApiProperty({ description: 'Number of suspended users' })
  @IsNumber()
  suspendedUsers: number;

  @ApiProperty({ description: 'Number of banned users' })
  @IsNumber()
  bannedUsers: number;

  @ApiProperty({ description: 'Number of deleted users' })
  @IsNumber()
  deletedUsers: number;

  @ApiProperty({ description: 'New users this month' })
  @IsNumber()
  newUsersThisMonth: number;

  @ApiProperty({ description: 'User growth rate percentage' })
  @IsNumber()
  userGrowthRate: number;

  @ApiPropertyOptional({ description: 'Average session duration' })
  @IsOptional()
  @IsString()
  averageSessionDuration?: string;

  @ApiPropertyOptional({ description: 'Top users by bookings' })
  @IsOptional()
  @IsArray()
  topUsersByBookings?: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, description: 'New user status' })
  status: UserStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;
}
