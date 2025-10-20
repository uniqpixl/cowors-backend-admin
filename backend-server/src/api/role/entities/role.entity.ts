import { BaseModel } from '@/database/models/base.model';
import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';
import { EntityType } from '../../../utils/id-generator.service';
import { PermissionEntity } from './permission.entity';

@Entity('roles')
export class RoleEntity extends BaseModel {
  @Index({ unique: true, where: '"deletedAt" IS NULL' })
  @Column({ length: 50 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_system_role', type: 'boolean', default: false })
  isSystemRole: boolean;

  @ManyToMany(() => PermissionEntity, (permission) => permission.roles, {
    cascade: true,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: PermissionEntity[];

  protected getEntityType(): EntityType {
    return EntityType.USER;
  }
}
