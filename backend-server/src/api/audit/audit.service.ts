import { UserEntity } from '@/auth/entities/user.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as os from 'os';
import * as process from 'process';
import { Between, FindManyOptions, Repository } from 'typeorm';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import {
  CreateSystemHealthDto,
  QueryAuditLogsDto,
  QuerySystemHealthDto,
} from './dto/system-health.dto';
import {
  AuditAction,
  AuditLogEntity,
  AuditSeverity,
} from './entities/audit-log.entity';
import {
  HealthStatus,
  ServiceType,
  SystemHealthEntity,
} from './entities/system-health.entity';
import {
  AuditIntegrityService,
  AuditLogContent,
} from './services/audit-integrity.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private auditLogRepository: Repository<AuditLogEntity>,
    @InjectRepository(SystemHealthEntity)
    private systemHealthRepository: Repository<SystemHealthEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private auditIntegrityService: AuditIntegrityService,
  ) {}

  // Audit Log Methods
  async createAuditLog(
    createAuditLogDto: CreateAuditLogDto,
  ): Promise<AuditLogEntity> {
    try {
      // Create the audit log with basic data
      const auditLogData = {
        ...createAuditLogDto,
        severity: createAuditLogDto.severity || AuditSeverity.LOW,
        isSuccessful: createAuditLogDto.isSuccessful ?? true,
        createdAt: new Date(),
      };

      // Generate integrity data
      const content: AuditLogContent = {
        userId: auditLogData.userId,
        action: auditLogData.action,
        resourceType: auditLogData.resourceType,
        resourceId: auditLogData.resourceId,
        description: auditLogData.description,
        oldValues: auditLogData.oldValues,
        newValues: auditLogData.newValues,
        ipAddress: auditLogData.ipAddress,
        userAgent: auditLogData.userAgent,
        severity: auditLogData.severity,
        metadata: auditLogData.metadata,
        sessionId: auditLogData.sessionId,
        requestId: auditLogData.requestId,
        endpoint: auditLogData.endpoint,
        httpMethod: auditLogData.httpMethod,
        responseStatus: auditLogData.responseStatus,
        executionTime: auditLogData.executionTime,
        isSuccessful: auditLogData.isSuccessful,
        errorMessage: auditLogData.errorMessage,
        createdAt: auditLogData.createdAt,
      };

      const integrityData =
        await this.auditIntegrityService.generateIntegrityData(content);

      // Create the audit log with integrity data
      const auditLog = this.auditLogRepository.create({
        ...auditLogData,
        contentHash: integrityData.contentHash,
        previousHash: integrityData.previousHash,
        sequenceNumber: integrityData.sequenceNumber,
        hashAlgorithm: integrityData.hashAlgorithm,
        integrityVerified: false,
      });

      const savedLog = await this.auditLogRepository.save(auditLog);

      // Log critical events
      if (createAuditLogDto.severity === AuditSeverity.CRITICAL) {
        this.logger.error(
          `Critical audit event: ${createAuditLogDto.action} - ${createAuditLogDto.description}`,
        );
      }

      return savedLog;
    } catch (error) {
      this.logger.error('Failed to create audit log', error.stack);
      throw error;
    }
  }

  // Integrity verification methods
  async verifyAuditLogIntegrity(logId: string): Promise<boolean> {
    try {
      const log = await this.auditLogRepository.findOne({
        where: { id: logId },
      });
      if (!log) {
        return false;
      }
      return this.auditIntegrityService.verifyLogIntegrity(log);
    } catch (error) {
      this.logger.error('Failed to verify audit log integrity', error.stack);
      return false;
    }
  }

  async verifyChainIntegrity(limit: number = 100): Promise<{
    isValid: boolean;
    totalChecked: number;
    invalidLogs: string[];
    brokenChainAt?: number;
  }> {
    return this.auditIntegrityService.verifyChainIntegrity(limit);
  }

  async getIntegrityStatistics(): Promise<{
    totalLogs: number;
    verifiedLogs: number;
    unverifiedLogs: number;
    lastVerificationDate?: Date;
  }> {
    return this.auditIntegrityService.getIntegrityStatistics();
  }

  async markLogsAsVerified(logIds: string[]): Promise<void> {
    return this.auditIntegrityService.markAsVerified(logIds);
  }

  async logUserAction(
    userId: string,
    action: AuditAction,
    resourceType?: string,
    resourceId?: string,
    description?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>,
    severity: AuditSeverity = AuditSeverity.LOW,
  ): Promise<void> {
    try {
      await this.createAuditLog({
        userId,
        action,
        resourceType,
        resourceId,
        description,
        oldValues,
        newValues,
        metadata,
        severity,
      });
    } catch (error) {
      this.logger.error('Failed to log user action', error.stack);
    }
  }

  async logSystemEvent(
    action: AuditAction,
    description: string,
    metadata?: Record<string, any>,
    severity: AuditSeverity = AuditSeverity.MEDIUM,
  ): Promise<void> {
    try {
      await this.createAuditLog({
        action,
        description,
        metadata,
        severity,
        resourceType: 'SYSTEM',
      });
    } catch (error) {
      this.logger.error('Failed to log system event', error.stack);
    }
  }

  async logSecurityEvent(
    action: AuditAction,
    description: string,
    ipAddress?: string,
    userAgent?: string,
    userId?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.createAuditLog({
        userId,
        action,
        description,
        ipAddress,
        userAgent,
        metadata,
        severity: AuditSeverity.HIGH,
        resourceType: 'SECURITY',
      });
    } catch (error) {
      this.logger.error('Failed to log security event', error.stack);
    }
  }

  async findAuditLogs(queryDto: QueryAuditLogsDto): Promise<{
    data: AuditLogEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      ...filters
    } = queryDto;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user');

    // Apply filters
    if (filters.userId) {
      queryBuilder.andWhere('audit.userId = :userId', {
        userId: filters.userId,
      });
    }

    if (filters.action) {
      queryBuilder.andWhere('audit.action = :action', {
        action: filters.action,
      });
    }

    if (filters.resourceType) {
      queryBuilder.andWhere('audit.resourceType = :resourceType', {
        resourceType: filters.resourceType,
      });
    }

    if (filters.resourceId) {
      queryBuilder.andWhere('audit.resourceId = :resourceId', {
        resourceId: filters.resourceId,
      });
    }

    if (filters.severity) {
      queryBuilder.andWhere('audit.severity = :severity', {
        severity: filters.severity,
      });
    }

    if (filters.ipAddress) {
      queryBuilder.andWhere('audit.ipAddress = :ipAddress', {
        ipAddress: filters.ipAddress,
      });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('audit.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
      });
    }

    // Apply sorting
    queryBuilder.orderBy(`audit.${sortBy}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getAuditLogById(id: string): Promise<AuditLogEntity> {
    return this.auditLogRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async getAuditStatistics(): Promise<any> {
    const totalLogs = await this.auditLogRepository.count();

    const severityStats = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.severity')
      .getRawMany();

    const actionStats = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const recentActivity = await this.auditLogRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['user'],
    });

    return {
      totalLogs,
      severityStats,
      actionStats,
      recentActivity,
    };
  }

  // System Health Methods
  async createSystemHealth(
    createSystemHealthDto: CreateSystemHealthDto,
  ): Promise<SystemHealthEntity> {
    try {
      const healthRecord = this.systemHealthRepository.create(
        createSystemHealthDto,
      );
      return await this.systemHealthRepository.save(healthRecord);
    } catch (error) {
      this.logger.error('Failed to create system health record', error.stack);
      throw error;
    }
  }

  async recordSystemHealth(): Promise<void> {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = os.loadavg()[0]; // 1-minute load average
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      await this.createSystemHealth({
        serviceName: 'Application',
        serviceType: ServiceType.APPLICATION,
        status: this.determineHealthStatus(memoryPercentage, cpuUsage),
        cpuUsage: cpuUsage,
        memoryUsage: memoryPercentage,
        metrics: {
          totalMemory,
          freeMemory,
          usedMemory,
          uptime: process.uptime(),
          platform: os.platform(),
          nodeVersion: process.version,
        },
      });
    } catch (error) {
      this.logger.error('Failed to record system health', error.stack);
    }
  }

  private determineHealthStatus(
    memoryUsage: number,
    cpuUsage: number,
  ): HealthStatus {
    if (memoryUsage > 90 || cpuUsage > 80) {
      return HealthStatus.CRITICAL;
    } else if (memoryUsage > 75 || cpuUsage > 60) {
      return HealthStatus.WARNING;
    } else {
      return HealthStatus.HEALTHY;
    }
  }

  async findSystemHealth(queryDto: QuerySystemHealthDto): Promise<{
    data: SystemHealthEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, ...filters } = queryDto;

    const queryBuilder =
      this.systemHealthRepository.createQueryBuilder('health');

    // Apply filters
    if (filters.serviceName) {
      queryBuilder.andWhere('health.serviceName = :serviceName', {
        serviceName: filters.serviceName,
      });
    }

    if (filters.serviceType) {
      queryBuilder.andWhere('health.serviceType = :serviceType', {
        serviceType: filters.serviceType,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('health.status = :status', {
        status: filters.status,
      });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere(
        'health.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(filters.startDate),
          endDate: new Date(filters.endDate),
        },
      );
    }

    // Apply sorting
    queryBuilder.orderBy('health.createdAt', 'DESC');

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getSystemHealthOverview(): Promise<any> {
    const latestHealthChecks = await this.systemHealthRepository
      .createQueryBuilder('health')
      .distinctOn(['health.serviceName'])
      .orderBy('health.serviceName')
      .addOrderBy('health.createdAt', 'DESC')
      .getMany();

    const healthStats = await this.systemHealthRepository
      .createQueryBuilder('health')
      .select('health.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('health.createdAt >= :date', {
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      }) // Last 24 hours
      .groupBy('health.status')
      .getRawMany();

    const averageMetrics = await this.systemHealthRepository
      .createQueryBuilder('health')
      .select('AVG(health.cpuUsage)', 'avgCpuUsage')
      .addSelect('AVG(health.memoryUsage)', 'avgMemoryUsage')
      .addSelect('AVG(health.responseTime)', 'avgResponseTime')
      .where('health.createdAt >= :date', {
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })
      .getRawOne();

    return {
      latestHealthChecks,
      healthStats,
      averageMetrics,
      systemInfo: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptime: process.uptime(),
      },
    };
  }

  async cleanupOldRecords(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Clean up old audit logs (keep last 30 days)
      await this.auditLogRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :date', { date: thirtyDaysAgo })
        .execute();

      // Clean up old health records (keep last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await this.systemHealthRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :date', { date: sevenDaysAgo })
        .execute();

      this.logger.log('Cleanup of old audit and health records completed');
    } catch (error) {
      this.logger.error('Failed to cleanup old records', error.stack);
    }
  }
}
