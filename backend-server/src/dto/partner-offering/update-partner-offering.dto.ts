import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePartnerOfferingDto } from './create-partner-offering.dto';

export class UpdatePartnerOfferingDto extends PartialType(
  OmitType(CreatePartnerOfferingDto, ['partnerId', 'categoryId'] as const),
) {}
