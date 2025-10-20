import { BaseModel } from '@/database/models/base.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';
import { UserEntity } from './user.entity';

// https://www.better-auth.com/docs/concepts/database#core-schema
@Entity('twoFactor')
export class TwoFactorEntity extends BaseModel {
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ nullable: true })
  secret: string;

  @Column({ nullable: true })
  backupCodes: string;

  protected getEntityType(): EntityType {
    return EntityType.USER;
  }
}
