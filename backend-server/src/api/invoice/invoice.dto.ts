import {
  BillingAddress,
  InvoiceLineItem,
  InvoiceMetadata,
  InvoiceStatus,
  TaxBreakdown,
  TaxType,
} from '@/database/entities/invoice.entity';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class BillingAddressDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;
}

export class InvoiceLineItemDto {
  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsOptional()
  @IsString()
  hsnCode?: string;

  @IsOptional()
  @IsString()
  sacCode?: string;
}

export class TaxBreakdownDto {
  @IsOptional()
  cgst?: {
    rate: number;
    amount: number;
  };

  @IsOptional()
  sgst?: {
    rate: number;
    amount: number;
  };

  @IsOptional()
  igst?: {
    rate: number;
    amount: number;
  };

  @IsOptional()
  vat?: {
    rate: number;
    amount: number;
  };

  @IsNumber()
  totalTaxRate: number;

  @IsNumber()
  totalTaxAmount: number;
}

export class InvoiceMetadataDto {
  @IsOptional()
  @IsString()
  placeOfSupply?: string;

  @IsOptional()
  @IsBoolean()
  reverseCharge?: boolean;

  @IsOptional()
  @IsEnum(['goods', 'services'])
  exportType?: 'goods' | 'services';

  @IsString()
  currency: string;

  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInvoiceDto {
  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  partnerId?: string;

  @IsEnum(TaxType)
  taxType: TaxType;

  @IsDateString()
  invoiceDate: Date;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsNumber()
  subtotal: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsNumber()
  taxAmount: number;

  @IsNumber()
  totalAmount: number;

  @IsString()
  currency: string;

  @ValidateNested()
  @Type(() => BillingAddressDto)
  billingAddress: BillingAddressDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems: InvoiceLineItemDto[];

  @ValidateNested()
  @Type(() => TaxBreakdownDto)
  taxBreakdown: TaxBreakdownDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceMetadataDto)
  metadata?: InvoiceMetadataDto;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => BillingAddressDto)
  billingAddress?: BillingAddressDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems?: InvoiceLineItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TaxBreakdownDto)
  taxBreakdown?: TaxBreakdownDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceMetadataDto)
  metadata?: InvoiceMetadataDto;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class GenerateInvoiceFromBookingDto {
  @IsString()
  bookingId: string;

  @IsEnum(TaxType)
  taxType: TaxType;

  @ValidateNested()
  @Type(() => BillingAddressDto)
  billingAddress: BillingAddressDto;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceMetadataDto)
  metadata?: InvoiceMetadataDto;
}

export class InvoiceResponseDto {
  id: string;
  invoiceNumber: string;
  userId: string;
  partnerId?: string;
  bookingId?: string;
  paymentId?: string;
  status: InvoiceStatus;
  taxType: TaxType;
  invoiceDate: Date;
  dueDate?: Date;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  billingAddress: BillingAddress;
  lineItems: InvoiceLineItem[];
  taxBreakdown: TaxBreakdown;
  metadata?: InvoiceMetadata;
  sentAt?: Date;
  paidAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  notes?: string;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class InvoiceListQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  partnerId?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsDateString()
  fromDate?: Date;

  @IsOptional()
  @IsDateString()
  toDate?: Date;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}

export class InvoiceStatsDto {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  statusBreakdown: {
    [key in InvoiceStatus]: number;
  };
}
