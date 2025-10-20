import { Module } from '@nestjs/common';
import { PricingValidationService } from './services/pricing-validation.service';

@Module({
  providers: [PricingValidationService],
  exports: [PricingValidationService],
})
export class PricingModule {}
