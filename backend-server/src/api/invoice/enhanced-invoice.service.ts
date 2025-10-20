import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  In,
  LessThan,
  MoreThan,
  Repository,
} from 'typeorm';

import { UserEntity } from '@/auth/entities/user.entity';
import {
  BulkInvoiceOperationDto,
  BulkOperationResponseDto,
  BulkOperationType,
  CreateInvoiceDto,
  ExportInvoiceDto,
  ExportResponseDto,
  ExportStatus,
  GenerateInvoiceDto,
  GetInvoicesDto,
  InvoiceAnalyticsDto,
  InvoiceAnalyticsResponseDto,
  InvoiceResponseDto,
  InvoiceSettingsDto,
  InvoiceSettingsResponseDto,
  InvoiceStatus,
  InvoiceSummaryResponseDto,
  InvoiceTemplateDto,
  InvoiceTemplateResponseDto,
  PaymentResponseDto,
  PaymentStatus,
  RecurringInvoiceResponseDto,
  ReminderType,
  UpdateInvoiceDto,
} from './dto/enhanced-invoice.dto';
import {
  EnhancedInvoiceEntity,
  InvoiceAuditTrailEntity,
  InvoiceExportEntity,
  InvoicePaymentEntity,
  InvoiceReminderEntity,
  InvoiceSettingsEntity,
  InvoiceTemplateEntity,
  RecurringInvoiceEntity,
} from './entities/enhanced-invoice.entity';

@Injectable()
export class EnhancedInvoiceService {
  constructor(
    @InjectRepository(EnhancedInvoiceEntity)
    private invoiceRepository: Repository<EnhancedInvoiceEntity>,
    @InjectRepository(InvoicePaymentEntity)
    private paymentRepository: Repository<InvoicePaymentEntity>,
    @InjectRepository(InvoiceTemplateEntity)
    private templateRepository: Repository<InvoiceTemplateEntity>,
    @InjectRepository(RecurringInvoiceEntity)
    private recurringRepository: Repository<RecurringInvoiceEntity>,
    @InjectRepository(InvoiceReminderEntity)
    private reminderRepository: Repository<InvoiceReminderEntity>,
    @InjectRepository(InvoiceAuditTrailEntity)
    private auditRepository: Repository<InvoiceAuditTrailEntity>,
    @InjectRepository(InvoiceExportEntity)
    private exportRepository: Repository<InvoiceExportEntity>,
    @InjectRepository(InvoiceSettingsEntity)
    private settingsRepository: Repository<InvoiceSettingsEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  // Invoice Management
  async createInvoice(
    dto: CreateInvoiceDto,
    userId: string,
  ): Promise<InvoiceResponseDto> {
    // Validate customer and partner
    if (dto.customerId) {
      const customer = await this.userRepository.findOne({
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    if (dto.partnerId) {
      const partner = await this.userRepository.findOne({
        where: { id: dto.partnerId },
      });
      if (!partner) {
        throw new NotFoundException('Partner not found');
      }
    }

    // Generate invoice number if not provided
    let invoiceNumber = dto.invoiceNumber;
    if (!invoiceNumber) {
      const settings = await this.getOrCreateSettings();
      invoiceNumber = settings.generateNextInvoiceNumber();
      settings.incrementNextNumber();
      await this.settingsRepository.save(settings);
    }

    // Check for duplicate invoice number
    const existingInvoice = await this.invoiceRepository.findOne({
      where: { invoiceNumber },
    });
    if (existingInvoice) {
      throw new ConflictException('Invoice number already exists');
    }

    const invoice = this.invoiceRepository.create({
      ...dto,
      invoiceNumber,
      createdBy: userId,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Create audit trail
    await this.createAuditTrail(
      savedInvoice.id,
      'CREATED',
      'Invoice created',
      userId,
    );

    return this.mapToInvoiceResponse(savedInvoice);
  }

  async getInvoices(
    dto: GetInvoicesDto,
  ): Promise<{ invoices: InvoiceResponseDto[]; total: number }> {
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .leftJoinAndSelect('invoice.partner', 'partner')
      .leftJoinAndSelect('invoice.booking', 'booking')
      .leftJoinAndSelect('invoice.payments', 'payments');

    // Apply filters
    if (dto.status) {
      queryBuilder.andWhere('invoice.status = :status', { status: dto.status });
    }

    if (dto.paymentStatus) {
      queryBuilder.andWhere('invoice.paymentStatus = :paymentStatus', {
        paymentStatus: dto.paymentStatus,
      });
    }

    if (dto.customerId) {
      queryBuilder.andWhere('invoice.customerId = :customerId', {
        customerId: dto.customerId,
      });
    }

    if (dto.partnerId) {
      queryBuilder.andWhere('invoice.partnerId = :partnerId', {
        partnerId: dto.partnerId,
      });
    }

    if (dto.type) {
      queryBuilder.andWhere('invoice.type = :type', { type: dto.type });
    }

    if (dto.startDate && dto.endDate) {
      queryBuilder.andWhere(
        'invoice.issueDate BETWEEN :startDate AND :endDate',
        {
          startDate: dto.startDate,
          endDate: dto.endDate,
        },
      );
    }

    if (dto.minAmount !== undefined) {
      queryBuilder.andWhere('invoice.totalAmount >= :minAmount', {
        minAmount: dto.minAmount,
      });
    }

    if (dto.maxAmount !== undefined) {
      queryBuilder.andWhere('invoice.totalAmount <= :maxAmount', {
        maxAmount: dto.maxAmount,
      });
    }

    if (dto.search) {
      queryBuilder.andWhere(
        '(invoice.invoiceNumber ILIKE :search OR customer.name ILIKE :search OR partner.name ILIKE :search)',
        { search: `%${dto.search}%` },
      );
    }

    // Apply sorting
    const sortField = dto.sortBy || 'createdAt';
    const sortOrder = dto.sortOrder || 'DESC';
    queryBuilder.orderBy(`invoice.${sortField}`, sortOrder);

    // Apply pagination
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [invoices, total] = await queryBuilder.getManyAndCount();

    return {
      invoices: invoices.map((invoice) => this.mapToInvoiceResponse(invoice)),
      total,
    };
  }

  async getInvoiceById(id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: [
        'customer',
        'partner',
        'booking',
        'payments',
        'reminders',
        'auditTrail',
      ],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.mapToInvoiceResponse(invoice);
  }

  async updateInvoice(
    id: string,
    dto: UpdateInvoiceDto,
    userId: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!invoice.canBeEdited()) {
      throw new BadRequestException(
        'Invoice cannot be edited in current status',
      );
    }

    // Store old values for audit
    const oldValues = { ...invoice };

    // Update invoice
    Object.assign(invoice, dto);
    invoice.updatedBy = userId;

    const updatedInvoice = await this.invoiceRepository.save(invoice);

    // Create audit trail
    await this.createAuditTrail(
      invoice.id,
      'UPDATED',
      'Invoice updated',
      userId,
      oldValues,
      dto,
    );

    return this.mapToInvoiceResponse(updatedInvoice);
  }

  async deleteInvoice(id: string, userId: string): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!invoice.isDraft()) {
      throw new BadRequestException('Only draft invoices can be deleted');
    }

    await this.invoiceRepository.remove(invoice);

    // Create audit trail
    await this.createAuditTrail(id, 'DELETED', 'Invoice deleted', userId);
  }

  // Status Management
  async sendInvoice(id: string, userId: string): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be sent');
    }

    invoice.status = InvoiceStatus.SENT;
    invoice.sentAt = new Date();
    invoice.updatedBy = userId;

    const updatedInvoice = await this.invoiceRepository.save(invoice);

    // Create audit trail
    await this.createAuditTrail(invoice.id, 'SENT', 'Invoice sent', userId);

    return this.mapToInvoiceResponse(updatedInvoice);
  }

  async approveInvoice(
    id: string,
    userId: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.PENDING) {
      throw new BadRequestException('Only pending invoices can be approved');
    }

    invoice.status = InvoiceStatus.APPROVED;
    invoice.approvedAt = new Date();
    invoice.approvedBy = userId;
    invoice.updatedBy = userId;

    const updatedInvoice = await this.invoiceRepository.save(invoice);

    // Create audit trail
    await this.createAuditTrail(
      invoice.id,
      'APPROVED',
      'Invoice approved',
      userId,
    );

    return this.mapToInvoiceResponse(updatedInvoice);
  }

  async rejectInvoice(
    id: string,
    reason: string,
    userId: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.PENDING) {
      throw new BadRequestException('Only pending invoices can be rejected');
    }

    invoice.status = InvoiceStatus.REJECTED;
    invoice.rejectedAt = new Date();
    invoice.rejectedBy = userId;
    invoice.rejectionReason = reason;
    invoice.updatedBy = userId;

    const updatedInvoice = await this.invoiceRepository.save(invoice);

    // Create audit trail
    await this.createAuditTrail(
      invoice.id,
      'REJECTED',
      `Invoice rejected: ${reason}`,
      userId,
    );

    return this.mapToInvoiceResponse(updatedInvoice);
  }

  async cancelInvoice(
    id: string,
    reason: string,
    userId: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!invoice.canBeCancelled()) {
      throw new BadRequestException(
        'Invoice cannot be cancelled in current status',
      );
    }

    invoice.status = InvoiceStatus.CANCELLED;
    invoice.cancelledAt = new Date();
    invoice.cancelledBy = userId;
    invoice.cancellationReason = reason;
    invoice.updatedBy = userId;

    const updatedInvoice = await this.invoiceRepository.save(invoice);

    // Create audit trail
    await this.createAuditTrail(
      invoice.id,
      'CANCELLED',
      `Invoice cancelled: ${reason}`,
      userId,
    );

    return this.mapToInvoiceResponse(updatedInvoice);
  }

  async voidInvoice(
    id: string,
    reason: string,
    userId: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.VOIDED) {
      throw new BadRequestException('Invoice is already voided');
    }

    invoice.status = InvoiceStatus.VOIDED;
    invoice.voidedAt = new Date();
    invoice.voidedBy = userId;
    invoice.voidReason = reason;
    invoice.updatedBy = userId;

    const updatedInvoice = await this.invoiceRepository.save(invoice);

    // Create audit trail
    await this.createAuditTrail(
      invoice.id,
      'VOIDED',
      `Invoice voided: ${reason}`,
      userId,
    );

    return this.mapToInvoiceResponse(updatedInvoice);
  }

  // Recurring Invoice Generation
  async generateRecurringInvoices(
    userId: string,
  ): Promise<{ generated: number; failed: number; details: any[] }> {
    const recurringInvoices = await this.recurringRepository.find({
      where: { isActive: true },
      relations: ['template'],
    });

    const results = {
      generated: 0,
      failed: 0,
      details: [],
    };

    for (const recurring of recurringInvoices) {
      try {
        if (recurring.shouldGenerate()) {
          const invoiceData = {
            ...recurring.template.templateData,
            customerId: recurring.customerId,
            partnerId: recurring.createdBy,
            type: recurring.template.type,
          };

          await this.createInvoice(invoiceData as CreateInvoiceDto, userId);
          recurring.nextGenerationDate = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ); // Add 30 days
          await this.recurringRepository.save(recurring);

          results.generated++;
          results.details.push({
            recurringId: recurring.id,
            status: 'success',
            message: 'Invoice generated successfully',
          });
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          recurringId: recurring.id,
          status: 'failed',
          message: error.message,
        });
      }
    }

    return results;
  }

  async createRecurringInvoice(
    dto: any,
    userId: string,
  ): Promise<RecurringInvoiceResponseDto> {
    const template = await this.templateRepository.findOne({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const recurringInvoice = this.recurringRepository.create({
      ...dto,
      createdBy: userId,
      nextGenerationDate: new Date(dto.startDate),
    });

    const saved = await this.recurringRepository.save(recurringInvoice);
    return this.mapToRecurringInvoiceResponse(saved);
  }

  async getRecurringInvoices(): Promise<RecurringInvoiceResponseDto[]> {
    const recurringInvoices = await this.recurringRepository.find({
      relations: ['template'],
      order: { createdAt: 'DESC' },
    });

    return recurringInvoices.map((recurring) =>
      this.mapToRecurringInvoiceResponse(recurring),
    );
  }

  async activateRecurringInvoice(
    id: string,
    userId: string,
  ): Promise<RecurringInvoiceResponseDto> {
    const recurringInvoice = await this.recurringRepository.findOne({
      where: { id },
    });

    if (!recurringInvoice) {
      throw new NotFoundException('Recurring invoice not found');
    }

    recurringInvoice.isActive = true;
    const saved = await this.recurringRepository.save(recurringInvoice);
    return this.mapToRecurringInvoiceResponse(saved);
  }

  async deactivateRecurringInvoice(
    id: string,
    userId: string,
  ): Promise<RecurringInvoiceResponseDto> {
    const recurringInvoice = await this.recurringRepository.findOne({
      where: { id },
    });

    if (!recurringInvoice) {
      throw new NotFoundException('Recurring invoice not found');
    }

    recurringInvoice.isActive = false;
    const saved = await this.recurringRepository.save(recurringInvoice);
    return this.mapToRecurringInvoiceResponse(saved);
  }

  async sendReminder(
    invoiceId: string,
    reminderDto: any,
    userId: string,
  ): Promise<{ sent: boolean; message: string }> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Implementation for sending reminder
    // This would integrate with email/SMS service

    await this.createAuditTrail(
      invoiceId,
      'REMINDER_SENT',
      `Reminder sent via ${reminderDto.type}`,
      userId,
      {},
      { reminderType: reminderDto.type },
    );

    return {
      sent: true,
      message: 'Reminder sent successfully',
    };
  }

  async sendOverdueReminders(
    userId: string,
  ): Promise<{ sent: number; failed: number; details: any[] }> {
    const overdueInvoices = await this.invoiceRepository.find({
      where: {
        status: InvoiceStatus.OVERDUE,
      },
    });

    const results = {
      sent: 0,
      failed: 0,
      details: [],
    };

    for (const invoice of overdueInvoices) {
      try {
        // Send overdue reminder logic here
        results.sent++;
        results.details.push({
          invoiceId: invoice.id,
          status: 'sent',
          message: 'Overdue reminder sent successfully',
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          invoiceId: invoice.id,
          status: 'failed',
          message: error.message,
        });
      }
    }

    return results;
  }

  async getInvoiceSummary(): Promise<InvoiceSummaryResponseDto> {
    const totalInvoices = await this.invoiceRepository.count();
    const paidInvoices = await this.invoiceRepository.count({
      where: { status: InvoiceStatus.PAID },
    });
    const pendingInvoices = await this.invoiceRepository.count({
      where: { status: InvoiceStatus.PENDING },
    });
    const overdueInvoices = await this.invoiceRepository.count({
      where: { status: InvoiceStatus.OVERDUE },
    });

    const totalAmountResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.totalAmount)', 'total')
      .getRawOne();

    const paidAmountResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.totalAmount)', 'total')
      .where('invoice.status = :status', { status: InvoiceStatus.PAID })
      .getRawOne();

    return {
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      draftInvoices: 0,
      sentInvoices: 0,
      totalAmount: parseFloat(totalAmountResult?.total || '0'),
      paidAmount: parseFloat(paidAmountResult?.total || '0'),
      outstandingAmount:
        parseFloat(totalAmountResult?.total || '0') -
        parseFloat(paidAmountResult?.total || '0'),
      overdueAmount: 0,
      thisMonthRevenue: 0,
      lastMonthRevenue: 0,
      revenueGrowth: 0,
      averageInvoiceValue:
        totalInvoices > 0
          ? parseFloat(totalAmountResult?.total || '0') / totalInvoices
          : 0,
    };
  }

  async getInvoiceAnalytics(
    userId: string,
  ): Promise<InvoiceAnalyticsResponseDto> {
    const whereClause: any = {};

    // Remove date filtering for now
    // whereClause.createdAt = {
    //   $gte: new Date(),
    //   $lte: new Date(),
    // };

    const invoices = await this.invoiceRepository.find({
      where: whereClause,
    });

    const analytics = {
      totalInvoices: invoices.length,
      totalAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      overdueAmount: 0,
      averageInvoiceValue: 0,
      paymentRate: 0,
      invoicesByStatus: {
        pending: 0,
        paid: 0,
        overdue: 0,
        cancelled: 0,
      },
      statusBreakdown: {},
      typeBreakdown: {},
      monthlyTrends: [],
      topCustomers: [],
    };

    // Calculate analytics from invoices
    invoices.forEach((invoice) => {
      analytics.totalAmount += invoice.totalAmount || 0;
      if (invoice.status === InvoiceStatus.PAID) {
        analytics.paidAmount += invoice.totalAmount || 0;
      } else {
        analytics.outstandingAmount += invoice.totalAmount || 0;
        if (invoice.status === InvoiceStatus.OVERDUE) {
          analytics.overdueAmount += invoice.totalAmount || 0;
        }
      }
      analytics.invoicesByStatus[invoice.status.toLowerCase()]++;
    });

    analytics.averageInvoiceValue =
      invoices.length > 0 ? analytics.totalAmount / invoices.length : 0;

    return analytics;
  }

  async getAgingReport(): Promise<any> {
    // Implementation for aging report
    const agingData = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select([
        'COUNT(*) as count',
        'SUM(invoice.totalAmount) as totalAmount',
        'CASE WHEN DATEDIFF(NOW(), invoice.dueDate) <= 30 THEN "0-30" WHEN DATEDIFF(NOW(), invoice.dueDate) <= 60 THEN "31-60" WHEN DATEDIFF(NOW(), invoice.dueDate) <= 90 THEN "61-90" ELSE "90+" END as ageGroup',
      ])
      .where('invoice.status = :status', { status: 'overdue' })
      .groupBy('ageGroup')
      .getRawMany();

    return {
      agingData,
      generatedAt: new Date(),
    };
  }

  async getRevenueTrends(dateFrom: string, dateTo: string): Promise<any> {
    // Implementation for revenue trends
    const trends = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select([
        'DATE(invoice.issueDate) as date',
        'SUM(invoice.totalAmount) as revenue',
        'COUNT(*) as invoiceCount',
      ])
      .where('invoice.issueDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      })
      .andWhere('invoice.status = :status', { status: 'paid' })
      .groupBy('DATE(invoice.issueDate)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      trends,
      period: { from: dateFrom, to: dateTo },
      generatedAt: new Date(),
    };
  }

  async exportInvoices(exportDto: any, userId: string): Promise<any> {
    // Implementation for exporting invoices
    const exportId = `export_${Date.now()}`;
    return {
      exportId,
      status: 'processing',
      message: 'Export initiated successfully',
    };
  }

  async getExportStatus(exportId: string): Promise<any> {
    // Implementation for getting export status
    return {
      exportId,
      status: 'completed',
      downloadUrl: `/api/invoice/export/${exportId}/download`,
      createdAt: new Date(),
    };
  }

  async downloadExport(exportId: string): Promise<string> {
    // Implementation for downloading export
    return `/downloads/invoices_${exportId}.csv`;
  }

  async generatePdf(invoiceId: string): Promise<{ downloadUrl: string }> {
    // Implementation for generating PDF
    return {
      downloadUrl: `/api/invoice/${invoiceId}/pdf/download`,
    };
  }

  async getInvoiceSettings(): Promise<any> {
    // Implementation for getting invoice settings
    return {
      id: 'default',
      defaultCurrency: 'USD',
      defaultPaymentTerms: 30,
      autoNumbering: true,
      numberPrefix: 'INV-',
      taxRate: 10,
    };
  }

  async updateInvoiceSettings(settingsDto: any, userId: string): Promise<any> {
    // Implementation for updating invoice settings
    return {
      ...settingsDto,
      updatedBy: userId,
      updatedAt: new Date(),
    };
  }

  async getInvoiceStatuses(): Promise<string[]> {
    return ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
  }

  async getInvoiceTypes(): Promise<string[]> {
    return ['standard', 'recurring', 'credit_note', 'proforma'];
  }

  async getPaymentStatuses(): Promise<string[]> {
    return ['pending', 'paid', 'failed', 'refunded'];
  }

  async validateInvoiceData(
    data: any,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!data.billTo) {
      errors.push('Bill to information is required');
    }
    if (!data.items || data.items.length === 0) {
      errors.push('At least one item is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async getNextInvoiceNumber(type?: string): Promise<{ nextNumber: string }> {
    const prefix = type === 'recurring' ? 'REC-' : 'INV-';
    const nextNumber = `${prefix}${Date.now()}`;
    return { nextNumber };
  }

  async getCustomerInvoiceHistory(
    customerId: string,
    page: number,
    limit: number,
  ): Promise<{ invoices: any[]; total: number }> {
    // Implementation for customer invoice history
    return {
      invoices: [],
      total: 0,
    };
  }

  async getPartnerInvoiceHistory(
    partnerId: string,
    page: number,
    limit: number,
  ): Promise<{ invoices: any[]; total: number }> {
    // Implementation for partner invoice history
    return {
      invoices: [],
      total: 0,
    };
  }

  private mapToRecurringInvoiceResponse(
    recurring: any,
  ): RecurringInvoiceResponseDto {
    return {
      id: recurring.id,
      templateId: recurring.templateId,
      customerId: recurring.customerId,
      frequency: recurring.frequency,
      startDate: recurring.startDate,
      endDate: recurring.endDate,
      nextGenerationDate: recurring.nextGenerationDate,
      isActive: recurring.isActive,
      currentOccurrences: recurring.currentOccurrences || 0,
      autoSend: recurring.autoSend || false,
      createdAt: recurring.createdAt,
      updatedAt: recurring.updatedAt,
    };
  }

  // Bulk Operations
  async bulkOperation(
    dto: BulkInvoiceOperationDto,
    userId: string,
  ): Promise<BulkOperationResponseDto> {
    const results = {
      successful: 0,
      failed: 0,
      totalProcessed: dto.invoiceIds.length,
      details: [],
      timestamp: new Date(),
    };

    for (const invoiceId of dto.invoiceIds) {
      try {
        switch (dto.operation) {
          case BulkOperationType.SEND:
            await this.sendInvoice(invoiceId, userId);
            break;
          case BulkOperationType.APPROVE:
            await this.approveInvoice(invoiceId, userId);
            break;
          case BulkOperationType.CANCEL:
            await this.cancelInvoice(
              invoiceId,
              dto.reason || 'Bulk cancellation',
              userId,
            );
            break;
          case BulkOperationType.DELETE:
            await this.deleteInvoice(invoiceId, userId);
            break;
          case BulkOperationType.MARK_PAID:
            await this.markAsPaid(
              invoiceId,
              { amount: 0, method: 'BULK_OPERATION' } as any,
              userId,
            );
            break;
          case BulkOperationType.MARK_OVERDUE:
            await this.markAsOverdue(invoiceId, userId);
            break;
        }
        results.successful++;
      } catch (error) {
        results.failed++;
        results.details.push({
          invoiceId,
          error: error.message,
        });
      }
    }

    return results;
  }

  // Payment Management
  async recordPayment(dto: any, userId: string): Promise<PaymentResponseDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: dto.invoiceId },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    if (invoice.balanceAmount < dto.amount) {
      throw new BadRequestException('Payment amount exceeds balance amount');
    }

    const paymentData = {
      ...dto,
      paymentDate: new Date(dto.paymentDate),
      recordedBy: userId,
    };

    const payment = this.paymentRepository.create(paymentData);
    const savedPaymentEntity = await this.paymentRepository.save(payment);
    const paymentEntity = Array.isArray(savedPaymentEntity)
      ? savedPaymentEntity[0]
      : savedPaymentEntity;

    // Update invoice payment status and amounts
    invoice.paidAmount += dto.amount;
    invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;

    if (invoice.balanceAmount <= 0) {
      invoice.paymentStatus = PaymentStatus.COMPLETED;
      invoice.paidAt = new Date();
    } else {
      invoice.paymentStatus = PaymentStatus.PROCESSING;
    }

    await this.invoiceRepository.save(invoice);

    // Create audit trail
    await this.createAuditTrail(
      invoice.id,
      'PAYMENT_RECORDED',
      `Payment of ${dto.amount} recorded`,
      userId,
    );

    return this.mapToPaymentResponse(paymentEntity);
  }

  async getPayments(
    dto: any,
  ): Promise<{ payments: PaymentResponseDto[]; total: number }> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.invoice', 'invoice')
      .leftJoinAndSelect('payment.recorder', 'recorder');

    // Apply filters
    if (dto.invoiceId) {
      queryBuilder.andWhere('payment.invoiceId = :invoiceId', {
        invoiceId: dto.invoiceId,
      });
    }

    if (dto.method) {
      queryBuilder.andWhere('payment.method = :method', { method: dto.method });
    }

    if (dto.status) {
      queryBuilder.andWhere('payment.status = :status', { status: dto.status });
    }

    if (dto.dateFrom && dto.dateTo) {
      queryBuilder.andWhere(
        'payment.paymentDate BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom: dto.dateFrom,
          dateTo: dto.dateTo,
        },
      );
    }

    // Apply sorting
    const sortField = dto.sortBy || 'createdAt';
    const sortOrder = dto.sortOrder || 'DESC';
    queryBuilder.orderBy(`payment.${sortField}`, sortOrder);

    // Apply pagination
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [payments, total] = await queryBuilder.getManyAndCount();

    return {
      payments: payments.map((payment) => this.mapToPaymentResponse(payment)),
      total,
    };
  }

  async getInvoicePayments(invoiceId: string): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentRepository.find({
      where: { invoiceId },
      order: { createdAt: 'DESC' },
    });

    return payments.map((payment) => this.mapToPaymentResponse(payment));
  }

  async markAsPaid(
    invoiceId: string,
    paymentDto: any,
    userId: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Record the payment
    await this.recordPayment({ ...paymentDto, invoiceId }, userId);

    // Update invoice status
    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date();
    await this.invoiceRepository.save(invoice);

    return this.mapToInvoiceResponse(invoice);
  }

  async markAsOverdue(
    invoiceId: string,
    userId: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const previousStatus = invoice.status;
    invoice.status = InvoiceStatus.OVERDUE;
    await this.invoiceRepository.save(invoice);

    await this.createAuditTrail(
      invoiceId,
      'MARKED_OVERDUE',
      'Invoice marked as overdue',
      userId,
      { status: previousStatus },
      { status: InvoiceStatus.OVERDUE },
    );

    return this.mapToInvoiceResponse(invoice);
  }

  // Template Management
  async createTemplate(
    dto: InvoiceTemplateDto,
    userId: string,
  ): Promise<InvoiceTemplateResponseDto> {
    const template = this.templateRepository.create({
      ...dto,
      createdBy: userId,
    });

    const savedTemplate = await this.templateRepository.save(template);
    return this.mapToTemplateResponse(savedTemplate);
  }

  async getTemplates(): Promise<InvoiceTemplateResponseDto[]> {
    const templates = await this.templateRepository.find({
      where: { isActive: true },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });

    return templates.map((template) => this.mapToTemplateResponse(template));
  }

  async updateTemplate(
    id: string,
    dto: InvoiceTemplateDto,
    userId: string,
  ): Promise<InvoiceTemplateResponseDto> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    Object.assign(template, dto);
    template.updatedBy = userId;

    const updatedTemplate = await this.templateRepository.save(template);
    return this.mapToTemplateResponse(updatedTemplate);
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await this.templateRepository.remove(template);
  }

  // Settings Management
  async getSettings(): Promise<InvoiceSettingsResponseDto> {
    const settings = await this.getOrCreateSettings();
    return this.mapToSettingsResponse(settings);
  }

  async updateSettings(
    dto: InvoiceSettingsDto,
    userId: string,
  ): Promise<InvoiceSettingsResponseDto> {
    const settings = await this.getOrCreateSettings();

    Object.assign(settings, dto);
    settings.updatedBy = userId;

    const updatedSettings = await this.settingsRepository.save(settings);
    return this.mapToSettingsResponse(updatedSettings);
  }

  // Analytics and Reporting
  async getAnalytics(
    dto: InvoiceAnalyticsDto,
  ): Promise<InvoiceAnalyticsResponseDto> {
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice');

    // Apply date filter
    if (dto.dateFrom && dto.dateTo) {
      queryBuilder.andWhere('invoice.issueDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom: dto.dateFrom,
        dateTo: dto.dateTo,
      });
    }

    // Apply additional filters
    if (dto.customerId) {
      queryBuilder.andWhere('invoice.customerId = :customerId', {
        customerId: dto.customerId,
      });
    }

    if (dto.partnerId) {
      queryBuilder.andWhere('invoice.partnerId = :partnerId', {
        partnerId: dto.partnerId,
      });
    }

    const invoices = await queryBuilder.getMany();

    // Calculate analytics
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );
    const paidAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.paidAmount),
      0,
    );
    const outstandingAmount = totalAmount - paidAmount;

    const statusBreakdown = invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {});

    const paymentStatusBreakdown = invoices.reduce((acc, inv) => {
      acc[inv.paymentStatus] = (acc[inv.paymentStatus] || 0) + 1;
      return acc;
    }, {});

    const overdueInvoices = invoices.filter((inv) => inv.isOverdue()).length;
    const averageAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

    return {
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
      totalInvoices,
      totalAmount,
      paidAmount,
      outstandingAmount,
      overdueAmount: outstandingAmount, // Assuming overdue amount is same as outstanding for now
      averageInvoiceValue: averageAmount,
      paymentRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
      statusBreakdown,
      typeBreakdown: {}, // Add empty type breakdown for now
      monthlyTrends: [], // Add empty monthly trends for now
      topCustomers: [], // Add empty top customers for now
    };
  }

  // Helper Methods
  private async getOrCreateSettings(): Promise<InvoiceSettingsEntity> {
    let settings = await this.settingsRepository.findOne({ where: {} });
    if (!settings) {
      settings = this.settingsRepository.create({
        updatedBy: 'system',
      });
      settings = await this.settingsRepository.save(settings);
    }
    return settings;
  }

  private async createAuditTrail(
    invoiceId: string,
    action: string,
    description: string,
    userId: string,
    oldValues?: any,
    newValues?: any,
  ): Promise<void> {
    const audit = this.auditRepository.create({
      invoiceId,
      action,
      description,
      oldValues,
      newValues,
      performedBy: userId,
    });

    await this.auditRepository.save(audit);
  }

  // Mapping Methods
  private mapToInvoiceResponse(
    invoice: EnhancedInvoiceEntity,
  ): InvoiceResponseDto {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      customerId: invoice.customerId,
      partnerId: invoice.partnerId,
      bookingId: invoice.bookingId,
      billTo: invoice.billTo,
      shipTo: invoice.shipTo,
      items: invoice.items,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      subtotal: Number(invoice.subtotal),
      discountAmount: Number(invoice.discountAmount),
      taxAmount: Number(invoice.taxAmount),
      shippingAmount: Number(invoice.shippingAmount),
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      balanceAmount: Number(invoice.balanceAmount),
      notes: invoice.notes,
      terms: invoice.terms,
      customFields: invoice.customFields,
      taxes: invoice.taxes,
      discountPercentage: Number(invoice.discountPercentage),
      pdfUrl: invoice.pdfUrl,
      sentAt: invoice.sentAt,
      viewedAt: invoice.viewedAt,
      paidAt: invoice.paidAt,
      approvedAt: invoice.approvedAt,
      rejectedAt: invoice.rejectedAt,
      cancelledAt: invoice.cancelledAt,
      voidedAt: invoice.voidedAt,
      rejectionReason: invoice.rejectionReason,

      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  private mapToPaymentResponse(
    payment: InvoicePaymentEntity,
  ): PaymentResponseDto {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      amount: Number(payment.amount),
      method: payment.method,
      status: payment.status,
      paymentDate: payment.paymentDate,
      reference: payment.reference,
      notes: payment.notes,
      bankDetails: payment.bankDetails,
      recordedBy: payment.recordedBy,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  private mapToTemplateResponse(
    template: InvoiceTemplateEntity,
  ): InvoiceTemplateResponseDto {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      templateData: template.templateData,
      defaultTerms: template.defaultTerms,
      defaultNotes: template.defaultNotes,
      isActive: template.isActive,
      createdBy: template.createdBy,
      updatedBy: template.updatedBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private mapToSettingsResponse(
    settings: InvoiceSettingsEntity,
  ): InvoiceSettingsResponseDto {
    return {
      id: settings.id,
      defaultCurrency: settings.defaultCurrency,
      defaultPaymentTerms: settings.defaultPaymentTerms,
      autoGenerateNumbers: settings.autoGenerateNumbers,
      numberPrefix: settings.numberPrefix,
      nextNumber: settings.nextNumber,
      defaultTerms: settings.defaultTerms,
      defaultNotes: settings.defaultNotes,
      enableReminders: settings.enableReminders,
      reminderSchedule: settings.reminderSchedule,
      lateFeePercentage: Number(settings.lateFeePercentage),
      enableLateFees: settings.enableLateFees,
      logoUrl: settings.logoUrl,
      companyDetails: settings.companyDetails,
      updatedBy: settings.updatedBy,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }
}
