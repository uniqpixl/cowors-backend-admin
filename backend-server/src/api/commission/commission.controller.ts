import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { CommissionService } from './commission.service';
import {
  BulkCommissionUpdateDto,
  CommissionPayoutResponseDto,
  CreateCommissionCalculationDto,
  CreateCommissionPayoutDto,
  CreatePartnerCommissionDto,
  GetCommissionCalculationsDto,
  GetCommissionPayoutsDto,
  GetCommissionRulesDto,
  GetPartnerCommissionsDto,
  PartnerCommissionResponseDto,
} from './dto/commission-tracking.dto';
import {
  CalculateCommissionDto,
  CalculationMethod,
  CommissionAnalyticsDto,
  CommissionCalculationResponseDto,
  CommissionExportDto,
  CommissionPaymentResponseDto,
  CommissionReportDto,
  CommissionReportResponseDto,
  CommissionRuleResponseDto,
  CommissionSettingsDto,
  CommissionStatus,
  CommissionType,
  CreateCommissionRuleDto,
  ExportFormat,
  PaymentStatus,
  ProcessCommissionPaymentDto,
  ReportType,
  UpdateCommissionRuleDto,
} from './dto/commission.dto';
import {
  CommissionCalculationEntity,
  CommissionExportEntity,
  CommissionRuleEntity,
  CommissionSettingsEntity,
} from './entities/commission.entity';

@ApiTags('Commission Management')
@Controller('commission')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  // Commission Rule Management
  @Post('rules')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create commission rule' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Commission rule created successfully',
    type: CommissionRuleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createCommissionRule(
    @Body() createDto: CreateCommissionRuleDto,
    @Request() req: any,
  ): Promise<CommissionRuleResponseDto> {
    return this.commissionService.createCommissionRule(createDto, req.user.id);
  }

  @Put('rules/:ruleId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update commission rule' })
  @ApiParam({ name: 'ruleId', description: 'Commission rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission rule updated successfully',
    type: CommissionRuleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Commission rule not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateCommissionRule(
    @Param('ruleId', ParseCoworsIdPipe) ruleId: string,
    @Body() updateDto: UpdateCommissionRuleDto,
    @Request() req: any,
  ): Promise<CommissionRuleResponseDto> {
    return this.commissionService.updateCommissionRule(
      ruleId,
      updateDto,
      req.user.id,
    );
  }

  @Get('rules/:ruleId')
  @Roles('admin', 'super_admin', 'partner')
  @ApiOperation({ summary: 'Get commission rule by ID' })
  @ApiParam({ name: 'ruleId', description: 'Commission rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission rule retrieved successfully',
    type: CommissionRuleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Commission rule not found',
  })
  async getCommissionRule(
    @Param('ruleId', ParseCoworsIdPipe) ruleId: string,
  ): Promise<CommissionRuleResponseDto> {
    return this.commissionService.getCommissionRule(ruleId);
  }

  @Get('rules')
  @Roles('admin', 'super_admin', 'partner')
  @ApiOperation({ summary: 'Get commission rules with filters' })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    description: 'Filter by partner ID',
  })
  @ApiQuery({
    name: 'commissionType',
    required: false,
    enum: CommissionType,
    description: 'Filter by commission type',
  })
  @ApiQuery({
    name: 'calculationMethod',
    required: false,
    enum: CalculationMethod,
    description: 'Filter by calculation method',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'effectiveDate',
    required: false,
    description: 'Filter by effective date (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission rules retrieved successfully',
    type: [CommissionRuleResponseDto],
  })
  async getCommissionRules(
    @Query('partnerId') partnerId?: string,
    @Query('commissionType') commissionType?: CommissionType,
    @Query('calculationMethod') calculationMethod?: CalculationMethod,
    @Query('isActive') isActive?: boolean,
    @Query('effectiveDate') effectiveDate?: string,
  ): Promise<CommissionRuleResponseDto[]> {
    const filters = {
      partnerId,
      commissionType,
      calculationMethod,
      isActive,
      effectiveDate,
    };
    return this.commissionService.getCommissionRules(filters);
  }

  @Delete('rules/:ruleId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Delete commission rule' })
  @ApiParam({ name: 'ruleId', description: 'Commission rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission rule deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Commission rule not found',
  })
  async deleteCommissionRule(
    @Param('ruleId', ParseCoworsIdPipe) ruleId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.commissionService.deleteCommissionRule(ruleId, req.user.id);
  }

  // Commission Transaction Management
  @Post('calculations')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Calculate commission for booking' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Commission calculation created successfully',
    type: CommissionCalculationResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async calculateCommission(
    @Body() createDto: CreateCommissionCalculationDto,
    @Request() req: any,
  ): Promise<CommissionCalculationResponseDto> {
    return this.commissionService.calculateCommissionForBooking(
      createDto.transactionId,
      req.user.id,
    );
  }

  @Get('calculations/:id')
  @Roles('admin', 'super_admin', 'partner')
  @ApiOperation({ summary: 'Get commission calculation by ID' })
  @ApiParam({ name: 'id', description: 'Commission calculation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission calculation retrieved successfully',
    type: CommissionCalculationResponseDto,
  })
  async getCommissionCalculation(
    @Param('id', ParseCoworsIdPipe) calculationId: string,
  ): Promise<CommissionCalculationResponseDto> {
    // This method needs to be implemented in the service
    throw new Error('Method not implemented');
  }

  @Get('calculations')
  @Roles('admin', 'super_admin', 'partner')
  @ApiOperation({ summary: 'Get commission calculations with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'partnerId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: CommissionStatus })
  @ApiResponse({
    status: 200,
    description: 'Commission calculations retrieved successfully',
    type: [CommissionCalculationResponseDto],
  })
  async getCommissionCalculations(@Query() filters: any): Promise<{
    calculations: CommissionCalculationResponseDto[];
    total: number;
  }> {
    return this.commissionService.getCalculations(
      filters.page || 1,
      filters.limit || 10,
      filters,
    );
  }

  // Partner Commission Management
  @Post('partners')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create partner commission' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Partner commission created successfully',
    type: PartnerCommissionResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createPartnerCommission(
    @Body() createDto: CreatePartnerCommissionDto,
    @Request() req: any,
  ): Promise<PartnerCommissionResponseDto> {
    return this.commissionService.createPartnerCommission(
      createDto,
      req.user.id,
    );
  }

  @Get('partners/:partnerId/summary')
  @Roles('admin', 'super_admin', 'partner')
  @ApiOperation({ summary: 'Get partner commission summary' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner commission summary retrieved successfully',
    type: PartnerCommissionResponseDto,
  })
  async getPartnerCommissionSummary(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
  ): Promise<PartnerCommissionResponseDto> {
    return this.commissionService.getPartnerCommissionSummary(partnerId);
  }

  // Analytics and Reporting
  @Get('analytics')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get commission analytics' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for analytics (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for analytics (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    description: 'Filter by partner ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission analytics retrieved successfully',
    type: CommissionAnalyticsDto,
  })
  async getCommissionAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('partnerId') partnerId?: string,
  ): Promise<CommissionAnalyticsDto> {
    const filters = { startDate, endDate, partnerId };
    return this.commissionService.getCommissionAnalytics(filters);
  }

  @Post('export')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Export commission data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission data export initiated successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportCommissionData(
    @Body() exportDto: CommissionExportDto,
    @Request() req: any,
  ): Promise<{ exportId: string; downloadUrl: string }> {
    return this.commissionService.exportCommissionData(exportDto, req.user.id);
  }

  @Get('reports/:reportId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get commission report' })
  @ApiParam({ name: 'reportId', description: 'Commission report ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission report retrieved successfully',
    type: CommissionReportResponseDto,
  })
  async getCommissionReport(
    @Param('reportId', ParseCoworsIdPipe) reportId: string,
  ): Promise<CommissionReportResponseDto> {
    return this.commissionService.getCommissionReport(reportId);
  }

  @Post('reports/generate')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Generate commission report' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Commission report generation initiated successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async generateCommissionReport(
    @Body() reportDto: CommissionReportDto,
    @Request() req: any,
  ): Promise<{ reportId: string }> {
    return this.commissionService.generateCommissionReport(
      reportDto,
      req.user.id,
    );
  }

  // Settings Management
  @Get('settings')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get commission settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission settings retrieved successfully',
    type: CommissionSettingsDto,
  })
  async getCommissionSettings(): Promise<CommissionSettingsDto> {
    return this.commissionService.getCommissionSettings();
  }

  @Put('settings')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update commission settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission settings updated successfully',
    type: CommissionSettingsDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateCommissionSettings(
    @Body() settingsDto: CommissionSettingsDto,
    @Request() req: any,
  ): Promise<CommissionSettingsDto> {
    return this.commissionService.updateCommissionSettings(
      settingsDto,
      req.user.id,
    );
  }
}
