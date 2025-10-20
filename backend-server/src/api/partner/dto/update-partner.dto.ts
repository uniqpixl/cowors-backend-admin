import {
  EventSubtype,
  PartnerStatus,
  PartnerType,
  ServiceSubtype,
  SpaceSubtype,
  VerificationStatus,
} from '@/common/enums/partner.enum';
import {
  NumberFieldOptional,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  AddressDto,
  BusinessDetailsDto,
  ContactInfoDto,
  OperatingHoursDto,
} from './create-partner.dto';

export class UpdatePartnerDto {
  @IsOptional()
  @IsString()
  @StringFieldOptional()
  businessName?: string;

  @IsOptional()
  @IsString()
  @StringFieldOptional()
  businessSubtype?: SpaceSubtype | ServiceSubtype | EventSubtype;

  // New dynamic category fields
  @ApiProperty({
    description: 'Partner type ID from the dynamic category system',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @StringFieldOptional()
  partnerTypeId?: string;

  @ApiProperty({
    description: 'Primary category ID from the dynamic category system',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @StringFieldOptional()
  primaryCategoryId?: string;

  @ApiProperty({
    description: 'Primary subcategory ID from the dynamic category system',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @StringFieldOptional()
  primarySubcategoryId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  @ApiProperty({ required: false })
  address?: AddressDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  @ApiProperty({ required: false })
  contactInfo?: ContactInfoDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BusinessDetailsDto)
  @ApiProperty({ required: false })
  businessDetails?: BusinessDetailsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  @ApiProperty({ required: false })
  operatingHours?: OperatingHoursDto;

  @IsOptional()
  @NumberFieldOptional({ min: 0, max: 100 })
  commissionRate?: number;

  @IsOptional()
  @ApiProperty({ enum: PartnerStatus, required: false })
  @IsEnum(PartnerStatus)
  status?: PartnerStatus;
}

export class UpdatePartnerVerificationDto {
  @ApiProperty({ enum: VerificationStatus, required: false })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsString()
  @StringFieldOptional()
  verificationNotes?: string;
}
