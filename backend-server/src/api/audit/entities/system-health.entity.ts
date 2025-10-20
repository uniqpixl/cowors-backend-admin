import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  DOWN = 'DOWN',
}

export enum ServiceType {
  DATABASE = 'DATABASE',
  REDIS = 'REDIS',
  EMAIL = 'EMAIL',
  PAYMENT = 'PAYMENT',
  STORAGE = 'STORAGE',
  EXTERNAL_API = 'EXTERNAL_API',
  APPLICATION = 'APPLICATION',
  WEBSOCKET = 'WEBSOCKET',
  SYSTEM = 'SYSTEM',
}

@Entity('system_health')
@Index(['serviceName', 'createdAt'])
@Index(['status', 'createdAt'])
@Index(['serviceType', 'createdAt'])
export class SystemHealthEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_name', type: 'varchar', length: 100 })
  serviceName: string;

  @Column({ name: 'service_type', type: 'enum', enum: ServiceType })
  serviceType: ServiceType;

  @Column({ type: 'enum', enum: HealthStatus })
  status: HealthStatus;

  @Column({ name: 'response_time', type: 'integer', nullable: true })
  responseTime: number; // in milliseconds

  @Column({
    name: 'cpu_usage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  cpuUsage: number; // percentage

  @Column({
    name: 'memory_usage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  memoryUsage: number; // percentage

  @Column({
    name: 'disk_usage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  diskUsage: number; // percentage

  @Column({ name: 'active_connections', type: 'integer', nullable: true })
  activeConnections: number;

  @Column({
    name: 'error_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  errorRate: number; // percentage

  @Column({ name: 'throughput', type: 'integer', nullable: true })
  throughput: number; // requests per minute

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metrics: Record<string, any>;

  @Column({ name: 'check_duration', type: 'integer', nullable: true })
  checkDuration: number; // in milliseconds

  @Column({ name: 'is_alert_sent', type: 'boolean', default: false })
  isAlertSent: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
