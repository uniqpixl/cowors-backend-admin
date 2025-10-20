export interface RuleTemplate {
  id: string;
  name: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  parentTemplateId?: string;
  metadata?: {
    description?: string;
    tags?: string[];
    author?: string;
  };
}

export interface PricingRuleTemplate extends RuleTemplate {
  type: 'pricing';
  rules: {
    basePrice?: {
      min?: number;
      max?: number;
      default?: number;
      currency?: string;
    };
    pricingModel?: 'hourly' | 'daily' | 'monthly' | 'fixed' | 'custom';
    discountRules?: {
      type: 'percentage' | 'fixed';
      value: number;
      conditions?: Record<string, any>;
      priority?: number;
    }[];
    surchargeRules?: {
      type: 'percentage' | 'fixed';
      value: number;
      conditions?: Record<string, any>;
      priority?: number;
    }[];
    pricingTiers?: {
      minQuantity: number;
      maxQuantity?: number;
      priceMultiplier: number;
    }[];
  };
}

export interface AvailabilityRuleTemplate extends RuleTemplate {
  type: 'availability';
  rules: {
    advanceBooking?: number; // days
    maxBookingDuration?: number; // hours
    bufferTime?: number; // minutes
    blackoutDates?: Date[];
    workingHours?: {
      [key: string]: { start: string; end: string };
    };
    minimumNotice?: number; // hours
  };
}

export interface FeatureRuleTemplate extends RuleTemplate {
  type: 'feature';
  rules: {
    allowedFeatures?: string[];
    requiredFeatures?: string[];
    defaultFeatures?: string[];
    featureConstraints?: Record<string, any>;
    allowInstantBooking?: boolean;
    allowCancellation?: boolean;
    cancellationPolicy?: string;
  };
}

export interface ValidationRuleTemplate extends RuleTemplate {
  type: 'validation';
  rules: {
    requiredFields?: string[];
    fieldValidations?: Record<
      string,
      {
        type: 'string' | 'number' | 'boolean' | 'array' | 'object';
        required?: boolean;
        min?: number;
        max?: number;
        pattern?: string;
        enum?: any[];
      }
    >;
    businessRules?: {
      name: string;
      condition: string;
      message: string;
      priority?: number;
    }[];
    verification?: string[];
    documents?: string[];
    minimumRating?: number;
  };
}

export type AnyRuleTemplate =
  | PricingRuleTemplate
  | AvailabilityRuleTemplate
  | FeatureRuleTemplate
  | ValidationRuleTemplate;

export interface RuleConflict {
  type: 'conflict' | 'override' | 'merge';
  field: string;
  parentValue: any;
  childValue: any;
  resolution: 'use_parent' | 'use_child' | 'merge' | 'error';
  message: string;
}

export interface RuleInheritanceResult {
  effectiveRules: any;
  conflicts: RuleConflict[];
  inheritanceChain: string[];
  version: string;
}

export interface RuleValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }[];
  warnings: {
    field: string;
    message: string;
  }[];
}
