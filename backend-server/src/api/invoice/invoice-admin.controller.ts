import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/decorators/auth/get-user.decorator';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import {
  BulkInvoiceOperationDto,
  BulkInvoiceOperationType,
  CreateInvoiceDto,
  ExportFormat,
  InvoiceAnalyticsDto,
  InvoiceExportDto,
  InvoiceReportDto,
  InvoiceResponseDto,
  InvoiceSettingsDto,
  InvoiceStatus,
  InvoiceType,
  ReportType,
  UpdateInvoiceDto,
} from './dto/invoice-admin.dto';
import { InvoiceAdminService } from './invoice-admin.service';

@ApiTags('Invoice Admin Management')
@Controller('admin/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvoiceAdminController {
  constructor(private readonly invoiceAdminService: InvoiceAdminService) {}

  // Invoice Management
  @Post()
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Create new invoice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invoice created successfully',
    type: InvoiceResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createInvoice(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @GetUser('id') userId: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceAdminService.createInvoice(createInvoiceDto, userId);
  }

  @Get()
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Get all invoices with advanced filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoices retrieved successfully',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: InvoiceStatus,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: InvoiceType,
    description: 'Filter by type',
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: String,
    description: 'Filter by customer',
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: String,
    description: 'Filter by partner',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: Date,
    description: 'Filter from date',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: Date,
    description: 'Filter to date',
  })
  @ApiQuery({
    name: 'minAmount',
    required: false,
    type: Number,
    description: 'Minimum amount filter',
  })
  @ApiQuery({
    name: 'maxAmount',
    required: false,
    type: Number,
    description: 'Maximum amount filter',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in invoice number or description',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  async getInvoices(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: InvoiceStatus,
    @Query('type') type?: InvoiceType,
    @Query('customerId') customerId?: string,
    @Query('partnerId') partnerId?: string,
    @Query('dateFrom') dateFrom?: Date,
    @Query('dateTo') dateTo?: Date,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<{ invoices: InvoiceResponseDto[]; total: number; summary: any }> {
    return this.invoiceAdminService.getInvoices({
      page,
      limit,
      status,
      type,
      customerId,
      partnerId,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      search,
      sortBy,
      sortOrder,
    });
  }

  // Settings Management - Must come before :id routes
  @Get('settings')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Get invoice settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings retrieved successfully',
    type: InvoiceSettingsDto,
  })
  async getSettings(): Promise<InvoiceSettingsDto> {
    return this.invoiceAdminService.getSettings();
  }

  @Put('settings')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Update invoice settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings updated successfully',
    type: InvoiceSettingsDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateSettings(
    @Body() settingsDto: InvoiceSettingsDto,
    @GetUser('id') userId: string,
  ): Promise<InvoiceSettingsDto> {
    return this.invoiceAdminService.updateSettings(settingsDto, userId);
  }

  @Get(':id')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice retrieved successfully',
    type: InvoiceResponseDto,
  })
  async getInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceAdminService.getInvoice(id);
  }

  @Put(':id')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Update invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice updated successfully',
    type: InvoiceResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @GetUser('id') userId: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceAdminService.updateInvoice(id, updateInvoiceDto, userId);
  }

  @Delete(':id')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Delete invoice' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Invoice deleted successfully',
  })
  async deleteInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return this.invoiceAdminService.deleteInvoice(id, userId);
  }

  // Invoice Status Management
  @Put(':id/status')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Update invoice status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice status updated successfully',
    type: InvoiceResponseDto,
  })
  async updateInvoiceStatus(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('status') status: InvoiceStatus,
    @Body('reason') reason?: string,
    @GetUser('id') userId?: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceAdminService.updateInvoiceStatus(id, status, userId);
  }

  @Post(':id/send')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Send invoice to customer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice sent successfully',
    type: InvoiceResponseDto,
  })
  async sendInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('email') email?: string,
    @Body('message') message?: string,
    @GetUser('id') userId?: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceAdminService.sendInvoice(id, userId);
  }

  @Post(':id/payment')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Record payment for invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment recorded successfully',
    type: InvoiceResponseDto,
  })
  async recordPayment(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('amount') amount: number,
    @Body('paymentMethod') paymentMethod: string,
    @Body('paymentReference') paymentReference?: string,
    @Body('notes') notes?: string,
    @GetUser('id') userId?: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceAdminService.recordPayment(
      id,
      {
        amount,
        paymentMethod,
        paymentReference,
        notes,
      },
      userId,
    );
  }

  @Post(':id/refund')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Process refund for invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Refund processed successfully',
    type: InvoiceResponseDto,
  })
  async processRefund(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('amount') amount: number,
    @Body('reason') reason: string,
    @Body('refundMethod') refundMethod?: string,
    @GetUser('id') userId?: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceAdminService.processRefund(
      id,
      {
        amount,
        reason,
        refundMethod,
      },
      userId,
    );
  }

  // Bulk Operations
  @Post('bulk-operation')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Perform bulk operations on invoices' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async bulkOperation(
    @Body() operationDto: BulkInvoiceOperationDto,
    @GetUser('id') userId: string,
  ): Promise<{ success: boolean; processedCount: number; errors: string[] }> {
    return this.invoiceAdminService.bulkOperation(operationDto, userId);
  }

  @Post('bulk-send')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Send multiple invoices' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bulk send completed' })
  async bulkSendInvoices(
    @Body('invoiceIds') invoiceIds: string[],
    @GetUser('id') userId?: string,
  ): Promise<{ success: boolean; processedCount: number; errors: string[] }> {
    return this.invoiceAdminService.bulkSendInvoices(invoiceIds, userId);
  }

  @Post('bulk-payment')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Record payments for multiple invoices' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk payment recording completed',
  })
  async bulkRecordPayments(
    @Body('payments')
    payments: Array<{
      invoiceId: string;
      amount: number;
      paymentMethod: string;
      paymentReference?: string;
    }>,
    @GetUser('id') userId?: string,
  ): Promise<{ success: boolean; processedCount: number; errors: string[] }> {
    return this.invoiceAdminService.bulkRecordPayments(payments, userId);
  }

  // Analytics
  @Get('analytics/overview')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Get invoice analytics overview' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
    type: InvoiceAnalyticsDto,
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: Date,
    description: 'Analytics from date',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: Date,
    description: 'Analytics to date',
  })
  async getAnalytics(
    @Query('dateFrom') dateFrom?: Date,
    @Query('dateTo') dateTo?: Date,
  ): Promise<InvoiceAnalyticsDto> {
    return this.invoiceAdminService.getAnalytics(dateFrom, dateTo);
  }

  @Get('analytics/revenue-trends')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Get revenue trends analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue trends retrieved successfully',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    description: 'Trend period',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: Date,
    description: 'Trends from date',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: Date,
    description: 'Trends to date',
  })
  async getRevenueTrends(
    @Query('period') period = 'monthly',
    @Query('dateFrom') dateFrom?: Date,
    @Query('dateTo') dateTo?: Date,
  ): Promise<any[]> {
    return this.invoiceAdminService.getRevenueTrends(
      dateFrom,
      dateTo,
      period as 'daily' | 'weekly' | 'monthly',
    );
  }

  @Get('analytics/aging-report')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Get invoice aging report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Aging report retrieved successfully',
  })
  async getAgingReport(): Promise<any> {
    return this.invoiceAdminService.getAgingReport();
  }

  @Get('analytics/customer-summary')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Get customer invoice summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer summary retrieved successfully',
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: String,
    description: 'Specific customer ID',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: Date,
    description: 'Summary from date',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: Date,
    description: 'Summary to date',
  })
  async getCustomerSummary(
    @Query('customerId') customerId?: string,
    @Query('dateFrom') dateFrom?: Date,
    @Query('dateTo') dateTo?: Date,
  ): Promise<any> {
    return this.invoiceAdminService.getCustomerSummary(
      customerId,
      dateFrom,
      dateTo,
    );
  }

  // Export and Reporting
  @Post('export')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Export invoice data' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Export initiated successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportData(
    @Body() exportDto: InvoiceExportDto,
    @GetUser('id') userId: string,
  ): Promise<{ exportId: string }> {
    return this.invoiceAdminService.exportData(exportDto, userId);
  }

  @Get('export/:exportId/status')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Get export status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export status retrieved successfully',
  })
  async getExportStatus(
    @Param('exportId', ParseCoworsIdPipe) exportId: string,
  ): Promise<any> {
    return this.invoiceAdminService.getExportStatus(exportId);
  }

  @Get('export/:exportId/download')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Download exported file' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File download initiated',
  })
  async downloadExport(
    @Param('exportId', ParseCoworsIdPipe) exportId: string,
  ): Promise<any> {
    return this.invoiceAdminService.downloadExport(exportId);
  }

  // Report Generation
  @Post('reports/generate')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Generate invoice report' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Report generation initiated',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async generateReport(
    @Body() reportDto: InvoiceReportDto,
    @GetUser('id') userId: string,
  ): Promise<{ reportId: string }> {
    return this.invoiceAdminService.generateReport(reportDto, userId);
  }

  @Get('reports/:reportId/status')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Get report generation status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report status retrieved successfully',
  })
  async getReportStatus(
    @Param('reportId', ParseCoworsIdPipe) reportId: string,
  ): Promise<any> {
    return this.invoiceAdminService.getReportStatus(reportId);
  }

  @Get('reports/:reportId/download')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Download generated report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report download initiated',
  })
  async downloadReport(
    @Param('reportId', ParseCoworsIdPipe) reportId: string,
  ): Promise<any> {
    return this.invoiceAdminService.downloadReport(reportId);
  }

  // Template Management
  @Get('templates/list')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Get available invoice templates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Templates retrieved successfully',
  })
  async getTemplates(): Promise<any[]> {
    return this.invoiceAdminService.getTemplates();
  }

  @Post('templates/:templateId/preview')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Preview invoice with template' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preview generated successfully',
  })
  async previewTemplate(
    @Param('templateId') templateId: string,
    @Body() sampleData: any,
  ): Promise<{ previewUrl: string }> {
    return this.invoiceAdminService.previewTemplate(templateId, sampleData);
  }

  @Get('number-sequences/next')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Get next invoice number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Next invoice number retrieved',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: InvoiceType,
    description: 'Invoice type',
  })
  async getNextInvoiceNumber(
    @Query('type') type?: InvoiceType,
  ): Promise<{ nextNumber: string }> {
    return this.invoiceAdminService.getNextInvoiceNumber(type);
  }

  @Post('validate')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Validate invoice data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Validation completed' })
  async validateInvoiceData(
    @Body() invoiceData: any,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    return this.invoiceAdminService.validateInvoiceData(invoiceData);
  }

  @Get('audit-trail/:id')
  @Roles('Admin', 'SuperAdmin')
  @ApiOperation({ summary: 'Get invoice audit trail' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit trail retrieved successfully',
  })
  async getAuditTrail(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<any[]> {
    return this.invoiceAdminService.getAuditTrail(id);
  }
}
