import { UserEntity } from '@/auth/entities/user.entity';
import { BaseModel } from '@/database/models/base.model';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';

@Entity('refresh_token')
export class RefreshTokenEntity extends BaseModel {
  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Index({ unique: true, where: '"deletedAt" IS NULL' })
  @Column({ length: 255 })
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  sessionToken: string; // Link to the current session

  @Column({ default: false })
  isRevoked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date;

  @Column({ nullable: true })
  replacedByToken: string; // For token rotation tracking

  @Column({ nullable: true })
  tokenFamily: string; // For detecting token reuse

  protected getEntityType(): EntityType {
    return EntityType.USER;
  }
}
