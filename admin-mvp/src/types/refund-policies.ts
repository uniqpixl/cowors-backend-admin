export enum RefundPolicyType {
  FLEXIBLE = 'flexible',
  MODERATE = 'moderate',
  STRICT = 'strict',
  CUSTOM = 'custom',
}

export enum RefundCalculationType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  TIERED = 'tiered',
}

export interface RefundTier {
  hoursBeforeStart: number;
  refundPercentage: number;
  fixedFee?: number;
  description?: string;
}

export interface RefundPolicy {
  id: string;
  partnerId: string;
  name: string;
  description?: string;
  type: RefundPolicyType;
  calculationType: RefundCalculationType;
  isActive: boolean;
  isDefault: boolean;
  minimumNoticeHours: number;
  noRefundHours: number;
  defaultRefundPercentage: number;
  fixedCancellationFee: number;
  refundTiers?: RefundTier[];
  allowSameDayRefund: boolean;
  allowPartialRefund: boolean;
  requireApproval: boolean;
  processingDays: number;
  applicableSpaceTypes?: string[];
  excludedDates?: string[];
  forceMajeureFullRefund: boolean;
  terms?: string;
  metadata?: {
    createdBy?: string;
    lastModifiedBy?: string;
    version?: number;
    approvedBy?: string;
    approvedAt?: Date;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RefundPolicyFormData {
  name: string;
  description?: string;
  type: RefundPolicyType;
  calculationType: RefundCalculationType;
  isDefault?: boolean;
  minimumNoticeHours: number;
  noRefundHours: number;
  defaultRefundPercentage: number;
  fixedCancellationFee?: number;
  refundTiers?: RefundTier[];
  allowSameDayRefund?: boolean;
  allowPartialRefund?: boolean;
  requireApproval?: boolean;
  processingDays: number;
  applicableSpaceTypes?: string[];
  excludedDates?: string[];
  forceMajeureFullRefund?: boolean;
  terms?: string;
  metadata?: Record<string, unknown>;
}

export interface RefundCalculationInput {
  bookingAmount: number;
  bookingStartTime: string;
  cancellationTime: string;
  partnerId: string;
  spaceType?: string;
  isEmergency?: boolean;
}

export interface RefundCalculationResult {
  refundAmount: number;
  cancellationFee: number;
  refundPercentage: number;
  isRefundable: boolean;
  reason: string;
}