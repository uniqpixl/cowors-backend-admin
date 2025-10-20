import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
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
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import {
  BulkInvoiceOperationDto,
  BulkOperationResponseDto,
  BulkOperationType,
  CreateInvoiceDto,
  Currency,
  ExportFormat,
  ExportInvoiceDto,
  ExportResponseDto,
  GenerateInvoiceDto,
  GetInvoicesDto,
  InvoiceAnalyticsDto,
  InvoiceAnalyticsResponseDto,
  InvoiceReminderDto,
  InvoiceResponseDto,
  InvoiceSettingsDto,
  InvoiceSettingsResponseDto,
  InvoiceStatus,
  InvoiceSummaryResponseDto,
  InvoiceTemplateDto,
  InvoiceTemplateResponseDto,
  InvoiceType,
  PaymentRecordDto,
  PaymentResponseDto,
  PaymentStatus,
  RecurringInvoiceDto,
  RecurringInvoiceResponseDto,
  SendInvoiceDto,
  UpdateInvoiceDto,
} from './dto/enhanced-invoice.dto';
import { EnhancedInvoiceService } from './enhanced-invoice.service';

@ApiTags('Enhanced Invoice Management')
@Controller('invoice/enhanced')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EnhancedInvoiceController {
  constructor(
    private readonly enhancedInvoiceService: EnhancedInvoiceService,
  ) {}

  // Invoice Management
  @Post()
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invoice created successfully',
    type: InvoiceResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createInvoice(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Request() req: any,
  ): Promise<InvoiceResponseDto> {
    return this.enhancedInvoiceService.createInvoice(
      createInvoiceDto,
      req.user.id,
    );
  }

  @Get()
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get invoices with advanced filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoices retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'partnerId', required: false, type: String })
  @ApiQuery({ name: 'bookingId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiQuery({ name: 'type', required: false, enum: InvoiceType })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'minAmount', required: false, type: Number })
  @ApiQuery({ name: 'maxAmount', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  async getInvoices(@Query() queryDto: GetInvoicesDto): Promise<{
    invoices: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.enhancedInvoiceService.getInvoices(queryDto);
    return {
      ...result,
      page: queryDto.page || 1,
      limit: queryDto.limit || 10,
    };
  }

  @Get(':id')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice retrieved successfully',
    type: InvoiceResponseDto,
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getInvoiceById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<InvoiceResponseDto> {
    return this.enhancedInvoiceService.getInvoiceById(id);
  }

  @Put(':id')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Update invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice updated successfully',
    type: InvoiceResponseDto,
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Request() req: any,
  ): Promise<InvoiceResponseDto> {
    return this.enhancedInvoiceService.updateInvoice(
      id,
      updateInvoiceDto,
      req.user.id,
    );
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete invoice' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Invoice deleted successfully',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async deleteInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.enhancedInvoiceService.deleteInvoice(id, req.user.id);
  }

  // Invoice Status Management
  @Patch(':id/send')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Send invoice to customer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice sent successfully',
    type: InvoiceResponseDto,
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async sendInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() sendInvoiceDto: SendInvoiceDto,
    @Request() req: any,
  ): Promise<InvoiceResponseDto> {
    return this.enhancedInvoiceService.sendInvoice(id, req.user.id);
  }

  @Patch(':id/approve')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Approve invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice approved successfully',
    type: InvoiceResponseDto,
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async approveInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<InvoiceResponseDto> {
    return this.enhancedInvoiceService.approveInvoice(id, req.user.id);
  }

  @Patch(':id/reject')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Reject invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice rejected successfully',
    type: InvoiceResponseDto,
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async rejectInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ): Promise<InvoiceResponseDto> {
    return this.enhancedInvoiceService.rejectInvoice(id, reason, req.user.id);
  }

  @Patch(':id/cancel')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Cancel invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice cancelled successfully',
    type: InvoiceResponseDto,
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async cancelInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ): Promise<InvoiceResponseDto> {
    return this.enhancedInvoiceService.cancelInvoice(id, reason, req.user.id);
  }

  @Patch(':id/void')
  @Roles('admin')
  @ApiOperation({ summary: 'Void invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice voided successfully',
    type: InvoiceResponseDto,
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async voidInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ): Promise<InvoiceResponseDto> {
    return this.enhancedInvoiceService.voidInvoice(id, reason, req.user.id);
  }

  // Bulk Operations
  @Post('bulk-operation')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Perform bulk operations on invoices' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
    type: BulkOperationResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async bulkInvoiceOperation(
    @Body() operationDto: BulkInvoiceOperationDto,
    @Request() req: any,
  ): Promise<BulkOperationResponseDto> {
    return this.enhancedInvoiceService.bulkOperation(operationDto, req.user.id);
  }

  // Invoice Generation
  @Post('generate')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Generate invoice from booking or template' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invoice generated successfully',
    type: InvoiceResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async generateInvoice(
    @Body() generateDto: GenerateInvoiceDto,
    @Request() req: any,
  ): Promise<InvoiceResponseDto> {
    // Convert GenerateInvoiceDto to CreateInvoiceDto
    const createDto: CreateInvoiceDto = {
      billTo: {
        name: 'Generated Customer',
        email: 'customer@example.com',
        address: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'Country',
        },
      },
      items: [
        {
          description: 'Generated Item',
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ],
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currency: Currency.USD,
      type: generateDto.type,
      ...generateDto.customData,
    };

    return this.enhancedInvoiceService.createInvoice(createDto, req.user.id);
  }

  @Post('generate-recurring')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Generate recurring invoices' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recurring invoices generated successfully',
  })
  async generateRecurringInvoices(
    @Request() req: any,
  ): Promise<{ generated: number; failed: number; details: any[] }> {
    return this.enhancedInvoiceService.generateRecurringInvoices(req.user.id);
  }

  // Payment Management
  @Post(':id/payments')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Record payment for invoice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment recorded successfully',
    type: PaymentResponseDto,
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async recordPayment(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() paymentDto: PaymentRecordDto,
    @Request() req: any,
  ): Promise<PaymentResponseDto> {
    return this.enhancedInvoiceService.recordPayment(
      { ...paymentDto, invoiceId: id },
      req.user.id,
    );
  }

  @Get(':id/payments')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get payments for invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payments retrieved successfully',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getInvoicePayments(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PaymentResponseDto[]> {
    return this.enhancedInvoiceService.getInvoicePayments(id);
  }

  @Patch(':id/mark-paid')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice marked as paid successfully',
    type: InvoiceResponseDto,
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async markAsPaid(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() paymentDto: PaymentRecordDto,
    @Request() req: any,
  ): Promise<InvoiceResponseDto> {
    return this.enhancedInvoiceService.markAsPaid(id, paymentDto, req.user.id);
  }

  @Patch(':id/mark-overdue')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Mark invoice as overdue' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice marked as overdue successfully',
    type: InvoiceResponseDto,
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async markAsOverdue(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<InvoiceResponseDto> {
    return this.enhancedInvoiceService.markAsOverdue(id, req.user.id);
  }

  // Template Management
  @Post('templates')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Create invoice template' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template created successfully',
    type: InvoiceTemplateResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createTemplate(
    @Body() templateDto: InvoiceTemplateDto,
    @Request() req: any,
  ): Promise<InvoiceTemplateResponseDto> {
    return this.enhancedInvoiceService.createTemplate(templateDto, req.user.id);
  }

  @Get('templates')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get invoice templates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Templates retrieved successfully',
  })
  async getTemplates(): Promise<InvoiceTemplateResponseDto[]> {
    return this.enhancedInvoiceService.getTemplates();
  }

  @Put('templates/:id')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Update invoice template' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template updated successfully',
    type: InvoiceTemplateResponseDto,
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateTemplate(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() templateDto: InvoiceTemplateDto,
    @Request() req: any,
  ): Promise<InvoiceTemplateResponseDto> {
    return this.enhancedInvoiceService.updateTemplate(
      id,
      templateDto,
      req.user.id,
    );
  }

  @Delete('templates/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete invoice template' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Template deleted successfully',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async deleteTemplate(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.enhancedInvoiceService.deleteTemplate(id);
  }

  // Recurring Invoice Management
  @Post('recurring')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Create recurring invoice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Recurring invoice created successfully',
    type: RecurringInvoiceResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createRecurringInvoice(
    @Body() recurringDto: RecurringInvoiceDto,
    @Request() req: any,
  ): Promise<RecurringInvoiceResponseDto> {
    return this.enhancedInvoiceService.createRecurringInvoice(
      recurringDto,
      req.user.id,
    );
  }

  @Get('recurring')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get recurring invoices' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recurring invoices retrieved successfully',
  })
  async getRecurringInvoices(): Promise<RecurringInvoiceResponseDto[]> {
    return this.enhancedInvoiceService.getRecurringInvoices();
  }

  @Patch('recurring/:id/activate')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Activate recurring invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recurring invoice activated successfully',
    type: RecurringInvoiceResponseDto,
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async activateRecurringInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<RecurringInvoiceResponseDto> {
    return this.enhancedInvoiceService.activateRecurringInvoice(
      id,
      req.user.id,
    );
  }

  @Patch('recurring/:id/deactivate')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Deactivate recurring invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recurring invoice deactivated successfully',
    type: RecurringInvoiceResponseDto,
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async deactivateRecurringInvoice(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<RecurringInvoiceResponseDto> {
    return this.enhancedInvoiceService.deactivateRecurringInvoice(
      id,
      req.user.id,
    );
  }

  // Reminder Management
  @Post(':id/reminders')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Send invoice reminder' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reminder sent successfully',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendReminder(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() reminderDto: InvoiceReminderDto,
    @Request() req: any,
  ): Promise<{ sent: boolean; message: string }> {
    return this.enhancedInvoiceService.sendReminder(
      id,
      reminderDto,
      req.user.id,
    );
  }

  @Post('send-overdue-reminders')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Send reminders for all overdue invoices' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Overdue reminders sent successfully',
  })
  async sendOverdueReminders(
    @Request() req: any,
  ): Promise<{ sent: number; failed: number; details: any[] }> {
    return this.enhancedInvoiceService.sendOverdueReminders(req.user.id);
  }

  // Analytics and Reporting
  @Get('analytics/summary')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get invoice summary analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary retrieved successfully',
    type: InvoiceSummaryResponseDto,
  })
  async getInvoiceSummary(): Promise<InvoiceSummaryResponseDto> {
    return this.enhancedInvoiceService.getInvoiceSummary();
  }

  @Post('analytics')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get detailed invoice analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
    type: InvoiceAnalyticsResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getInvoiceAnalytics(
    @Body() analyticsDto: InvoiceAnalyticsDto,
    @Request() req: any,
  ): Promise<InvoiceAnalyticsResponseDto> {
    return this.enhancedInvoiceService.getInvoiceAnalytics(req.user.id);
  }

  @Get('analytics/aging-report')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get invoice aging report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Aging report retrieved successfully',
  })
  async getAgingReport(): Promise<any> {
    return this.enhancedInvoiceService.getAgingReport();
  }

  @Get('analytics/revenue-trends')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get revenue trends' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue trends retrieved successfully',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
  })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  async getRevenueTrends(
    @Query('period') period: string = 'monthly',
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ): Promise<any> {
    return this.enhancedInvoiceService.getRevenueTrends(
      startDate?.toISOString() ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate?.toISOString() || new Date().toISOString(),
    );
  }

  // Export and Download
  @Post('export')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Export invoices' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export initiated successfully',
    type: ExportResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportInvoices(
    @Body() exportDto: ExportInvoiceDto,
    @Request() req: any,
  ): Promise<ExportResponseDto> {
    return this.enhancedInvoiceService.exportInvoices(exportDto, req.user.id);
  }

  @Get('export/:exportId/status')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get export status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export status retrieved successfully',
    type: ExportResponseDto,
  })
  @ApiParam({ name: 'exportId', type: 'string', format: 'uuid' })
  async getExportStatus(
    @Param('exportId', ParseCoworsIdPipe) exportId: string,
  ): Promise<ExportResponseDto> {
    return this.enhancedInvoiceService.getExportStatus(exportId);
  }

  @Get('export/:exportId/download')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Download exported file' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File download URL retrieved successfully',
  })
  @ApiParam({ name: 'exportId', type: 'string', format: 'uuid' })
  async downloadExport(
    @Param('exportId', ParseCoworsIdPipe) exportId: string,
  ): Promise<string> {
    return this.enhancedInvoiceService.downloadExport(exportId);
  }

  @Get(':id/pdf')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Generate and download invoice PDF' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PDF generated successfully',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async generatePdf(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<{ downloadUrl: string }> {
    return this.enhancedInvoiceService.generatePdf(id);
  }

  // Settings Management
  @Get('settings')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get invoice settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings retrieved successfully',
    type: InvoiceSettingsResponseDto,
  })
  async getInvoiceSettings(): Promise<InvoiceSettingsResponseDto> {
    return this.enhancedInvoiceService.getInvoiceSettings();
  }

  @Put('settings')
  @Roles('admin')
  @ApiOperation({ summary: 'Update invoice settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings updated successfully',
    type: InvoiceSettingsResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateInvoiceSettings(
    @Body() settingsDto: InvoiceSettingsDto,
    @Request() req: any,
  ): Promise<InvoiceSettingsResponseDto> {
    return this.enhancedInvoiceService.updateInvoiceSettings(
      settingsDto,
      req.user.id,
    );
  }

  // Utility Methods
  @Get('utils/statuses')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get available invoice statuses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statuses retrieved successfully',
  })
  async getInvoiceStatuses(): Promise<string[]> {
    return this.enhancedInvoiceService.getInvoiceStatuses();
  }

  @Get('utils/types')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get available invoice types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Types retrieved successfully',
  })
  async getInvoiceTypes(): Promise<string[]> {
    return this.enhancedInvoiceService.getInvoiceTypes();
  }

  @Get('utils/payment-statuses')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get available payment statuses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment statuses retrieved successfully',
  })
  async getPaymentStatuses(): Promise<string[]> {
    return this.enhancedInvoiceService.getPaymentStatuses();
  }

  @Post('utils/validate')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Validate invoice data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Validation completed' })
  async validateInvoiceData(
    @Body() data: any,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    return this.enhancedInvoiceService.validateInvoiceData(data);
  }

  @Get('utils/next-number')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get next invoice number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Next invoice number retrieved successfully',
  })
  @ApiQuery({ name: 'type', required: false, enum: InvoiceType })
  async getNextInvoiceNumber(
    @Query('type') type?: InvoiceType,
  ): Promise<{ nextNumber: string }> {
    return this.enhancedInvoiceService.getNextInvoiceNumber(type);
  }

  @Get('customer/:customerId/history')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get customer invoice history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer history retrieved successfully',
  })
  @ApiParam({ name: 'customerId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getCustomerInvoiceHistory(
    @Param('customerId', ParseCoworsIdPipe) customerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ invoices: InvoiceResponseDto[]; total: number }> {
    return this.enhancedInvoiceService.getCustomerInvoiceHistory(
      customerId,
      page,
      limit,
    );
  }

  @Get('partner/:partnerId/history')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get partner invoice history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner history retrieved successfully',
  })
  @ApiParam({ name: 'partnerId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPartnerInvoiceHistory(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ invoices: InvoiceResponseDto[]; total: number }> {
    return this.enhancedInvoiceService.getPartnerInvoiceHistory(
      partnerId,
      page,
      limit,
    );
  }
}
