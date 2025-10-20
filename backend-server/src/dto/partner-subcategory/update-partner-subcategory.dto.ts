import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePartnerSubcategoryDto } from './create-partner-subcategory.dto';

export class UpdatePartnerSubcategoryDto extends PartialType(
  OmitType(CreatePartnerSubcategoryDto, ['partnerCategoryId'] as const),
) {}
