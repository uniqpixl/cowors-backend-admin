import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

// Base DTOs for common Cashfree VRS operations
export class CashfreeBaseRequestDto {
  @ApiProperty({ description: 'User ID for the verification' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Partner ID for business verifications' })
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiPropertyOptional({
    description: 'Booking ID associated with the verification',
  })
  @IsOptional()
  @IsString()
  bookingId?: string;
}

// Aadhaar Verification DTOs
export class InitiateAadhaarVerificationDto extends CashfreeBaseRequestDto {
  @ApiProperty({ description: 'Aadhaar number for verification' })
  @IsString()
  aadhaarNumber: string;

  @ApiPropertyOptional({ description: 'Consent for Aadhaar verification' })
  @IsOptional()
  @IsBoolean()
  consent?: boolean;
}

export class VerifyAadhaarOtpDto {
  @ApiProperty({ description: 'Verification ID from initiate request' })
  @IsString()
  verificationId: string;

  @ApiProperty({ description: 'OTP received on Aadhaar registered mobile' })
  @IsString()
  otp: string;

  @ApiProperty({ description: 'Reference ID from OTP generation' })
  @IsString()
  refId: string;
}

export class AadhaarOcrVerificationDto extends CashfreeBaseRequestDto {
  @ApiProperty({ description: 'Base64 encoded Aadhaar card image' })
  @IsString()
  aadhaarImage: string;

  @ApiPropertyOptional({ description: 'Quality check for the image' })
  @IsOptional()
  @IsBoolean()
  qualityCheck?: boolean;
}

// PAN Verification DTOs
export class PanVerificationDto extends CashfreeBaseRequestDto {
  @ApiProperty({ description: 'PAN number for verification' })
  @IsString()
  panNumber: string;

  @ApiPropertyOptional({ description: 'Name to match with PAN' })
  @IsOptional()
  @IsString()
  nameToMatch?: string;

  @ApiPropertyOptional({
    description: 'Date of birth for additional verification',
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;
}

// Bank Account Verification DTOs
export class BankAccountVerificationDto extends CashfreeBaseRequestDto {
  @ApiProperty({ description: 'Bank account number' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'IFSC code of the bank' })
  @IsString()
  ifscCode: string;

  @ApiPropertyOptional({ description: 'Account holder name to match' })
  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @ApiPropertyOptional({
    description: 'Verification method',
    enum: ['penny_drop', 'account_analysis'],
    default: 'penny_drop',
  })
  @IsOptional()
  @IsEnum(['penny_drop', 'account_analysis'])
  verificationMethod?: 'penny_drop' | 'account_analysis';
}

// GSTIN Verification DTOs
export class GstinVerificationDto extends CashfreeBaseRequestDto {
  @ApiProperty({ description: 'GSTIN number for verification' })
  @IsString()
  gstinNumber: string;

  @ApiPropertyOptional({ description: 'Business name to match' })
  @IsOptional()
  @IsString()
  businessName?: string;
}

// Business Details Verification DTOs
export class BusinessDetailsVerificationDto extends CashfreeBaseRequestDto {
  @ApiProperty({ description: 'Business name' })
  @IsString()
  businessName: string;

  @ApiProperty({ description: 'Business registration number' })
  @IsString()
  registrationNumber: string;

  @ApiPropertyOptional({ description: 'Business type' })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional({ description: 'Registration date' })
  @IsOptional()
  @IsString()
  registrationDate?: string;
}

// Response DTOs
export class CashfreeVerificationResponseDto {
  @ApiProperty({ description: 'Verification ID' })
  verificationId: string;

  @ApiProperty({ description: 'Status of the verification' })
  status: 'SUCCESS' | 'FAILED' | 'PENDING';

  @ApiPropertyOptional({
    description: 'Form URL for browser-based verification',
  })
  formUrl?: string;

  @ApiPropertyOptional({ description: 'Form ID for tracking' })
  formId?: string;

  @ApiPropertyOptional({
    description: 'Reference ID for OTP-based verifications',
  })
  refId?: string;

  @ApiPropertyOptional({ description: 'OTP expiry time' })
  otpExpiry?: string;

  @ApiPropertyOptional({ description: 'Error message if verification failed' })
  errorMessage?: string;

  @ApiPropertyOptional({ description: 'Error code if verification failed' })
  errorCode?: string;
}

export class AadhaarVerificationResultDto {
  @ApiProperty({ description: 'Verification status' })
  status: 'SUCCESS' | 'FAILED' | 'PENDING';

  @ApiPropertyOptional({ description: 'Masked Aadhaar number' })
  aadhaarMasked?: string;

  @ApiPropertyOptional({ description: 'Extracted data from Aadhaar' })
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

  @ApiPropertyOptional({
    description: 'OCR confidence score for image-based verification',
  })
  ocrConfidenceScore?: number;

  @ApiPropertyOptional({ description: 'Verification score' })
  verificationScore?: number;
}

export class PanVerificationResultDto {
  @ApiProperty({ description: 'Verification status' })
  status: 'SUCCESS' | 'FAILED' | 'PENDING';

  @ApiPropertyOptional({ description: 'PAN exists in government database' })
  panExists?: boolean;

  @ApiPropertyOptional({ description: 'Name match result' })
  nameMatch?: boolean;

  @ApiPropertyOptional({ description: 'Name match score (0-100)' })
  nameMatchScore?: number;

  @ApiPropertyOptional({ description: 'PAN category' })
  panCategory?: string;

  @ApiPropertyOptional({ description: 'Name on PAN' })
  nameOnPan?: string;

  @ApiPropertyOptional({ description: 'PAN type' })
  panType?: 'Individual' | 'Business';

  @ApiPropertyOptional({ description: 'Last updated date' })
  lastUpdated?: string;
}

export class BankVerificationResultDto {
  @ApiProperty({ description: 'Verification status' })
  status: 'SUCCESS' | 'FAILED' | 'PENDING';

  @ApiPropertyOptional({ description: 'Account exists in bank' })
  accountExists?: boolean;

  @ApiPropertyOptional({ description: 'Name match result' })
  nameMatch?: boolean;

  @ApiPropertyOptional({ description: 'Name match score (0-100)' })
  nameMatchScore?: number;

  @ApiPropertyOptional({ description: 'Account type' })
  accountType?: string;

  @ApiPropertyOptional({ description: 'Account status' })
  accountStatus?: string;

  @ApiPropertyOptional({ description: 'Bank name' })
  bankName?: string;

  @ApiPropertyOptional({ description: 'Account holder name from bank' })
  accountHolderName?: string;
}

export class GstinVerificationResultDto {
  @ApiProperty({ description: 'Verification status' })
  status: 'SUCCESS' | 'FAILED' | 'PENDING';

  @ApiPropertyOptional({ description: 'GSTIN exists in government database' })
  gstinExists?: boolean;

  @ApiPropertyOptional({ description: 'Business name match result' })
  businessNameMatch?: boolean;

  @ApiPropertyOptional({ description: 'Registration status' })
  registrationStatus?: string;

  @ApiPropertyOptional({ description: 'Business name from GSTIN' })
  businessName?: string;

  @ApiPropertyOptional({ description: 'Business type' })
  businessType?: string;

  @ApiPropertyOptional({ description: 'Registration date' })
  registrationDate?: string;

  @ApiPropertyOptional({ description: 'Filing status' })
  filingStatus?: string;

  @ApiPropertyOptional({ description: 'Last return filed' })
  lastReturn?: string;
}

// Webhook DTOs
export class CashfreeWebhookDto {
  @ApiProperty({ description: 'Event type' })
  @IsString()
  event: string;

  @ApiProperty({ description: 'Verification ID' })
  @IsString()
  verificationId: string;

  @ApiProperty({ description: 'Form ID' })
  @IsString()
  formId: string;

  @ApiProperty({ description: 'Verification status' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ description: 'Verification data' })
  @IsOptional()
  @IsObject()
  data?: any;

  @ApiPropertyOptional({ description: 'Timestamp of the event' })
  @IsOptional()
  @IsString()
  timestamp?: string;

  @ApiPropertyOptional({ description: 'Signature for webhook verification' })
  @IsOptional()
  @IsString()
  signature?: string;
}

// Bulk verification DTOs
export class BulkVerificationRequestDto {
  @ApiProperty({ description: 'Array of verification requests' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  verifications: Array<
    PanVerificationDto | BankAccountVerificationDto | GstinVerificationDto
  >;

  @ApiPropertyOptional({ description: 'Batch name for tracking' })
  @IsOptional()
  @IsString()
  batchName?: string;

  @ApiPropertyOptional({ description: 'Callback URL for batch completion' })
  @IsOptional()
  @IsString()
  callbackUrl?: string;
}

export class BulkVerificationResponseDto {
  @ApiProperty({ description: 'Batch ID for tracking' })
  batchId: string;

  @ApiProperty({ description: 'Total number of verifications in batch' })
  totalCount: number;

  @ApiProperty({ description: 'Number of successful submissions' })
  successCount: number;

  @ApiProperty({ description: 'Number of failed submissions' })
  failedCount: number;

  @ApiPropertyOptional({
    description: 'Array of individual verification responses',
  })
  results?: CashfreeVerificationResponseDto[];

  @ApiPropertyOptional({ description: 'Estimated completion time' })
  estimatedCompletionTime?: string;
}
