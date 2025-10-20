import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format, startOfWeek } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';
import {
  Between,
  In,
  LessThan,
  MoreThan,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
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
  PaymentStatus,
  ReportType,
  UpdateInvoiceDto,
} from './dto/invoice-admin.dto';
import {
  InvoiceAuditTrailEntity,
  InvoiceEntity,
  InvoiceExportEntity,
  InvoicePaymentEntity,
  InvoiceRefundEntity,
  InvoiceReportEntity,
  InvoiceSettingsEntity,
} from './entities/invoice-admin.entity';

@Injectable()
export class InvoiceAdminService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(InvoicePaymentEntity)
    private paymentRepository: Repository<InvoicePaymentEntity>,
    @InjectRepository(InvoiceRefundEntity)
    private refundRepository: Repository<InvoiceRefundEntity>,
    @InjectRepository(InvoiceAuditTrailEntity)
    private auditRepository: Repository<InvoiceAuditTrailEntity>,
    @InjectRepository(InvoiceExportEntity)
    private exportRepository: Repository<InvoiceExportEntity>,
    @InjectRepository(InvoiceReportEntity)
    private reportRepository: Repository<InvoiceReportEntity>,
    @InjectRepository(InvoiceSettingsEntity)
    private settingsRepository: Repository<InvoiceSettingsEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
    @InjectRepository(PartnerEntity)
    private partnerRepository: Repository<PartnerEntity>,
  ) {}

  // Invoice Management
  async createInvoice(
    createInvoiceDto: CreateInvoiceDto,
    userId: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = this.invoiceRepository.create({
      ...createInvoiceDto,
      createdBy: userId,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);
    await this.createAuditTrail(
      savedInvoice.id,
      'CREATED',
      'Invoice created',
      null,
      savedInvoice,
      userId,
    );

    return this.mapToResponseDto(savedInvoice);
  }

  async updateInvoice(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
    userId: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.findInvoiceById(id);
    const oldValues = { ...invoice };

    Object.assign(invoice, updateInvoiceDto);
    invoice.updatedBy = userId;

    const updatedInvoice = await this.invoiceRepository.save(invoice);
    await this.createAuditTrail(
      id,
      'UPDATED',
      'Invoice updated',
      oldValues,
      updatedInvoice,
      userId,
    );

    return this.mapToResponseDto(updatedInvoice);
  }

  async getInvoice(id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.findInvoiceById(id, [
      'payments',
      'refunds',
      'partner',
      'booking',
    ]);
    return this.mapToResponseDto(invoice);
  }

  async getInvoices(params: {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    type?: InvoiceType;
    customerId?: string;
    partnerId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{
    invoices: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
    summary: any;
  }> {
    const {
      page = 1,
      limit = 10,
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
    } = params;
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.payments', 'payments')
      .leftJoinAndSelect('invoice.refunds', 'refunds')
      .leftJoinAndSelect('invoice.partner', 'partner')
      .leftJoinAndSelect('invoice.booking', 'booking');

    const filters = {
      status: status ? [status] : undefined,
      type: type ? [type] : undefined,
      customerId,
      partnerId,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      search,
    };

    this.applyFilters(queryBuilder, filters);

    // Apply sorting
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder || 'DESC';
    queryBuilder.orderBy(`invoice.${sortField}`, sortDirection);

    const [invoices, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      invoices: invoices.map((invoice) => this.mapToResponseDto(invoice)),
      total,
      page,
      limit,
      summary: {
        totalAmount: invoices.reduce(
          (sum, inv) => sum + Number(inv.totalAmount),
          0,
        ),
        paidAmount: invoices.reduce(
          (sum, inv) => sum + Number(inv.paidAmount),
          0,
        ),
        outstandingAmount: invoices.reduce(
          (sum, inv) => sum + Number(inv.outstandingAmount),
          0,
        ),
      },
    };
  }

  async deleteInvoice(id: string, userId: string): Promise<void> {
    const invoice = await this.findInvoiceById(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot delete paid invoices');
    }

    await this.createAuditTrail(
      id,
      'DELETED',
      'Invoice deleted',
      invoice,
      null,
      userId,
    );
    await this.invoiceRepository.remove(invoice);
  }

  // Status Management
  async updateInvoiceStatus(
    id: string,
    status: InvoiceStatus,
    userId: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.findInvoiceById(id);
    const oldStatus = invoice.status;

    invoice.status = status;
    invoice.updatedBy = userId;

    if (status === InvoiceStatus.SENT && !invoice.sentAt) {
      invoice.sentAt = new Date();
    }

    if (status === InvoiceStatus.PAID && !invoice.paidAt) {
      invoice.paidAt = new Date();
    }

    const updatedInvoice = await this.invoiceRepository.save(invoice);
    await this.createAuditTrail(
      id,
      'STATUS_UPDATED',
      `Status changed from ${oldStatus} to ${status}`,
      { status: oldStatus },
      { status },
      userId,
    );

    return this.mapToResponseDto(updatedInvoice);
  }

  async sendInvoice(id: string, userId: string): Promise<InvoiceResponseDto> {
    const invoice = await this.findInvoiceById(id);

    if (invoice.status === InvoiceStatus.DRAFT) {
      invoice.status = InvoiceStatus.SENT;
      invoice.sentAt = new Date();
      invoice.updatedBy = userId;

      const updatedInvoice = await this.invoiceRepository.save(invoice);
      await this.createAuditTrail(
        id,
        'SENT',
        'Invoice sent to customer',
        null,
        null,
        userId,
      );

      // TODO: Implement email sending logic

      return this.mapToResponseDto(updatedInvoice);
    }

    throw new BadRequestException('Only draft invoices can be sent');
  }

  // Payment Management
  async recordPayment(
    invoiceId: string,
    paymentData: {
      amount: number;
      paymentMethod: string;
      paymentReference?: string;
      transactionId?: string;
      notes?: string;
      paymentDetails?: Record<string, any>;
    },
    userId: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.findInvoiceById(invoiceId);

    if (paymentData.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    if (paymentData.amount > invoice.outstandingAmount) {
      throw new BadRequestException(
        'Payment amount cannot exceed outstanding amount',
      );
    }

    const payment = this.paymentRepository.create({
      invoiceId,
      ...paymentData,
      status: PaymentStatus.COMPLETED,
      paymentDate: new Date(),
      processedDate: new Date(),
      createdBy: userId,
    });

    await this.paymentRepository.save(payment);

    // Update invoice amounts
    invoice.paidAmount += paymentData.amount;
    invoice.outstandingAmount = invoice.totalAmount - invoice.paidAmount;

    // Update status based on payment
    if (invoice.outstandingAmount <= 0) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paidAt = new Date();
    } else if (invoice.paidAmount > 0) {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    }

    invoice.updatedBy = userId;
    const updatedInvoice = await this.invoiceRepository.save(invoice);

    await this.createAuditTrail(
      invoiceId,
      'PAYMENT_RECORDED',
      `Payment of ${paymentData.amount} recorded`,
      null,
      {
        paymentAmount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
      },
      userId,
    );

    return this.mapToResponseDto(updatedInvoice);
  }

  async processRefund(
    invoiceId: string,
    refundData: {
      amount: number;
      reason: string;
      refundMethod?: string;
      notes?: string;
    },
    userId: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.findInvoiceById(invoiceId);

    if (refundData.amount <= 0) {
      throw new BadRequestException('Refund amount must be greater than 0');
    }

    if (refundData.amount > invoice.paidAmount) {
      throw new BadRequestException('Refund amount cannot exceed paid amount');
    }

    const refund = this.refundRepository.create({
      invoiceId,
      ...refundData,
      status: 'completed',
      refundDate: new Date(),
      processedDate: new Date(),
      createdBy: userId,
    });

    await this.refundRepository.save(refund);

    // Update invoice amounts
    invoice.paidAmount -= refundData.amount;
    invoice.outstandingAmount = invoice.totalAmount - invoice.paidAmount;

    // Update status
    if (invoice.paidAmount <= 0) {
      invoice.status = InvoiceStatus.REFUNDED;
    } else {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    }

    invoice.updatedBy = userId;
    const updatedInvoice = await this.invoiceRepository.save(invoice);

    await this.createAuditTrail(
      invoiceId,
      'REFUND_PROCESSED',
      `Refund of ${refundData.amount} processed: ${refundData.reason}`,
      null,
      { refundAmount: refundData.amount, reason: refundData.reason },
      userId,
    );

    return this.mapToResponseDto(updatedInvoice);
  }

  // Bulk Operations
  async bulkOperation(
    operationDto: BulkInvoiceOperationDto,
    userId: string,
  ): Promise<{ success: boolean; processedCount: number; errors: string[] }> {
    const { operation, invoiceIds, data, reason } = operationDto;
    const results = { success: 0, failed: 0, errors: [] };

    for (const invoiceId of invoiceIds) {
      try {
        switch (operation) {
          case BulkInvoiceOperationType.UPDATE_STATUS:
            if (data?.status) {
              await this.updateInvoiceStatus(invoiceId, data.status, userId);
            }
            break;

          case BulkInvoiceOperationType.SEND_INVOICES:
            await this.sendInvoice(invoiceId, userId);
            break;

          case BulkInvoiceOperationType.RECORD_PAYMENTS:
            if (data?.paymentMethod && data?.amount) {
              await this.recordPayment(
                invoiceId,
                {
                  amount: data.amount,
                  paymentMethod: data.paymentMethod,
                  notes: reason,
                },
                userId,
              );
            }
            break;

          case BulkInvoiceOperationType.PROCESS_REFUNDS:
            if (data?.amount && data?.reason) {
              await this.processRefund(
                invoiceId,
                {
                  amount: data.amount,
                  reason: data.reason,
                  notes: reason,
                },
                userId,
              );
            }
            break;

          case BulkInvoiceOperationType.DELETE_INVOICES:
            await this.deleteInvoice(invoiceId, userId);
            break;

          case BulkInvoiceOperationType.APPLY_DISCOUNT:
            if (data?.discountPercentage) {
              await this.updateInvoice(
                invoiceId,
                { discountPercentage: data.discountPercentage },
                userId,
              );
            }
            break;

          case BulkInvoiceOperationType.UPDATE_DUE_DATE:
            if (data?.dueDate) {
              await this.updateInvoice(
                invoiceId,
                { dueDate: data.dueDate },
                userId,
              );
            }
            break;

          default:
            throw new BadRequestException(
              `Unsupported operation: ${operation}`,
            );
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Invoice ${invoiceId}: ${error.message}`);
      }
    }

    return {
      success: results.success > 0,
      processedCount: results.success,
      errors: results.errors,
    };
  }

  // Analytics and Reporting
  async getAnalytics(
    dateFrom?: Date,
    dateTo?: Date,
    filters?: {
      type?: InvoiceType[];
      status?: InvoiceStatus[];
      partnerId?: string;
    },
  ): Promise<InvoiceAnalyticsDto> {
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice');

    if (dateFrom && dateTo) {
      queryBuilder.andWhere(
        'invoice.invoiceDate BETWEEN :dateFrom AND :dateTo',
        { dateFrom, dateTo },
      );
    }

    if (filters?.type?.length) {
      queryBuilder.andWhere('invoice.type IN (:...types)', {
        types: filters.type,
      });
    }

    if (filters?.status?.length) {
      queryBuilder.andWhere('invoice.status IN (:...statuses)', {
        statuses: filters.status,
      });
    }

    if (filters?.partnerId) {
      queryBuilder.andWhere('invoice.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    const invoices = await queryBuilder.getMany();

    // Calculate basic metrics
    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + Number(inv.paidAmount),
      0,
    );
    const totalOutstanding = invoices.reduce(
      (sum, inv) => sum + Number(inv.outstandingAmount),
      0,
    );
    const totalOverdue = invoices
      .filter((inv) => inv.status === InvoiceStatus.OVERDUE)
      .reduce((sum, inv) => sum + Number(inv.outstandingAmount), 0);

    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(
      (inv) => inv.status === InvoiceStatus.PAID,
    ).length;
    const overdueInvoices = invoices.filter(
      (inv) => inv.status === InvoiceStatus.OVERDUE,
    ).length;

    const averageInvoiceAmount =
      totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    // Calculate average payment time
    const paidInvoicesWithDates = invoices.filter(
      (inv) => inv.paidAt && inv.invoiceDate,
    );
    const averagePaymentTime =
      paidInvoicesWithDates.length > 0
        ? paidInvoicesWithDates.reduce((sum, inv) => {
            const days = Math.ceil(
              (inv.paidAt!.getTime() - inv.invoiceDate.getTime()) /
                (1000 * 60 * 60 * 24),
            );
            return sum + days;
          }, 0) / paidInvoicesWithDates.length
        : 0;

    // Revenue by month
    const revenueByMonth = this.calculateRevenueByMonth(invoices);

    // Top customers
    const topCustomers = this.calculateTopCustomers(invoices);

    // Status distribution
    const statusDistribution = this.calculateStatusDistribution(invoices);

    // Revenue by type
    const revenueByType = this.calculateRevenueByType(invoices);

    // Payment method distribution
    const paymentMethodDistribution =
      await this.calculatePaymentMethodDistribution(
        invoices.map((inv) => inv.id),
      );

    return {
      totalRevenue,
      totalOutstanding,
      totalOverdue,
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      averageInvoiceAmount,
      averagePaymentTime,
      revenueByMonth,
      topCustomers,
      statusDistribution,
      revenueByType,
      paymentMethodDistribution,
    };
  }

  // Export and Download
  async exportInvoices(
    exportDto: InvoiceExportDto,
    userId: string,
  ): Promise<{ exportId: string }> {
    const exportRecord = this.exportRepository.create({
      exportType: exportDto.exportType,
      format: exportDto.format,
      filters: exportDto.filters,
      parameters: {
        fields: exportDto.fields,
        includeLineItems: exportDto.includeLineItems,
        includePayments: exportDto.includePayments,
      },
      status: 'pending',
      createdBy: userId,
    });

    const savedExport = await this.exportRepository.save(exportRecord);

    // Process export asynchronously
    this.processExport(savedExport.id).catch(console.error);

    return { exportId: savedExport.id };
  }

  async getExportStatus(exportId: string): Promise<InvoiceExportEntity> {
    const exportRecord = await this.exportRepository.findOne({
      where: { id: exportId },
    });
    if (!exportRecord) {
      throw new NotFoundException('Export not found');
    }
    return exportRecord;
  }

  // Report Generation
  async generateReport(
    reportDto: InvoiceReportDto,
    userId: string,
  ): Promise<{ reportId: string }> {
    const reportRecord = this.reportRepository.create({
      reportType: reportDto.reportType,
      format: reportDto.format,
      parameters: reportDto.parameters,
      filters: {
        dateFrom: reportDto.dateFrom,
        dateTo: reportDto.dateTo,
        customerIds: reportDto.customerIds,
        partnerIds: reportDto.partnerIds,
      },
      status: 'pending',
      createdBy: userId,
    });

    const savedReport = await this.reportRepository.save(reportRecord);

    // Process report asynchronously
    this.processReport(savedReport.id).catch(console.error);

    return { reportId: savedReport.id };
  }

  async getReportStatus(reportId: string): Promise<InvoiceReportEntity> {
    const reportRecord = await this.reportRepository.findOne({
      where: { id: reportId },
    });
    if (!reportRecord) {
      throw new NotFoundException('Report not found');
    }
    return reportRecord;
  }

  // Settings Management
  async getSettings(): Promise<InvoiceSettingsDto> {
    try {
      console.log('getSettings called');
      console.log('settingsRepository:', !!this.settingsRepository);

      if (!this.settingsRepository) {
        console.error('settingsRepository is not injected');
        throw new Error('Settings repository not available');
      }

      console.log('Attempting to find settings...');
      const settings = await this.settingsRepository.findOne({
        where: {},
        order: { createdAt: 'DESC' },
      });
      console.log('Settings found:', !!settings);

      if (!settings) {
        console.log('No settings found, returning defaults');
        // Return default settings structure that matches InvoiceSettingsDto
        return {
          defaultPaymentTerms: 30,
          defaultCurrency: 'INR',
          defaultTaxRate: 18.0,
          autoSendInvoices: false,
          sendPaymentReminders: true,
          paymentReminderDays: [7, 3, 1],
          latePaymentFeePercentage: 0,
          invoiceNumberPrefix: 'INV',
          invoiceNumberFormat: 'INV-{YYYY}-{MM}-{####}',
        };
      }

      console.log('Settings entity found, mapping to DTO...');
      // Map entity to DTO properly
      return {
        defaultTemplate: settings.defaultTemplate,
        defaultPaymentTerms: settings.defaultPaymentTerms || 30,
        defaultCurrency: settings.defaultCurrency || 'INR',
        defaultTaxRate: settings.defaultTaxRate
          ? Number(settings.defaultTaxRate)
          : 18.0,
        autoSendInvoices: settings.autoSendInvoices || false,
        sendPaymentReminders: settings.sendPaymentReminders !== false,
        paymentReminderDays: settings.paymentReminderDays || [7, 3, 1],
        latePaymentFeePercentage: settings.latePaymentFeePercentage
          ? Number(settings.latePaymentFeePercentage)
          : 0,
        invoiceNumberPrefix: settings.invoiceNumberPrefix || 'INV',
        invoiceNumberFormat:
          settings.invoiceNumberFormat || 'INV-{YYYY}-{MM}-{####}',
        companyInfo: settings.companyInfo,
        emailTemplates: settings.emailTemplates,
        integrations: settings.integrations,
        notifications: settings.notifications,
      };
    } catch (error) {
      console.error('Error in getSettings:', error);
      console.error('Error stack:', error.stack);
      // Return default settings instead of throwing error
      console.log('Returning default settings due to error');
      return {
        defaultPaymentTerms: 30,
        defaultCurrency: 'INR',
        defaultTaxRate: 18.0,
        autoSendInvoices: false,
        sendPaymentReminders: true,
        paymentReminderDays: [7, 3, 1],
        latePaymentFeePercentage: 0,
        invoiceNumberPrefix: 'INV',
        invoiceNumberFormat: 'INV-{YYYY}-{MM}-{####}',
      };
    }
  }

  async updateSettings(
    settingsDto: InvoiceSettingsDto,
    userId: string,
  ): Promise<InvoiceSettingsDto> {
    let settings = await this.settingsRepository.findOne({ where: {} });

    if (settings) {
      Object.assign(settings, settingsDto);
      settings.updatedBy = userId;
    } else {
      settings = this.settingsRepository.create({
        ...settingsDto,
        createdBy: userId,
      });
    }

    const savedSettings = await this.settingsRepository.save(settings);
    return savedSettings;
  }

  // Helper Methods
  private async findInvoiceById(
    id: string,
    relations: string[] = [],
  ): Promise<InvoiceEntity> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations,
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<InvoiceEntity>,
    filters?: {
      status?: InvoiceStatus[];
      type?: InvoiceType[];
      customerId?: string;
      partnerId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      minAmount?: number;
      maxAmount?: number;
      search?: string;
    },
  ): void {
    if (!filters) return;

    if (filters.status?.length) {
      queryBuilder.andWhere('invoice.status IN (:...statuses)', {
        statuses: filters.status,
      });
    }

    if (filters.type?.length) {
      queryBuilder.andWhere('invoice.type IN (:...types)', {
        types: filters.type,
      });
    }

    if (filters.customerId) {
      queryBuilder.andWhere('invoice.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }

    if (filters.partnerId) {
      queryBuilder.andWhere('invoice.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere(
        'invoice.invoiceDate BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        },
      );
    }

    if (filters.minAmount !== undefined) {
      queryBuilder.andWhere('invoice.totalAmount >= :minAmount', {
        minAmount: filters.minAmount,
      });
    }

    if (filters.maxAmount !== undefined) {
      queryBuilder.andWhere('invoice.totalAmount <= :maxAmount', {
        maxAmount: filters.maxAmount,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(invoice.invoiceNumber ILIKE :search OR invoice.customerName ILIKE :search OR invoice.customerEmail ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
  }

  private async createAuditTrail(
    invoiceId: string,
    action: string,
    description: string,
    oldValues: any,
    newValues: any,
    userId: string,
  ): Promise<void> {
    const auditTrail = this.auditRepository.create({
      invoiceId,
      action,
      description,
      oldValues,
      newValues,
      performedBy: userId,
    });

    await this.auditRepository.save(auditTrail);
  }

  private mapToResponseDto(invoice: InvoiceEntity): InvoiceResponseDto {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      status: invoice.status,
      customer: {
        id: invoice.customerId,
        name: invoice.customerName,
        email: invoice.customerEmail,
        phone: invoice.customerPhone,
        address: invoice.customerAddress,
        taxId: invoice.customerTaxId,
      },
      partner: invoice.partner
        ? {
            id: invoice.partner.id,
            name: invoice.partner.contactInfo?.email || 'Unknown',
            email: invoice.partner.contactInfo?.email,
          }
        : undefined,
      booking: invoice.booking
        ? {
            id: invoice.booking.id,
            spaceId: invoice.booking.spaceOption?.spaceId,
            spaceName: 'Unknown Space',
            startDate: new Date(),
            endDate: new Date(),
          }
        : undefined,
      lineItems: invoice.lineItems,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      discountAmount: Number(invoice.discountAmount),
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      outstandingAmount: Number(invoice.outstandingAmount),
      currency: invoice.currency,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      sentDate: invoice.sentAt,
      paidDate: invoice.paidAt,
      notes: invoice.notes,
      terms: invoice.terms,
      pdfUrl: invoice.pdfUrl,
      payments:
        invoice.payments?.map((payment) => ({
          id: payment.id,
          amount: Number(payment.amount),
          paymentMethod: payment.paymentMethod,
          paymentReference: payment.paymentReference,
          status: payment.status,
          processedDate: payment.processedDate || payment.paymentDate,
          notes: payment.notes,
        })) || [],
      refunds:
        invoice.refunds?.map((refund) => ({
          id: refund.id,
          amount: Number(refund.amount),
          reason: refund.reason,
          refundMethod: refund.refundMethod,
          processedDate: refund.processedDate || refund.refundDate,
          status: refund.status,
        })) || [],
      metadata: invoice.metadata,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      createdBy: invoice.createdBy,
      updatedBy: invoice.updatedBy,
    };
  }

  // Analytics Helper Methods
  private calculateRevenueByMonth(
    invoices: InvoiceEntity[],
  ): Array<{ month: string; revenue: number; invoiceCount: number }> {
    const monthlyData = new Map<string, { revenue: number; count: number }>();

    invoices.forEach((invoice) => {
      const month = format(invoice.invoiceDate, 'yyyy-MM');
      const existing = monthlyData.get(month) || { revenue: 0, count: 0 };
      existing.revenue += Number(invoice.paidAmount);
      existing.count += 1;
      monthlyData.set(month, existing);
    });

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      invoiceCount: data.count,
    }));
  }

  private calculateTopCustomers(invoices: InvoiceEntity[]): Array<{
    customerId: string;
    customerName: string;
    totalRevenue: number;
    invoiceCount: number;
  }> {
    const customerData = new Map<
      string,
      { name: string; revenue: number; count: number }
    >();

    invoices.forEach((invoice) => {
      const existing = customerData.get(invoice.customerId) || {
        name: invoice.customerName,
        revenue: 0,
        count: 0,
      };
      existing.revenue += Number(invoice.paidAmount);
      existing.count += 1;
      customerData.set(invoice.customerId, existing);
    });

    return Array.from(customerData.entries())
      .map(([customerId, data]) => ({
        customerId,
        customerName: data.name,
        totalRevenue: data.revenue,
        invoiceCount: data.count,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
  }

  private calculateStatusDistribution(
    invoices: InvoiceEntity[],
  ): Array<{ status: InvoiceStatus; count: number; totalAmount: number }> {
    const statusData = new Map<
      InvoiceStatus,
      { count: number; amount: number }
    >();

    invoices.forEach((invoice) => {
      const existing = statusData.get(invoice.status) || {
        count: 0,
        amount: 0,
      };
      existing.count += 1;
      existing.amount += Number(invoice.totalAmount);
      statusData.set(invoice.status, existing);
    });

    return Array.from(statusData.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      totalAmount: data.amount,
    }));
  }

  private calculateRevenueByType(
    invoices: InvoiceEntity[],
  ): Array<{ type: InvoiceType; revenue: number; count: number }> {
    const typeData = new Map<InvoiceType, { revenue: number; count: number }>();

    invoices.forEach((invoice) => {
      const existing = typeData.get(invoice.type) || { revenue: 0, count: 0 };
      existing.revenue += Number(invoice.paidAmount);
      existing.count += 1;
      typeData.set(invoice.type, existing);
    });

    return Array.from(typeData.entries()).map(([type, data]) => ({
      type,
      revenue: data.revenue,
      count: data.count,
    }));
  }

  private async calculatePaymentMethodDistribution(
    invoiceIds: string[],
  ): Promise<Array<{ method: string; count: number; totalAmount: number }>> {
    if (invoiceIds.length === 0) return [];

    const payments = await this.paymentRepository.find({
      where: { invoiceId: In(invoiceIds), status: PaymentStatus.COMPLETED },
    });

    const methodData = new Map<string, { count: number; amount: number }>();

    payments.forEach((payment) => {
      const existing = methodData.get(payment.paymentMethod) || {
        count: 0,
        amount: 0,
      };
      existing.count += 1;
      existing.amount += Number(payment.amount);
      methodData.set(payment.paymentMethod, existing);
    });

    return Array.from(methodData.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      totalAmount: data.amount,
    }));
  }

  // Export Processing
  private async processExport(exportId: string): Promise<void> {
    const exportRecord = await this.exportRepository.findOne({
      where: { id: exportId },
    });
    if (!exportRecord) return;

    try {
      exportRecord.status = 'processing';
      exportRecord.startedAt = new Date();
      await this.exportRepository.save(exportRecord);

      // TODO: Implement actual export logic based on format and filters
      // This would generate CSV, Excel, PDF, or JSON files

      exportRecord.status = 'completed';
      exportRecord.completedAt = new Date();
      exportRecord.fileName = `invoice_export_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.${exportRecord.format.toLowerCase()}`;
      exportRecord.downloadUrl = `/api/invoice/exports/${exportId}/download`;

      await this.exportRepository.save(exportRecord);
    } catch (error) {
      exportRecord.status = 'failed';
      exportRecord.errorMessage = error.message;
      await this.exportRepository.save(exportRecord);
    }
  }

  // Report Processing
  private async processReport(reportId: string): Promise<void> {
    const reportRecord = await this.reportRepository.findOne({
      where: { id: reportId },
    });
    if (!reportRecord) return;

    try {
      reportRecord.status = 'processing';
      reportRecord.startedAt = new Date();
      await this.reportRepository.save(reportRecord);

      // TODO: Implement actual report generation logic based on report type
      // This would generate different types of reports (revenue, aging, etc.)

      reportRecord.status = 'completed';
      reportRecord.completedAt = new Date();
      reportRecord.fileName = `invoice_report_${reportRecord.reportType}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.${reportRecord.format.toLowerCase()}`;
      reportRecord.downloadUrl = `/api/invoice/reports/${reportId}/download`;

      await this.reportRepository.save(reportRecord);
    } catch (error) {
      reportRecord.status = 'failed';
      reportRecord.errorMessage = error.message;
      await this.reportRepository.save(reportRecord);
    }
  }

  // Bulk Operations
  async bulkSendInvoices(
    invoiceIds: string[],
    userId: string,
  ): Promise<{ success: boolean; processedCount: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const invoiceId of invoiceIds) {
      try {
        await this.sendInvoice(invoiceId, userId);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Invoice ${invoiceId}: ${error.message}`);
      }
    }

    return {
      success: results.success > 0,
      processedCount: results.success,
      errors: results.errors,
    };
  }

  async bulkRecordPayments(
    payments: Array<{
      invoiceId: string;
      amount: number;
      paymentMethod: string;
    }>,
    userId: string,
  ): Promise<{ success: boolean; processedCount: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const payment of payments) {
      try {
        await this.recordPayment(
          payment.invoiceId,
          {
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
          },
          userId,
        );
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Invoice ${payment.invoiceId}: ${error.message}`);
      }
    }

    return {
      success: results.success > 0,
      processedCount: results.success,
      errors: results.errors,
    };
  }

  // Revenue Trends
  async getRevenueTrends(
    dateFrom?: Date | string,
    dateTo?: Date | string,
    granularity: 'daily' | 'weekly' | 'monthly' = 'monthly',
  ): Promise<Array<{ period: string; revenue: number; invoiceCount: number }>> {
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice');

    // Set default date range if not provided (last 12 months)
    const endDate = dateTo ? new Date(dateTo) : new Date();
    const startDate = dateFrom
      ? new Date(dateFrom)
      : new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);

    queryBuilder
      .where('invoice.invoiceDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom: startDate,
        dateTo: endDate,
      })
      .andWhere('invoice.status = :status', { status: InvoiceStatus.PAID });

    const invoices = await queryBuilder.getMany();

    const trendsData = new Map<string, { revenue: number; count: number }>();

    invoices.forEach((invoice) => {
      let period: string;
      const invoiceDate = invoice.invoiceDate;

      switch (granularity) {
        case 'daily':
          period = format(invoiceDate, 'yyyy-MM-dd');
          break;
        case 'weekly':
          period = format(startOfWeek(invoiceDate), 'yyyy-MM-dd');
          break;
        case 'monthly':
        default:
          period = format(invoiceDate, 'yyyy-MM');
          break;
      }

      const existing = trendsData.get(period) || { revenue: 0, count: 0 };
      existing.revenue += Number(invoice.paidAmount || 0);
      existing.count += 1;
      trendsData.set(period, existing);
    });

    return Array.from(trendsData.entries())
      .map(([period, data]) => ({
        period,
        revenue: data.revenue,
        invoiceCount: data.count,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  async getAgingReport(): Promise<any> {
    const invoices = await this.invoiceRepository.find({
      where: { status: In([InvoiceStatus.SENT, InvoiceStatus.OVERDUE]) },
    });

    const now = new Date();
    const aging = {
      current: [],
      days30: [],
      days60: [],
      days90: [],
      over90: [],
    };

    invoices.forEach((invoice) => {
      const daysPastDue = Math.floor(
        (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysPastDue <= 0) {
        aging.current.push(invoice);
      } else if (daysPastDue <= 30) {
        aging.days30.push(invoice);
      } else if (daysPastDue <= 60) {
        aging.days60.push(invoice);
      } else if (daysPastDue <= 90) {
        aging.days90.push(invoice);
      } else {
        aging.over90.push(invoice);
      }
    });

    return aging;
  }

  async getCustomerSummary(
    customerId?: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<any> {
    const whereCondition: any = {};

    if (customerId) {
      whereCondition.customerId = customerId;
    }

    if (dateFrom && dateTo) {
      whereCondition.createdAt = Between(dateFrom, dateTo);
    } else if (dateFrom) {
      whereCondition.createdAt = MoreThan(dateFrom);
    } else if (dateTo) {
      whereCondition.createdAt = LessThan(dateTo);
    }

    const invoices = await this.invoiceRepository.find({
      where: whereCondition,
    });

    const summary = invoices.reduce((acc, invoice) => {
      const key = invoice.customerId || 'unknown';
      if (!acc[key]) {
        acc[key] = {
          customerId: invoice.customerId,
          customerName: invoice.customerId || 'Unknown',
          totalInvoices: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
        };
      }

      acc[key].totalInvoices++;
      acc[key].totalAmount += Number(invoice.totalAmount || 0);
      acc[key].paidAmount += Number(invoice.paidAmount || 0);
      acc[key].pendingAmount += Number(invoice.outstandingAmount || 0);

      return acc;
    }, {});

    return Object.values(summary);
  }

  async exportData(
    exportDto: any,
    userId: string,
  ): Promise<{ exportId: string }> {
    const exportId = uuidv4();

    // In a real implementation, this would queue a background job
    // For now, we'll just return the export ID

    return { exportId };
  }

  async downloadExport(exportId: string): Promise<any> {
    // Implementation for downloading export
    return {
      data: 'export-data',
      filename: `export-${exportId}.csv`,
      contentType: 'text/csv',
    };
  }

  async downloadReport(reportId: string): Promise<any> {
    // Implementation for downloading report
    return {
      data: 'report-data',
      filename: `report-${reportId}.pdf`,
      contentType: 'application/pdf',
    };
  }

  async getTemplates(): Promise<any[]> {
    // Implementation for getting templates
    return [
      {
        id: 'template-1',
        name: 'Standard Invoice',
        description: 'Standard invoice template',
        isDefault: true,
      },
      {
        id: 'template-2',
        name: 'Professional Invoice',
        description: 'Professional invoice template',
        isDefault: false,
      },
    ];
  }

  async previewTemplate(templateId: string, sampleData: any): Promise<any> {
    // Implementation for previewing template
    return {
      templateId,
      previewHtml: '<html><body>Invoice Preview</body></html>',
      previewUrl: `/api/templates/${templateId}/preview`,
    };
  }

  async getNextInvoiceNumber(type?: string): Promise<{ nextNumber: string }> {
    // Implementation for getting next invoice number
    const settings = await this.getSettings();
    const nextNumber = `INV-${Date.now().toString().slice(-4)}`;

    return { nextNumber };
  }

  async validateInvoiceData(
    invoiceData: any,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    // Implementation for validating invoice data
    const errors = [];

    if (!invoiceData.billTo) {
      errors.push('Bill to information is required');
    }

    if (!invoiceData.items || invoiceData.items.length === 0) {
      errors.push('At least one item is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async getAuditTrail(invoiceId: string): Promise<any[]> {
    // Implementation for getting audit trail
    return [
      {
        id: '1',
        invoiceId,
        action: 'created',
        userId: 'user-1',
        timestamp: new Date(),
        details: 'Invoice created',
      },
      {
        id: '2',
        invoiceId,
        action: 'sent',
        userId: 'user-1',
        timestamp: new Date(),
        details: 'Invoice sent to customer',
      },
    ];
  }
}
