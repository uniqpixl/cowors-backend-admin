import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { PageOptionsDto as CursorPageOptions } from '@/common/dto/cursor-pagination/page-options.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { PageOptionsDto as OffsetPageOptions } from '@/common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import {
  PartnerStatus,
  PartnerType,
  VerificationStatus,
} from '@/common/enums/partner.enum';
import {
  ClassField,
  NumberField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

@Exclude()
export class PartnerDto {
  @StringField()
  @Expose()
  id: string;

  @StringField()
  @Expose()
  userId: string;

  @StringField()
  @Expose()
  businessName: string;

  @ApiProperty({ enum: PartnerType })
  @Expose()
  businessType: PartnerType;

  @StringFieldOptional()
  @Expose()
  businessSubtype?: string;

  @StringFieldOptional()
  @Expose()
  address?: string;

  @Expose()
  contactInfo?: Record<string, any>;

  @ApiProperty({ enum: VerificationStatus })
  @Expose()
  verificationStatus: VerificationStatus;

  @ApiProperty({ enum: PartnerStatus })
  @Expose()
  status: PartnerStatus;

  @Expose()
  businessDetails?: Record<string, any>;

  @Expose()
  operatingHours?: Record<string, any>;

  @NumberField()
  @Expose()
  rating: number;

  @NumberField()
  @Expose()
  reviewCount: number;

  @NumberField()
  @Expose()
  commissionRate: number;

  @ClassField(() => Date)
  @Expose()
  createdAt: Date;

  @ClassField(() => Date)
  @Expose()
  updatedAt: Date;
}

export class QueryPartnersOffsetDto extends OffsetPageOptions {
  @ApiPropertyOptional({
    description:
      'Search query for business name, email, first name, or last name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: PartnerType, required: false })
  @IsOptional()
  @IsEnum(PartnerType)
  businessType?: PartnerType;

  @ApiProperty({ enum: PartnerStatus, required: false })
  @IsOptional()
  @IsEnum(PartnerStatus)
  status?: PartnerStatus;

  @ApiProperty({ enum: VerificationStatus, required: false })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;
}

export class OffsetPaginatedPartnerDto extends OffsetPaginatedDto<PartnerDto> {
  declare data: PartnerDto[];
}

export class QueryPartnersCursorDto extends CursorPageOptions {
  @ApiProperty({ enum: PartnerType, required: false })
  @IsOptional()
  @IsEnum(PartnerType)
  businessType?: PartnerType;

  @ApiProperty({ enum: PartnerStatus, required: false })
  @IsOptional()
  @IsEnum(PartnerStatus)
  status?: PartnerStatus;

  @ApiProperty({ enum: VerificationStatus, required: false })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;
}

export class CursorPaginatedPartnerDto extends CursorPaginatedDto<PartnerDto> {
  declare data: PartnerDto[];
}
