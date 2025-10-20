import { BaseModel } from '@/database/models/base.model';
import { Column, Entity, Index, ManyToMany } from 'typeorm';
import { EntityType } from '../../../utils/id-generator.service';
import { RoleEntity } from './role.entity';

@Entity('permissions')
export class PermissionEntity extends BaseModel {
  @Index({ unique: true, where: '"deletedAt" IS NULL' })
  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  resource: string;

  @Column({ length: 50 })
  action: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => RoleEntity, (role) => role.permissions)
  roles: RoleEntity[];

  protected getEntityType(): EntityType {
    return EntityType.USER;
  }
}
