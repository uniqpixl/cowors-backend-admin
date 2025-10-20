import { UserEntity } from '@/auth/entities/user.entity';
import {
  ConfigurationScope,
  ConfigurationType,
  ConfigurationValue,
} from '@/common/types/financial-configuration.types';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Re-export enums for use in other modules
export { ConfigurationScope, ConfigurationType, ConfigurationValue };

@Entity('financial_configurations')
@Index(['type', 'scope', 'scopeId'], { unique: true })
@Index(['type', 'isActive'])
@Index(['scope', 'scopeId'])
export class FinancialConfigurationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ConfigurationType,
    comment: 'Type of financial configuration',
  })
  @Index()
  type: ConfigurationType;

  @Column({
    type: 'enum',
    enum: ConfigurationScope,
    comment: 'Scope of the configuration',
  })
  @Index()
  scope: ConfigurationScope;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Scope identifier (partner ID, region, etc.)',
  })
  @Index()
  scopeId?: string;

  @Column({
    type: 'jsonb',
    comment: 'Configuration values with metadata',
  })
  configuration: Record<string, ConfigurationValue>;

  @Column({
    type: 'int',
    default: 1,
    comment: 'Current version number',
  })
  @Index()
  version: number;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Whether configuration is active',
  })
  @Index()
  isActive: boolean;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Description of the configuration',
  })
  description?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional metadata',
  })
  metadata?: Record<string, any>;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'User who created this configuration',
  })
  createdBy?: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'User who last updated this configuration',
  })
  updatedBy?: string;

  @CreateDateColumn({ comment: 'Configuration creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ comment: 'Configuration last update timestamp' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater?: UserEntity;

  @OneToMany(
    () => FinancialConfigurationVersionEntity,
    (version) => version.configuration,
  )
  versions: FinancialConfigurationVersionEntity[];

  @OneToMany(
    () => FinancialConfigurationChangeEntity,
    (change) => change.configuration,
  )
  changes: FinancialConfigurationChangeEntity[];
}

@Entity('financial_configuration_versions')
@Index(['configurationId', 'version'], { unique: true })
@Index(['configurationId', 'isActive'])
export class FinancialConfigurationVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    comment: 'Reference to the main configuration',
  })
  @Index()
  configurationId: string;

  @Column({
    type: 'int',
    comment: 'Version number',
  })
  @Index()
  version: number;

  @Column({
    type: 'jsonb',
    comment: 'Configuration values for this version',
  })
  configuration: Record<string, ConfigurationValue>;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether this version is currently active',
  })
  @Index()
  isActive: boolean;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Description of changes in this version',
  })
  description?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional metadata for this version',
  })
  metadata?: Record<string, any>;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'User who created this version',
  })
  createdBy?: string;

  @CreateDateColumn({ comment: 'Version creation timestamp' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => FinancialConfigurationEntity, (config) => config.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'configurationId' })
  configurationEntity: FinancialConfigurationEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: UserEntity;
}

@Entity('financial_configuration_changes')
@Index(['configurationId', 'createdAt'])
@Index(['userId', 'createdAt'])
export class FinancialConfigurationChangeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    comment: 'Reference to the configuration',
  })
  @Index()
  configurationId: string;

  @Column({
    type: 'int',
    comment: 'Version number after the change',
  })
  version: number;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Type of change (CREATE, UPDATE, DELETE, ROLLBACK)',
  })
  @Index()
  changeType: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Previous configuration values',
  })
  previousValues?: Record<string, any>;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'New configuration values',
  })
  newValues?: Record<string, any>;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Reason for the change',
  })
  reason?: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'User who made the change',
  })
  userId?: string;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: 'IP address of the user who made the change',
  })
  ipAddress?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'User agent of the request',
  })
  userAgent?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional metadata about the change',
  })
  metadata?: Record<string, any>;

  @CreateDateColumn({ comment: 'Change timestamp' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => FinancialConfigurationEntity, (config) => config.changes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'configurationId' })
  configuration: FinancialConfigurationEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
