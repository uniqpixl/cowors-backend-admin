import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '@/auth/entities/user.entity';
import { RolesGuard } from '@/guards/roles.guard';

import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoleEntity, PermissionEntity, UserEntity]),
  ],
  controllers: [RoleController],
  providers: [RoleService, RolesGuard],
  exports: [RoleService, RolesGuard],
})
export class RoleModule {}
