import { Column, Entity, Index, OneToMany } from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';
import { BaseModel } from '../models/base.model';
// import { PartnerCategoryEntity } from './partner-category.entity'; // Removed to avoid circular dependency
// import { PartnerEntity } from './partner.entity'; // Removed to avoid circular dependency

@Entity('partner_types')
export class PartnerTypeEntity extends BaseModel {
  @Column({ length: 100, unique: true })
  @Index()
  name: string;

  @Column({ length: 100, unique: true })
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

  // Relationships
  @OneToMany('PartnerCategoryEntity', (category: any) => category.partnerType)
  categories: any[];

  @OneToMany('PartnerEntity', (partner: any) => partner.partnerType)
  partners: any[];

  // Helper methods
  getActiveCategories(): any[] {
    return this.categories?.filter((category: any) => category.isActive) || [];
  }

  getCategoryCount(): number {
    return this.getActiveCategories().length;
  }

  getPartnerCount(): number {
    return (
      this.partners?.filter((partner) => partner.status === 'active').length ||
      0
    );
  }

  // Static method to create slug from name
  static createSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  protected getEntityType(): EntityType {
    return EntityType.CATEGORY;
  }
}
