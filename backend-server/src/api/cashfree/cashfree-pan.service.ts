import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  CashfreeApiResponse,
  CashfreeVrsService,
} from './cashfree-vrs.service';

export interface PanVerificationRequest {
  panNumber: string;
  name?: string;
  dateOfBirth?: string;
  purpose?: string;
  consentText?: string;
}

export interface PanVerificationResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  verificationId: string;
  panNumber: string;
  isValid: boolean;
  nameMatch?: {
    status: 'MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH' | 'NOT_CHECKED';
    score?: number;
  };
  dobMatch?: {
    status: 'MATCH' | 'NO_MATCH' | 'NOT_CHECKED';
  };
  extractedData?: {
    name?: string;
    panNumber?: string;
    category?: string;
    panStatus?: string;
    lastUpdated?: string;
    aadhaarSeeded?: boolean;
  };
  confidenceScore?: number;
  errors?: string[];
}

export interface PanOcrRequest {
  verificationId: string;
  panImage: Buffer;
}

export interface PanOcrResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  verificationId: string;
  extractedData?: {
    panNumber?: string;
    name?: string;
    fatherName?: string;
    dateOfBirth?: string;
    signature?: string;
  };
  confidenceScore?: number;
  errors?: string[];
}

export interface BusinessPanVerificationRequest {
  panNumber: string;
  businessName?: string;
  purpose?: string;
  consentText?: string;
}

export interface BusinessPanVerificationResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  verificationId: string;
  panNumber: string;
  isValid: boolean;
  businessNameMatch?: {
    status: 'MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH' | 'NOT_CHECKED';
    score?: number;
  };
  extractedData?: {
    businessName?: string;
    panNumber?: string;
    category?: string;
    panStatus?: string;
    lastUpdated?: string;
    registrationDate?: string;
    businessType?: string;
  };
  confidenceScore?: number;
  errors?: string[];
}

@Injectable()
export class CashfreePanService {
  private readonly logger = new Logger(CashfreePanService.name);

  constructor(private readonly cashfreeVrsService: CashfreeVrsService) {}

  /**
   * Verify individual PAN number
   */
  async verifyIndividualPan(
    request: PanVerificationRequest,
  ): Promise<PanVerificationResult> {
    try {
      this.logger.debug(
        `Verifying individual PAN: ${this.maskPanNumber(request.panNumber)}`,
      );

      // Validate PAN format
      if (!this.isValidPanFormat(request.panNumber)) {
        throw new BadRequestException('Invalid PAN number format');
      }

      const response = await this.cashfreeVrsService.executeWithRetry(
        async () => {
          return this.cashfreeVrsService.makeApiCall(
            '/verification/pan/individual',
            'POST',
            {
              pan_number: request.panNumber.toUpperCase(),
              name: request.name,
              date_of_birth: request.dateOfBirth,
              purpose: request.purpose || 'Individual KYC Verification',
              consent_text:
                request.consentText ||
                'I consent to use my PAN for KYC verification',
            },
          );
        },
      );

      return this.mapIndividualPanResponse(response);
    } catch (error) {
      this.logger.error('Failed to verify individual PAN', error);
      throw error;
    }
  }

  /**
   * Verify business PAN number
   */
  async verifyBusinessPan(
    request: BusinessPanVerificationRequest,
  ): Promise<BusinessPanVerificationResult> {
    try {
      this.logger.debug(
        `Verifying business PAN: ${this.maskPanNumber(request.panNumber)}`,
      );

      // Validate PAN format
      if (!this.isValidPanFormat(request.panNumber)) {
        throw new BadRequestException('Invalid PAN number format');
      }

      const response = await this.cashfreeVrsService.executeWithRetry(
        async () => {
          return this.cashfreeVrsService.makeApiCall(
            '/verification/pan/business',
            'POST',
            {
              pan_number: request.panNumber.toUpperCase(),
              business_name: request.businessName,
              purpose: request.purpose || 'Business KYC Verification',
              consent_text:
                request.consentText ||
                'I consent to use business PAN for KYC verification',
            },
          );
        },
      );

      return this.mapBusinessPanResponse(response);
    } catch (error) {
      this.logger.error('Failed to verify business PAN', error);
      throw error;
    }
  }

  /**
   * Verify PAN via OCR (document upload)
   */
  async verifyPanViaOcr(request: PanOcrRequest): Promise<PanOcrResult> {
    try {
      this.logger.debug(
        `Performing PAN OCR verification for: ${request.verificationId}`,
      );

      const formData = new FormData();
      formData.append('verification_id', request.verificationId);
      formData.append(
        'pan_image',
        new Blob([Buffer.from(request.panImage)]),
        'pan_card.jpg',
      );

      const response = await this.cashfreeVrsService.executeWithRetry(
        async () => {
          return this.cashfreeVrsService.makeApiCall(
            '/verification/document/pan',
            'POST',
            formData,
          );
        },
      );

      return this.mapOcrResponse(response);
    } catch (error) {
      this.logger.error('Failed to perform PAN OCR verification', error);
      throw error;
    }
  }

  /**
   * Get PAN verification status
   */
  async getVerificationStatus(
    verificationId: string,
  ): Promise<PanVerificationResult> {
    try {
      this.logger.debug(
        `Getting PAN verification status for: ${verificationId}`,
      );

      const response = await this.cashfreeVrsService.executeWithRetry(
        async () => {
          return this.cashfreeVrsService.makeApiCall(
            `/verification/pan/status/${verificationId}`,
            'GET',
          );
        },
      );

      return this.mapIndividualPanResponse(response);
    } catch (error) {
      this.logger.error('Failed to get PAN verification status', error);
      throw error;
    }
  }

  /**
   * Validate PAN number format
   */
  private isValidPanFormat(panNumber: string): boolean {
    // PAN format: AAAAA9999A (5 letters, 4 digits, 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(panNumber.toUpperCase());
  }

  /**
   * Mask PAN number for privacy compliance
   */
  maskPanNumber(panNumber: string): string {
    if (panNumber.length !== 10) return panNumber;
    return panNumber.substring(0, 3) + 'XXXX' + panNumber.substring(7);
  }

  /**
   * Validate PAN category for individual vs business
   */
  getPanCategory(panNumber: string): 'INDIVIDUAL' | 'BUSINESS' | 'UNKNOWN' {
    if (!this.isValidPanFormat(panNumber)) return 'UNKNOWN';

    const fourthChar = panNumber.charAt(3).toUpperCase();

    // Individual PAN categories
    const individualCategories = ['P', 'A', 'B', 'G', 'J', 'L'];
    // Business PAN categories
    const businessCategories = ['C', 'F', 'H', 'T'];

    if (individualCategories.includes(fourthChar)) {
      return 'INDIVIDUAL';
    } else if (businessCategories.includes(fourthChar)) {
      return 'BUSINESS';
    }

    return 'UNKNOWN';
  }

  /**
   * Calculate name similarity score
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    if (!name1 || !name2) return 0;

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z]/g, '');
    const n1 = normalize(name1);
    const n2 = normalize(name2);

    if (n1 === n2) return 100;

    // Simple Levenshtein distance calculation
    const matrix = Array(n2.length + 1)
      .fill(null)
      .map(() => Array(n1.length + 1).fill(null));

    for (let i = 0; i <= n1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= n2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= n2.length; j++) {
      for (let i = 1; i <= n1.length; i++) {
        const indicator = n1[i - 1] === n2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }

    const distance = matrix[n2.length][n1.length];
    const maxLength = Math.max(n1.length, n2.length);
    return Math.round(((maxLength - distance) / maxLength) * 100);
  }

  /**
   * Map individual PAN response
   */
  private mapIndividualPanResponse(
    response: CashfreeApiResponse,
  ): PanVerificationResult {
    const data = response.data || {};

    return {
      status: response.status,
      verificationId: data.verification_id,
      panNumber: data.pan_number,
      isValid: data.is_valid || false,
      nameMatch: data.name_match
        ? {
            status: data.name_match.status,
            score: data.name_match.score,
          }
        : undefined,
      dobMatch: data.dob_match
        ? {
            status: data.dob_match.status,
          }
        : undefined,
      extractedData: data.extracted_data
        ? {
            name: data.extracted_data.name,
            panNumber: data.extracted_data.pan_number,
            category: data.extracted_data.category,
            panStatus: data.extracted_data.pan_status,
            lastUpdated: data.extracted_data.last_updated,
            aadhaarSeeded: data.extracted_data.aadhaar_seeded,
          }
        : undefined,
      confidenceScore: data.confidence_score,
      errors: response.error ? [response.error.message] : undefined,
    };
  }

  /**
   * Map business PAN response
   */
  private mapBusinessPanResponse(
    response: CashfreeApiResponse,
  ): BusinessPanVerificationResult {
    const data = response.data || {};

    return {
      status: response.status,
      verificationId: data.verification_id,
      panNumber: data.pan_number,
      isValid: data.is_valid || false,
      businessNameMatch: data.business_name_match
        ? {
            status: data.business_name_match.status,
            score: data.business_name_match.score,
          }
        : undefined,
      extractedData: data.extracted_data
        ? {
            businessName: data.extracted_data.business_name,
            panNumber: data.extracted_data.pan_number,
            category: data.extracted_data.category,
            panStatus: data.extracted_data.pan_status,
            lastUpdated: data.extracted_data.last_updated,
            registrationDate: data.extracted_data.registration_date,
            businessType: data.extracted_data.business_type,
          }
        : undefined,
      confidenceScore: data.confidence_score,
      errors: response.error ? [response.error.message] : undefined,
    };
  }

  /**
   * Map OCR response
   */
  private mapOcrResponse(response: CashfreeApiResponse): PanOcrResult {
    const data = response.data || {};

    return {
      status: response.status,
      verificationId: data.verification_id,
      extractedData: data.extracted_data
        ? {
            panNumber: data.extracted_data.pan_number,
            name: data.extracted_data.name,
            fatherName: data.extracted_data.father_name,
            dateOfBirth: data.extracted_data.date_of_birth,
            signature: data.extracted_data.signature,
          }
        : undefined,
      confidenceScore: data.confidence_score,
      errors: response.error ? [response.error.message] : undefined,
    };
  }
}
