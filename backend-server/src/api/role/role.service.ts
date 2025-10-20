import { ErrorResponseUtil } from '@/common/utils/error-response.util';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
  ) {}

  async createRole(createRoleDto: CreateRoleDto): Promise<RoleEntity> {
    const { permissionIds, ...roleData } = createRoleDto;

    const role = this.roleRepository.create(roleData);

    if (permissionIds && permissionIds.length > 0) {
      const permissions =
        await this.permissionRepository.findByIds(permissionIds);
      role.permissions = permissions;
    }

    return this.roleRepository.save(role);
  }

  async findAllRoles(): Promise<RoleEntity[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findRoleById(id: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      ErrorResponseUtil.notFound('Role', id);
    }

    return role;
  }

  async updateRole(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleEntity> {
    const role = await this.findRoleById(id);
    const { permissionIds, ...roleData } = updateRoleDto;

    Object.assign(role, roleData);

    if (permissionIds !== undefined) {
      if (permissionIds.length > 0) {
        const permissions =
          await this.permissionRepository.findByIds(permissionIds);
        role.permissions = permissions;
      } else {
        role.permissions = [];
      }
    }

    return this.roleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findRoleById(id);

    if (role.isSystemRole) {
      ErrorResponseUtil.forbidden(
        'Cannot delete system roles',
        'SYSTEM_ROLE_DELETE_FORBIDDEN',
      );
    }

    await this.roleRepository.remove(role);
  }

  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionEntity> {
    const permission = this.permissionRepository.create(createPermissionDto);
    return this.permissionRepository.save(permission);
  }

  async findAllPermissions(): Promise<PermissionEntity[]> {
    return this.permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<RoleEntity> {
    const role = await this.findRoleById(roleId);
    const permissions =
      await this.permissionRepository.findByIds(permissionIds);

    role.permissions = permissions;
    return this.roleRepository.save(role);
  }

  async removePermissionsFromRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<RoleEntity> {
    const role = await this.findRoleById(roleId);

    role.permissions = role.permissions.filter(
      (permission) => !permissionIds.includes(permission.id),
    );

    return this.roleRepository.save(role);
  }

  async hasPermission(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    // This would typically involve checking user's role and permissions
    // For now, we'll implement a basic version
    const result = await this.roleRepository
      .createQueryBuilder('role')
      .innerJoin('role.permissions', 'permission')
      .innerJoin('user', 'user', 'user.role = role.name')
      .where('user.id = :userId', { userId })
      .andWhere('permission.resource = :resource', { resource })
      .andWhere('permission.action = :action', { action })
      .getCount();

    return result > 0;
  }
}
