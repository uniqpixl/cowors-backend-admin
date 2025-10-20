import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  CashfreeApiResponse,
  CashfreeVrsService,
} from './cashfree-vrs.service';

export interface AadhaarOtpRequest {
  aadhaarNumber: string;
  purpose?: string;
  consentText?: string;
}

export interface AadhaarOtpResult {
  refId: string;
  status: 'SUCCESS' | 'FAILED';
  message: string;
  otpExpiry: Date;
  maskedAadhaar?: string;
}

export interface AadhaarVerifyOtpRequest {
  refId: string;
  otp: string;
}

export interface AadhaarVerificationResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  refId: string;
  verificationId?: string;
  extractedData?: {
    name?: string;
    gender?: string;
    dob?: string;
    address?: string;
    fatherName?: string;
    mobileHash?: string;
    emailHash?: string;
    photoLink?: string;
    yearOfBirth?: string;
    careOf?: string;
    district?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  confidenceScore?: number;
  errors?: string[];
}

export interface AadhaarOcrRequest {
  verificationId: string;
  frontImage: Buffer;
  backImage?: Buffer;
}

export interface AadhaarOcrResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  verificationId: string;
  extractedData?: {
    aadhaarNumber?: string;
    name?: string;
    gender?: string;
    dob?: string;
    address?: string;
    fatherName?: string;
    pincode?: string;
  };
  confidenceScore?: number;
  errors?: string[];
}

@Injectable()
export class CashfreeAadhaarService {
  private readonly logger = new Logger(CashfreeAadhaarService.name);

  constructor(private readonly cashfreeVrsService: CashfreeVrsService) {}

  /**
   * Generate OTP for Aadhaar OKYC verification
   */
  async generateOtpForAadhaar(
    request: AadhaarOtpRequest,
  ): Promise<AadhaarOtpResult> {
    try {
      this.logger.debug('Generating OTP for Aadhaar verification');

      // Validate Aadhaar number format
      if (!this.isValidAadhaarNumber(request.aadhaarNumber)) {
        throw new BadRequestException('Invalid Aadhaar number format');
      }

      const response = await this.cashfreeVrsService.executeWithRetry(
        async () => {
          return this.cashfreeVrsService.makeApiCall(
            '/verification/aadhaar/otp',
            'POST',
            {
              aadhaar_number: request.aadhaarNumber,
              purpose: request.purpose || 'KYC Verification',
              consent_text:
                request.consentText ||
                'I consent to use my Aadhaar for KYC verification',
            },
          );
        },
      );

      if (response.status !== 'SUCCESS') {
        throw new BadRequestException(
          response.message || 'Failed to generate OTP',
        );
      }

      return {
        refId: response.data.ref_id,
        status: response.status,
        message: response.message,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        maskedAadhaar: this.maskAadhaarNumber(request.aadhaarNumber),
      };
    } catch (error) {
      this.logger.error('Failed to generate Aadhaar OTP', error);
      throw error;
    }
  }

  /**
   * Verify Aadhaar using OTP
   */
  async verifyAadhaarWithOtp(
    request: AadhaarVerifyOtpRequest,
  ): Promise<AadhaarVerificationResult> {
    try {
      this.logger.debug(`Verifying Aadhaar OTP for refId: ${request.refId}`);

      const response = await this.cashfreeVrsService.executeWithRetry(
        async () => {
          return this.cashfreeVrsService.makeApiCall(
            '/verification/aadhaar/verify',
            'POST',
            {
              ref_id: request.refId,
              otp: request.otp,
            },
          );
        },
      );

      return this.mapAadhaarResponse(response);
    } catch (error) {
      this.logger.error('Failed to verify Aadhaar OTP', error);
      throw error;
    }
  }

  /**
   * Verify Aadhaar via OCR (document upload)
   */
  async verifyAadhaarViaOcr(
    request: AadhaarOcrRequest,
  ): Promise<AadhaarOcrResult> {
    try {
      this.logger.debug(
        `Performing Aadhaar OCR verification for: ${request.verificationId}`,
      );

      const formData = new FormData();
      formData.append('verification_id', request.verificationId);
      formData.append(
        'front_image',
        new Blob([Buffer.from(request.frontImage)]),
        'aadhaar_front.jpg',
      );
      if (request.backImage) {
        formData.append(
          'back_image',
          new Blob([Buffer.from(request.backImage)]),
          'aadhaar_back.jpg',
        );
      }

      const response = await this.cashfreeVrsService.executeWithRetry(
        async () => {
          return this.cashfreeVrsService.makeApiCall(
            '/verification/document/aadhaar',
            'POST',
            formData,
          );
        },
      );

      return this.mapOcrResponse(response);
    } catch (error) {
      this.logger.error('Failed to perform Aadhaar OCR verification', error);
      throw error;
    }
  }

  /**
   * Get verification status by reference ID
   */
  async getVerificationStatus(
    refId: string,
  ): Promise<AadhaarVerificationResult> {
    try {
      this.logger.debug(
        `Getting Aadhaar verification status for refId: ${refId}`,
      );

      const response = await this.cashfreeVrsService.executeWithRetry(
        async () => {
          return this.cashfreeVrsService.makeApiCall(
            `/verification/aadhaar/status/${refId}`,
            'GET',
          );
        },
      );

      return this.mapAadhaarResponse(response);
    } catch (error) {
      this.logger.error('Failed to get Aadhaar verification status', error);
      throw error;
    }
  }

  /**
   * Validate Aadhaar number format
   */
  private isValidAadhaarNumber(aadhaarNumber: string): boolean {
    // Remove spaces and check if it's 12 digits
    const cleaned = aadhaarNumber.replace(/\s/g, '');

    if (!/^\d{12}$/.test(cleaned)) {
      return false;
    }

    // Validate using Verhoeff algorithm
    return this.verifyVerhoeffChecksum(cleaned);
  }

  /**
   * Verify Aadhaar checksum using Verhoeff algorithm
   */
  private verifyVerhoeffChecksum(aadhaarNumber: string): boolean {
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
    const myArray = aadhaarNumber.split('').map(Number).reverse();

    for (let i = 0; i < myArray.length; i++) {
      c = d[c][p[(i + 1) % 8][myArray[i]]];
    }

    return c === 0;
  }

  /**
   * Mask Aadhaar number for privacy compliance
   */
  maskAadhaarNumber(aadhaarNumber: string): string {
    const cleaned = aadhaarNumber.replace(/\s/g, '');
    return cleaned.replace(/\d(?=\d{4})/g, 'X');
  }

  /**
   * Create irreversible hash for Aadhaar storage compliance
   */
  async hashAadhaarForStorage(aadhaarNumber: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(aadhaarNumber).digest('hex');
  }

  /**
   * Map Cashfree Aadhaar API response to our format
   */
  private mapAadhaarResponse(
    response: CashfreeApiResponse,
  ): AadhaarVerificationResult {
    const data = response.data || {};

    return {
      status: response.status,
      refId: data.ref_id,
      verificationId: data.verification_id,
      extractedData: data.extracted_data
        ? {
            name: data.extracted_data.name,
            gender: data.extracted_data.gender,
            dob: data.extracted_data.dob,
            address: data.extracted_data.address,
            fatherName: data.extracted_data.care_of,
            mobileHash: data.extracted_data.mobile_hash,
            emailHash: data.extracted_data.email,
            photoLink: data.extracted_data.photo_link,
            yearOfBirth: data.extracted_data.year_of_birth,
            careOf: data.extracted_data.care_of,
            district: data.extracted_data.dist,
            state: data.extracted_data.state,
            pincode: data.extracted_data.pincode,
            country: data.extracted_data.country,
          }
        : undefined,
      confidenceScore: data.confidence_score,
      errors: response.error ? [response.error.message] : undefined,
    };
  }

  /**
   * Map Cashfree OCR response to our format
   */
  private mapOcrResponse(response: CashfreeApiResponse): AadhaarOcrResult {
    const data = response.data || {};

    return {
      status: response.status,
      verificationId: data.verification_id,
      extractedData: data.extracted_data
        ? {
            aadhaarNumber: data.extracted_data.aadhaar_number,
            name: data.extracted_data.name,
            gender: data.extracted_data.gender,
            dob: data.extracted_data.dob,
            address: data.extracted_data.address,
            fatherName: data.extracted_data.father_name,
            pincode: data.extracted_data.pincode,
          }
        : undefined,
      confidenceScore: data.confidence_score,
      errors: response.error ? [response.error.message] : undefined,
    };
  }
}
