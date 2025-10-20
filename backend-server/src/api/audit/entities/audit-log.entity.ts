import { UserEntity } from '@/auth/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  PERMISSION_GRANT = 'PERMISSION_GRANT',
  PERMISSION_REVOKE = 'PERMISSION_REVOKE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  BULK_OPERATION = 'BULK_OPERATION',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SECURITY_EVENT = 'SECURITY_EVENT',
  PAYMENT_PROCESS = 'PAYMENT_PROCESS',
  PAYOUT_PROCESS = 'PAYOUT_PROCESS',
  USER_SUSPEND = 'USER_SUSPEND',
  USER_ACTIVATE = 'USER_ACTIVATE',
  PARTNER_VERIFY = 'PARTNER_VERIFY',
  PARTNER_REJECT = 'PARTNER_REJECT',
  CONTENT_PUBLISH = 'CONTENT_PUBLISH',
  CONTENT_UNPUBLISH = 'CONTENT_UNPUBLISH',
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DELETE = 'FILE_DELETE',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['resourceType', 'resourceId'])
@Index(['ipAddress', 'createdAt'])
@Index(['severity', 'createdAt'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({
    name: 'resource_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  resourceType: string;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'enum', enum: AuditSeverity, default: AuditSeverity.LOW })
  severity: AuditSeverity;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'session_id', type: 'varchar', length: 255, nullable: true })
  sessionId: string;

  @Column({ name: 'request_id', type: 'varchar', length: 255, nullable: true })
  requestId: string;

  @Column({ name: 'endpoint', type: 'varchar', length: 255, nullable: true })
  endpoint: string;

  @Column({ name: 'http_method', type: 'varchar', length: 10, nullable: true })
  httpMethod: string;

  @Column({ name: 'response_status', type: 'integer', nullable: true })
  responseStatus: number;

  @Column({ name: 'execution_time', type: 'integer', nullable: true })
  executionTime: number; // in milliseconds

  @Column({ name: 'is_successful', type: 'boolean', default: true })
  isSuccessful: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  // Immutability and integrity fields
  @Column({ name: 'content_hash', type: 'varchar', length: 64, nullable: true })
  contentHash: string; // SHA-256 hash of the log content

  @Column({
    name: 'previous_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  previousHash: string; // Hash of the previous audit log for chain integrity

  @Column({
    name: 'hash_algorithm',
    type: 'varchar',
    length: 20,
    default: 'SHA256',
  })
  hashAlgorithm: string; // Algorithm used for hashing

  @Column({ name: 'sequence_number', type: 'bigint', nullable: true })
  sequenceNumber: number; // Sequential number for ordering

  @Column({ name: 'integrity_verified', type: 'boolean', default: false })
  integrityVerified: boolean; // Flag to indicate if integrity has been verified

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
