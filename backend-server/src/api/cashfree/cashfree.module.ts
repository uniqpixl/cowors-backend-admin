import { UserEntity } from '@/auth/entities/user.entity';
import cashfreeConfig from '@/config/cashfree/cashfree.config';
import { KycVerificationEntity } from '@/database/entities/kyc-verification.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashfreeAadhaarService } from './cashfree-aadhaar.service';
import { CashfreeBusinessService } from './cashfree-business.service';
import { CashfreePanService } from './cashfree-pan.service';
import { CashfreeVrsService } from './cashfree-vrs.service';
import { CashfreeWebhookService } from './cashfree-webhook.service';
import { CashfreeController } from './cashfree.controller';

@Module({
  imports: [
    ConfigModule.forFeature(cashfreeConfig),
    TypeOrmModule.forFeature([
      KycVerificationEntity,
      UserEntity,
      PartnerEntity,
    ]),
  ],
  controllers: [CashfreeController],
  providers: [
    CashfreeVrsService,
    CashfreeAadhaarService,
    CashfreePanService,
    CashfreeBusinessService,
    CashfreeWebhookService,
  ],
  exports: [
    CashfreeVrsService,
    CashfreeAadhaarService,
    CashfreePanService,
    CashfreeBusinessService,
    CashfreeWebhookService,
  ],
})
export class CashfreeModule {}
