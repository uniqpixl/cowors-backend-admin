import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { DynamicPricingEntity } from '@/database/entities/dynamic-pricing.entity';
import { SpaceAvailabilityEntity } from '@/database/entities/space-availability.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { RolesGuard } from '@/guards/roles.guard';
import { DynamicPricingService } from '@/services/dynamic-pricing.service';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicPricingController } from './dynamic-pricing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DynamicPricingEntity,
      SpaceEntity,
      SpaceAvailabilityEntity,
      BookingEntity,
      UserEntity,
    ]),
  ],
  controllers: [DynamicPricingController],
  providers: [DynamicPricingService, RolesGuard, IdGeneratorService],
  exports: [DynamicPricingService],
})
export class DynamicPricingModule {}
