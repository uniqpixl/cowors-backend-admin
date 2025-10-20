import {
  EventSubtype,
  PartnerType,
  ServiceSubtype,
  SpaceSubtype,
} from '@/common/enums/partner.enum';
import {
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class ContactInfoDto {
  @IsEmail()
  @StringField()
  email: string;

  @IsPhoneNumber('IN')
  @StringField()
  phone: string;

  @IsUrl({}, { message: 'Website must be a valid URL' })
  @StringFieldOptional()
  website?: string;

  @StringFieldOptional()
  alternatePhone?: string;
}

export class BusinessDetailsDto {
  @StringFieldOptional()
  description?: string;

  @StringFieldOptional()
  gstNumber?: string;

  @StringFieldOptional()
  panNumber?: string;

  @StringFieldOptional()
  bankAccountNumber?: string;

  @StringFieldOptional()
  ifscCode?: string;

  @StringFieldOptional()
  bankName?: string;

  @StringFieldOptional()
  accountHolderName?: string;
}

export class AddressDto {
  @IsNotEmpty()
  @IsString()
  @StringField()
  street: string;

  @IsNotEmpty()
  @IsString()
  @StringField()
  city: string;

  @IsNotEmpty()
  @IsString()
  @StringField()
  state: string;

  @IsNotEmpty()
  @IsString()
  @StringField()
  country: string;

  @IsNotEmpty()
  @IsString()
  @StringField()
  postalCode: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    type: 'object',
    properties: {
      latitude: { type: 'number' },
      longitude: { type: 'number' },
    },
    required: false,
  })
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export class OperatingHoursDto {
  @ApiProperty({ example: { open: '09:00', close: '18:00', isOpen: true } })
  monday?: { open: string; close: string; isOpen: boolean };

  @ApiProperty({ example: { open: '09:00', close: '18:00', isOpen: true } })
  tuesday?: { open: string; close: string; isOpen: boolean };

  @ApiProperty({ example: { open: '09:00', close: '18:00', isOpen: true } })
  wednesday?: { open: string; close: string; isOpen: boolean };

  @ApiProperty({ example: { open: '09:00', close: '18:00', isOpen: true } })
  thursday?: { open: string; close: string; isOpen: boolean };

  @ApiProperty({ example: { open: '09:00', close: '18:00', isOpen: true } })
  friday?: { open: string; close: string; isOpen: boolean };

  @ApiProperty({ example: { open: '09:00', close: '18:00', isOpen: true } })
  saturday?: { open: string; close: string; isOpen: boolean };

  @ApiProperty({ example: { open: '09:00', close: '18:00', isOpen: true } })
  sunday?: { open: string; close: string; isOpen: boolean };
}

export class CreatePartnerDto {
  @IsNotEmpty()
  @IsString()
  @StringField()
  businessName: string;

  // Legacy fields for backward compatibility
  @ApiProperty({ enum: PartnerType, required: false, deprecated: true })
  @IsOptional()
  @IsEnum(PartnerType)
  businessType?: PartnerType;

  @IsOptional()
  @IsString()
  @StringFieldOptional()
  businessSubtype?: SpaceSubtype | ServiceSubtype | EventSubtype;

  // New dynamic category fields
  @ApiProperty({
    description: 'Partner type ID from the dynamic category system',
  })
  @IsOptional()
  @IsUUID()
  @StringFieldOptional()
  partnerTypeId?: string;

  @ApiProperty({
    description: 'Primary category ID from the dynamic category system',
  })
  @IsOptional()
  @IsUUID()
  @StringFieldOptional()
  primaryCategoryId?: string;

  @ApiProperty({
    description: 'Primary subcategory ID from the dynamic category system',
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

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  @ApiProperty()
  contactInfo: ContactInfoDto;

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
}
