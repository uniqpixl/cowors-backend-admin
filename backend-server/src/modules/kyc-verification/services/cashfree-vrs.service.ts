import { CashfreeConfig } from '@/config/cashfree/cashfree-config.type';
import { GlobalConfig } from '@/config/config.type';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import {
  AadhaarOcrVerificationDto,
  AadhaarVerificationResultDto,
  BankAccountVerificationDto,
  BankVerificationResultDto,
  BulkVerificationRequestDto,
  BulkVerificationResponseDto,
  BusinessDetailsVerificationDto,
  CashfreeVerificationResponseDto,
  GstinVerificationDto,
  GstinVerificationResultDto,
  InitiateAadhaarVerificationDto,
  PanVerificationDto,
  PanVerificationResultDto,
  VerifyAadhaarOtpDto,
} from '../dto/cashfree-vrs.dto';

interface CashfreeAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class CashfreeVrsService {
  private readonly logger = new Logger(CashfreeVrsService.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: CashfreeConfig;
  private accessToken: string | null = null;
  private tokenExpiryTime: number = 0;

  constructor(private readonly configService: ConfigService<GlobalConfig>) {
    this.config = this.configService.getOrThrow('cashfree', { infer: true });

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Cashfree VRS credentials not configured');
    }

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2022-09-01',
      },
    });

    // Add request interceptor for authentication
    this.httpClient.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error('Cashfree VRS API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          config: {
            method: error.config?.method,
            url: error.config?.url,
          },
        });
        throw error;
      },
    );
  }

  /**
   * Get access token for Cashfree VRS API
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid
    if (this.accessToken && now < this.tokenExpiryTime) {
      return this.accessToken;
    }

    try {
      const response = await axios.post<CashfreeAuthResponse>(
        `${this.config.baseUrl}/authenticate`,
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'client_credentials',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      this.accessToken = response.data.access_token;
      // Set expiry time with 5 minute buffer
      this.tokenExpiryTime = now + (response.data.expires_in - 300) * 1000;

      this.logger.log('Successfully obtained Cashfree VRS access token');
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to obtain Cashfree VRS access token:', error);
      throw new InternalServerErrorException(
        'Failed to authenticate with Cashfree VRS',
      );
    }
  }

  /**
   * Generate OTP for Aadhaar verification
   */
  async initiateAadhaarVerification(
    dto: InitiateAadhaarVerificationDto,
  ): Promise<CashfreeVerificationResponseDto> {
    try {
      const payload = {
        aadhaar_number: dto.aadhaarNumber,
        consent: dto.consent || true,
        purpose: 'KYC verification for Cowors platform',
      };

      const response = await this.httpClient.post(
        '/aadhaar/otp/generate',
        payload,
      );

      return {
        verificationId: response.data.verification_id,
        status: 'PENDING',
        refId: response.data.ref_id,
        otpExpiry: response.data.otp_expiry,
      };
    } catch (error) {
      this.logger.error('Failed to initiate Aadhaar verification:', error);
      throw new BadRequestException('Failed to initiate Aadhaar verification');
    }
  }

  /**
   * Verify Aadhaar OTP
   */
  async verifyAadhaarOtp(
    dto: VerifyAadhaarOtpDto,
  ): Promise<AadhaarVerificationResultDto> {
    try {
      const payload = {
        otp: dto.otp,
        ref_id: dto.refId,
      };

      const response = await this.httpClient.post(
        '/aadhaar/otp/verify',
        payload,
      );

      return {
        status: response.data.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        aadhaarMasked: response.data.aadhaar_masked,
        extractedData: response.data.extracted_data
          ? {
              name: response.data.extracted_data.name,
              gender: response.data.extracted_data.gender,
              dob: response.data.extracted_data.dob,
              address: response.data.extracted_data.address,
              fatherName: response.data.extracted_data.father_name,
              mobileHash: response.data.extracted_data.mobile_hash,
              emailHash: response.data.extracted_data.email_hash,
              photoLink: response.data.extracted_data.photo_link,
              yearOfBirth: response.data.extracted_data.year_of_birth,
              careOf: response.data.extracted_data.care_of,
              district: response.data.extracted_data.district,
              state: response.data.extracted_data.state,
              pincode: response.data.extracted_data.pincode,
              country: response.data.extracted_data.country,
            }
          : undefined,
        verificationScore: response.data.verification_score,
      };
    } catch (error) {
      this.logger.error('Failed to verify Aadhaar OTP:', error);
      throw new BadRequestException('Failed to verify Aadhaar OTP');
    }
  }

  /**
   * Verify Aadhaar using OCR
   */
  async verifyAadhaarOcr(
    dto: AadhaarOcrVerificationDto,
  ): Promise<AadhaarVerificationResultDto> {
    try {
      const payload = {
        aadhaar_image: dto.aadhaarImage,
        quality_check: dto.qualityCheck || true,
      };

      const response = await this.httpClient.post('/aadhaar/ocr', payload);

      return {
        status: response.data.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        aadhaarMasked: response.data.aadhaar_masked,
        extractedData: response.data.extracted_data
          ? {
              name: response.data.extracted_data.name,
              gender: response.data.extracted_data.gender,
              dob: response.data.extracted_data.dob,
              address: response.data.extracted_data.address,
              fatherName: response.data.extracted_data.father_name,
              district: response.data.extracted_data.district,
              state: response.data.extracted_data.state,
              pincode: response.data.extracted_data.pincode,
              country: response.data.extracted_data.country,
            }
          : undefined,
        ocrConfidenceScore: response.data.ocr_confidence_score,
        verificationScore: response.data.verification_score,
      };
    } catch (error) {
      this.logger.error('Failed to verify Aadhaar OCR:', error);
      throw new BadRequestException('Failed to verify Aadhaar OCR');
    }
  }

  /**
   * Verify PAN
   */
  async verifyPan(dto: PanVerificationDto): Promise<PanVerificationResultDto> {
    try {
      const payload = {
        pan_number: dto.panNumber,
        name_to_match: dto.nameToMatch,
        date_of_birth: dto.dateOfBirth,
      };

      const response = await this.httpClient.post('/pan/verify', payload);

      return {
        status: response.data.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        panExists: response.data.pan_exists,
        nameMatch: response.data.name_match,
        nameMatchScore: response.data.name_match_score,
        panCategory: response.data.pan_category,
        nameOnPan: response.data.name_on_pan,
        panType: response.data.pan_type,
        lastUpdated: response.data.last_updated,
      };
    } catch (error) {
      this.logger.error('Failed to verify PAN:', error);
      throw new BadRequestException('Failed to verify PAN');
    }
  }

  /**
   * Verify Bank Account
   */
  async verifyBankAccount(
    dto: BankAccountVerificationDto,
  ): Promise<BankVerificationResultDto> {
    try {
      const payload = {
        account_number: dto.accountNumber,
        ifsc_code: dto.ifscCode,
        account_holder_name: dto.accountHolderName,
        verification_method: dto.verificationMethod || 'penny_drop',
      };

      const response = await this.httpClient.post('/bank/verify', payload);

      return {
        status: response.data.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        accountExists: response.data.account_exists,
        nameMatch: response.data.name_match,
        nameMatchScore: response.data.name_match_score,
        accountType: response.data.account_type,
        accountStatus: response.data.account_status,
        bankName: response.data.bank_name,
        accountHolderName: response.data.account_holder_name,
      };
    } catch (error) {
      this.logger.error('Failed to verify bank account:', error);
      throw new BadRequestException('Failed to verify bank account');
    }
  }

  /**
   * Verify GSTIN
   */
  async verifyGstin(
    dto: GstinVerificationDto,
  ): Promise<GstinVerificationResultDto> {
    try {
      const payload = {
        gstin_number: dto.gstinNumber,
        business_name: dto.businessName,
      };

      const response = await this.httpClient.post('/gstin/verify', payload);

      return {
        status: response.data.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        gstinExists: response.data.gstin_exists,
        businessNameMatch: response.data.business_name_match,
        registrationStatus: response.data.registration_status,
        businessName: response.data.business_name,
        businessType: response.data.business_type,
        registrationDate: response.data.registration_date,
        filingStatus: response.data.filing_status,
        lastReturn: response.data.last_return,
      };
    } catch (error) {
      this.logger.error('Failed to verify GSTIN:', error);
      throw new BadRequestException('Failed to verify GSTIN');
    }
  }

  /**
   * Create browser-based verification form
   */
  async createVerificationForm(
    verificationType: string,
    data: any,
  ): Promise<{ formId: string; formUrl: string }> {
    try {
      const payload = {
        verification_type: verificationType,
        verification_data: data,
        callback_url: `${this.configService.getOrThrow('app.url', { infer: true })}/api/v1/kyc/cashfree/webhook`,
        redirect_url: `${this.configService.getOrThrow('app.url', { infer: true })}/verification/complete`,
      };

      const response = await this.httpClient.post('/form/create', payload);

      return {
        formId: response.data.form_id,
        formUrl: response.data.form_url,
      };
    } catch (error) {
      this.logger.error('Failed to create verification form:', error);
      throw new BadRequestException('Failed to create verification form');
    }
  }

  /**
   * Get verification status
   */
  async getVerificationStatus(verificationId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/status/${verificationId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get verification status:', error);
      throw new BadRequestException('Failed to get verification status');
    }
  }

  /**
   * Process bulk verifications
   */
  async processBulkVerifications(
    dto: BulkVerificationRequestDto,
  ): Promise<BulkVerificationResponseDto> {
    try {
      const payload = {
        verifications: dto.verifications,
        batch_name: dto.batchName,
        callback_url: dto.callbackUrl,
      };

      const response = await this.httpClient.post('/bulk/verify', payload);

      return {
        batchId: response.data.batch_id,
        totalCount: response.data.total_count,
        successCount: response.data.success_count,
        failedCount: response.data.failed_count,
        results: response.data.results,
        estimatedCompletionTime: response.data.estimated_completion_time,
      };
    } catch (error) {
      this.logger.error('Failed to process bulk verifications:', error);
      throw new BadRequestException('Failed to process bulk verifications');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error('Failed to verify webhook signature:', error);
      return false;
    }
  }

  /**
   * Mask Aadhaar number for security
   */
  maskAadhaar(aadhaarNumber: string): string {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      return aadhaarNumber;
    }
    return `XXXX-XXXX-${aadhaarNumber.slice(-4)}`;
  }

  /**
   * Validate Aadhaar number format
   */
  validateAadhaarNumber(aadhaarNumber: string): boolean {
    // Remove spaces and hyphens
    const cleanAadhaar = aadhaarNumber.replace(/[\s-]/g, '');

    // Check if it's 12 digits
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      return false;
    }

    // Verhoeff algorithm validation
    const d = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    ];

    const p = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
    ];

    let c = 0;
    const myArray = cleanAadhaar.split('').map(Number).reverse();

    for (let i = 0; i < myArray.length; i++) {
      c = d[c][p[i % 8][myArray[i]]];
    }

    return c === 0;
  }

  /**
   * Validate PAN number format
   */
  validatePanNumber(panNumber: string): boolean {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(panNumber.toUpperCase());
  }

  /**
   * Validate GSTIN number format
   */
  validateGstinNumber(gstinNumber: string): boolean {
    const gstinRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstinNumber.toUpperCase());
  }
}
