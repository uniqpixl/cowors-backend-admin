import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  CashfreeApiResponse,
  CashfreeVrsService,
} from './cashfree-vrs.service';

export interface BusinessDetailsVerificationRequest {
  businessName: string;
  businessType:
    | 'PROPRIETORSHIP'
    | 'PARTNERSHIP'
    | 'PRIVATE_LIMITED'
    | 'PUBLIC_LIMITED'
    | 'LLP'
    | 'OPC';
  registrationNumber?: string;
  incorporationDate?: string;
  businessAddress?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  purpose?: string;
  consentText?: string;
}

export interface BusinessDetailsVerificationResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  verificationId: string;
  businessName: string;
  isValid: boolean;
  nameMatch?: {
    status: 'MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH' | 'NOT_CHECKED';
    score?: number;
  };
  addressMatch?: {
    status: 'MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH' | 'NOT_CHECKED';
    score?: number;
  };
  extractedData?: {
    businessName?: string;
    registrationNumber?: string;
    businessType?: string;
    incorporationDate?: string;
    businessStatus?: string;
    registeredAddress?: string;
    authorizedCapital?: string;
    paidUpCapital?: string;
    directors?: Array<{
      name: string;
      din?: string;
      designation?: string;
    }>;
    lastFilingDate?: string;
    complianceStatus?: string;
  };
  confidenceScore?: number;
  errors?: string[];
}

export interface BankAccountVerificationRequest {
  accountNumber: string;
  ifscCode: string;
  accountHolderName?: string;
  bankName?: string;
  purpose?: string;
  consentText?: string;
}

export interface BankAccountVerificationResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  verificationId: string;
  accountNumber: string;
  ifscCode: string;
  isValid: boolean;
  accountStatus?: 'ACTIVE' | 'INACTIVE' | 'DORMANT' | 'CLOSED';
  nameMatch?: {
    status: 'MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH' | 'NOT_CHECKED';
    score?: number;
  };
  extractedData?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branchName?: string;
    accountType?: string;
    accountStatus?: string;
    branchAddress?: string;
    micr?: string;
    upiId?: string;
  };
  confidenceScore?: number;
  errors?: string[];
}

export interface GstinVerificationRequest {
  gstinNumber: string;
  businessName?: string;
  purpose?: string;
  consentText?: string;
}

export interface GstinVerificationResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  verificationId: string;
  gstinNumber: string;
  isValid: boolean;
  gstStatus?: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'SUSPENDED';
  nameMatch?: {
    status: 'MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH' | 'NOT_CHECKED';
    score?: number;
  };
  extractedData?: {
    legalName?: string;
    tradeName?: string;
    gstinNumber?: string;
    gstStatus?: string;
    registrationDate?: string;
    constitutionOfBusiness?: string;
    taxpayerType?: string;
    businessAddress?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      stateCode?: string;
    };
    filingStatus?: Array<{
      period: string;
      status: string;
      dateOfFiling?: string;
    }>;
    lastReturnFiled?: string;
    complianceRating?: string;
  };
  confidenceScore?: number;
  errors?: string[];
}

@Injectable()
export class CashfreeBusinessService {
  private readonly logger = new Logger(CashfreeBusinessService.name);

  constructor(private readonly cashfreeVrsService: CashfreeVrsService) {}

  /**
   * Verify business details
   */
  async verifyBusinessDetails(
    request: BusinessDetailsVerificationRequest,
  ): Promise<BusinessDetailsVerificationResult> {
    try {
      this.logger.debug(
        `Verifying business details for: ${request.businessName}`,
      );

      const response = await this.cashfreeVrsService.executeWithRetry(
        async () => {
          return this.cashfreeVrsService.makeApiCall(
            '/verification/business/details',
            'POST',
            {
              business_name: request.businessName,
              registration_number: request.registrationNumber,
              business_type: request.businessType,
              purpose: request.purpose || 'Business Details Verification',
              consent_text:
                request.consentText ||
                'I consent to verify business details for KYC',
            },
          );
        },
      );

      return this.mapBusinessDetailsResponse(response);
    } catch (error) {
      this.logger.error('Failed to verify business details', error);
      throw error;
    }
  }

  /**
   * Verify bank account details
   */
  async verifyBankAccount(
    request: BankAccountVerificationRequest,
  ): Promise<BankAccountVerificationResult> {
    try {
      this.logger.debug(
        `Verifying bank account: ${this.maskAccountNumber(request.accountNumber)}`,
      );

      // Validate IFSC format
      if (!this.isValidIfscCode(request.ifscCode)) {
        throw new BadRequestException('Invalid IFSC code format');
      }

      const response = await this.cashfreeVrsService.executeWithRetry(
        async () => {
          return this.cashfreeVrsService.makeApiCall(
            '/verification/bank/account',
            'POST',
            {
              account_number: request.accountNumber,
              ifsc_code: request.ifscCode.toUpperCase(),
              account_holder_name: request.accountHolderName,
              bank_name: request.bankName,
              purpose: request.purpose || 'Bank Account Verification',
              consent_text:
                request.consentText ||
                'I consent to verify bank account for KYC',
            },
          );
        },
      );

      return this.mapBankAccountResponse(response);
    } catch (error) {
      this.logger.error('Failed to verify bank account', error);
      throw error;
    }
  }

  /**
   * Verify GSTIN number
   */
  async verifyGstin(
    request: GstinVerificationRequest,
  ): Promise<GstinVerificationResult> {
    try {
      this.logger.debug(`Verifying GSTIN: ${request.gstinNumber}`);

      // Validate GSTIN format
      if (!this.isValidGstinFormat(request.gstinNumber)) {
        throw new BadRequestException('Invalid GSTIN format');
      }

      const response = await this.cashfreeVrsService.executeWithRetry(
        async () => {
          return this.cashfreeVrsService.makeApiCall(
            '/verification/gstin',
            'POST',
            {
              gstin_number: request.gstinNumber.toUpperCase(),
              business_name: request.businessName,
              purpose: request.purpose || 'GSTIN Verification',
              consent_text:
                request.consentText ||
                'I consent to verify GSTIN for business KYC',
            },
          );
        },
      );

      return this.mapGstinResponse(response);
    } catch (error) {
      this.logger.error('Failed to verify GSTIN', error);
      throw error;
    }
  }

  /**
   * Get business verification status
   */
  async getBusinessVerificationStatus(
    verificationId: string,
  ): Promise<BusinessDetailsVerificationResult> {
    try {
      this.logger.debug(
        `Getting business verification status for: ${verificationId}`,
      );

      const response = await this.cashfreeVrsService.executeWithRetry(
        async () => {
          return this.cashfreeVrsService.makeApiCall(
            `/verification/business/status/${verificationId}`,
            'GET',
          );
        },
      );

      return this.mapBusinessDetailsResponse(response);
    } catch (error) {
      this.logger.error('Failed to get business verification status', error);
      throw error;
    }
  }

  /**
   * Get bank account verification status
   */
  async getBankAccountVerificationStatus(
    verificationId: string,
  ): Promise<BankAccountVerificationResult> {
    try {
      this.logger.debug(
        `Getting bank account verification status for: ${verificationId}`,
      );

      const response = await this.cashfreeVrsService.executeWithRetry(
        async () => {
          return this.cashfreeVrsService.makeApiCall(
            `/verification/bank/status/${verificationId}`,
            'GET',
          );
        },
      );

      return this.mapBankAccountResponse(response);
    } catch (error) {
      this.logger.error(
        'Failed to get bank account verification status',
        error,
      );
      throw error;
    }
  }

  /**
   * Get GSTIN verification status
   */
  async getGstinVerificationStatus(
    verificationId: string,
  ): Promise<GstinVerificationResult> {
    try {
      this.logger.debug(
        `Getting GSTIN verification status for: ${verificationId}`,
      );

      const response = await this.cashfreeVrsService.executeWithRetry(
        async () => {
          return this.cashfreeVrsService.makeApiCall(
            `/verification/gstin/status/${verificationId}`,
            'GET',
          );
        },
      );

      return this.mapGstinResponse(response);
    } catch (error) {
      this.logger.error('Failed to get GSTIN verification status', error);
      throw error;
    }
  }

  /**
   * Validate IFSC code format
   */
  private isValidIfscCode(ifscCode: string): boolean {
    // IFSC format: AAAA0BBBBBB (4 letters, 1 zero, 6 alphanumeric)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifscCode.toUpperCase());
  }

  /**
   * Validate GSTIN format
   */
  private isValidGstinFormat(gstin: string): boolean {
    // GSTIN format: 15 characters - 2 state code + 10 PAN + 1 entity number + 1 Z + 1 checksum
    const gstinRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin.toUpperCase());
  }

  /**
   * Mask account number for privacy
   */
  private maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber;
    return 'XXXX' + accountNumber.slice(-4);
  }

  /**
   * Calculate GSTIN checksum
   */
  private validateGstinChecksum(gstin: string): boolean {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const factor = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];

    let sum = 0;
    for (let i = 0; i < 14; i++) {
      const charIndex = chars.indexOf(gstin[i]);
      const product = charIndex * factor[i];
      sum += Math.floor(product / 36) + (product % 36);
    }

    const checksum = (36 - (sum % 36)) % 36;
    return chars[checksum] === gstin[14];
  }

  /**
   * Map business details response
   */
  private mapBusinessDetailsResponse(
    response: CashfreeApiResponse,
  ): BusinessDetailsVerificationResult {
    const data = response.data || {};

    return {
      status: response.status,
      verificationId: data.verification_id,
      businessName: data.business_name,
      isValid: data.is_valid || false,
      nameMatch: data.name_match
        ? {
            status: data.name_match.status,
            score: data.name_match.score,
          }
        : undefined,
      addressMatch: data.address_match
        ? {
            status: data.address_match.status,
            score: data.address_match.score,
          }
        : undefined,
      extractedData: data.extracted_data
        ? {
            businessName: data.extracted_data.business_name,
            registrationNumber: data.extracted_data.registration_number,
            businessType: data.extracted_data.business_type,
            incorporationDate: data.extracted_data.incorporation_date,
            businessStatus: data.extracted_data.business_status,
            registeredAddress: data.extracted_data.registered_address,
            authorizedCapital: data.extracted_data.authorized_capital,
            paidUpCapital: data.extracted_data.paid_up_capital,
            directors: data.extracted_data.directors,
            lastFilingDate: data.extracted_data.last_filing_date,
            complianceStatus: data.extracted_data.compliance_status,
          }
        : undefined,
      confidenceScore: data.confidence_score,
      errors: response.error ? [response.error.message] : undefined,
    };
  }

  /**
   * Map bank account response
   */
  private mapBankAccountResponse(
    response: CashfreeApiResponse,
  ): BankAccountVerificationResult {
    const data = response.data || {};

    return {
      status: response.status,
      verificationId: data.verification_id,
      accountNumber: data.account_number,
      ifscCode: data.ifsc_code,
      isValid: data.is_valid || false,
      accountStatus: data.account_status,
      nameMatch: data.name_match
        ? {
            status: data.name_match.status,
            score: data.name_match.score,
          }
        : undefined,
      extractedData: data.extracted_data
        ? {
            accountHolderName: data.extracted_data.account_holder_name,
            accountNumber: data.extracted_data.account_number,
            ifscCode: data.extracted_data.ifsc_code,
            bankName: data.extracted_data.bank_name,
            branchName: data.extracted_data.branch_name,
            accountType: data.extracted_data.account_type,
            accountStatus: data.extracted_data.account_status,
            branchAddress: data.extracted_data.branch_address,
            micr: data.extracted_data.micr,
            upiId: data.extracted_data.upi_id,
          }
        : undefined,
      confidenceScore: data.confidence_score,
      errors: response.error ? [response.error.message] : undefined,
    };
  }

  /**
   * Map GSTIN response
   */
  private mapGstinResponse(
    response: CashfreeApiResponse,
  ): GstinVerificationResult {
    const data = response.data || {};

    return {
      status: response.status,
      verificationId: data.verification_id,
      gstinNumber: data.gstin_number,
      isValid: data.is_valid || false,
      gstStatus: data.gst_status,
      nameMatch: data.name_match
        ? {
            status: data.name_match.status,
            score: data.name_match.score,
          }
        : undefined,
      extractedData: data.extracted_data
        ? {
            legalName: data.extracted_data.legal_name,
            tradeName: data.extracted_data.trade_name,
            gstinNumber: data.extracted_data.gstin_number,
            gstStatus: data.extracted_data.gst_status,
            registrationDate: data.extracted_data.registration_date,
            constitutionOfBusiness:
              data.extracted_data.constitution_of_business,
            taxpayerType: data.extracted_data.taxpayer_type,
            businessAddress: data.extracted_data.business_address,
            filingStatus: data.extracted_data.filing_status,
            lastReturnFiled: data.extracted_data.last_return_filed,
            complianceRating: data.extracted_data.compliance_rating,
          }
        : undefined,
      confidenceScore: data.confidence_score,
      errors: response.error ? [response.error.message] : undefined,
    };
  }
}
