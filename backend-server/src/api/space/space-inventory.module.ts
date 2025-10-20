import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ExtrasEntity,
  InventoryAuditTrailEntity,
  InventoryEntity,
  InventoryExportEntity,
  InventoryReportEntity,
  InventorySettingsEntity,
  PricingRuleEntity,
} from '../space-inventory/entities/space-inventory.entity';
import { SpacePackageEntity } from './entities/space-inventory.entity';
import { SpaceInventoryController } from './space-inventory.controller';
import { SpaceInventoryService } from './space-inventory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Core space inventory entities
      SpacePackageEntity,
      ExtrasEntity,
      InventoryEntity,
      PricingRuleEntity,

      // Audit and tracking entities
      InventoryAuditTrailEntity,

      // Export and report entities
      InventoryExportEntity,
      InventoryReportEntity,

      // Settings entity
      InventorySettingsEntity,

      // Related entities
      SpaceEntity,
      UserEntity,
      BookingEntity,
    ]),
  ],
  controllers: [SpaceInventoryController],
  providers: [SpaceInventoryService],
  exports: [SpaceInventoryService],
})
export class SpaceInventoryModule {}
