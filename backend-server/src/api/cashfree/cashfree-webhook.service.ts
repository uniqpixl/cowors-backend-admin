import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';

import {
  KycStatus,
  KycVerificationEntity,
  KycVerificationType,
} from '@/database/entities/kyc-verification.entity';
import { CashfreeVrsService } from './cashfree-vrs.service';

export interface CashfreeWebhookPayload {
  event: string;
  verification_id: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  timestamp: string;
  data?: any;
  signature?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  verificationId?: string;
  status?: KycStatus;
  error?: string;
}

@Injectable()
export class CashfreeWebhookService {
  private readonly logger = new Logger(CashfreeWebhookService.name);

  constructor(
    @InjectRepository(KycVerificationEntity)
    private readonly kycVerificationRepository: Repository<KycVerificationEntity>,
    private readonly cashfreeVrsService: CashfreeVrsService,
  ) {}

  /**
   * Process incoming Cashfree webhook
   */
  async processWebhook(
    payload: CashfreeWebhookPayload,
    signature: string,
    rawBody: string,
  ): Promise<WebhookVerificationResult> {
    try {
      this.logger.debug(
        `Processing Cashfree webhook for verification: ${payload.verification_id}`,
      );

      // Verify webhook signature
      if (!this.verifyWebhookSignature(rawBody, signature)) {
        this.logger.warn('Invalid webhook signature received');
        throw new BadRequestException('Invalid webhook signature');
      }

      // Find the KYC verification record
      const kycVerification = await this.kycVerificationRepository.findOne({
        where: {
          cashfreeVerificationId: payload.verification_id,
        },
      });

      if (!kycVerification) {
        this.logger.warn(
          `KYC verification not found for Cashfree ID: ${payload.verification_id}`,
        );
        return {
          isValid: false,
          error: 'Verification record not found',
        };
      }

      // Update verification status based on webhook event
      const updatedStatus = this.mapWebhookStatusToKycStatus(payload.status);

      // Update the verification record
      await this.updateVerificationFromWebhook(
        kycVerification,
        payload,
        updatedStatus,
      );

      this.logger.log(
        `Successfully processed webhook for verification: ${payload.verification_id}`,
      );

      return {
        isValid: true,
        verificationId: payload.verification_id,
        status: updatedStatus,
      };
    } catch (error) {
      this.logger.error('Failed to process Cashfree webhook', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature using HMAC
   */
  private verifyWebhookSignature(
    rawBody: string,
    receivedSignature: string,
  ): boolean {
    try {
      const webhookSecret = this.cashfreeVrsService.getWebhookSecret();

      if (!webhookSecret) {
        this.logger.warn('Webhook secret not configured');
        return false;
      }

      // Create HMAC signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody, 'utf8')
        .digest('hex');

      // Compare signatures using timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(receivedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error('Error verifying webhook signature', error);
      return false;
    }
  }

  /**
   * Update KYC verification record from webhook data
   */
  private async updateVerificationFromWebhook(
    kycVerification: KycVerificationEntity,
    payload: CashfreeWebhookPayload,
    status: KycStatus,
  ): Promise<void> {
    try {
      // Update basic status
      kycVerification.status = status;

      // Update completion timestamp if verification is complete
      if (status === KycStatus.APPROVED || status === KycStatus.REJECTED) {
        kycVerification.completedAt = new Date();
      }

      // Update Cashfree-specific data based on event type
      switch (payload.event) {
        case 'aadhaar.verification.completed':
          this.updateAadhaarVerificationData(kycVerification, payload.data);
          break;
        case 'pan.verification.completed':
          this.updatePanVerificationData(kycVerification, payload.data);
          break;
        case 'bank.verification.completed':
          this.updateBankVerificationData(kycVerification, payload.data);
          break;
        case 'gstin.verification.completed':
          this.updateGstinVerificationData(kycVerification, payload.data);
          break;
        case 'business.verification.completed':
          this.updateBusinessVerificationData(kycVerification, payload.data);
          break;
        default:
          this.logger.warn(`Unknown webhook event type: ${payload.event}`);
      }

      // Save updated verification
      await this.kycVerificationRepository.save(kycVerification);

      this.logger.debug(
        `Updated KYC verification ${kycVerification.id} from webhook`,
      );
    } catch (error) {
      this.logger.error('Failed to update verification from webhook', error);
      throw error;
    }
  }

  /**
   * Update Aadhaar verification data
   */
  private updateAadhaarVerificationData(
    verification: KycVerificationEntity,
    data: any,
  ): void {
    if (!verification.cashfreeData) {
      verification.cashfreeData = {};
    }

    verification.cashfreeData.aadhaar = {
      ...verification.cashfreeData.aadhaar,
      name: data.extracted_data?.name,
      gender: data.extracted_data?.gender,
      dob: data.extracted_data?.dob,
      address: data.extracted_data?.address,
      fatherName: data.extracted_data?.care_of,
      district: data.extracted_data?.dist,
      state: data.extracted_data?.state,
      pincode: data.extracted_data?.pincode,
      country: data.extracted_data?.country,
      mobileHash: data.extracted_data?.mobile_hash,
      emailHash: data.extracted_data?.email,
      photoLink: data.extracted_data?.photo_link,
      yearOfBirth: data.extracted_data?.year_of_birth,
      careOf: data.extracted_data?.care_of,
    };

    // Update verification result
    if (!verification.verificationResult) {
      verification.verificationResult = {};
    }

    verification.verificationResult.identity = {
      verified: data.status === 'SUCCESS',
      confidence: data.confidence_score || 0,
      extractedData: verification.cashfreeData.aadhaar,
    };
  }

  /**
   * Update PAN verification data
   */
  private updatePanVerificationData(
    verification: KycVerificationEntity,
    data: any,
  ): void {
    if (!verification.cashfreeData) {
      verification.cashfreeData = {};
    }

    verification.cashfreeData.pan = {
      ...verification.cashfreeData.pan,
      panNumber: data.extracted_data?.pan_number,
      name: data.extracted_data?.name,
      category: data.extracted_data?.category,
      panStatus: data.extracted_data?.pan_status,
      lastUpdated: data.extracted_data?.last_updated,
      aadhaarSeeded: data.extracted_data?.aadhaar_seeded,
      nameMatch: data.name_match?.status,
      nameMatchScore: data.name_match?.score,
      dobMatch: data.dob_match?.status,
    };

    // Update verification result
    if (!verification.verificationResult) {
      verification.verificationResult = {};
    }

    verification.verificationResult.document = {
      verified: data.status === 'SUCCESS' && data.is_valid,
      confidence: data.confidence_score || 0,
      extractedData: verification.cashfreeData.pan,
    };
  }

  /**
   * Update bank account verification data
   */
  private updateBankVerificationData(
    verification: KycVerificationEntity,
    data: any,
  ): void {
    if (!verification.cashfreeData) {
      verification.cashfreeData = {};
    }

    verification.cashfreeData.bankAccount = {
      ...verification.cashfreeData.bankAccount,
      accountNumber: data.extracted_data?.account_number,
      ifscCode: data.extracted_data?.ifsc_code,
      accountHolderName: data.extracted_data?.account_holder_name,
      bankName: data.extracted_data?.bank_name,
      branchName: data.extracted_data?.branch_name,
      accountType: data.extracted_data?.account_type,
      accountStatus: data.extracted_data?.account_status,
      branchAddress: data.extracted_data?.branch_address,
      micr: data.extracted_data?.micr,
      upiId: data.extracted_data?.upi_id,
      nameMatch: data.name_match?.status,
      nameMatchScore: data.name_match?.score,
    };

    // Update verification result
    if (!verification.verificationResult) {
      verification.verificationResult = {};
    }

    verification.verificationResult.address = {
      verified: data.status === 'SUCCESS' && data.is_valid,
      confidence: data.confidence_score || 0,
      extractedData: verification.cashfreeData.bankAccount,
    };
  }

  /**
   * Update GSTIN verification data
   */
  private updateGstinVerificationData(
    verification: KycVerificationEntity,
    data: any,
  ): void {
    if (!verification.cashfreeData) {
      verification.cashfreeData = {};
    }

    verification.cashfreeData.gstin = {
      ...verification.cashfreeData.gstin,
      gstinNumber: data.extracted_data?.gstin_number,
      legalName: data.extracted_data?.legal_name,
      tradeName: data.extracted_data?.trade_name,
      gstStatus: data.extracted_data?.gst_status,
      registrationDate: data.extracted_data?.registration_date,
      constitutionOfBusiness: data.extracted_data?.constitution_of_business,
      taxpayerType: data.extracted_data?.taxpayer_type,
      businessAddress: data.extracted_data?.business_address,
      filingStatus: data.extracted_data?.filing_status,
      lastReturnFiled: data.extracted_data?.last_return_filed,
      complianceRating: data.extracted_data?.compliance_rating,
      nameMatch: data.name_match?.status,
      nameMatchScore: data.name_match?.score,
    };

    // Update verification result
    if (!verification.verificationResult) {
      verification.verificationResult = {};
    }

    verification.verificationResult.document = {
      verified: data.status === 'SUCCESS' && data.is_valid,
      confidence: data.confidence_score || 0,
      extractedData: verification.cashfreeData.gstin,
    };
  }

  /**
   * Update business verification data
   */
  private updateBusinessVerificationData(
    verification: KycVerificationEntity,
    data: any,
  ): void {
    if (!verification.cashfreeData) {
      verification.cashfreeData = {};
    }

    verification.cashfreeData.businessDetails = {
      ...verification.cashfreeData.businessDetails,
      businessName: data.extracted_data?.business_name,
      registrationNumber: data.extracted_data?.registration_number,
      businessType: data.extracted_data?.business_type,
      incorporationDate: data.extracted_data?.incorporation_date,
      businessStatus: data.extracted_data?.business_status,
      registeredAddress: data.extracted_data?.registered_address,
      authorizedCapital: data.extracted_data?.authorized_capital,
      paidUpCapital: data.extracted_data?.paid_up_capital,
      directors: data.extracted_data?.directors,
      lastFilingDate: data.extracted_data?.last_filing_date,
      complianceStatus: data.extracted_data?.compliance_status,
      nameMatch: data.name_match?.status,
      nameMatchScore: data.name_match?.score,
      addressMatch: data.address_match?.status,
      addressMatchScore: data.address_match?.score,
    };

    // Update verification result
    if (!verification.verificationResult) {
      verification.verificationResult = {};
    }

    verification.verificationResult.document = {
      verified: data.status === 'SUCCESS' && data.is_valid,
      confidence: data.confidence_score || 0,
      extractedData: verification.cashfreeData.businessDetails,
    };
  }

  /**
   * Map Cashfree webhook status to KYC status
   */
  private mapWebhookStatusToKycStatus(cashfreeStatus: string): KycStatus {
    switch (cashfreeStatus) {
      case 'SUCCESS':
        return KycStatus.APPROVED;
      case 'FAILED':
        return KycStatus.REJECTED;
      case 'PENDING':
        return KycStatus.PENDING;
      default:
        this.logger.warn(`Unknown Cashfree status: ${cashfreeStatus}`);
        return KycStatus.PENDING;
    }
  }

  /**
   * Retry failed webhook processing
   */
  async retryWebhookProcessing(
    verificationId: string,
  ): Promise<WebhookVerificationResult> {
    try {
      this.logger.debug(
        `Retrying webhook processing for verification: ${verificationId}`,
      );

      // Find the verification record
      const kycVerification = await this.kycVerificationRepository.findOne({
        where: {
          cashfreeVerificationId: verificationId,
        },
      });

      if (!kycVerification) {
        return {
          isValid: false,
          error: 'Verification record not found',
        };
      }

      // Fetch latest status from Cashfree API
      const latestStatus =
        await this.fetchLatestVerificationStatus(verificationId);

      if (latestStatus) {
        const updatedStatus = this.mapWebhookStatusToKycStatus(
          latestStatus.status,
        );

        // Create a mock webhook payload for processing
        const mockPayload: CashfreeWebhookPayload = {
          event: this.getEventTypeFromVerification(kycVerification),
          verification_id: verificationId,
          status: latestStatus.status,
          timestamp: new Date().toISOString(),
          data: latestStatus.data,
        };

        await this.updateVerificationFromWebhook(
          kycVerification,
          mockPayload,
          updatedStatus,
        );

        return {
          isValid: true,
          verificationId,
          status: updatedStatus,
        };
      }

      return {
        isValid: false,
        error: 'Could not fetch latest verification status',
      };
    } catch (error) {
      this.logger.error('Failed to retry webhook processing', error);
      throw error;
    }
  }

  /**
   * Fetch latest verification status from Cashfree API
   */
  private async fetchLatestVerificationStatus(
    verificationId: string,
  ): Promise<any> {
    try {
      const response = await this.cashfreeVrsService.makeApiCall(
        `/verification/status/${verificationId}`,
        'GET',
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to fetch verification status from Cashfree',
        error,
      );
      return null;
    }
  }

  /**
   * Get event type based on verification type
   */
  private getEventTypeFromVerification(
    verification: KycVerificationEntity,
  ): string {
    switch (verification.verificationType) {
      case KycVerificationType.AADHAAR_VERIFICATION:
        return 'aadhaar.verification.completed';
      case KycVerificationType.PAN_VERIFICATION:
        return 'pan.verification.completed';
      case KycVerificationType.BANK_ACCOUNT:
        return 'bank.verification.completed';
      case KycVerificationType.GSTIN_VERIFICATION:
        return 'gstin.verification.completed';
      case KycVerificationType.BUSINESS_DETAILS:
        return 'business.verification.completed';
      default:
        return 'verification.completed';
    }
  }
}
