import {
  KycProvider,
  KycStatus,
  KycVerificationType,
  UserType,
} from '@/database/entities/kyc-verification.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class InitiateKycVerificationDto {
  @ApiProperty({
    description: 'KYC provider to use for verification',
    enum: KycProvider,
    example: KycProvider.JUMIO,
  })
  @IsEnum(KycProvider)
  provider: KycProvider;

  @ApiProperty({
    description: 'Type of verification to perform',
    enum: KycVerificationType,
    example: KycVerificationType.IDENTITY,
  })
  @IsEnum(KycVerificationType)
  verificationType: KycVerificationType;

  @ApiProperty({
    description: 'User type for verification (USER or PARTNER)',
    enum: UserType,
    example: UserType.USER,
  })
  @IsEnum(UserType)
  userType: UserType;

  @ApiPropertyOptional({
    description: 'Partner ID if verification is for a business partner',
    example: 'partner-uuid-here',
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({
    description: 'Booking ID if verification is for a specific booking',
    example: 'booking-uuid-here',
  })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Return URL after verification completion',
    example: 'https://app.cowors.com/verification/complete',
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional verification data for Cashfree VRS',
  })
  @IsOptional()
  verificationData?: {
    aadhaarNumber?: string;
    panNumber?: string;
    accountNumber?: string;
    ifscCode?: string;
    gstinNumber?: string;
    businessName?: string;
    nameToMatch?: string;
    businessType?: string;
    registrationNumber?: string;
    address?: string;
    accountHolderName?: string;
    directorName?: string;
  };
}

export class KycVerificationResponseDto {
  @ApiProperty({
    description: 'Verification session ID',
    example: 'kyc-session-123',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Verification URL for user to complete KYC',
    example: 'https://provider.com/verify/session-123',
  })
  verificationUrl: string;

  @ApiProperty({
    description: 'Current verification status',
    enum: KycStatus,
    example: KycStatus.PENDING,
  })
  status: KycStatus;

  @ApiProperty({
    description: 'Verification ID in our system',
    example: 'verification-uuid',
  })
  verificationId: string;

  @ApiPropertyOptional({
    description: 'Session expiration timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Cashfree form URL for browser-based verification',
    example: 'https://verification.cashfree.com/form/abc123',
  })
  cashfreeFormUrl?: string;

  @ApiPropertyOptional({
    description: 'Cashfree form ID for tracking',
    example: 'form-abc123',
  })
  cashfreeFormId?: string;
}

export class KycStatusResponseDto {
  @ApiProperty({
    description: 'Current KYC verification status',
    enum: KycStatus,
    example: KycStatus.APPROVED,
  })
  status: KycStatus;

  @ApiProperty({
    description: 'KYC provider used',
    enum: KycProvider,
    example: KycProvider.JUMIO,
  })
  provider: KycProvider;

  @ApiProperty({
    description: 'Verification type',
    enum: KycVerificationType,
    example: KycVerificationType.IDENTITY,
  })
  verificationType: KycVerificationType;

  @ApiPropertyOptional({
    description: 'Verification completion timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Verification submission timestamp',
    example: '2024-01-15T09:30:00Z',
  })
  submittedAt?: Date;

  @ApiPropertyOptional({
    description: 'Reason for rejection if status is failed',
    example: 'Document quality insufficient',
  })
  rejectionReason?: string;

  @ApiPropertyOptional({
    description: 'Verification result data',
  })
  verificationResult?: any;

  @ApiPropertyOptional({
    description: 'Associated booking ID if applicable',
    example: 'booking-uuid',
  })
  bookingId?: string;

  @ApiProperty({
    description: 'User type for verification (USER or PARTNER)',
    enum: UserType,
    example: UserType.USER,
  })
  userType: UserType;

  @ApiPropertyOptional({
    description: 'Partner ID if verification is for a business partner',
    example: 'partner-uuid',
  })
  partnerId?: string;

  @ApiPropertyOptional({
    description: 'Cashfree-specific verification result',
  })
  cashfreeResult?: any;
}

export class KycWebhookDto {
  @ApiProperty({
    description: 'Provider session ID',
    example: 'provider-session-123',
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'New verification status',
    enum: KycStatus,
    example: KycStatus.APPROVED,
  })
  @IsEnum(KycStatus)
  status: KycStatus;

  @ApiPropertyOptional({
    description: 'Provider transaction ID',
    example: 'txn-123',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Verification result data from provider',
  })
  @IsOptional()
  verificationResult?: any;

  @ApiPropertyOptional({
    description: 'Rejection reason if verification failed',
    example: 'Document expired',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
