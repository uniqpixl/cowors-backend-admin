import { UserEntity } from '@/auth/entities/user.entity';
import { PartnerAddonEntity } from '@/database/entities/partner-addon.entity';
import { PartnerCategoryEntity } from '@/database/entities/partner-category.entity';
import { PartnerListingEntity } from '@/database/entities/partner-listing.entity';
import { PartnerSubcategoryEntity } from '@/database/entities/partner-subcategory.entity';
import { PartnerTypeEntity } from '@/database/entities/partner-type.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnerAddonService } from '../../services/partner-addon.service';
import { UserModule } from '../user/user.module';
import { PartnerAddonController } from './partner-addon.controller';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PartnerEntity,
      UserEntity,
      PartnerTypeEntity,
      PartnerCategoryEntity,
      PartnerSubcategoryEntity,
      PartnerAddonEntity,
      PartnerListingEntity,
    ]),
    UserModule,
  ],
  controllers: [PartnerController, PartnerAddonController],
  providers: [PartnerService, PartnerAddonService, IdGeneratorService],
  exports: [PartnerService, PartnerAddonService],
})
export class PartnerModule {}
