import { PartialType } from '@nestjs/swagger';
import { CreatePartnerTypeDto } from './create-partner-type.dto';

export class UpdatePartnerTypeDto extends PartialType(CreatePartnerTypeDto) {}
