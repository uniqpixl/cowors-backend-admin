import { Expose, Type } from 'class-transformer';
import { PermissionDto } from './permission.dto';

export class RoleDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string;

  @Expose()
  isSystemRole: boolean;

  @Expose()
  @Type(() => PermissionDto)
  permissions: PermissionDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
