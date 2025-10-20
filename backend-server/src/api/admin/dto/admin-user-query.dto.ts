import { Role as UserRole, UserStatus } from '@/api/user/user.enum';
import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AdminUserQueryDto {
  @ApiPropertyOptional({ description: 'Search query for user name or email' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED'],
    description: 'Filter by user status',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    enum: ['User', 'Partner', 'Admin'],
    description: 'Filter by user role',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Filter by email verification status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  emailVerified?: boolean;

  @ApiPropertyOptional({ description: 'Filter users created after this date' })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({ description: 'Filter users created before this date' })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @ApiPropertyOptional({
    description: 'Filter users who logged in after this date',
  })
  @IsOptional()
  @IsDateString()
  lastLoginAfter?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['name', 'email', 'createdAt', 'lastLoginAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt' = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
