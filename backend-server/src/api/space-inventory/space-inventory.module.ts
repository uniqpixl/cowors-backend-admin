import { UserEntity } from '@/auth/entities/user.entity';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpacePackageEntity } from '../space/entities/space-inventory.entity';
import {
  ExtrasEntity,
  InventoryAuditTrailEntity,
  InventoryEntity,
  InventoryExportEntity,
  InventoryReportEntity,
  InventorySettingsEntity,
  PricingRuleEntity,
} from './entities/space-inventory.entity';
import { SpaceInventoryController } from './space-inventory.controller';
import { SpaceInventoryService } from './space-inventory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SpacePackageEntity,
      ExtrasEntity,
      InventoryEntity,
      PricingRuleEntity,
      InventoryAuditTrailEntity,
      InventoryExportEntity,
      InventoryReportEntity,
      InventorySettingsEntity,
      UserEntity,
    ]),
  ],
  controllers: [SpaceInventoryController],
  providers: [SpaceInventoryService, IdGeneratorService],
  exports: [SpaceInventoryService],
})
export class SpaceInventoryModule {}
