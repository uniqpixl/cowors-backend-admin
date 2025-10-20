import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePartnerCategoryDto } from './create-partner-category.dto';

// Omit partnerTypeId from updates as it shouldn't be changed after creation
export class UpdatePartnerCategoryDto extends PartialType(
  OmitType(CreatePartnerCategoryDto, ['partnerTypeId'] as const),
) {}
