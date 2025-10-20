import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, Length } from 'class-validator';
import { CreatePartnerAddonDto } from './create-partner-addon.dto';

export class UpdatePartnerAddonDto extends PartialType(CreatePartnerAddonDto) {
  @ApiPropertyOptional({
    description: 'ID of the category this addon belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Type of addon',
    example: 'equipment',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  addonType?: string;

  @ApiPropertyOptional({
    description: 'Pricing model for the addon',
    example: 'fixed',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  pricingModel?: string;

  @ApiPropertyOptional({
    description: 'Availability rules for the addon',
  })
  @IsOptional()
  @IsObject()
  availabilityRules?: {
    timeSlots?: {
      start: string;
      end: string;
      daysOfWeek: number[];
    }[];
    blackoutDates?: string[];
    advanceBookingDays?: number;
    maxBookingDuration?: number;
    seasonalAvailability?: {
      startDate: string;
      endDate: string;
      isAvailable: boolean;
    }[];
  };
}
