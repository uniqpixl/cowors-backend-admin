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
// import { PartnerCategoryEntity } from './partner-category.entity'; // Removed to avoid circular dependency
// import { PartnerOfferingEntity } from './partner-offering.entity'; // Removed to avoid circular dependency

@Entity('partner_subcategories')
export class PartnerSubcategoryEntity extends BaseModel {
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

  // Note: Rule columns have been moved to partner_types level
  // pricingRules, featureRules, validationRules, ruleOverrides are no longer at subcategory level

  @Column('jsonb', { nullable: true })
  metadata?: {
    keywords?: string[];
    tags?: string[];
    searchTerms?: string[];
    seoTitle?: string;
    seoDescription?: string;
    popularityScore?: number;
  };

  // Foreign Keys
  @Column()
  @Index()
  categoryId: string;

  // Relationships
  @ManyToOne(
    'PartnerCategoryEntity',
    (category: any) => category.subcategories,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'categoryId' })
  partnerCategory: any;

  @OneToMany('PartnerOfferingEntity', (offering: any) => offering.subcategory)
  offerings: any[];

  @OneToMany('PartnerEntity', (partner: any) => partner.primarySubcategory)
  partners: any[];

  // Helper methods
  getOfferingCount(): number {
    return this.offerings?.filter((offering) => offering.isActive).length || 0;
  }

  // Helper methods for accessing rules from parent category/type
  getEffectivePricingRules(): any {
    return this.partnerCategory?.pricingRules || {};
  }

  getEffectiveAvailabilityRules(): any {
    return this.partnerCategory?.featureRules?.availability || {};
  }

  getEffectiveRequirements(): any {
    return this.partnerCategory?.validationRules?.requirements || {};
  }

  getEffectiveFeatures(): any {
    return this.partnerCategory?.featureRules || {};
  }

  // Static method to create slug from name
  static createSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Generate unique slug within category
  static async generateUniqueSlug(
    name: string,
    categoryId: string,
    excludeId?: string,
  ): Promise<string> {
    // This would be implemented in the service layer
    return this.createSlug(name);
  }

  protected getEntityType(): EntityType {
    return EntityType.SUBCATEGORY;
  }
}
