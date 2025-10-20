import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../shared/cache/cache.module';

// Entities
import { UserEntity } from '../auth/entities/user.entity';
import { PartnerAddonEntity } from '../database/entities/partner-addon.entity';
import { PartnerCategoryEntity } from '../database/entities/partner-category.entity';
import { PartnerListingEntity } from '../database/entities/partner-listing.entity';
import { PartnerOfferingEntity } from '../database/entities/partner-offering.entity';
import { PartnerSubcategoryEntity } from '../database/entities/partner-subcategory.entity';
import { PartnerTypeEntity } from '../database/entities/partner-type.entity';
import { PartnerEntity } from '../database/entities/partner.entity';

// Services
import { PartnerAddonService } from '../services/partner-addon.service';
import { PartnerCategoryService } from '../services/partner-category.service';
import { PartnerOfferingService } from '../services/partner-offering.service';
import { PartnerSubcategoryService } from '../services/partner-subcategory.service';
import { PartnerTypeService } from '../services/partner-type.service';
import { RuleTemplateService } from '../services/rule-template.service';
import { IdGeneratorService } from '../utils/id-generator.service';

// Public Controllers
import { DiscoveryController } from '../controllers/discovery.controller';
import { PartnerCategoryController } from '../controllers/partner-category.controller';
import { PartnerOfferingController } from '../controllers/partner-offering.controller';
import { PartnerSubcategoryController } from '../controllers/partner-subcategory.controller';
import { PartnerTypeController } from '../controllers/partner-type.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PartnerTypeEntity,
      PartnerCategoryEntity,
      PartnerSubcategoryEntity,
      PartnerOfferingEntity,
      PartnerAddonEntity,
      PartnerEntity,
      PartnerListingEntity,
      UserEntity,
    ]),
    CacheModule,
    NestCacheModule.register(),
  ],
  providers: [
    PartnerTypeService,
    PartnerCategoryService,
    PartnerSubcategoryService,
    PartnerOfferingService,
    PartnerAddonService,
    RuleTemplateService,
    IdGeneratorService,
  ],
  controllers: [
    // Public API Controllers
    PartnerTypeController,
    PartnerCategoryController,
    PartnerSubcategoryController,
    PartnerOfferingController,
    DiscoveryController,
  ],
  exports: [
    PartnerTypeService,
    PartnerCategoryService,
    PartnerSubcategoryService,
    PartnerOfferingService,
    PartnerAddonService,
    RuleTemplateService,
  ],
})
export class PartnerCategoryManagementModule {}
