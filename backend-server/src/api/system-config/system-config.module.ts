import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '@/auth/entities/user.entity';
import { SystemConfigEntity } from '@/database/entities/system-config.entity';
import { RolesGuard } from '@/guards/roles.guard';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfigEntity, UserEntity])],
  controllers: [SystemConfigController],
  providers: [SystemConfigService, RolesGuard],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
