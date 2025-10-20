import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { Role as UserRole } from '../user/user.enum';
import {
  PerformanceAlert,
  PerformanceMetrics,
  PerformanceMonitoringService,
} from './performance-monitoring.service';

class PerformanceMetricsDto {
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

class PerformanceAlertDto {
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

class SystemHealthDto {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  issues: string[];
  recommendations: string[];
}

@ApiTags('Performance Monitoring')
@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PerformanceMonitoringController {
  constructor(
    private readonly performanceMonitoringService: PerformanceMonitoringService,
  ) {}

  @Get('metrics/current')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get current performance metrics',
    description:
      'Retrieve real-time performance metrics for database, API, system, application, and business operations',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current performance metrics retrieved successfully',
    type: PerformanceMetricsDto,
  })
  async getCurrentMetrics(): Promise<PerformanceMetrics> {
    return this.performanceMonitoringService.getCurrentPerformanceMetrics();
  }

  @Get('metrics/history')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get performance metrics history',
    description: 'Retrieve historical performance metrics for trend analysis',
  })
  @ApiQuery({
    name: 'hours',
    required: false,
    type: Number,
    description: 'Number of hours of history to retrieve (default: 24)',
    example: 24,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance metrics history retrieved successfully',
    type: [PerformanceMetricsDto],
  })
  async getMetricsHistory(
    @Query('hours') hours: number = 24,
  ): Promise<PerformanceMetrics[]> {
    return this.performanceMonitoringService.getPerformanceHistory(hours);
  }

  @Get('alerts')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get active performance alerts',
    description:
      'Retrieve all active performance alerts that require attention',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance alerts retrieved successfully',
    type: [PerformanceAlertDto],
  })
  async getAlerts(): Promise<PerformanceAlert[]> {
    return this.performanceMonitoringService.getPerformanceAlerts();
  }

  @Post('alerts/:alertId/resolve')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Resolve a performance alert',
    description: 'Mark a specific performance alert as resolved',
  })
  @ApiParam({
    name: 'alertId',
    type: String,
    description: 'The ID of the alert to resolve',
    example: 'database-averageQueryTime-1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alert resolved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Alert resolved successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Alert not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Alert not found' },
      },
    },
  })
  async resolveAlert(@Param('alertId') alertId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const resolved =
      await this.performanceMonitoringService.resolveAlert(alertId);

    if (resolved) {
      return {
        success: true,
        message: 'Alert resolved successfully',
      };
    } else {
      return {
        success: false,
        message: 'Alert not found',
      };
    }
  }

  @Get('health')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get system health status',
    description:
      'Get overall system health status with score, issues, and recommendations',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System health status retrieved successfully',
    type: SystemHealthDto,
  })
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    return this.performanceMonitoringService.getSystemHealth();
  }

  @Get('dashboard')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get performance monitoring dashboard data',
    description:
      'Get comprehensive performance data for dashboard display including current metrics, alerts, and health status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        currentMetrics: { $ref: '#/components/schemas/PerformanceMetricsDto' },
        activeAlerts: {
          type: 'array',
          items: { $ref: '#/components/schemas/PerformanceAlertDto' },
        },
        systemHealth: { $ref: '#/components/schemas/SystemHealthDto' },
        alertsSummary: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 5 },
            critical: { type: 'number', example: 1 },
            high: { type: 'number', example: 2 },
            medium: { type: 'number', example: 1 },
            low: { type: 'number', example: 1 },
          },
        },
      },
    },
  })
  async getDashboardData(): Promise<{
    currentMetrics: PerformanceMetrics;
    activeAlerts: PerformanceAlert[];
    systemHealth: {
      status: 'healthy' | 'warning' | 'critical';
      score: number;
      issues: string[];
      recommendations: string[];
    };
    alertsSummary: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  }> {
    const [currentMetrics, activeAlerts, systemHealth] = await Promise.all([
      this.performanceMonitoringService.getCurrentPerformanceMetrics(),
      this.performanceMonitoringService.getPerformanceAlerts(),
      this.performanceMonitoringService.getSystemHealth(),
    ]);

    const alertsSummary = {
      total: activeAlerts.length,
      critical: activeAlerts.filter((a) => a.severity === 'critical').length,
      high: activeAlerts.filter((a) => a.severity === 'high').length,
      medium: activeAlerts.filter((a) => a.severity === 'medium').length,
      low: activeAlerts.filter((a) => a.severity === 'low').length,
    };

    return {
      currentMetrics,
      activeAlerts,
      systemHealth,
      alertsSummary,
    };
  }

  @Get('metrics/realtime')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get real-time performance metrics',
    description: 'Get the latest performance metrics for real-time monitoring',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Real-time performance metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string', format: 'date-time' },
        metrics: { $ref: '#/components/schemas/PerformanceMetricsDto' },
        alerts: {
          type: 'array',
          items: { $ref: '#/components/schemas/PerformanceAlertDto' },
        },
      },
    },
  })
  async getRealtimeMetrics(): Promise<{
    timestamp: Date;
    metrics: PerformanceMetrics;
    alerts: PerformanceAlert[];
  }> {
    const [metrics, alerts] = await Promise.all([
      this.performanceMonitoringService.getCurrentPerformanceMetrics(),
      this.performanceMonitoringService.getPerformanceAlerts(),
    ]);

    return {
      timestamp: new Date(),
      metrics,
      alerts,
    };
  }
}
