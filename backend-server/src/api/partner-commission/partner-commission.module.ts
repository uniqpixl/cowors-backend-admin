import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { PartnerCommissionSettingsController } from '../../controllers/partner-commission-settings.controller';
import { PartnerCommissionSettingsEntity } from '../../database/entities/partner-commission-settings.entity';
import { PartnerCommissionSettingsService } from '../../services/partner-commission-settings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PartnerCommissionSettingsEntity, UserEntity]),
  ],
  controllers: [PartnerCommissionSettingsController],
  providers: [PartnerCommissionSettingsService],
  exports: [PartnerCommissionSettingsService],
})
export class PartnerCommissionModule {}
