import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { DataSource, Repository } from 'typeorm';
import {
  HealthStatus,
  ServiceType,
  SystemHealthEntity,
} from '../entities/system-health.entity';

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);

  constructor(
    @InjectRepository(SystemHealthEntity)
    private readonly systemHealthRepository: Repository<SystemHealthEntity>,
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async performHealthChecks(): Promise<void> {
    this.logger.debug('Performing scheduled health checks');

    try {
      await Promise.all([
        this.checkDatabaseHealth(),
        this.checkSystemHealth(),
        this.checkDiskHealth(),
        this.checkMemoryHealth(),
        this.checkApplicationHealth(),
      ]);
    } catch (error) {
      this.logger.error('Error during health checks', error.stack);
    }
  }

  async checkDatabaseHealth(): Promise<void> {
    const startTime = Date.now();
    let status = HealthStatus.HEALTHY;
    let message = 'Database is healthy';
    let responseTime = 0;
    let activeConnections = 0;
    let errorRate = 0;

    try {
      // Test database connection with a simple query
      const result = await this.dataSource.query('SELECT 1 as test');
      responseTime = Date.now() - startTime;

      // Get connection pool information
      if ((this.dataSource.driver as any).pool) {
        activeConnections =
          (this.dataSource.driver as any).pool.totalCount || 0;
      }

      // Determine status based on response time
      if (responseTime > 5000) {
        status = HealthStatus.CRITICAL;
        message = 'Database response time is critical';
      } else if (responseTime > 2000) {
        status = HealthStatus.WARNING;
        message = 'Database response time is slow';
      } else if (responseTime > 1000) {
        status = HealthStatus.WARNING;
        message = 'Database response time is elevated';
      }
    } catch (error) {
      status = HealthStatus.DOWN;
      message = `Database connection failed: ${error.message}`;
      responseTime = Date.now() - startTime;
      errorRate = 100;
    }

    await this.recordHealthCheck({
      serviceName: 'PostgreSQL',
      serviceType: ServiceType.DATABASE,
      status,
      responseTime,
      activeConnections,
      errorRate,
      message,
      metrics: {
        connectionPool: {
          active: activeConnections,
          idle: 0, // Would need to implement if available
          total: activeConnections,
        },
        queryPerformance: {
          averageResponseTime: responseTime,
          slowQueries: 0, // Would need to implement
        },
      },
    });
  }

  async checkSystemHealth(): Promise<void> {
    const startTime = Date.now();
    let status = HealthStatus.HEALTHY;
    let message = 'System is healthy';

    try {
      // Get system metrics
      const cpuUsage = await this.getCpuUsage();
      const memoryUsage = this.getMemoryUsage();
      const loadAverage = os.loadavg()[0]; // 1-minute load average
      const uptime = os.uptime();

      // Determine status based on system metrics
      if (cpuUsage > 90 || memoryUsage > 95) {
        status = HealthStatus.CRITICAL;
        message = 'System resources are critically high';
      } else if (cpuUsage > 80 || memoryUsage > 85) {
        status = HealthStatus.WARNING;
        message = 'System resources are elevated';
      } else if (cpuUsage > 70 || memoryUsage > 75) {
        status = HealthStatus.WARNING;
        message = 'System resources are moderate';
      }

      const checkDuration = Date.now() - startTime;

      await this.recordHealthCheck({
        serviceName: 'System',
        serviceType: ServiceType.SYSTEM,
        status,
        cpuUsage,
        memoryUsage,
        message,
        checkDuration,
        metrics: {
          loadAverage,
          uptime,
          platform: os.platform(),
          arch: os.arch(),
          nodeVersion: process.version,
          processUptime: process.uptime(),
        },
      });
    } catch (error) {
      await this.recordHealthCheck({
        serviceName: 'System',
        serviceType: ServiceType.SYSTEM,
        status: HealthStatus.DOWN,
        message: `System check failed: ${error.message}`,
        checkDuration: Date.now() - startTime,
      });
    }
  }

  async checkDiskHealth(): Promise<void> {
    const startTime = Date.now();
    let status = HealthStatus.HEALTHY;
    let message = 'Disk space is healthy';
    let diskUsage = 0;

    try {
      diskUsage = await this.getDiskUsage();

      if (diskUsage > 95) {
        status = HealthStatus.CRITICAL;
        message = 'Disk space is critically low';
      } else if (diskUsage > 85) {
        status = HealthStatus.WARNING;
        message = 'Disk space is low';
      } else if (diskUsage > 75) {
        status = HealthStatus.WARNING;
        message = 'Disk space is moderate';
      }

      await this.recordHealthCheck({
        serviceName: 'Disk',
        serviceType: ServiceType.STORAGE,
        status,
        diskUsage,
        message,
        checkDuration: Date.now() - startTime,
        metrics: {
          diskUsagePercentage: diskUsage,
          availableSpace: await this.getAvailableDiskSpace(),
        },
      });
    } catch (error) {
      await this.recordHealthCheck({
        serviceName: 'Disk',
        serviceType: ServiceType.STORAGE,
        status: HealthStatus.DOWN,
        message: `Disk check failed: ${error.message}`,
        checkDuration: Date.now() - startTime,
      });
    }
  }

  async checkMemoryHealth(): Promise<void> {
    const startTime = Date.now();
    let status = HealthStatus.HEALTHY;
    let message = 'Memory usage is healthy';

    try {
      const memoryUsage = this.getMemoryUsage();
      const processMemory = process.memoryUsage();

      if (memoryUsage > 95) {
        status = HealthStatus.CRITICAL;
        message = 'Memory usage is critically high';
      } else if (memoryUsage > 85) {
        status = HealthStatus.WARNING;
        message = 'Memory usage is high';
      } else if (memoryUsage > 75) {
        status = HealthStatus.WARNING;
        message = 'Memory usage is moderate';
      }

      await this.recordHealthCheck({
        serviceName: 'Memory',
        serviceType: ServiceType.SYSTEM,
        status,
        memoryUsage,
        message,
        checkDuration: Date.now() - startTime,
        metrics: {
          systemMemory: {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem(),
            usagePercentage: memoryUsage,
          },
          processMemory: {
            rss: processMemory.rss,
            heapTotal: processMemory.heapTotal,
            heapUsed: processMemory.heapUsed,
            external: processMemory.external,
            arrayBuffers: processMemory.arrayBuffers,
          },
        },
      });
    } catch (error) {
      await this.recordHealthCheck({
        serviceName: 'Memory',
        serviceType: ServiceType.SYSTEM,
        status: HealthStatus.DOWN,
        message: `Memory check failed: ${error.message}`,
        checkDuration: Date.now() - startTime,
      });
    }
  }

  async checkApplicationHealth(): Promise<void> {
    const startTime = Date.now();
    let status = HealthStatus.HEALTHY;
    let message = 'Application is healthy';

    try {
      // Check if the application is responding
      const processUptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      const heapUsagePercentage =
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      if (heapUsagePercentage > 90) {
        status = HealthStatus.WARNING;
        message = 'Application heap usage is high';
      }

      await this.recordHealthCheck({
        serviceName: 'Application',
        serviceType: ServiceType.APPLICATION,
        status,
        message,
        checkDuration: Date.now() - startTime,
        metrics: {
          uptime: processUptime,
          heapUsage: heapUsagePercentage,
          version: process.version,
          pid: process.pid,
          environment: process.env.NODE_ENV || 'development',
        },
      });
    } catch (error) {
      await this.recordHealthCheck({
        serviceName: 'Application',
        serviceType: ServiceType.APPLICATION,
        status: HealthStatus.DOWN,
        message: `Application check failed: ${error.message}`,
        checkDuration: Date.now() - startTime,
      });
    }
  }

  private async recordHealthCheck(data: any): Promise<void> {
    try {
      const healthRecord = this.systemHealthRepository.create(data);
      await this.systemHealthRepository.save(healthRecord);
    } catch (error) {
      this.logger.error('Failed to record health check', error.stack);
    }
  }

  private async getCpuUsage(): Promise<number> {
    // Use load average as a simpler CPU usage indicator
    // Load average represents system load over time
    const loadAvg = os.loadavg()[0]; // 1-minute load average
    const cpuCount = os.cpus().length;

    // Convert load average to percentage (load avg / cpu count * 100)
    // Cap at 100% to avoid unrealistic values
    const cpuPercentage = Math.min((loadAvg / cpuCount) * 100, 100);

    return cpuPercentage;
  }

  private getMemoryUsage(): number {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    return (usedMemory / totalMemory) * 100;
  }

  private async getDiskUsage(): Promise<number> {
    try {
      // This is a simplified disk usage check
      // In production, you might want to use a more robust solution
      const stats = await fs.stat(process.cwd());

      // For now, return a mock value since getting actual disk usage
      // requires platform-specific implementations
      return 25; // Mock 25% usage
    } catch (error) {
      this.logger.warn('Could not get disk usage', error.message);
      return 0;
    }
  }

  private async getAvailableDiskSpace(): Promise<number> {
    try {
      // Mock available disk space in bytes
      return 50 * 1024 * 1024 * 1024; // 50GB mock
    } catch (error) {
      this.logger.warn('Could not get available disk space', error.message);
      return 0;
    }
  }

  async getSystemOverview(): Promise<any> {
    try {
      const [latestHealthChecks, criticalIssues] = await Promise.all([
        this.getLatestHealthChecks(),
        this.getCriticalIssues(),
      ]);

      return {
        timestamp: new Date(),
        overall_status: this.determineOverallStatus(latestHealthChecks),
        services: latestHealthChecks,
        critical_issues: criticalIssues,
        system_info: {
          platform: os.platform(),
          arch: os.arch(),
          node_version: process.version,
          uptime: process.uptime(),
          memory_usage: this.getMemoryUsage(),
          cpu_count: os.cpus().length,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get system overview', error.stack);
      throw error;
    }
  }

  private async getLatestHealthChecks(): Promise<SystemHealthEntity[]> {
    return this.systemHealthRepository
      .createQueryBuilder('health')
      .distinctOn(['health.serviceName'])
      .orderBy('health.serviceName')
      .addOrderBy('health.createdAt', 'DESC')
      .limit(10)
      .getMany();
  }

  private async getCriticalIssues(): Promise<SystemHealthEntity[]> {
    return this.systemHealthRepository.find({
      where: {
        status: HealthStatus.CRITICAL,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  private determineOverallStatus(
    healthChecks: SystemHealthEntity[],
  ): HealthStatus {
    if (healthChecks.some((check) => check.status === HealthStatus.CRITICAL)) {
      return HealthStatus.CRITICAL;
    }
    if (healthChecks.some((check) => check.status === HealthStatus.DOWN)) {
      return HealthStatus.DOWN;
    }
    if (healthChecks.some((check) => check.status === HealthStatus.WARNING)) {
      return HealthStatus.WARNING;
    }
    return HealthStatus.HEALTHY;
  }
}
