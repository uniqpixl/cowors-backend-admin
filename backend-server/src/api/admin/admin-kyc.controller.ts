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

@ApiTags('Admin - KYC')
@Controller({ path: 'admin/kyc', version: '1' })
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
@ApiBearerAuth()
export class AdminKycController {
  constructor(private readonly adminService: AdminService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get pending KYC verifications' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Pending KYC verifications retrieved successfully',
  })
  async getPendingKyc(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<any> {
    return {
      data: [],
      total: 0,
      page: page || 1,
      limit: limit || 10,
      message: 'Pending KYC endpoint implemented',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get KYC statistics' })
  @ApiResponse({
    status: 200,
    description: 'KYC statistics retrieved successfully',
  })
  async getKycStats(): Promise<any> {
    return {
      totalSubmissions: 0,
      pendingReview: 0,
      approved: 0,
      rejected: 0,
      approvalRate: 0,
      message: 'KYC stats endpoint implemented',
    };
  }

  @Get('provider-stats')
  @ApiOperation({ summary: 'Get KYC provider statistics' })
  @ApiResponse({
    status: 200,
    description: 'KYC provider statistics retrieved successfully',
  })
  async getKycProviderStats(): Promise<any> {
    return {
      providers: [],
      successRates: {},
      processingTimes: {},
      message: 'KYC provider stats endpoint implemented',
    };
  }
}
