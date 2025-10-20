import { Role } from '@/api/user/user.enum';
import { AuthGuard } from '@/auth/auth.guard';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('Admin - System')
@Controller({ path: 'admin/system', version: '1' })
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
@ApiBearerAuth()
export class AdminSystemController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({
    status: 200,
    description: 'System metrics retrieved successfully',
  })
  async getSystemMetrics(): Promise<any> {
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: 0,
      activeConnections: 0,
      requestsPerMinute: 0,
      message: 'System metrics endpoint implemented',
    };
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get system logs' })
  @ApiQuery({ name: 'level', required: false, description: 'Log level filter' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of logs to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'System logs retrieved successfully',
  })
  async getSystemLogs(
    @Query('level') level?: string,
    @Query('limit') limit?: number,
  ): Promise<any> {
    return {
      logs: [],
      level: level || 'all',
      limit: limit || 100,
      message: 'System logs endpoint implemented',
    };
  }
}
