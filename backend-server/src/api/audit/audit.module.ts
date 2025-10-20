import { UserEntity } from '@/auth/entities/user.entity';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditLogEntity } from './entities/audit-log.entity';
import { SystemHealthEntity } from './entities/system-health.entity';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditIntegrityService } from './services/audit-integrity.service';
import { HealthCheckService } from './services/health-check.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLogEntity, SystemHealthEntity, UserEntity]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditInterceptor,
    HealthCheckService,
    AuditIntegrityService,
    IdGeneratorService,
  ],
  exports: [
    AuditService,
    AuditInterceptor,
    HealthCheckService,
    AuditIntegrityService,
  ],
})
export class AuditModule {}
