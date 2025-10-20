import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
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
import { Role as UserRole } from '../../api/user/user.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { AdminPartnerService } from './admin-partner.service';
import {
  BulkPartnerStatusUpdateDto,
  PartnerApprovalDto,
  PartnerBookingDto,
  PartnerDetailsDto,
  PartnerListResponseDto,
  PartnerQueryDto,
  PartnerRevenueAnalyticsDto,
  PartnerSpaceDto,
  PartnerStatsDto,
  UpdatePartnerDto,
  UpdatePartnerStatusDto,
} from './dto/partner-management.dto';

@ApiTags('Admin - Partner Management')
@ApiBearerAuth()
@Controller({ path: 'admin/partners', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin)
export class AdminPartnerController {
  private readonly logger = new Logger(AdminPartnerController.name);

  constructor(private readonly adminPartnerService: AdminPartnerService) {}

  @Get()
  @ApiOperation({ summary: 'Get all partners with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Partners retrieved successfully',
    type: PartnerListResponseDto,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, email, or company',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by partner status',
  })
  @ApiQuery({
    name: 'verificationStatus',
    required: false,
    description: 'Filter by verification status',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Filter by city or area',
  })
  @ApiQuery({
    name: 'registrationDateFrom',
    required: false,
    description: 'Registration date from',
  })
  @ApiQuery({
    name: 'registrationDateTo',
    required: false,
    description: 'Registration date to',
  })
  @ApiQuery({
    name: 'revenueMin',
    required: false,
    description: 'Minimum revenue filter',
  })
  @ApiQuery({
    name: 'revenueMax',
    required: false,
    description: 'Maximum revenue filter',
  })
  @ApiQuery({
    name: 'spacesCountMin',
    required: false,
    description: 'Minimum spaces count',
  })
  @ApiQuery({
    name: 'spacesCountMax',
    required: false,
    description: 'Maximum spaces count',
  })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (asc/desc)',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getAllPartners(
    @Query() query: PartnerQueryDto,
  ): Promise<PartnerListResponseDto> {
    this.logger.log(
      'AdminPartnerController.getAllPartners called with query:',
      query,
    );
    try {
      const result = await this.adminPartnerService.findAllPartners(query);
      this.logger.log('AdminPartnerController.getAllPartners result:', result);
      return result;
    } catch (error) {
      this.logger.error('AdminPartnerController.getAllPartners error:', error);
      throw error;
    }
  }

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint for debugging' })
  async testEndpoint(): Promise<{ message: string }> {
    this.logger.log('Test endpoint called successfully');
    return { message: 'Test endpoint working' };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get partner statistics' })
  @ApiResponse({
    status: 200,
    description: 'Partner statistics retrieved successfully',
    type: PartnerStatsDto,
  })
  async getPartnerStats(): Promise<PartnerStatsDto> {
    return this.adminPartnerService.getPartnerStats();
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending partners awaiting approval' })
  @ApiResponse({
    status: 200,
    description: 'Pending partners retrieved successfully',
  })
  async getPendingPartners(): Promise<any> {
    return this.adminPartnerService.getPendingPartners();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get detailed partner statistics' })
  @ApiResponse({
    status: 200,
    description: 'Partner statistics retrieved successfully',
  })
  async getPartnerStatistics(): Promise<any> {
    return this.adminPartnerService.getPartnerStatistics();
  }

  @Get(':id')
  @Roles(UserRole.SuperAdmin, UserRole.Admin)
  @ApiOperation({ summary: 'Get partner by ID' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner details retrieved successfully',
    type: PartnerDetailsDto,
  })
  async getPartnerById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerDetailsDto> {
    return this.adminPartnerService.findPartnerById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update partner information' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner updated successfully',
    type: PartnerDetailsDto,
  })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async updatePartner(
    @Param('id') id: string,
    @Body() updatePartnerDto: UpdatePartnerDto,
  ): Promise<PartnerDetailsDto> {
    return this.adminPartnerService.updatePartner(id, updatePartnerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete partner' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  @HttpCode(HttpStatus.OK)
  async deletePartner(
    @Param('id') id: string,
  ): Promise<{ message: string; deletedAt: Date }> {
    return this.adminPartnerService.deletePartner(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update partner status' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner status updated successfully',
    type: PartnerDetailsDto,
  })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async updatePartnerStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdatePartnerStatusDto,
  ): Promise<PartnerDetailsDto> {
    return this.adminPartnerService.updatePartnerStatus(id, updateStatusDto);
  }

  @Put('status/update')
  @ApiOperation({ summary: 'Bulk update partner status' })
  @ApiResponse({
    status: 200,
    description: 'Partners status updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        updatedCount: { type: 'number' },
        failedIds: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async bulkUpdatePartnerStatus(
    @Body() bulkStatusDto: BulkPartnerStatusUpdateDto,
  ): Promise<{ message: string; updatedCount: number; failedIds: string[] }> {
    return this.adminPartnerService.bulkUpdatePartnerStatus(bulkStatusDto);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve pending partner' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner approved successfully',
    type: PartnerDetailsDto,
  })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async approvePartner(
    @Param('id') id: string,
    @Body() approvalDto: PartnerApprovalDto,
  ): Promise<PartnerDetailsDto> {
    return this.adminPartnerService.approvePartner(id, approvalDto);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject pending partner' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner rejected successfully',
    type: PartnerDetailsDto,
  })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async rejectPartner(
    @Param('id') id: string,
    @Body() rejectionDto: PartnerApprovalDto,
  ): Promise<PartnerDetailsDto> {
    return this.adminPartnerService.rejectPartner(id, rejectionDto);
  }

  @Get(':id/spaces')
  @ApiOperation({ summary: 'Get partner spaces' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner spaces retrieved successfully',
    type: [PartnerSpaceDto],
  })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async getPartnerSpaces(@Param('id') id: string): Promise<PartnerSpaceDto[]> {
    return this.adminPartnerService.getPartnerSpaces(id);
  }

  @Get(':id/bookings')
  @ApiOperation({ summary: 'Get partner bookings' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Partner bookings retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async getPartnerBookings(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{
    bookings: PartnerBookingDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.adminPartnerService.getPartnerBookings(id);
    return {
      bookings: result,
      total: result.length,
      page,
      limit,
      totalPages: Math.ceil(result.length / limit),
    };
  }

  @Get(':id/revenue')
  @ApiOperation({ summary: 'Get partner revenue analytics' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period for analytics (30d, 90d, 1y)',
  })
  @ApiResponse({
    status: 200,
    description: 'Partner revenue analytics retrieved successfully',
    type: PartnerRevenueAnalyticsDto,
  })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async getPartnerRevenue(
    @Param('id') id: string,
    @Query('period') period: string = '30d',
  ): Promise<PartnerRevenueAnalyticsDto> {
    return this.adminPartnerService.getPartnerRevenue(id, period);
  }
}
