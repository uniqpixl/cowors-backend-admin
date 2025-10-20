import { PartialType } from '@nestjs/mapped-types';

import { CreatePartnerCommissionSettingsDto } from './create-partner-commission-settings.dto';

export class UpdatePartnerCommissionSettingsDto extends PartialType(
  CreatePartnerCommissionSettingsDto,
) {}
