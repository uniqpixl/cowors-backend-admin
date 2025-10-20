import { UserEntity } from '@/auth/entities/user.entity';
import {
  ErrorCodes,
  ErrorResponseUtil,
} from '@/common/utils/error-response.util';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  InvoiceEntity,
  InvoiceLineItem,
  InvoiceStatus,
  TaxBreakdown,
  TaxType,
} from '@/database/entities/invoice.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import {
  CreateInvoiceDto,
  GenerateInvoiceFromBookingDto,
  InvoiceListQueryDto,
  InvoiceResponseDto,
  InvoiceStatsDto,
  UpdateInvoiceDto,
} from './invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
  ) {}

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Get the count of invoices for this month
    const startOfMonth = new Date(year, new Date().getMonth(), 1);
    const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);

    const count = await this.invoiceRepository.count({
      where: {
        createdAt: Between(startOfMonth, endOfMonth),
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  calculateGST(
    amount: number,
    gstRate: number,
    placeOfSupply: string,
    businessState: string,
  ): TaxBreakdown {
    const taxAmount = (amount * gstRate) / 100;

    // Determine if it's intra-state or inter-state transaction
    const isIntraState = placeOfSupply === businessState;

    if (isIntraState) {
      // Intra-state: CGST + SGST
      const cgstRate = gstRate / 2;
      const sgstRate = gstRate / 2;
      const cgstAmount = (amount * cgstRate) / 100;
      const sgstAmount = (amount * sgstRate) / 100;

      return {
        cgst: { rate: cgstRate, amount: cgstAmount },
        sgst: { rate: sgstRate, amount: sgstAmount },
        totalTaxRate: gstRate,
        totalTaxAmount: taxAmount,
      };
    } else {
      // Inter-state: IGST
      return {
        igst: { rate: gstRate, amount: taxAmount },
        totalTaxRate: gstRate,
        totalTaxAmount: taxAmount,
      };
    }
  }

  calculateVAT(amount: number, vatRate: number): TaxBreakdown {
    const taxAmount = (amount * vatRate) / 100;

    return {
      vat: { rate: vatRate, amount: taxAmount },
      totalTaxRate: vatRate,
      totalTaxAmount: taxAmount,
    };
  }

  async generateInvoiceFromBooking(
    dto: GenerateInvoiceFromBookingDto,
  ): Promise<InvoiceResponseDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id: dto.bookingId },
      relations: [
        'user',
        'spaceOption',
        'spaceOption.space',
        'spaceOption.space.partner',
        'items',
      ],
    });

    if (!booking) {
      throw ErrorResponseUtil.notFound('Booking', dto.bookingId);
    }

    // Check if invoice already exists for this booking
    const existingInvoice = await this.invoiceRepository.findOne({
      where: { bookingId: dto.bookingId },
    });

    if (existingInvoice) {
      throw ErrorResponseUtil.conflict(
        'Invoice already exists for this booking',
        ErrorCodes.RESOURCE_CONFLICT,
      );
    }

    // Create line items from booking
    const lineItems: InvoiceLineItem[] = [
      {
        description: `Space Booking - ${booking.spaceOption.space.name}`,
        quantity: 1,
        unitPrice: booking.baseAmount,
        amount: booking.baseAmount,
        sacCode: '997212', // SAC code for co-working space services
      },
    ];

    // Add extras items if any
    if (booking.items && booking.items.length > 0) {
      for (const item of booking.items) {
        lineItems.push({
          description: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.totalPrice,
          hsnCode: null, // Not available in BookingItemEntity
          sacCode: null, // Not available in BookingItemEntity
        });
      }
    }

    const subtotal = booking.baseAmount + booking.extrasAmount;
    const discountAmount = booking.discountAmount;
    const taxableAmount = subtotal - discountAmount;

    // Calculate tax based on type
    let taxBreakdown: TaxBreakdown;
    let taxAmount: number;

    if (dto.taxType === TaxType.GST) {
      // Default GST rate for co-working spaces (18%)
      const gstRate = 18;
      const placeOfSupply =
        dto.metadata?.placeOfSupply || dto.billingAddress.state;
      const businessState =
        booking.spaceOption.space.listing?.location?.city?.state || 'Karnataka'; // Default business state

      taxBreakdown = this.calculateGST(
        taxableAmount,
        gstRate,
        placeOfSupply,
        businessState,
      );
      taxAmount = taxBreakdown.totalTaxAmount;
    } else if (dto.taxType === TaxType.VAT) {
      // Default VAT rate (varies by country)
      const vatRate = 20; // Default 20% for international
      taxBreakdown = this.calculateVAT(taxableAmount, vatRate);
      taxAmount = taxBreakdown.totalTaxAmount;
    } else {
      taxBreakdown = {
        totalTaxRate: 0,
        totalTaxAmount: 0,
      };
      taxAmount = 0;
    }

    const totalAmount = taxableAmount + taxAmount;

    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = this.invoiceRepository.create({
      invoiceNumber,
      userId: booking.userId,
      partnerId: booking.spaceOption.space.listing?.partner_id,
      bookingId: dto.bookingId,
      status: InvoiceStatus.DRAFT,
      taxType: dto.taxType,
      issueDate: new Date(),
      dueDate: dto.dueDate,
      subtotal,
      discountAmount,
      totalTax: taxAmount,
      totalAmount,
      currency: booking.currency,
      billingAddress: dto.billingAddress,
      lineItems,
      taxBreakdown,
      metadata: dto.metadata,
      notes: dto.notes,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);
    return this.mapToResponseDto(savedInvoice);
  }

  async createInvoice(dto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    const invoiceNumber = await this.generateInvoiceNumber();

    const { taxAmount, invoiceDate, ...restDto } = dto;
    const invoice = this.invoiceRepository.create({
      ...restDto,
      invoiceNumber,
      status: InvoiceStatus.DRAFT,
      totalTax: taxAmount,
      issueDate: invoiceDate,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);
    return this.mapToResponseDto(savedInvoice);
  }

  async updateInvoice(
    id: string,
    dto: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });

    if (!invoice) {
      throw ErrorResponseUtil.notFound('Invoice', id);
    }

    // Handle status changes
    if (dto.status) {
      switch (dto.status) {
        case InvoiceStatus.SENT:
          invoice.sentAt = new Date();
          break;
        case InvoiceStatus.PAID:
          invoice.paidAt = new Date();
          break;
        case InvoiceStatus.CANCELLED:
          invoice.cancelledAt = new Date();
          break;
      }
    }

    Object.assign(invoice, dto);
    const updatedInvoice = await this.invoiceRepository.save(invoice);
    return this.mapToResponseDto(updatedInvoice);
  }

  async getInvoiceById(id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['user', 'partner', 'booking', 'payment'],
    });

    if (!invoice) {
      throw ErrorResponseUtil.notFound('Invoice', id);
    }

    return this.mapToResponseDto(invoice);
  }

  async getInvoices(query: InvoiceListQueryDto): Promise<{
    invoices: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, ...filters } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.user', 'user')
      .leftJoinAndSelect('invoice.partner', 'partner')
      .leftJoinAndSelect('invoice.booking', 'booking')
      .where('invoice.deletedAt IS NULL');

    // Apply filters
    if (filters.userId) {
      queryBuilder.andWhere('invoice.userId = :userId', {
        userId: filters.userId,
      });
    }

    if (filters.partnerId) {
      queryBuilder.andWhere('invoice.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('invoice.status = :status', {
        status: filters.status,
      });
    }

    if (filters.fromDate) {
      queryBuilder.andWhere('invoice.invoiceDate >= :fromDate', {
        fromDate: filters.fromDate,
      });
    }

    if (filters.toDate) {
      queryBuilder.andWhere('invoice.invoiceDate <= :toDate', {
        toDate: filters.toDate,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(invoice.invoiceNumber ILIKE :search OR invoice.notes ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [invoices, total] = await queryBuilder
      .orderBy('invoice.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      invoices: invoices.map((invoice) => this.mapToResponseDto(invoice)),
      total,
      page,
      limit,
    };
  }

  async getInvoiceStats(
    userId?: string,
    partnerId?: string,
  ): Promise<InvoiceStatsDto> {
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.deletedAt IS NULL');

    if (userId) {
      queryBuilder.andWhere('invoice.userId = :userId', { userId });
    }

    if (partnerId) {
      queryBuilder.andWhere('invoice.partnerId = :partnerId', { partnerId });
    }

    const invoices = await queryBuilder.getMany();

    const stats: InvoiceStatsDto = {
      totalInvoices: invoices.length,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      statusBreakdown: {
        [InvoiceStatus.DRAFT]: 0,
        [InvoiceStatus.SENT]: 0,
        [InvoiceStatus.PAID]: 0,
        [InvoiceStatus.OVERDUE]: 0,
        [InvoiceStatus.CANCELLED]: 0,
      },
    };

    for (const invoice of invoices) {
      stats.totalAmount += Number(invoice.totalAmount);
      stats.statusBreakdown[invoice.status]++;

      if (invoice.status === InvoiceStatus.PAID) {
        stats.paidAmount += Number(invoice.totalAmount);
      } else if (invoice.status === InvoiceStatus.OVERDUE) {
        stats.overdueAmount += Number(invoice.totalAmount);
      } else if (invoice.status !== InvoiceStatus.CANCELLED) {
        stats.pendingAmount += Number(invoice.totalAmount);
      }
    }

    return stats;
  }

  async deleteInvoice(id: string): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });

    if (!invoice) {
      throw ErrorResponseUtil.notFound('Invoice', id);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw ErrorResponseUtil.badRequest(
        'Cannot delete a paid invoice',
        ErrorCodes.INVALID_STATUS,
      );
    }

    await this.invoiceRepository.softDelete(id);
  }

  private mapToResponseDto(invoice: InvoiceEntity): InvoiceResponseDto {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      userId: invoice.userId,
      partnerId: invoice.partnerId,
      bookingId: invoice.bookingId,
      paymentId: invoice.paymentId,
      status: invoice.status,
      taxType: invoice.taxType,
      invoiceDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotal: Number(invoice.subtotal),
      discountAmount: Number(invoice.discountAmount),
      taxAmount: Number(invoice.totalTax),
      totalAmount: Number(invoice.totalAmount),
      currency: invoice.currency,
      billingAddress: invoice.billingAddress,
      lineItems: invoice.lineItems,
      taxBreakdown: invoice.taxBreakdown,
      metadata: invoice.metadata,
      sentAt: invoice.sentAt,
      paidAt: invoice.paidAt,
      cancelledAt: invoice.cancelledAt,
      cancellationReason: invoice.cancellationReason,
      notes: invoice.notes,
      pdfUrl: invoice.pdfUrl,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }
}
