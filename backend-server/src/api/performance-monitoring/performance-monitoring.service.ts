import { WebSocketService } from '@/api/notification/services/websocket.service';
import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

export interface PerformanceMetrics {
  // Database Performance
  averageQueryTime: number;
  slowQueries: number;
  databaseConnections: number;
  databaseCpuUsage: number;
  databaseMemoryUsage: number;

  // API Performance
  averageResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  successRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;

  // System Performance
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  uptime: number;

  // Application Performance
  activeConnections: number;
  queueLength: number;
  cacheHitRate: number;
  cacheMissRate: number;

  // Business Performance
  transactionThroughput: number;
  bookingProcessingTime: number;
  paymentProcessingTime: number;
  userSessionDuration: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'database' | 'api' | 'system' | 'application' | 'business';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface PerformanceThresholds {
  database: {
    averageQueryTime: number; // ms
    slowQueryThreshold: number; // ms
    maxConnections: number;
    maxCpuUsage: number; // %
    maxMemoryUsage: number; // %
  };
  api: {
    maxResponseTime: number; // ms
    maxErrorRate: number; // %
    minSuccessRate: number; // %
    maxP95ResponseTime: number; // ms
    maxP99ResponseTime: number; // ms
  };
  system: {
    maxCpuUsage: number; // %
    maxMemoryUsage: number; // %
    maxDiskUsage: number; // %
    maxNetworkLatency: number; // ms
    minUptime: number; // %
  };
  application: {
    maxQueueLength: number;
    minCacheHitRate: number; // %
    maxActiveConnections: number;
  };
  business: {
    minTransactionThroughput: number; // per minute
    maxBookingProcessingTime: number; // ms
    maxPaymentProcessingTime: number; // ms
  };
}

@Injectable()
export class PerformanceMonitoringService {
  private readonly logger = new Logger(PerformanceMonitoringService.name);
  private performanceHistory: PerformanceMetrics[] = [];
  private activeAlerts: Map<string, PerformanceAlert> = new Map();

  private readonly thresholds: PerformanceThresholds = {
    database: {
      averageQueryTime: 100, // 100ms
      slowQueryThreshold: 1000, // 1 second
      maxConnections: 80, // 80% of max
      maxCpuUsage: 80,
      maxMemoryUsage: 85,
    },
    api: {
      maxResponseTime: 500, // 500ms
      maxErrorRate: 5, // 5%
      minSuccessRate: 95, // 95%
      maxP95ResponseTime: 1000, // 1 second
      maxP99ResponseTime: 2000, // 2 seconds
    },
    system: {
      maxCpuUsage: 80,
      maxMemoryUsage: 85,
      maxDiskUsage: 90,
      maxNetworkLatency: 100, // 100ms
      minUptime: 99.5, // 99.5%
    },
    application: {
      maxQueueLength: 1000,
      minCacheHitRate: 80, // 80%
      maxActiveConnections: 10000,
    },
    business: {
      minTransactionThroughput: 10, // 10 transactions per minute
      maxBookingProcessingTime: 5000, // 5 seconds
      maxPaymentProcessingTime: 3000, // 3 seconds
    },
  };

  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private webSocketService: WebSocketService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getCurrentPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const [
        databaseMetrics,
        apiMetrics,
        systemMetrics,
        applicationMetrics,
        businessMetrics,
      ] = await Promise.all([
        this.getDatabaseMetrics(),
        this.getApiMetrics(),
        this.getSystemMetrics(),
        this.getApplicationMetrics(),
        this.getBusinessMetrics(),
      ]);

      const metrics: PerformanceMetrics = {
        ...databaseMetrics,
        ...apiMetrics,
        ...systemMetrics,
        ...applicationMetrics,
        ...businessMetrics,
      };

      // Store in history (keep last 100 entries)
      this.performanceHistory.push(metrics);
      if (this.performanceHistory.length > 100) {
        this.performanceHistory.shift();
      }

      return metrics;
    } catch (error) {
      this.logger.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  async getPerformanceHistory(
    hours: number = 24,
  ): Promise<PerformanceMetrics[]> {
    // In a real implementation, this would fetch from a time-series database
    // For now, return the in-memory history
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.performanceHistory.filter((_, index) => {
      // Approximate time filtering based on index
      const estimatedTime = new Date(
        Date.now() - (this.performanceHistory.length - index) * 60 * 1000,
      );
      return estimatedTime >= cutoffTime;
    });
  }

  async getPerformanceAlerts(): Promise<PerformanceAlert[]> {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => !alert.resolved,
    );
  }

  async checkPerformanceThresholds(
    metrics: PerformanceMetrics,
  ): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];

    // Database alerts
    if (metrics.averageQueryTime > this.thresholds.database.averageQueryTime) {
      alerts.push(
        this.createAlert(
          'database',
          'high',
          'averageQueryTime',
          metrics.averageQueryTime,
          this.thresholds.database.averageQueryTime,
          `Average query time (${metrics.averageQueryTime}ms) exceeds threshold`,
        ),
      );
    }

    if (metrics.databaseCpuUsage > this.thresholds.database.maxCpuUsage) {
      alerts.push(
        this.createAlert(
          'database',
          'critical',
          'databaseCpuUsage',
          metrics.databaseCpuUsage,
          this.thresholds.database.maxCpuUsage,
          `Database CPU usage (${metrics.databaseCpuUsage}%) is too high`,
        ),
      );
    }

    // API alerts
    if (metrics.errorRate > this.thresholds.api.maxErrorRate) {
      alerts.push(
        this.createAlert(
          'api',
          'high',
          'errorRate',
          metrics.errorRate,
          this.thresholds.api.maxErrorRate,
          `API error rate (${metrics.errorRate}%) exceeds threshold`,
        ),
      );
    }

    if (metrics.averageResponseTime > this.thresholds.api.maxResponseTime) {
      alerts.push(
        this.createAlert(
          'api',
          'medium',
          'averageResponseTime',
          metrics.averageResponseTime,
          this.thresholds.api.maxResponseTime,
          `API response time (${metrics.averageResponseTime}ms) is slow`,
        ),
      );
    }

    // System alerts
    if (metrics.cpuUsage > this.thresholds.system.maxCpuUsage) {
      alerts.push(
        this.createAlert(
          'system',
          'high',
          'cpuUsage',
          metrics.cpuUsage,
          this.thresholds.system.maxCpuUsage,
          `System CPU usage (${metrics.cpuUsage}%) is too high`,
        ),
      );
    }

    if (metrics.memoryUsage > this.thresholds.system.maxMemoryUsage) {
      alerts.push(
        this.createAlert(
          'system',
          'high',
          'memoryUsage',
          metrics.memoryUsage,
          this.thresholds.system.maxMemoryUsage,
          `System memory usage (${metrics.memoryUsage}%) is too high`,
        ),
      );
    }

    // Application alerts
    if (metrics.queueLength > this.thresholds.application.maxQueueLength) {
      alerts.push(
        this.createAlert(
          'application',
          'medium',
          'queueLength',
          metrics.queueLength,
          this.thresholds.application.maxQueueLength,
          `Queue length (${metrics.queueLength}) is too high`,
        ),
      );
    }

    if (metrics.cacheHitRate < this.thresholds.application.minCacheHitRate) {
      alerts.push(
        this.createAlert(
          'application',
          'low',
          'cacheHitRate',
          metrics.cacheHitRate,
          this.thresholds.application.minCacheHitRate,
          `Cache hit rate (${metrics.cacheHitRate}%) is too low`,
        ),
      );
    }

    // Business alerts
    if (
      metrics.transactionThroughput <
      this.thresholds.business.minTransactionThroughput
    ) {
      alerts.push(
        this.createAlert(
          'business',
          'medium',
          'transactionThroughput',
          metrics.transactionThroughput,
          this.thresholds.business.minTransactionThroughput,
          `Transaction throughput (${metrics.transactionThroughput}/min) is too low`,
        ),
      );
    }

    // Store new alerts
    alerts.forEach((alert) => {
      this.activeAlerts.set(alert.id, alert);
    });

    return alerts;
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.activeAlerts.set(alertId, alert);

      this.eventEmitter.emit('performance.alert.resolved', { alert });
      return true;
    }
    return false;
  }

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const metrics = await this.getCurrentPerformanceMetrics();
      const alerts = await this.getPerformanceAlerts();

      const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
      const highAlerts = alerts.filter((a) => a.severity === 'high');

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let score = 100;
      const issues: string[] = [];
      const recommendations: string[] = [];

      if (criticalAlerts.length > 0) {
        status = 'critical';
        score -= criticalAlerts.length * 20;
        issues.push(...criticalAlerts.map((a) => a.message));
        recommendations.push(
          'Immediate attention required for critical issues',
        );
      }

      if (highAlerts.length > 0) {
        if (status !== 'critical') status = 'warning';
        score -= highAlerts.length * 10;
        issues.push(...highAlerts.map((a) => a.message));
        recommendations.push('Address high-priority performance issues');
      }

      // Additional health checks
      if (metrics.errorRate > 1) {
        issues.push(`Error rate is ${metrics.errorRate}%`);
        recommendations.push('Investigate and fix application errors');
      }

      if (metrics.averageResponseTime > 200) {
        issues.push(`Response time is ${metrics.averageResponseTime}ms`);
        recommendations.push('Optimize API performance and database queries');
      }

      if (metrics.cacheHitRate < 90) {
        issues.push(`Cache hit rate is ${metrics.cacheHitRate}%`);
        recommendations.push('Review and optimize caching strategy');
      }

      score = Math.max(0, score);

      return {
        status,
        score,
        issues,
        recommendations,
      };
    } catch (error) {
      this.logger.error('Failed to get system health:', error);
      return {
        status: 'critical',
        score: 0,
        issues: ['Failed to assess system health'],
        recommendations: ['Check system monitoring and logging'],
      };
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async collectPerformanceMetrics(): Promise<void> {
    try {
      const metrics = await this.getCurrentPerformanceMetrics();
      const alerts = await this.checkPerformanceThresholds(metrics);

      if (alerts.length > 0) {
        const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
        const highAlerts = alerts.filter((a) => a.severity === 'high');

        if (criticalAlerts.length > 0 || highAlerts.length > 0) {
          // Send real-time alerts
          const priority = criticalAlerts.length > 0 ? 'high' : 'medium';
          const message = `${alerts.length} performance alerts detected`;
          await this.webSocketService.sendSystemAlert(message, priority);
        }

        this.eventEmitter.emit('performance.alerts.detected', { alerts });
      }

      this.eventEmitter.emit('performance.metrics.collected', { metrics });
    } catch (error) {
      this.logger.error('Failed to collect performance metrics:', error);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupResolvedAlerts(): Promise<void> {
    const resolvedAlerts = Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.resolved,
    );
    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    resolvedAlerts.forEach((alert) => {
      if (alert.timestamp < cutoffTime) {
        this.activeAlerts.delete(alert.id);
      }
    });

    if (resolvedAlerts.length > 0) {
      this.logger.log(`Cleaned up ${resolvedAlerts.length} resolved alerts`);
    }
  }

  // Private helper methods
  private async getDatabaseMetrics() {
    // Mock database metrics - in real implementation, these would come from database monitoring
    return {
      averageQueryTime: Math.random() * 200 + 50, // 50-250ms
      slowQueries: Math.floor(Math.random() * 5),
      databaseConnections: Math.floor(Math.random() * 50 + 20),
      databaseCpuUsage: Math.random() * 60 + 20, // 20-80%
      databaseMemoryUsage: Math.random() * 50 + 30, // 30-80%
    };
  }

  private async getApiMetrics() {
    // Calculate real API metrics from recent requests
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    try {
      // Mock API metrics - in real implementation, these would come from request logging
      return {
        averageResponseTime: Math.random() * 300 + 100, // 100-400ms
        requestsPerSecond: Math.random() * 100 + 50, // 50-150 RPS
        errorRate: Math.random() * 3, // 0-3%
        successRate: 100 - Math.random() * 3, // 97-100%
        p95ResponseTime: Math.random() * 500 + 200, // 200-700ms
        p99ResponseTime: Math.random() * 1000 + 500, // 500-1500ms
      };
    } catch (error) {
      this.logger.error('Failed to get API metrics:', error);
      return {
        averageResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 100,
        successRate: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      };
    }
  }

  private async getSystemMetrics() {
    // Mock system metrics - in real implementation, these would come from system monitoring
    return {
      cpuUsage: Math.random() * 60 + 20, // 20-80%
      memoryUsage: Math.random() * 50 + 30, // 30-80%
      diskUsage: Math.random() * 40 + 40, // 40-80%
      networkLatency: Math.random() * 50 + 10, // 10-60ms
      uptime: 99.5 + Math.random() * 0.5, // 99.5-100%
    };
  }

  private async getApplicationMetrics() {
    // Get real application metrics where possible
    const activeConnections =
      this.webSocketService.getConnectionStats().connectedUsers;

    return {
      activeConnections,
      queueLength: Math.floor(Math.random() * 100), // Mock queue length
      cacheHitRate: Math.random() * 20 + 80, // 80-100%
      cacheMissRate: Math.random() * 20, // 0-20%
    };
  }

  private async getBusinessMetrics() {
    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Get real business metrics
      const [recentPayments, recentBookings] = await Promise.all([
        this.paymentRepository.count({
          where: { createdAt: Between(oneMinuteAgo, now) },
        }),
        this.bookingRepository.count({
          where: { createdAt: Between(oneMinuteAgo, now) },
        }),
      ]);

      return {
        transactionThroughput: recentPayments, // transactions per minute
        bookingProcessingTime: Math.random() * 2000 + 1000, // 1-3 seconds (mock)
        paymentProcessingTime: Math.random() * 1500 + 500, // 0.5-2 seconds (mock)
        userSessionDuration: Math.random() * 30 + 15, // 15-45 minutes (mock)
      };
    } catch (error) {
      this.logger.error('Failed to get business metrics:', error);
      return {
        transactionThroughput: 0,
        bookingProcessingTime: 0,
        paymentProcessingTime: 0,
        userSessionDuration: 0,
      };
    }
  }

  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    metric: string,
    currentValue: number,
    threshold: number,
    message: string,
  ): PerformanceAlert {
    return {
      id: `${type}-${metric}-${Date.now()}`,
      type,
      severity,
      metric,
      currentValue,
      threshold,
      message,
      timestamp: new Date(),
      resolved: false,
    };
  }
}
