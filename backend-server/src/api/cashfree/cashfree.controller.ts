import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  NotFoundException,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { UserEntity } from '@/auth/entities/user.entity';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/decorators/auth/get-user.decorator';

import {
  AadhaarOcrRequest,
  AadhaarOtpRequest,
  AadhaarVerifyOtpRequest,
  CashfreeAadhaarService,
} from './cashfree-aadhaar.service';
import {
  BankAccountVerificationRequest,
  BusinessDetailsVerificationRequest,
  CashfreeBusinessService,
  GstinVerificationRequest,
} from './cashfree-business.service';
import {
  BusinessPanVerificationRequest,
  CashfreePanService,
  PanOcrRequest,
  PanVerificationRequest,
} from './cashfree-pan.service';
import {
  CashfreeWebhookPayload,
  CashfreeWebhookService,
} from './cashfree-webhook.service';

@ApiTags('Cashfree VRS')
@Controller('api/cashfree')
export class CashfreeController {
  private readonly logger = new Logger(CashfreeController.name);

  constructor(
    private readonly aadhaarService: CashfreeAadhaarService,
    private readonly panService: CashfreePanService,
    private readonly businessService: CashfreeBusinessService,
    private readonly webhookService: CashfreeWebhookService,
  ) {}

  // ==================== USER KYC ENDPOINTS ====================

  @Post('user/aadhaar/generate-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate OTP for Aadhaar verification' })
  @ApiResponse({ status: 200, description: 'OTP generated successfully' })
  async generateAadhaarOtp(
    @GetUser() user: UserEntity,
    @Body() request: AadhaarOtpRequest,
  ) {
    try {
      this.logger.log(`User ${user.id} requesting Aadhaar OTP generation`);
      return await this.aadhaarService.generateOtpForAadhaar(request);
    } catch (error) {
      this.logger.error('Failed to generate Aadhaar OTP', error);
      throw error;
    }
  }

  @Post('user/aadhaar/verify-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Aadhaar using OTP' })
  @ApiResponse({ status: 200, description: 'Aadhaar verified successfully' })
  async verifyAadhaarOtp(
    @GetUser() user: UserEntity,
    @Body() request: AadhaarVerifyOtpRequest,
  ) {
    try {
      this.logger.log(`User ${user.id} verifying Aadhaar OTP`);
      return await this.aadhaarService.verifyAadhaarWithOtp(request);
    } catch (error) {
      this.logger.error('Failed to verify Aadhaar OTP', error);
      throw error;
    }
  }

  @Post('user/aadhaar/ocr')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Aadhaar via OCR' })
  @ApiResponse({
    status: 200,
    description: 'Aadhaar OCR completed successfully',
  })
  async verifyAadhaarOcr(
    @GetUser() user: UserEntity,
    @Body() request: AadhaarOcrRequest,
  ) {
    try {
      this.logger.log(`User ${user.id} performing Aadhaar OCR verification`);
      return await this.aadhaarService.verifyAadhaarViaOcr(request);
    } catch (error) {
      this.logger.error('Failed to perform Aadhaar OCR', error);
      throw error;
    }
  }

  @Get('user/aadhaar/status/:refId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Aadhaar verification status' })
  @ApiResponse({
    status: 200,
    description: 'Aadhaar verification status retrieved',
  })
  async getAadhaarStatus(
    @GetUser() user: UserEntity,
    @Param('refId') refId: string,
  ) {
    try {
      this.logger.log(`User ${user.id} checking Aadhaar verification status`);
      return await this.aadhaarService.getVerificationStatus(refId);
    } catch (error) {
      this.logger.error('Failed to get Aadhaar verification status', error);
      throw error;
    }
  }

  @Post('user/pan/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify individual PAN' })
  @ApiResponse({ status: 200, description: 'PAN verified successfully' })
  async verifyIndividualPan(
    @GetUser() user: UserEntity,
    @Body() request: PanVerificationRequest,
  ) {
    try {
      this.logger.log(`User ${user.id} verifying individual PAN`);
      return await this.panService.verifyIndividualPan(request);
    } catch (error) {
      this.logger.error('Failed to verify individual PAN', error);
      throw error;
    }
  }

  @Post('user/pan/ocr')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify PAN via OCR' })
  @ApiResponse({ status: 200, description: 'PAN OCR completed successfully' })
  async verifyPanOcr(
    @GetUser() user: UserEntity,
    @Body() request: PanOcrRequest,
  ) {
    try {
      this.logger.log(`User ${user.id} performing PAN OCR verification`);
      return await this.panService.verifyPanViaOcr(request);
    } catch (error) {
      this.logger.error('Failed to perform PAN OCR', error);
      throw error;
    }
  }

  @Get('user/pan/status/:verificationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get PAN verification status' })
  @ApiResponse({
    status: 200,
    description: 'PAN verification status retrieved',
  })
  async getPanStatus(
    @GetUser() user: UserEntity,
    @Param('verificationId') verificationId: string,
  ) {
    try {
      this.logger.log(`User ${user.id} checking PAN verification status`);
      return await this.panService.getVerificationStatus(verificationId);
    } catch (error) {
      this.logger.error('Failed to get PAN verification status', error);
      throw error;
    }
  }

  // ==================== PARTNER KYC ENDPOINTS ====================

  @Post('partner/business/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify business details' })
  @ApiResponse({
    status: 200,
    description: 'Business details verified successfully',
  })
  async verifyBusinessDetails(
    @GetUser() user: UserEntity,
    @Body() request: BusinessDetailsVerificationRequest,
  ) {
    try {
      this.logger.log(`User ${user.id} verifying business details`);
      return await this.businessService.verifyBusinessDetails(request);
    } catch (error) {
      this.logger.error('Failed to verify business details', error);
      throw error;
    }
  }

  @Post('partner/bank/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify bank account' })
  @ApiResponse({
    status: 200,
    description: 'Bank account verified successfully',
  })
  async verifyBankAccount(
    @GetUser() user: UserEntity,
    @Body() request: BankAccountVerificationRequest,
  ) {
    try {
      this.logger.log(`User ${user.id} verifying bank account`);
      return await this.businessService.verifyBankAccount(request);
    } catch (error) {
      this.logger.error('Failed to verify bank account', error);
      throw error;
    }
  }

  @Post('partner/pan/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify business PAN' })
  @ApiResponse({
    status: 200,
    description: 'Business PAN verified successfully',
  })
  async verifyBusinessPan(
    @GetUser() user: UserEntity,
    @Body() request: BusinessPanVerificationRequest,
  ) {
    try {
      this.logger.log(`User ${user.id} verifying business PAN`);
      return await this.panService.verifyBusinessPan(request);
    } catch (error) {
      this.logger.error('Failed to verify business PAN', error);
      throw error;
    }
  }

  @Post('partner/gstin/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify GSTIN' })
  @ApiResponse({ status: 200, description: 'GSTIN verified successfully' })
  async verifyGstin(
    @GetUser() user: UserEntity,
    @Body() request: GstinVerificationRequest,
  ) {
    try {
      this.logger.log(`User ${user.id} verifying GSTIN`);
      return await this.businessService.verifyGstin(request);
    } catch (error) {
      this.logger.error('Failed to verify GSTIN', error);
      throw error;
    }
  }

  @Get('partner/business/status/:verificationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get business verification status' })
  @ApiResponse({
    status: 200,
    description: 'Business verification status retrieved',
  })
  async getBusinessStatus(
    @GetUser() user: UserEntity,
    @Param('verificationId') verificationId: string,
  ) {
    try {
      this.logger.log(`User ${user.id} checking business verification status`);
      return await this.businessService.getBusinessVerificationStatus(
        verificationId,
      );
    } catch (error) {
      this.logger.error('Failed to get business verification status', error);
      throw error;
    }
  }

  @Get('partner/bank/status/:verificationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bank account verification status' })
  @ApiResponse({
    status: 200,
    description: 'Bank account verification status retrieved',
  })
  async getBankAccountStatus(
    @GetUser() user: UserEntity,
    @Param('verificationId') verificationId: string,
  ) {
    try {
      this.logger.log(
        `User ${user.id} checking bank account verification status`,
      );
      return await this.businessService.getBankAccountVerificationStatus(
        verificationId,
      );
    } catch (error) {
      this.logger.error(
        'Failed to get bank account verification status',
        error,
      );
      throw error;
    }
  }

  @Get('partner/gstin/status/:verificationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get GSTIN verification status' })
  @ApiResponse({
    status: 200,
    description: 'GSTIN verification status retrieved',
  })
  async getGstinStatus(
    @GetUser() user: UserEntity,
    @Param('verificationId') verificationId: string,
  ) {
    try {
      this.logger.log(`User ${user.id} checking GSTIN verification status`);
      return await this.businessService.getGstinVerificationStatus(
        verificationId,
      );
    } catch (error) {
      this.logger.error('Failed to get GSTIN verification status', error);
      throw error;
    }
  }

  // ==================== WEBHOOK ENDPOINTS ====================

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Cashfree webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-cashfree-signature') signature: string,
    @Body() payload: CashfreeWebhookPayload,
  ) {
    try {
      this.logger.log(
        `Received Cashfree webhook for verification: ${payload.verification_id}`,
      );

      if (!signature) {
        throw new BadRequestException('Missing webhook signature');
      }

      const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(payload);

      const result = await this.webhookService.processWebhook(
        payload,
        signature,
        rawBody,
      );

      if (!result.isValid) {
        throw new BadRequestException(result.error || 'Invalid webhook');
      }

      return {
        success: true,
        verificationId: result.verificationId,
        status: result.status,
      };
    } catch (error) {
      this.logger.error('Failed to process webhook', error);
      throw error;
    }
  }

  @Post('webhook/retry/:verificationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry webhook processing for a verification' })
  @ApiResponse({ status: 200, description: 'Webhook retry completed' })
  async retryWebhook(
    @GetUser() user: UserEntity,
    @Param('verificationId') verificationId: string,
  ) {
    try {
      this.logger.log(
        `User ${user.id} retrying webhook for verification: ${verificationId}`,
      );

      const result =
        await this.webhookService.retryWebhookProcessing(verificationId);

      if (!result.isValid) {
        throw new NotFoundException(result.error || 'Verification not found');
      }

      return {
        success: true,
        verificationId: result.verificationId,
        status: result.status,
      };
    } catch (error) {
      this.logger.error('Failed to retry webhook', error);
      throw error;
    }
  }

  // ==================== UTILITY ENDPOINTS ====================

  @Get('health')
  @ApiOperation({ summary: 'Health check for Cashfree VRS service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'Cashfree VRS',
      timestamp: new Date().toISOString(),
    };
  }
}
