import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  KycProvider,
  KycStatus,
  KycVerificationEntity,
  KycVerificationType,
  UserType,
} from '@/database/entities/kyc-verification.entity';
import { CashfreeWebhookDto } from '@/modules/kyc-verification/dto/cashfree-vrs.dto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CashfreeAadhaarService } from '../cashfree/cashfree-aadhaar.service';
import { CashfreeBusinessService } from '../cashfree/cashfree-business.service';
import { CashfreePanService } from '../cashfree/cashfree-pan.service';
import { CashfreeVrsService } from '../cashfree/cashfree-vrs.service';
import {
  CashfreeWebhookPayload,
  CashfreeWebhookService,
} from '../cashfree/cashfree-webhook.service';
import {
  InitiateKycVerificationDto,
  KycStatusResponseDto,
  KycVerificationResponseDto,
  KycWebhookDto,
} from './dto/kyc-verification.dto';

@Injectable()
export class KycVerificationService {
  private readonly logger = new Logger(KycVerificationService.name);

  constructor(
    @InjectRepository(KycVerificationEntity)
    private readonly kycVerificationRepository: Repository<KycVerificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cashfreeVrsService: CashfreeVrsService,
    private readonly cashfreeAadhaarService: CashfreeAadhaarService,
    private readonly cashfreePanService: CashfreePanService,
    private readonly cashfreeBusinessService: CashfreeBusinessService,
    private readonly cashfreeWebhookService: CashfreeWebhookService,
  ) {}

  async initiateVerification(
    userId: string,
    dto: InitiateKycVerificationDto,
  ): Promise<KycVerificationResponseDto> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if booking exists (if provided)
    let booking: BookingEntity | null = null;
    if (dto.bookingId) {
      booking = await this.bookingRepository.findOne({
        where: { id: dto.bookingId, userId },
      });
      if (!booking) {
        throw new NotFoundException(
          'Booking not found or does not belong to user',
        );
      }
    }

    // Check for existing pending verification
    const existingVerification = await this.kycVerificationRepository.findOne({
      where: {
        userId,
        status: KycStatus.PENDING,
        verificationType: dto.verificationType,
      },
    });

    if (existingVerification) {
      throw new BadRequestException(
        'A verification of this type is already in progress',
      );
    }

    // Create verification record
    const verification = this.kycVerificationRepository.create({
      userId,
      bookingId: dto.bookingId,
      partnerId: dto.partnerId,
      userType: dto.userType,
      status: KycStatus.PENDING,
      provider: dto.provider,
      verificationType: dto.verificationType,
      submittedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    const savedVerification =
      await this.kycVerificationRepository.save(verification);

    // Generate provider session
    const providerSession = await this.createProviderSession(
      savedVerification,
      dto.returnUrl,
      dto.verificationData,
    );

    // Update verification with provider data
    savedVerification.providerSessionId = providerSession.sessionId;
    savedVerification.providerTransactionId = providerSession.transactionId;

    // Update Cashfree-specific fields if using Cashfree
    if (
      dto.provider === KycProvider.CASHFREE &&
      providerSession.cashfreeFormId
    ) {
      savedVerification.cashfreeFormId = providerSession.cashfreeFormId;
      savedVerification.cashfreeFormUrl = providerSession.cashfreeFormUrl;
      savedVerification.cashfreeVerificationId = providerSession.verificationId;
    }

    await this.kycVerificationRepository.save(savedVerification);

    // Update booking KYC status if applicable
    if (booking) {
      booking.kycStatus = 'pending';
      booking.kycVerificationId = savedVerification.id;
      await this.bookingRepository.save(booking);
    }

    return {
      sessionId: providerSession.sessionId,
      verificationUrl: providerSession.verificationUrl,
      status: savedVerification.status,
      verificationId: savedVerification.id,
      expiresAt: savedVerification.expiresAt,
      cashfreeFormUrl: savedVerification.cashfreeFormUrl,
      cashfreeFormId: savedVerification.cashfreeFormId,
    };
  }

  async getVerificationStatus(userId: string): Promise<KycStatusResponseDto> {
    const verification = await this.kycVerificationRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!verification) {
      throw new NotFoundException('No verification found for user');
    }

    return {
      status: verification.status,
      provider: verification.provider,
      verificationType: verification.verificationType,
      completedAt: verification.completedAt,
      submittedAt: verification.submittedAt,
      rejectionReason: verification.rejectionReason,
      verificationResult: verification.verificationResult,
      bookingId: verification.bookingId,
      userType: verification.userType,
      partnerId: verification.partnerId,
      cashfreeResult: verification.cashfreeResult,
    };
  }

  async handleWebhook(dto: KycWebhookDto): Promise<{ success: boolean }> {
    // Find verification by provider session ID
    const verification = await this.kycVerificationRepository.findOne({
      where: { providerSessionId: dto.sessionId },
      relations: ['user', 'booking'],
    });

    if (!verification) {
      throw new NotFoundException('Verification session not found');
    }

    // Update verification status
    verification.status = dto.status;
    verification.verificationResult = dto.verificationResult;
    verification.rejectionReason = dto.rejectionReason;
    verification.providerTransactionId =
      dto.transactionId || verification.providerTransactionId;

    if (
      dto.status === KycStatus.APPROVED ||
      dto.status === KycStatus.REJECTED
    ) {
      verification.completedAt = new Date();
    }

    await this.kycVerificationRepository.save(verification);

    // Update user KYC status
    if (dto.status === KycStatus.APPROVED) {
      await this.userRepository.update(verification.userId, {
        kycVerified: true,
        kycProvider: verification.provider,
        kycVerifiedAt: new Date(),
        kycVerificationId: verification.id,
      });

      // Emit KYC completed event for payment processing
      this.eventEmitter.emit('kyc.completed', {
        userId: verification.userId,
        verificationId: verification.id,
        provider: verification.provider,
        completedAt: new Date(),
        bookingId: verification.bookingId,
      });
    }

    // Update booking KYC status if applicable
    if (verification.booking) {
      const bookingKycStatus = this.mapKycStatusToBookingStatus(dto.status);
      verification.booking.kycStatus = bookingKycStatus;
      if (dto.status === KycStatus.APPROVED) {
        verification.booking.kycCompletedAt = new Date();
      }
      await this.bookingRepository.save(verification.booking);
    }

    // Emit KYC status change event
    this.eventEmitter.emit('kyc.status.changed', {
      userId: verification.userId,
      verificationId: verification.id,
      status: dto.status,
      previousStatus: verification.status,
      bookingId: verification.bookingId,
      timestamp: new Date(),
    });

    return { success: true };
  }

  private async createProviderSession(
    verification: KycVerificationEntity,
    returnUrl?: string,
    verificationData?: any,
  ): Promise<{
    sessionId: string;
    transactionId: string;
    verificationUrl: string;
    verificationId?: string;
    cashfreeFormId?: string;
    cashfreeFormUrl?: string;
  }> {
    const sessionId = `${verification.provider.toLowerCase()}_${uuidv4()}`;
    const transactionId = `txn_${uuidv4()}`;

    // Handle Cashfree VRS integration
    if (verification.provider === KycProvider.CASHFREE) {
      return await this.createCashfreeSession(
        verification,
        verificationData,
        sessionId,
        transactionId,
      );
    }

    // Mock verification URLs for other providers
    const baseUrls = {
      [KycProvider.JUMIO]: 'https://demo.jumio.com/verify',
      [KycProvider.ONFIDO]: 'https://demo.onfido.com/verify',
      [KycProvider.SUMSUB]: 'https://demo.sumsub.com/verify',
      [KycProvider.VERIFF]: 'https://demo.veriff.com/verify',
    };

    const verificationUrl = `${baseUrls[verification.provider]}/${sessionId}?return_url=${encodeURIComponent(returnUrl || '')}`;

    return {
      sessionId,
      transactionId,
      verificationUrl,
    };
  }

  private async createCashfreeSession(
    verification: KycVerificationEntity,
    verificationData: any,
    sessionId: string,
    transactionId: string,
  ): Promise<{
    sessionId: string;
    transactionId: string;
    verificationUrl: string;
    verificationId?: string;
    cashfreeFormId?: string;
    cashfreeFormUrl?: string;
  }> {
    try {
      let verificationResult: any;
      let verificationUrl: string;
      let cashfreeVerificationId: string;

      // Handle different verification types with appropriate Cashfree services
      switch (verification.verificationType) {
        case KycVerificationType.AADHAAR_VERIFICATION:
        case KycVerificationType.DIRECTOR_AADHAAR:
          if (verificationData?.aadhaarNumber) {
            // For Aadhaar, we need to generate OTP first
            const otpResult =
              await this.cashfreeAadhaarService.generateOtpForAadhaar({
                aadhaarNumber: verificationData.aadhaarNumber,
                purpose: 'KYC Verification',
                consentText: 'I consent to use my Aadhaar for KYC verification',
              });
            verificationUrl = `${this.configService.get('FRONTEND_URL')}/kyc/aadhaar/verify-otp?refId=${otpResult.refId}`;
            cashfreeVerificationId = otpResult.refId;
          } else {
            throw new BadRequestException(
              'Aadhaar number is required for Aadhaar verification',
            );
          }
          break;

        case KycVerificationType.PAN_VERIFICATION:
          if (verificationData?.panNumber) {
            verificationResult =
              await this.cashfreePanService.verifyIndividualPan({
                panNumber: verificationData.panNumber,
                name: verificationData.nameToMatch,
                dateOfBirth: verificationData.dateOfBirth,
                purpose: 'KYC Verification',
              });
            verificationUrl = `${this.configService.get('FRONTEND_URL')}/kyc/pan/result?verificationId=${verificationResult.verificationId}`;
            cashfreeVerificationId = verificationResult.verificationId;
          } else {
            throw new BadRequestException(
              'PAN number is required for PAN verification',
            );
          }
          break;

        case KycVerificationType.BUSINESS_PAN:
          if (verificationData?.panNumber) {
            verificationResult =
              await this.cashfreePanService.verifyBusinessPan({
                panNumber: verificationData.panNumber,
                businessName: verificationData.businessName,
                purpose: 'Business KYC Verification',
              });
            verificationUrl = `${this.configService.get('FRONTEND_URL')}/kyc/business-pan/result?verificationId=${verificationResult.verificationId}`;
            cashfreeVerificationId = verificationResult.verificationId;
          } else {
            throw new BadRequestException(
              'Business PAN number is required for business PAN verification',
            );
          }
          break;

        case KycVerificationType.BANK_ACCOUNT:
          if (verificationData?.accountNumber && verificationData?.ifscCode) {
            verificationResult =
              await this.cashfreeBusinessService.verifyBankAccount({
                accountNumber: verificationData.accountNumber,
                ifscCode: verificationData.ifscCode,
                accountHolderName: verificationData.accountHolderName,
                purpose: 'Bank Account Verification',
              });
            verificationUrl = `${this.configService.get('FRONTEND_URL')}/kyc/bank-account/result?verificationId=${verificationResult.verificationId}`;
            cashfreeVerificationId = verificationResult.verificationId;
          } else {
            throw new BadRequestException(
              'Account number and IFSC code are required for bank account verification',
            );
          }
          break;

        case KycVerificationType.GSTIN_VERIFICATION:
          if (verificationData?.gstinNumber) {
            verificationResult = await this.cashfreeBusinessService.verifyGstin(
              {
                gstinNumber: verificationData.gstinNumber,
                businessName: verificationData.businessName,
                purpose: 'GSTIN Verification',
              },
            );
            verificationUrl = `${this.configService.get('FRONTEND_URL')}/kyc/gstin/result?verificationId=${verificationResult.verificationId}`;
            cashfreeVerificationId = verificationResult.verificationId;
          } else {
            throw new BadRequestException(
              'GSTIN number is required for GSTIN verification',
            );
          }
          break;

        case KycVerificationType.BUSINESS_DETAILS:
          if (
            verificationData?.businessName &&
            verificationData?.businessType
          ) {
            verificationResult =
              await this.cashfreeBusinessService.verifyBusinessDetails({
                businessName: verificationData.businessName,
                businessType: verificationData.businessType,
                registrationNumber: verificationData.registrationNumber,
                incorporationDate: verificationData.incorporationDate,
                businessAddress: verificationData.address,
                purpose: 'Business Details Verification',
              });
            verificationUrl = `${this.configService.get('FRONTEND_URL')}/kyc/business-details/result?verificationId=${verificationResult.verificationId}`;
            cashfreeVerificationId = verificationResult.verificationId;
          } else {
            throw new BadRequestException(
              'Business name and type are required for business details verification',
            );
          }
          break;

        default:
          throw new BadRequestException(
            `Unsupported verification type: ${verification.verificationType}`,
          );
      }

      return {
        sessionId,
        transactionId,
        verificationUrl,
        verificationId: verification.id,
        cashfreeFormId: cashfreeVerificationId,
        cashfreeFormUrl: verificationUrl,
      };
    } catch (error) {
      this.logger.error('Failed to create Cashfree session:', error);
      throw new BadRequestException(
        `Failed to create Cashfree verification session: ${error.message}`,
      );
    }
  }

  private mapToCashfreeVerificationType(
    verificationType: KycVerificationType,
  ): string {
    const typeMapping = {
      [KycVerificationType.AADHAAR_VERIFICATION]: 'aadhaar',
      [KycVerificationType.PAN_VERIFICATION]: 'pan',
      [KycVerificationType.BANK_ACCOUNT]: 'bank_account',
      [KycVerificationType.GSTIN_VERIFICATION]: 'gstin',
      [KycVerificationType.BUSINESS_DETAILS]: 'business_details',
      [KycVerificationType.BUSINESS_PAN]: 'pan',
      [KycVerificationType.DIRECTOR_AADHAAR]: 'aadhaar',
      // Fallback for legacy types
      [KycVerificationType.IDENTITY]: 'aadhaar',
      [KycVerificationType.ADDRESS]: 'aadhaar',
      [KycVerificationType.DOCUMENT]: 'pan',
      [KycVerificationType.BIOMETRIC]: 'aadhaar',
    };

    return typeMapping[verificationType] || 'aadhaar';
  }

  private async processCashfreeWebhook(
    verification: KycVerificationEntity,
    webhookData: CashfreeWebhookPayload,
  ): Promise<void> {
    try {
      // Use the Cashfree webhook service to process the webhook
      // Note: For internal processing, we'll use empty signature and rawBody
      await this.cashfreeWebhookService.processWebhook(
        webhookData,
        '',
        JSON.stringify(webhookData),
      );

      // Reload the verification to get updated data
      const updatedVerification = await this.kycVerificationRepository.findOne({
        where: { id: verification.id },
        relations: ['user', 'booking'],
      });

      if (!updatedVerification) {
        throw new Error('Verification not found after webhook processing');
      }

      // Emit events
      this.eventEmitter.emit('kyc.completed', {
        userId: updatedVerification.user?.id,
        partnerId: updatedVerification.partnerId,
        bookingId: updatedVerification.booking?.id,
        verificationType: updatedVerification.verificationType,
        status: updatedVerification.status,
        provider: updatedVerification.provider,
      });

      this.eventEmitter.emit('kyc.status.changed', {
        verificationId: updatedVerification.id,
        oldStatus: verification.status,
        newStatus: updatedVerification.status,
        provider: updatedVerification.provider,
      });
    } catch (error) {
      this.logger.error('Failed to handle Cashfree webhook:', error);
      throw error;
    }
  }

  private mapCashfreeStatusToKycStatus(cashfreeStatus: string): KycStatus {
    switch (cashfreeStatus.toUpperCase()) {
      case 'SUCCESS':
        return KycStatus.APPROVED;
      case 'FAILED':
        return KycStatus.REJECTED;
      case 'PENDING':
        return KycStatus.IN_PROGRESS;
      default:
        return KycStatus.PENDING;
    }
  }

  private extractCashfreeVerificationResult(
    verificationType: KycVerificationType,
    data: any,
  ): any {
    switch (verificationType) {
      case KycVerificationType.BANK_ACCOUNT:
        return {
          bankVerification: {
            accountExists: data?.account_exists,
            nameMatch: data?.name_match,
            nameMatchScore: data?.name_match_score,
            accountType: data?.account_type,
            accountStatus: data?.account_status,
          },
        };
      case KycVerificationType.PAN_VERIFICATION:
      case KycVerificationType.BUSINESS_PAN:
        return {
          panVerification: {
            panExists: data?.pan_exists,
            nameMatch: data?.name_match,
            nameMatchScore: data?.name_match_score,
            panCategory: data?.pan_category,
            lastUpdated: data?.last_updated,
          },
        };
      case KycVerificationType.GSTIN_VERIFICATION:
        return {
          gstinVerification: {
            gstinExists: data?.gstin_exists,
            businessNameMatch: data?.business_name_match,
            registrationStatus: data?.registration_status,
            filingStatus: data?.filing_status,
            lastReturn: data?.last_return,
          },
        };
      default:
        return {};
    }
  }

  private mapKycStatusToBookingStatus(
    kycStatus: KycStatus,
  ): 'not_required' | 'pending' | 'in_progress' | 'completed' | 'failed' {
    switch (kycStatus) {
      case KycStatus.PENDING:
        return 'pending';
      case KycStatus.IN_PROGRESS:
        return 'in_progress';
      case KycStatus.APPROVED:
        return 'completed';
      case KycStatus.REJECTED:
        return 'failed';
      default:
        return 'not_required';
    }
  }

  async getVerificationById(
    verificationId: string,
  ): Promise<KycVerificationEntity> {
    const verification = await this.kycVerificationRepository.findOne({
      where: { id: verificationId },
      relations: ['user', 'booking'],
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    return verification;
  }

  async getUserVerifications(userId: string): Promise<KycVerificationEntity[]> {
    return this.kycVerificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  public async handleCashfreeWebhook(
    dto: CashfreeWebhookDto,
  ): Promise<{ success: boolean }> {
    try {
      // Find verification by Cashfree form ID or verification ID
      const verification = await this.kycVerificationRepository.findOne({
        where: [
          { cashfreeFormId: dto.formId },
          { cashfreeVerificationId: dto.verificationId },
        ],
        relations: ['user', 'booking'],
      });

      if (!verification) {
        throw new NotFoundException(
          'Verification not found for Cashfree form ID',
        );
      }

      // Convert DTO to CashfreeWebhookPayload format
      const webhookPayload: CashfreeWebhookPayload = {
        event: dto.event,
        verification_id: dto.verificationId,
        status: dto.status as 'SUCCESS' | 'FAILED' | 'PENDING',
        data: dto.data,
        timestamp: dto.timestamp || new Date().toISOString(),
      };

      // Process the webhook using the Cashfree webhook service
      await this.processCashfreeWebhook(verification, webhookPayload);

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to handle Cashfree webhook:', error);
      throw error;
    }
  }
}
