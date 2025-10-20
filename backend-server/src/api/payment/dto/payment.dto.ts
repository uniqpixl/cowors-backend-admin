import {
  PaymentGateway,
  PaymentStatus,
  RefundStatus,
} from '@/common/enums/booking.enum';
import { PaymentMethod } from '@/common/enums/payment.enum';
import { RefundMethod, RefundType } from '@/database/entities/refund.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiPropertyOptional({
    description:
      'User ID (optional, will use authenticated user if not provided)',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ description: 'Booking ID' })
  @IsUUID()
  bookingId: string;

  @ApiProperty({ description: 'Payment gateway', enum: PaymentGateway })
  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ description: 'Payment amount', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency code', default: 'INR' })
  @IsString()
  currency: string = 'INR';

  @ApiPropertyOptional({ description: 'Payment breakdown details' })
  @IsOptional()
  @IsObject()
  breakdown?: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class ProcessPaymentDto {
  @ApiProperty({ description: 'Payment ID' })
  @IsUUID()
  paymentId: string;

  @ApiProperty({ description: 'Gateway payment ID' })
  @IsString()
  gatewayPaymentId: string;

  @ApiPropertyOptional({ description: 'Gateway order ID' })
  @IsOptional()
  @IsString()
  gatewayOrderId?: string;

  @ApiPropertyOptional({ description: 'Gateway response data' })
  @IsOptional()
  @IsObject()
  gatewayResponse?: any;
}

export class CreateRefundDto {
  @ApiProperty({ description: 'Payment ID to refund' })
  @IsUUID()
  paymentId: string;

  @ApiProperty({ description: 'Refund type', enum: RefundType })
  @IsEnum(RefundType)
  type: RefundType;

  @ApiProperty({ description: 'Refund method', enum: RefundMethod })
  @IsEnum(RefundMethod)
  method: RefundMethod;

  @ApiProperty({ description: 'Refund amount', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Refund reason' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Refund breakdown details' })
  @IsOptional()
  @IsObject()
  breakdown?: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Booking ID' })
  bookingId: string;

  @ApiProperty({ description: 'Payment ID' })
  paymentId: string;

  @ApiPropertyOptional({ description: 'Gateway payment ID' })
  gatewayPaymentId?: string;

  @ApiPropertyOptional({ description: 'Gateway order ID' })
  gatewayOrderId?: string;

  @ApiProperty({ description: 'Payment gateway', enum: PaymentGateway })
  gateway: PaymentGateway;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ description: 'Payment amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  status: PaymentStatus;

  @ApiPropertyOptional({ description: 'Payment date' })
  paidAt?: Date;

  @ApiPropertyOptional({ description: 'Failure date' })
  failedAt?: Date;

  @ApiPropertyOptional({ description: 'Failure reason' })
  failureReason?: string;

  @ApiPropertyOptional({ description: 'Gateway response data' })
  gatewayResponse?: any;

  @ApiPropertyOptional({ description: 'Payment breakdown details' })
  breakdown?: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: any;

  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated date' })
  updatedAt: Date;
}

export class RefundResponseDto {
  @ApiProperty({ description: 'Refund ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Payment ID' })
  paymentId: string;

  @ApiProperty({ description: 'Refund ID' })
  refundId: string;

  @ApiPropertyOptional({ description: 'Gateway refund ID' })
  gatewayRefundId?: string;

  @ApiProperty({ description: 'Refund type', enum: RefundType })
  type: RefundType;

  @ApiProperty({ description: 'Refund method', enum: RefundMethod })
  method: RefundMethod;

  @ApiProperty({ description: 'Refund amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Refund status', enum: RefundStatus })
  status: RefundStatus;

  @ApiProperty({ description: 'Refund reason' })
  reason: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Processing date' })
  processedAt?: Date;

  @ApiPropertyOptional({ description: 'Completion date' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Failure date' })
  failedAt?: Date;

  @ApiPropertyOptional({ description: 'Failure reason' })
  failureReason?: string;

  @ApiPropertyOptional({ description: 'Gateway response data' })
  gatewayResponse?: any;

  @ApiPropertyOptional({ description: 'Refund breakdown details' })
  breakdown?: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: any;

  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated date' })
  updatedAt: Date;
}

export class StripePaymentIntentResponseDto {
  @ApiProperty({ description: 'Stripe payment intent ID' })
  id: string;

  @ApiProperty({ description: 'Client secret for frontend' })
  client_secret: string;

  @ApiProperty({ description: 'Payment amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Payment status' })
  status: string;
}

export class RazorpayOrderResponseDto {
  @ApiProperty({ description: 'Razorpay order ID' })
  id: string;

  @ApiProperty({ description: 'Order amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Order status' })
  status: string;

  @ApiProperty({ description: 'Order receipt' })
  receipt: string;
}
