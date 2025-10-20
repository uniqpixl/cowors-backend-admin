import { Role } from '@/api/user/user.enum';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import {
  CreateSystemHealthDto,
  QueryAuditLogsDto,
  QuerySystemHealthDto,
} from './dto/system-health.dto';
import { AuditLogEntity } from './entities/audit-log.entity';
import { SystemHealthEntity } from './entities/system-health.entity';

@ApiTags('Audit & Monitoring')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // Audit Log Endpoints
  @Post('logs')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Create audit log entry' })
  @ApiResponse({
    status: 201,
    description: 'Audit log created successfully',
    type: AuditLogEntity,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @HttpCode(HttpStatus.CREATED)
  async createAuditLog(
    @Body() createAuditLogDto: CreateAuditLogDto,
  ): Promise<AuditLogEntity> {
    return this.auditService.createAuditLog(createAuditLogDto);
  }

  @Get('logs')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Get audit logs with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    description: 'Filter by action',
  })
  @ApiQuery({
    name: 'resourceType',
    required: false,
    description: 'Filter by resource type',
  })
  @ApiQuery({
    name: 'severity',
    required: false,
    description: 'Filter by severity',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date filter (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date filter (ISO string)',
  })
  async getAuditLogs(@Query() queryDto: QueryAuditLogsDto) {
    return this.auditService.findAuditLogs(queryDto);
  }

  @Get('logs/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({
    status: 200,
    description: 'Audit log retrieved successfully',
    type: AuditLogEntity,
  })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getAuditLogById(@Param('id') id: string): Promise<AuditLogEntity> {
    return this.auditService.getAuditLogById(id);
  }

  @Get('logs/statistics/overview')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Get audit log statistics and overview' })
  @ApiResponse({
    status: 200,
    description: 'Audit statistics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getAuditStatistics() {
    return this.auditService.getAuditStatistics();
  }

  // System Health Endpoints
  @Post('health')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Record system health metrics' })
  @ApiResponse({
    status: 201,
    description: 'System health recorded successfully',
    type: SystemHealthEntity,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @HttpCode(HttpStatus.CREATED)
  async createSystemHealth(
    @Body() createSystemHealthDto: CreateSystemHealthDto,
  ): Promise<SystemHealthEntity> {
    return this.auditService.createSystemHealth(createSystemHealthDto);
  }

  @Post('health/record')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Record current system health automatically' })
  @ApiResponse({
    status: 201,
    description: 'System health recorded successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @HttpCode(HttpStatus.CREATED)
  async recordSystemHealth(): Promise<{ message: string }> {
    await this.auditService.recordSystemHealth();
    return { message: 'System health recorded successfully' };
  }

  @Get('health')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Get system health records with filtering' })
  @ApiResponse({
    status: 200,
    description: 'System health records retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'serviceName',
    required: false,
    description: 'Filter by service name',
  })
  @ApiQuery({
    name: 'serviceType',
    required: false,
    description: 'Filter by service type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by health status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date filter (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date filter (ISO string)',
  })
  async getSystemHealth(@Query() queryDto: QuerySystemHealthDto) {
    return this.auditService.findSystemHealth(queryDto);
  }

  @Get('health/overview')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Get system health overview and statistics' })
  @ApiResponse({
    status: 200,
    description: 'System health overview retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getSystemHealthOverview() {
    return this.auditService.getSystemHealthOverview();
  }

  // Admin Dashboard Endpoints
  @Get('dashboard')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({
    summary: 'Get admin dashboard with audit and health overview',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getAdminDashboard() {
    const [auditStats, healthOverview] = await Promise.all([
      this.auditService.getAuditStatistics(),
      this.auditService.getSystemHealthOverview(),
    ]);

    return {
      audit: auditStats,
      health: healthOverview,
      timestamp: new Date().toISOString(),
    };
  }

  // Maintenance Endpoints
  @Post('maintenance/cleanup')
  @Roles(Role.SuperAdmin)
  @ApiOperation({ summary: 'Clean up old audit logs and health records' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
  })
  async cleanupOldRecords(): Promise<{ message: string }> {
    await this.auditService.cleanupOldRecords();
    return { message: 'Old records cleanup completed successfully' };
  }

  // Security Monitoring Endpoints
  @Get('security/events')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Get security-related audit events' })
  @ApiResponse({
    status: 200,
    description: 'Security events retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getSecurityEvents(@Query() queryDto: QueryAuditLogsDto) {
    const securityQuery = {
      ...queryDto,
      resourceType: 'SECURITY',
    };
    return this.auditService.findAuditLogs(securityQuery);
  }

  @Get('security/failed-logins')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Get failed login attempts' })
  @ApiResponse({
    status: 200,
    description: 'Failed login attempts retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getFailedLogins(@Query() queryDto: QueryAuditLogsDto) {
    const failedLoginQuery = {
      ...queryDto,
      action: 'FAILED_LOGIN',
    };
    return this.auditService.findAuditLogs(failedLoginQuery);
  }

  @Get('activity/recent')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Get recent admin activity' })
  @ApiResponse({
    status: 200,
    description: 'Recent activity retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getRecentActivity(@Query('limit') limit: number = 50) {
    const queryDto: QueryAuditLogsDto = {
      limit: Math.min(limit, 100), // Cap at 100
      page: 1,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    };
    return this.auditService.findAuditLogs(queryDto);
  }

  @Get('activity/user/:userId')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Get activity for specific user' })
  @ApiResponse({
    status: 200,
    description: 'User activity retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getUserActivity(
    @Param('userId') userId: string,
    @Query() queryDto: QueryAuditLogsDto,
  ) {
    const userActivityQuery = {
      ...queryDto,
      userId,
    };
    return this.auditService.findAuditLogs(userActivityQuery);
  }

  // Integrity Verification Endpoints
  @Post('integrity/verify/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Verify integrity of a specific audit log' })
  @ApiResponse({
    status: 200,
    description: 'Audit log integrity verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Integrity verification failed',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async verifyAuditLogIntegrity(@Param('id') id: string) {
    return this.auditService.verifyAuditLogIntegrity(id);
  }

  @Post('integrity/verify-chain')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Verify integrity of the entire audit log chain' })
  @ApiResponse({
    status: 200,
    description: 'Audit log chain integrity verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Chain integrity verification failed',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async verifyChainIntegrity() {
    return this.auditService.verifyChainIntegrity();
  }

  @Get('integrity/statistics')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Get audit log integrity statistics' })
  @ApiResponse({
    status: 200,
    description: 'Integrity statistics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getIntegrityStatistics() {
    return this.auditService.getIntegrityStatistics();
  }

  @Post('integrity/mark-verified')
  @Roles(Role.SuperAdmin)
  @ApiOperation({
    summary: 'Mark audit logs as verified after integrity check',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs marked as verified successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
  })
  async markLogsAsVerified(@Body() body: { logIds: string[] }) {
    return this.auditService.markLogsAsVerified(body.logIds);
  }
}
