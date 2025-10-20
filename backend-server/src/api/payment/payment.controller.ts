import { AuthGuard } from '@/auth/auth.guard';
import { PaymentGateway } from '@/common/enums/booking.enum';
import { PaymentMethod } from '@/common/enums/payment.enum';
import { RefundMethod, RefundType } from '@/database/entities/refund.entity';
import { Public } from '@/decorators/public.decorator';
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  RawBodyRequest,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreatePaymentDto,
  CreateRefundDto,
  ProcessPaymentDto,
} from './dto/payment.dto';
import { PaymentService } from './payment.service';
import { WebhookValidationService } from './services/webhook-validation.service';

@ApiTags('Payment')
@Controller('payment')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly webhookValidationService: WebhookValidationService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async createPayment(
    @Request() req,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    const userId = createPaymentDto.userId || req.user.id;
    return this.paymentService.createPayment({
      ...createPaymentDto,
      userId,
    });
  }

  @Post(':paymentId/stripe/intent')
  @ApiOperation({ summary: 'Create Stripe payment intent' })
  @ApiResponse({
    status: 201,
    description: 'Stripe payment intent created successfully',
  })
  async createStripePaymentIntent(
    @Param('paymentId') paymentId: string,
    @Body() body: { amount: number; currency?: string; metadata?: any },
  ) {
    return this.paymentService.createStripePaymentIntent(
      paymentId,
      body.amount,
      body.currency,
      body.metadata,
    );
  }

  @Post(':paymentId/razorpay/order')
  @ApiOperation({ summary: 'Create Razorpay order' })
  @ApiResponse({
    status: 201,
    description: 'Razorpay order created successfully',
  })
  async createRazorpayOrder(
    @Param('paymentId') paymentId: string,
    @Body() body: { amount: number; currency?: string; metadata?: any },
  ) {
    return this.paymentService.createRazorpayOrder(
      paymentId,
      body.amount,
      body.currency,
      body.metadata,
    );
  }

  @Post(':paymentId/process')
  @ApiOperation({ summary: 'Process payment confirmation' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  async processPayment(
    @Param('paymentId') paymentId: string,
    @Body() processPaymentDto: Omit<ProcessPaymentDto, 'paymentId'>,
    @Request() req,
  ) {
    return this.paymentService.processPayment(
      paymentId,
      req.user.id,
      processPaymentDto.gatewayPaymentId,
      processPaymentDto.gatewayResponse,
    );
  }

  @Post(':paymentId/fail')
  @ApiOperation({ summary: 'Mark payment as failed' })
  @ApiResponse({ status: 200, description: 'Payment marked as failed' })
  async failPayment(
    @Param('paymentId') paymentId: string,
    @Body() body: { failureReason: string; gatewayResponse?: any },
  ) {
    return this.paymentService.failPayment(
      paymentId,
      body.failureReason,
      body.gatewayResponse,
    );
  }

  @Get(':paymentId')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({
    status: 200,
    description: 'Payment details retrieved successfully',
  })
  async getPayment(@Param('paymentId') paymentId: string) {
    return this.paymentService.getPaymentById(paymentId);
  }

  @Get('user/history')
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved successfully',
  })
  async getUserPayments(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.paymentService.getPaymentsByUser(
      req.user.id,
      limit || 20,
      offset || 0,
    );
  }

  @Post('refund/create')
  @ApiOperation({ summary: 'Create a refund request' })
  @ApiResponse({ status: 201, description: 'Refund created successfully' })
  async createRefund(@Request() req, @Body() createRefundDto: CreateRefundDto) {
    return this.paymentService.createRefund(createRefundDto);
  }

  @Post('refund/:refundId/process')
  @ApiOperation({ summary: 'Process refund' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  async processRefund(@Param('refundId') refundId: string) {
    return this.paymentService.processRefund(refundId);
  }

  @Get('refund/:refundId')
  @ApiOperation({ summary: 'Get refund details' })
  @ApiResponse({
    status: 200,
    description: 'Refund details retrieved successfully',
  })
  async getRefund(@Param('refundId') refundId: string) {
    return this.paymentService.getRefundById(refundId);
  }

  @Get('refund/user/history')
  @ApiOperation({ summary: 'Get user refund history' })
  @ApiResponse({
    status: 200,
    description: 'Refund history retrieved successfully',
  })
  async getUserRefunds(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.paymentService.getRefundsByUser(
      req.user.id,
      limit || 20,
      offset || 0,
    );
  }

  // Webhook endpoints - publicly accessible with signature validation
  @Public()
  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleStripeWebhook(
    @Request() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    // Validate webhook signature and get the event
    const event = this.webhookValidationService.validateStripeWebhook(
      req.rawBody,
      signature,
    );

    return this.paymentService.handleStripeWebhook(event);
  }

  @Public()
  @Post('webhook/razorpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Razorpay webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleRazorpayWebhook(
    @Request() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    // Validate webhook signature and get the event
    const event = this.webhookValidationService.validateRazorpayWebhook(
      req.rawBody,
      signature,
    );

    return this.paymentService.handleRazorpayWebhook(event);
  }
}
