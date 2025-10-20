import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpaceController } from './space.controller';
import { SpaceService } from './space.service';

// Entities
import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PartnerAddonEntity } from '@/database/entities/partner-addon.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { SpaceOptionExtrasEntity } from '@/database/entities/space-option-extras.entity';
import { SpaceOptionEntity } from '@/database/entities/space-option.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { SpacePackageEntity } from './entities/space-inventory.entity';

// Repositories
import { PartnerExtrasRepository } from './repositories/partner-extras.repository';
import { SpaceOptionExtrasRepository } from './repositories/space-option-extras.repository';
import { SpaceOptionRepository } from './repositories/space-option.repository';
import { SpacePackageRepository } from './repositories/space-package.repository';

// Services
import { PricingValidationService } from './services/pricing-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SpaceEntity,
      SpaceOptionEntity,
      SpaceOptionExtrasEntity,
      PartnerAddonEntity,
      PartnerEntity,
      BookingEntity,
      UserEntity,
      SpacePackageEntity,
    ]),
  ],
  controllers: [SpaceController],
  providers: [
    SpaceService,
    SpaceOptionRepository,
    PartnerExtrasRepository,
    SpaceOptionExtrasRepository,
    SpacePackageRepository,
    PricingValidationService,
    IdGeneratorService,
  ],
  exports: [
    SpaceService,
    SpaceOptionRepository,
    PartnerExtrasRepository,
    SpaceOptionExtrasRepository,
    PricingValidationService,
  ],
})
export class SpaceModule {}
