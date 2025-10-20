import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { PartnerCategoryEntity } from '../database/entities/partner-category.entity';
import { PartnerTypeEntity } from '../database/entities/partner-type.entity';
import {
  AnyRuleTemplate,
  AvailabilityRuleTemplate,
  FeatureRuleTemplate,
  PricingRuleTemplate,
  RuleConflict,
  RuleInheritanceResult,
  RuleValidationResult,
  ValidationRuleTemplate,
} from '../interfaces/rule-templates.interface';
import { EntityType, IdGeneratorService } from '../utils/id-generator.service';

@Injectable()
export class RuleTemplateService {
  private readonly logger = new Logger(RuleTemplateService.name);
  constructor(
    @InjectRepository(PartnerCategoryEntity)
    private readonly partnerCategoryRepository: Repository<PartnerCategoryEntity>,
    @InjectRepository(PartnerTypeEntity)
    private readonly partnerTypeRepository: Repository<PartnerTypeEntity>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly idGeneratorService: IdGeneratorService,
  ) {}

  /**
   * Validate rule template structure and business logic
   */
  async validateRuleTemplate(
    template: AnyRuleTemplate,
  ): Promise<RuleValidationResult> {
    const errors: {
      field: string;
      message: string;
      severity: 'error' | 'warning';
    }[] = [];
    const warnings: { field: string; message: string }[] = [];

    // Basic validation
    if (!template.id || !template.name || !template.version) {
      errors.push({
        field: 'basic',
        message: 'Template must have id, name, and version',
        severity: 'error',
      });
    }

    // Type-specific validation
    switch (template.type) {
      case 'pricing':
        this.validatePricingRules(
          template as PricingRuleTemplate,
          errors,
          warnings,
        );
        break;
      case 'availability':
        this.validateAvailabilityRules(
          template as AvailabilityRuleTemplate,
          errors,
          warnings,
        );
        break;
      case 'feature':
        this.validateFeatureRules(
          template as FeatureRuleTemplate,
          errors,
          warnings,
        );
        break;
      case 'validation':
        this.validateValidationRules(
          template as ValidationRuleTemplate,
          errors,
          warnings,
        );
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Resolve rule inheritance with conflict detection and resolution
   */
  async resolveRuleInheritance(
    categoryId: string,
    ruleType: 'pricing' | 'availability' | 'feature' | 'validation',
  ): Promise<RuleInheritanceResult> {
    const cacheKey = `rule-inheritance:${categoryId}:${ruleType}`;
    const cached = await this.cacheManager.get<RuleInheritanceResult>(cacheKey);

    if (cached) {
      return cached;
    }

    const category = await this.partnerCategoryRepository.findOne({
      where: { id: categoryId },
      relations: ['partnerType'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const inheritanceChain = [categoryId, category.partnerTypeId];
    const conflicts: RuleConflict[] = [];

    // Get rules from category and parent type
    const categoryRules = this.getCategoryRules(category, ruleType);
    const parentRules = this.getParentTypeRules(category.partnerType, ruleType);

    // Detect and resolve conflicts
    const effectiveRules = this.mergeRulesWithConflictResolution(
      parentRules,
      categoryRules,
      conflicts,
    );

    const result: RuleInheritanceResult = {
      effectiveRules,
      conflicts,
      inheritanceChain,
      version: this.generateVersionHash(effectiveRules),
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  /**
   * Create a new version of rule template
   */
  async createRuleTemplateVersion(
    categoryId: string,
    ruleType: 'pricing' | 'availability' | 'feature' | 'validation',
    newRules: any,
    comment?: string,
  ): Promise<void> {
    const category = await this.partnerCategoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Create version history entry
    const versionHistory = (category.metadata as any)?.versionHistory || [];
    const newVersion = {
      version: this.generateVersionNumber(versionHistory),
      timestamp: new Date(),
      ruleType,
      rules: newRules,
      comment,
      author: 'system', // TODO: Get from auth context
    };

    versionHistory.push(newVersion);

    // Update category with new rules and version history
    const updatedMetadata = {
      ...category.metadata,
      versionHistory,
    };

    await this.partnerCategoryRepository.update(categoryId, {
      [this.getRuleFieldName(ruleType)]: newRules,
      metadata: updatedMetadata,
    });

    // Invalidate cache
    await this.invalidateRuleCache(categoryId, 'all');
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(
    categoryId: string,
    ruleType: 'pricing' | 'availability' | 'feature' | 'validation',
    version: string,
  ): Promise<void> {
    const category = await this.partnerCategoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const versionHistory = (category.metadata as any)?.versionHistory || [];
    const targetVersion = versionHistory.find(
      (v) => v.version === version && v.ruleType === ruleType,
    );

    if (!targetVersion) {
      throw new NotFoundException('Version not found');
    }

    // Update with target version rules
    await this.partnerCategoryRepository.update(categoryId, {
      [this.getRuleFieldName(ruleType)]: targetVersion.rules,
    });

    // Invalidate cache
    await this.invalidateRuleCache(categoryId, 'all');
  }

  /**
   * Get rule template versions
   */
  async getRuleTemplateVersions(
    categoryId: string,
    ruleType?: 'pricing' | 'availability' | 'feature' | 'validation',
  ): Promise<any[]> {
    const category = await this.partnerCategoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const versionHistory = (category.metadata as any)?.versionHistory || [];

    if (ruleType) {
      return versionHistory.filter((v) => v.ruleType === ruleType);
    }

    return versionHistory;
  }

  // Private helper methods
  private validatePricingRules(
    template: PricingRuleTemplate,
    errors: any[],
    warnings: any[],
  ): void {
    const rules = template.rules;

    if (rules.basePrice) {
      if (
        rules.basePrice.min &&
        rules.basePrice.max &&
        rules.basePrice.min > rules.basePrice.max
      ) {
        errors.push({
          field: 'basePrice',
          message: 'Minimum price cannot be greater than maximum price',
          severity: 'error',
        });
      }
    }

    if (rules.discountRules) {
      rules.discountRules.forEach((rule, index) => {
        if (rule.type === 'percentage' && rule.value > 100) {
          warnings.push({
            field: `discountRules[${index}]`,
            message:
              'Discount percentage greater than 100% may cause negative pricing',
          });
        }
      });
    }
  }

  private validateAvailabilityRules(
    template: AvailabilityRuleTemplate,
    errors: any[],
    warnings: any[],
  ): void {
    const rules = template.rules;

    if (rules.advanceBooking && rules.advanceBooking < 0) {
      errors.push({
        field: 'advanceBooking',
        message: 'Advance booking days cannot be negative',
        severity: 'error',
      });
    }

    if (rules.maxBookingDuration && rules.maxBookingDuration <= 0) {
      errors.push({
        field: 'maxBookingDuration',
        message: 'Maximum booking duration must be positive',
        severity: 'error',
      });
    }
  }

  private validateFeatureRules(
    template: FeatureRuleTemplate,
    errors: any[],
    warnings: any[],
  ): void {
    const rules = template.rules;

    if (rules.requiredFeatures && rules.allowedFeatures) {
      const invalidRequired = rules.requiredFeatures.filter(
        (feature) => !rules.allowedFeatures!.includes(feature),
      );

      if (invalidRequired.length > 0) {
        errors.push({
          field: 'requiredFeatures',
          message: `Required features not in allowed list: ${invalidRequired.join(', ')}`,
          severity: 'error',
        });
      }
    }
  }

  private validateValidationRules(
    template: ValidationRuleTemplate,
    errors: any[],
    warnings: any[],
  ): void {
    const rules = template.rules;

    if (
      rules.minimumRating &&
      (rules.minimumRating < 0 || rules.minimumRating > 5)
    ) {
      errors.push({
        field: 'minimumRating',
        message: 'Minimum rating must be between 0 and 5',
        severity: 'error',
      });
    }
  }

  private getCategoryRules(
    category: PartnerCategoryEntity,
    ruleType: string,
  ): any {
    switch (ruleType) {
      case 'pricing':
        return category.pricingRules;
      case 'availability':
        return category.ruleTemplates?.availability;
      case 'feature':
        return category.featureRules;
      case 'validation':
        return category.validationRules;
      default:
        return null;
    }
  }

  private getParentTypeRules(partnerType: any, ruleType: string): any {
    if (!partnerType) return null;

    switch (ruleType) {
      case 'pricing':
        return partnerType.pricingRules;
      case 'availability':
        return partnerType.ruleTemplates?.availability;
      case 'feature':
        return partnerType.featureRules;
      case 'validation':
        return partnerType.validationRules;
      default:
        return null;
    }
  }

  private mergeRulesWithConflictResolution(
    parentRules: any,
    childRules: any,
    conflicts: RuleConflict[],
  ): any {
    if (!parentRules) return childRules;
    if (!childRules) return parentRules;

    const merged = { ...parentRules };

    for (const [key, value] of Object.entries(childRules)) {
      if (parentRules[key] !== undefined && parentRules[key] !== value) {
        conflicts.push({
          type: 'override',
          field: key,
          parentValue: parentRules[key],
          childValue: value,
          resolution: 'use_child',
          message: `Child rule overrides parent rule for field: ${key}`,
        });
      }
      merged[key] = value;
    }

    return merged;
  }

  private generateVersionHash(rules: any): string {
    return this.idGeneratorService.generateId(EntityType.RULE_VERSION);
  }

  private generateVersionNumber(versionHistory: any[]): string {
    const latestVersion =
      versionHistory.length > 0
        ? Math.max(
            ...versionHistory.map(
              (v) => parseInt(v.version.replace('v', '')) || 0,
            ),
          )
        : 0;
    return `v${latestVersion + 1}`;
  }

  private getRuleFieldName(ruleType: string): string {
    switch (ruleType) {
      case 'pricing':
        return 'pricingRules';
      case 'availability':
        return 'ruleTemplates';
      case 'feature':
        return 'featureRules';
      case 'validation':
        return 'validationRules';
      default:
        throw new BadRequestException('Invalid rule type');
    }
  }

  // Cache invalidation helper
  private async invalidateRuleCache(
    entityId: string,
    ruleType: string,
  ): Promise<void> {
    if (ruleType === 'all') {
      const ruleTypes = ['pricing', 'availability', 'feature', 'validation'];
      for (const type of ruleTypes) {
        const patterns = [
          `rule_inheritance:${entityId}:${type}`,
          `rule_inheritance:*:${type}`, // Invalidate related inheritance chains
          `rule_validation:${entityId}:${type}`,
          `rule_template_versions:${entityId}:${type}`,
        ];

        for (const pattern of patterns) {
          await this.cacheManager.del(pattern);
        }
      }
    } else {
      const patterns = [
        `rule_inheritance:${entityId}:${ruleType}`,
        `rule_inheritance:*:${ruleType}`, // Invalidate related inheritance chains
        `rule_validation:${entityId}:${ruleType}`,
        `rule_template_versions:${entityId}:${ruleType}`,
      ];

      for (const pattern of patterns) {
        await this.cacheManager.del(pattern);
      }
    }
  }

  // Cache warming for frequently accessed rule templates
  async warmRuleTemplateCache(
    entityId?: string,
    ruleType?: string,
  ): Promise<void> {
    if (entityId && ruleType) {
      // Warm specific rule template
      await this.resolveRuleInheritance(entityId, ruleType as any);
    } else {
      // Warm frequently accessed rule templates
      const frequentTemplates = await this.getFrequentlyAccessedTemplates();

      // Warm in batches
      const batchSize = 5;
      for (let i = 0; i < frequentTemplates.length; i += batchSize) {
        const batch = frequentTemplates.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (template) => {
            await this.resolveRuleInheritance(
              template.entityId,
              template.ruleType as any,
            );
            await this.warmRuleVersionsCache(
              template.entityId,
              template.ruleType,
            );
          }),
        );

        // Small delay between batches
        if (i + batchSize < frequentTemplates.length) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }
    }
  }

  // Get frequently accessed rule templates
  private async getFrequentlyAccessedTemplates(): Promise<
    Array<{ entityId: string; ruleType: string; accessCount: number }>
  > {
    const cacheKey = 'frequent-rule-templates';
    let frequentTemplates =
      await this.cacheManager.get<
        Array<{ entityId: string; ruleType: string; accessCount: number }>
      >(cacheKey);

    if (!frequentTemplates) {
      // Track access patterns from cache hits
      const accessPatterns: Record<string, number> = {};

      // Get all active categories and their rule types
      const ruleTypes = ['pricing', 'feature', 'validation'];
      const entities = await this.getActiveEntities(); // This would get active categories/types

      // Simulate access counting (in real implementation, this would be tracked)
      for (const entity of entities) {
        for (const ruleType of ruleTypes) {
          const key = `${entity.id}:${ruleType}`;
          // Check if this combination is cached (indicates frequent access)
          const cacheKey = `rule_inheritance:${entity.id}:${ruleType}`;
          const cached = await this.cacheManager.get(cacheKey);
          if (cached) {
            accessPatterns[key] = (accessPatterns[key] || 0) + 1;
          }
        }
      }

      // Convert to array and sort by access count
      frequentTemplates = Object.entries(accessPatterns)
        .map(([key, count]) => {
          const [entityId, ruleType] = key.split(':');
          return { entityId, ruleType, accessCount: count };
        })
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 20); // Top 20 most accessed

      // Cache for 30 minutes
      await this.cacheManager.set(cacheKey, frequentTemplates, 1800000);
    }

    return frequentTemplates;
  }

  // Get active entities (categories/types) for cache warming
  private async getActiveEntities(): Promise<
    Array<{ id: string; type: string }>
  > {
    const cacheKey = 'active-entities-for-warming';
    let entities =
      await this.cacheManager.get<Array<{ id: string; type: string }>>(
        cacheKey,
      );

    if (!entities) {
      // Get active categories
      const activeCategories = await this.partnerCategoryRepository.find({
        where: { isActive: true },
        select: ['id'],
        take: 50, // Limit for performance
      });

      // Get active partner types
      const activeTypes = await this.partnerTypeRepository.find({
        where: { isActive: true },
        select: ['id'],
        take: 20, // Limit for performance
      });

      entities = [
        ...activeCategories.map((cat) => ({ id: cat.id, type: 'category' })),
        ...activeTypes.map((type) => ({ id: type.id, type: 'partnerType' })),
      ];

      // Cache for 1 hour
      await this.cacheManager.set(cacheKey, entities, 3600000);
    }

    return entities;
  }

  // Warm rule versions cache
  private async warmRuleVersionsCache(
    entityId: string,
    ruleType: string,
  ): Promise<void> {
    const cacheKey = `rule_template_versions:${entityId}:${ruleType}`;
    const cached = await this.cacheManager.get(cacheKey);

    if (!cached) {
      // Pre-load versions into cache
      await this.getRuleTemplateVersions(entityId, ruleType as any);
    }
  }

  // Track rule template access for analytics
  async trackRuleTemplateAccess(
    entityId: string,
    ruleType: string,
    accessType: 'read' | 'write' | 'inherit',
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const accessKey = `rule_access:${entityId}:${ruleType}:${today}`;

    const currentAccess =
      (await this.cacheManager.get<Record<string, number>>(accessKey)) || {};
    currentAccess[accessType] = (currentAccess[accessType] || 0) + 1;
    currentAccess.total = (currentAccess.total || 0) + 1;

    // Cache for 24 hours
    await this.cacheManager.set(accessKey, currentAccess, 86400000);

    // Update global access patterns
    const globalKey = `global_rule_access:${today}`;
    const globalAccess =
      (await this.cacheManager.get<Record<string, number>>(globalKey)) || {};
    const templateKey = `${entityId}:${ruleType}`;
    globalAccess[templateKey] = (globalAccess[templateKey] || 0) + 1;

    await this.cacheManager.set(globalKey, globalAccess, 86400000);
  }

  // Get rule template access analytics
  async getRuleTemplateAnalytics(
    entityId?: string,
    ruleType?: string,
  ): Promise<any> {
    const today = new Date().toISOString().split('T')[0];

    if (entityId && ruleType) {
      // Get specific template analytics
      const accessKey = `rule_access:${entityId}:${ruleType}:${today}`;
      const accessData =
        (await this.cacheManager.get<Record<string, number>>(accessKey)) || {};

      return {
        entityId,
        ruleType,
        date: today,
        accessMetrics: accessData,
        lastUpdated: new Date(),
      };
    } else {
      // Get global analytics
      const globalKey = `global_rule_access:${today}`;
      const globalAccess =
        (await this.cacheManager.get<Record<string, number>>(globalKey)) || {};

      // Convert to sorted array
      const sortedAccess = Object.entries(globalAccess)
        .map(([key, count]) => {
          const [entityId, ruleType] = key.split(':');
          return { entityId, ruleType, accessCount: count };
        })
        .sort((a, b) => b.accessCount - a.accessCount);

      return {
        date: today,
        totalAccess: Object.values(globalAccess).reduce(
          (sum, count) => sum + count,
          0,
        ),
        topTemplates: sortedAccess.slice(0, 10),
        lastUpdated: new Date(),
      };
    }
  }

  // Scheduled cache warming for rule templates
  async scheduledRuleTemplateWarming(): Promise<void> {
    try {
      // Warm frequently accessed templates
      await this.warmRuleTemplateCache();
    } catch (error) {
      this.logger.error('Rule template cache warming failed', error as any);
      return;
    }
    this.logger.log('Rule template cache warming completed');
  }
}
