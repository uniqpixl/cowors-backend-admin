import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';
import { BaseModel } from '../models/base.model';

@Entity('partner_categories')
export class PartnerCategoryEntity extends BaseModel {
  @Column({ length: 100 })
  @Index()
  name: string;

  @Column({ length: 100 })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 50, nullable: true })
  icon?: string;

  @Column({ length: 7, nullable: true })
  color?: string;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: false })
  requiresSubcategory: boolean;

  // Rule inheritance system (JSONB fields)
  @Column('jsonb', { nullable: true, name: 'pricing_rules' })
  pricingRules?: {
    basePrice?: {
      min?: number;
      max?: number;
      default?: number;
    };
    discountRules?: {
      type: 'percentage' | 'fixed';
      value: number;
      conditions?: Record<string, any>;
    }[];
    surchargeRules?: {
      type: 'percentage' | 'fixed';
      value: number;
      conditions?: Record<string, any>;
    }[];
    pricingTiers?: {
      minQuantity: number;
      maxQuantity?: number;
      priceMultiplier: number;
    }[];
  };

  @Column('jsonb', { nullable: true, name: 'feature_rules' })
  featureRules?: {
    allowedFeatures?: string[];
    requiredFeatures?: string[];
    defaultFeatures?: string[];
    featureConstraints?: Record<string, any>;
  };

  @Column('jsonb', { nullable: true, name: 'validation_rules' })
  validationRules?: {
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
    }[];
  };

  @Column('jsonb', { nullable: true })
  ruleTemplates?: {
    pricing?: {
      basePrice?: number;
      currency?: string;
      pricingModel?: 'hourly' | 'daily' | 'monthly' | 'fixed' | 'custom';
    };
    availability?: {
      advanceBooking?: number; // days
      maxBookingDuration?: number; // hours
      bufferTime?: number; // minutes
    };
    requirements?: {
      verification?: string[];
      documents?: string[];
      minimumRating?: number;
    };
    features?: {
      allowInstantBooking?: boolean;
      allowCancellation?: boolean;
      cancellationPolicy?: string;
    };
  };

  @Column('jsonb', { nullable: true })
  metadata?: {
    keywords?: string[];
    tags?: string[];
    searchTerms?: string[];
    seoTitle?: string;
    seoDescription?: string;
  };

  // Foreign Keys
  @Column()
  @Index()
  partnerTypeId: string;

  // Relationships
  @ManyToOne(
    'PartnerTypeEntity',
    (partnerType: any) => partnerType.categories,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'partnerTypeId' })
  partnerType: any;

  @OneToMany(
    'PartnerSubcategoryEntity',
    (subcategory: any) => subcategory.partnerCategory,
  )
  subcategories: any[];

  @OneToMany('PartnerOfferingEntity', (offering: any) => offering.category)
  offerings: any[];

  @OneToMany('PartnerEntity', (partner: any) => partner.primaryCategory)
  partners: any[];

  // Helper methods
  getActiveSubcategories(): any[] {
    return (
      this.subcategories?.filter((subcategory) => subcategory.isActive) || []
    );
  }

  getSubcategoryCount(): number {
    return this.getActiveSubcategories().length;
  }

  getOfferingCount(): number {
    return this.offerings?.filter((offering) => offering.isActive).length || 0;
  }

  hasSubcategories(): boolean {
    return this.getActiveSubcategories().length > 0;
  }

  // Get default pricing from rule templates
  getDefaultPricing() {
    return this.ruleTemplates?.pricing || null;
  }

  // Get availability rules
  getAvailabilityRules() {
    return this.ruleTemplates?.availability || null;
  }

  // Get verification requirements
  getRequirements() {
    return this.ruleTemplates?.requirements || null;
  }

  // Static method to create slug from name
  static createSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Generate unique slug within partner type
  static async generateUniqueSlug(
    name: string,
    partnerTypeId: string,
    excludeId?: string,
  ): Promise<string> {
    // This would be implemented in the service layer
    return this.createSlug(name);
  }

  protected getEntityType(): EntityType {
    return EntityType.CATEGORY;
  }
}
