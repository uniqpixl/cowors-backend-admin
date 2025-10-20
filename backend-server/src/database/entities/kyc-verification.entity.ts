import { UserEntity } from '@/auth/entities/user.entity';
import { BaseModel } from '@/database/models/base.model';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';
import { BookingEntity } from './booking.entity';

export enum KycStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum KycProvider {
  JUMIO = 'jumio',
  ONFIDO = 'onfido',
  VERIFF = 'veriff',
  SUMSUB = 'sumsub',
  CASHFREE = 'cashfree',
}

export enum KycVerificationType {
  IDENTITY = 'identity',
  ADDRESS = 'address',
  DOCUMENT = 'document',
  BIOMETRIC = 'biometric',
  // User KYC Types
  AADHAAR_VERIFICATION = 'aadhaar_verification',
  PAN_VERIFICATION = 'pan_verification',
  // Partner KYC Types
  BUSINESS_DETAILS = 'business_details',
  BANK_ACCOUNT = 'bank_account',
  BUSINESS_PAN = 'business_pan',
  DIRECTOR_AADHAAR = 'director_aadhaar',
  GSTIN_VERIFICATION = 'gstin_verification',
}

export enum UserType {
  USER = 'user',
  PARTNER = 'partner',
}

@Entity('kyc_verification')
export class KycVerificationEntity extends BaseModel {
  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.USER,
  })
  userType: UserType;

  @Column({ type: 'uuid', nullable: true })
  partnerId?: string;

  @Index({ where: '"deletedAt" IS NULL' })
  @Column({ nullable: true })
  bookingId?: string;

  @OneToOne(() => BookingEntity, { nullable: true })
  @JoinColumn({ name: 'bookingId' })
  booking?: BookingEntity;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.PENDING,
  })
  status: KycStatus;

  @Column({
    type: 'enum',
    enum: KycProvider,
  })
  provider: KycProvider;

  @Column({
    type: 'enum',
    enum: KycVerificationType,
    default: KycVerificationType.IDENTITY,
  })
  verificationType: KycVerificationType;

  @Column({ nullable: true })
  providerTransactionId?: string;

  @Column({ nullable: true })
  providerSessionId?: string;

  @Column('jsonb', { nullable: true })
  providerData?: {
    scanReference?: string;
    workflowId?: string;
    applicantId?: string;
    checkId?: string;
    reportIds?: string[];
    documentIds?: string[];
    [key: string]: any;
  };

  // Cashfree-specific fields
  @Column({ nullable: true })
  cashfreeFormId?: string;

  @Column({ nullable: true })
  cashfreeFormUrl?: string;

  @Column({ nullable: true })
  cashfreeVerificationId?: string;

  @Column('jsonb', { nullable: true })
  cashfreeData?: {
    // Bank Account Verification
    bankAccount?: {
      accountNumber: string;
      ifscCode: string;
      accountHolderName?: string;
      bankName?: string;
      verificationMethod: 'penny_drop' | 'account_analysis';
      branchName?: string;
      accountType?: string;
      accountStatus?: string;
      branchAddress?: string;
      micr?: string;
      upiId?: string;
      nameMatch?: string;
      nameMatchScore?: number;
    };

    // PAN Verification
    pan?: {
      panNumber: string;
      nameOnPan?: string;
      panType?: 'Individual' | 'Business';
      panStatus?: string;
      name?: string;
      category?: string;
      lastUpdated?: string;
      aadhaarSeeded?: boolean;
      nameMatch?: string;
      nameMatchScore?: number;
      dobMatch?: string;
    };

    // GSTIN Verification
    gstin?: {
      gstinNumber: string;
      businessName?: string;
      businessType?: string;
      registrationDate?: string;
      status?: string;
      legalName?: string;
      tradeName?: string;
      gstStatus?: string;
      constitutionOfBusiness?: string;
      taxpayerType?: string;
      businessAddress?: string;
      filingStatus?: string;
      lastReturnFiled?: string;
      complianceRating?: string;
      nameMatch?: string;
      nameMatchScore?: number;
    };

    // Business Details Verification
    businessDetails?: {
      businessName?: string;
      registrationNumber?: string;
      businessType?: string;
      incorporationDate?: string;
      businessStatus?: string;
      registeredAddress?: string;
      authorizedCapital?: string;
      paidUpCapital?: string;
      directors?: any[];
      lastFilingDate?: string;
      complianceStatus?: string;
      nameMatch?: string;
      nameMatchScore?: number;
      addressMatch?: string;
      addressMatchScore?: number;
    };

    // Aadhaar Verification
    aadhaar?: {
      name?: string;
      gender?: string;
      dob?: string;
      address?: string;
      fatherName?: string;
      district?: string;
      state?: string;
      pincode?: string;
      country?: string;
      mobileHash?: string;
      emailHash?: string;
      photoLink?: string;
      yearOfBirth?: string;
      careOf?: string;
    };

    // Aadhaar-specific fields
    aadhaarRefId?: string;
    otpExpiry?: string;
    aadhaarMasked?: string;
    ocrConfidenceScore?: number;
    extractedAadhaarData?: {
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
  };

  @Column('jsonb', { nullable: true })
  verificationResult?: {
    overallResult?: 'PASSED' | 'FAILED' | 'PENDING';
    identityVerification?: {
      result: 'PASSED' | 'FAILED' | 'PENDING';
      confidence?: number;
      reasons?: string[];
    };
    identity?: {
      verified: boolean;
      confidence: number;
      extractedData?: any;
    };
    documentVerification?: {
      result: 'PASSED' | 'FAILED' | 'PENDING';
      documentType?: string;
      confidence?: number;
      reasons?: string[];
    };
    document?: {
      verified: boolean;
      confidence: number;
      extractedData?: any;
    };
    biometricVerification?: {
      result: 'PASSED' | 'FAILED' | 'PENDING';
      confidence?: number;
      reasons?: string[];
    };
    addressVerification?: {
      result: 'PASSED' | 'FAILED' | 'PENDING';
      confidence?: number;
      reasons?: string[];
    };
    address?: {
      verified: boolean;
      confidence: number;
      extractedData?: any;
    };
    riskAssessment?: {
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      score?: number;
      factors?: string[];
    };
    extractedData?: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      nationality?: string;
      documentNumber?: string;
      documentType?: string;
      issuingCountry?: string;
      expiryDate?: string;
      address?: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
    };
  };

  @Column('text', { nullable: true })
  rejectionReason?: string;

  @Column('jsonb', { nullable: true })
  fraudChecks?: {
    duplicateCheck?: {
      result: 'PASSED' | 'FAILED';
      duplicateUserId?: string;
      confidence?: number;
    };
    watchlistCheck?: {
      result: 'PASSED' | 'FAILED';
      matches?: {
        name: string;
        type: string;
        confidence: number;
      }[];
    };
    deviceFingerprint?: {
      deviceId?: string;
      ipAddress?: string;
      userAgent?: string;
      riskScore?: number;
    };
  };

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column('text', { nullable: true })
  adminNotes?: string;

  @Column('text', { nullable: true })
  internalNotes?: string;

  @Column('jsonb', { nullable: true })
  cashfreeResult?: {
    verificationStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
    verificationScore?: number;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';

    bankVerification?: {
      accountExists: boolean;
      nameMatch: boolean;
      nameMatchScore?: number;
      accountType?: string;
      accountStatus?: string;
    };

    panVerification?: {
      panExists: boolean;
      nameMatch: boolean;
      nameMatchScore?: number;
      panCategory: string;
      lastUpdated?: string;
    };

    gstinVerification?: {
      gstinExists: boolean;
      businessNameMatch: boolean;
      registrationStatus: string;
      filingStatus?: string;
      lastReturn?: string;
    };
  };

  // Composite indexes for efficient queries
  @Index(['userId', 'status'])
  static userStatusIndex: void;

  @Index(['provider', 'status'])
  static providerStatusIndex: void;

  @Index(['bookingId', 'status'])
  static bookingStatusIndex: void;

  @Index(['status', 'createdAt'])
  static statusTimeIndex: void;

  @Index(['userType', 'verificationType'])
  static userTypeVerificationIndex: void;

  @Index(['partnerId', 'verificationType'])
  static partnerVerificationIndex: void;

  protected getEntityType(): EntityType {
    return EntityType.USER;
  }
}
