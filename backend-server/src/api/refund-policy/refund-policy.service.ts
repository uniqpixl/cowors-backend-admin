import {
  RefundCalculationType,
  RefundPolicyEntity,
  RefundPolicyType,
  RefundTier,
} from '@/database/entities/refund-policy.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorResponseUtil } from '../../common/utils/error-response.util';

export interface RefundCalculationResult {
  refundAmount: number;
  cancellationFee: number;
  refundPercentage: number;
  isRefundable: boolean;
  reason: string;
  processingDays: number;
  requiresApproval: boolean;
}

export interface RefundCalculationInput {
  bookingAmount: number;
  bookingStartTime: Date;
  cancellationTime: Date;
  partnerId: string;
  spaceType?: string;
  isEmergency?: boolean;
}

@Injectable()
export class RefundPolicyService {
  private readonly logger = new Logger(RefundPolicyService.name);

  constructor(
    @InjectRepository(RefundPolicyEntity)
    private refundPolicyRepository: Repository<RefundPolicyEntity>,
  ) {}

  async createRefundPolicy(
    partnerId: string,
    policyData: Partial<RefundPolicyEntity>,
  ): Promise<RefundPolicyEntity> {
    // If this is set as default, unset other default policies for this partner
    if (policyData.isDefault) {
      await this.refundPolicyRepository.update(
        { partnerId, isDefault: true },
        { isDefault: false },
      );
    }

    const policy = this.refundPolicyRepository.create({
      ...policyData,
      partnerId,
    });

    return this.refundPolicyRepository.save(policy);
  }

  async updateRefundPolicy(
    policyId: string,
    partnerId: string,
    updateData: Partial<RefundPolicyEntity>,
  ): Promise<RefundPolicyEntity> {
    const policy = await this.refundPolicyRepository.findOne({
      where: { id: policyId, partnerId },
    });

    if (!policy) {
      throw ErrorResponseUtil.notFound('Refund Policy', policyId);
    }

    // If this is set as default, unset other default policies for this partner
    if (updateData.isDefault && !policy.isDefault) {
      await this.refundPolicyRepository.update(
        { partnerId, isDefault: true },
        { isDefault: false },
      );
    }

    await this.refundPolicyRepository.update(policyId, updateData);
    return this.refundPolicyRepository.findOne({ where: { id: policyId } });
  }

  async getPartnerRefundPolicies(
    partnerId: string,
  ): Promise<RefundPolicyEntity[]> {
    return this.refundPolicyRepository.find({
      where: { partnerId, isActive: true },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async getDefaultRefundPolicy(
    partnerId: string,
  ): Promise<RefundPolicyEntity | null> {
    return this.refundPolicyRepository.findOne({
      where: { partnerId, isDefault: true, isActive: true },
    });
  }

  async getRefundPolicyById(policyId: string): Promise<RefundPolicyEntity> {
    const policy = await this.refundPolicyRepository.findOne({
      where: { id: policyId },
      relations: ['partner'],
    });

    if (!policy) {
      throw ErrorResponseUtil.notFound('Refund Policy', policyId);
    }

    return policy;
  }

  async calculateRefund(
    input: RefundCalculationInput,
  ): Promise<RefundCalculationResult> {
    const policy = await this.getDefaultRefundPolicy(input.partnerId);

    if (!policy) {
      // Use system default policy
      return this.calculateSystemDefaultRefund(input);
    }

    const hoursBeforeStart = this.calculateHoursBeforeStart(
      input.cancellationTime,
      input.bookingStartTime,
    );

    // Check if refund is allowed
    if (hoursBeforeStart < policy.noRefundHours) {
      return {
        refundAmount: 0,
        cancellationFee: input.bookingAmount,
        refundPercentage: 0,
        isRefundable: false,
        reason: `Cancellation within ${policy.noRefundHours} hours of booking start`,
        processingDays: policy.processingDays,
        requiresApproval: policy.requireApproval,
      };
    }

    if (
      hoursBeforeStart < policy.minimumNoticeHours &&
      !policy.allowSameDayRefund
    ) {
      return {
        refundAmount: 0,
        cancellationFee: input.bookingAmount,
        refundPercentage: 0,
        isRefundable: false,
        reason: `Minimum ${policy.minimumNoticeHours} hours notice required`,
        processingDays: policy.processingDays,
        requiresApproval: policy.requireApproval,
      };
    }

    // Handle emergency/force majeure
    if (input.isEmergency && policy.forceMajeureFullRefund) {
      return {
        refundAmount: input.bookingAmount,
        cancellationFee: 0,
        refundPercentage: 100,
        isRefundable: true,
        reason: 'Force majeure/emergency cancellation',
        processingDays: policy.processingDays,
        requiresApproval: policy.requireApproval,
      };
    }

    // Calculate refund based on policy type
    switch (policy.calculationType) {
      case RefundCalculationType.TIERED:
        return this.calculateTieredRefund(input, policy, hoursBeforeStart);
      case RefundCalculationType.FIXED_AMOUNT:
        return this.calculateFixedAmountRefund(input, policy);
      case RefundCalculationType.PERCENTAGE:
      default:
        return this.calculatePercentageRefund(input, policy);
    }
  }

  private calculateHoursBeforeStart(
    cancellationTime: Date,
    bookingStartTime: Date,
  ): number {
    const diffMs = bookingStartTime.getTime() - cancellationTime.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  }

  private calculateTieredRefund(
    input: RefundCalculationInput,
    policy: RefundPolicyEntity,
    hoursBeforeStart: number,
  ): RefundCalculationResult {
    if (!policy.refundTiers || policy.refundTiers.length === 0) {
      return this.calculatePercentageRefund(input, policy);
    }

    // Sort tiers by hours before start (descending)
    const sortedTiers = [...policy.refundTiers].sort(
      (a, b) => b.hoursBeforeStart - a.hoursBeforeStart,
    );

    // Find applicable tier
    const applicableTier = sortedTiers.find(
      (tier) => hoursBeforeStart >= tier.hoursBeforeStart,
    );

    if (!applicableTier) {
      // No applicable tier, use default
      return this.calculatePercentageRefund(input, policy);
    }

    const refundPercentage = applicableTier.refundPercentage;
    const refundAmount = (input.bookingAmount * refundPercentage) / 100;
    const cancellationFee =
      (applicableTier.fixedFee || 0) + (input.bookingAmount - refundAmount);

    return {
      refundAmount: Math.max(0, refundAmount - (applicableTier.fixedFee || 0)),
      cancellationFee,
      refundPercentage,
      isRefundable: refundAmount > 0,
      reason:
        applicableTier.description ||
        `${refundPercentage}% refund as per policy`,
      processingDays: policy.processingDays,
      requiresApproval: policy.requireApproval,
    };
  }

  private calculatePercentageRefund(
    input: RefundCalculationInput,
    policy: RefundPolicyEntity,
  ): RefundCalculationResult {
    const refundPercentage = Number(policy.defaultRefundPercentage);
    const refundAmount = (input.bookingAmount * refundPercentage) / 100;
    const cancellationFee =
      Number(policy.fixedCancellationFee) +
      (input.bookingAmount - refundAmount);

    return {
      refundAmount: Math.max(
        0,
        refundAmount - Number(policy.fixedCancellationFee),
      ),
      cancellationFee,
      refundPercentage,
      isRefundable: refundAmount > Number(policy.fixedCancellationFee),
      reason: `${refundPercentage}% refund as per policy`,
      processingDays: policy.processingDays,
      requiresApproval: policy.requireApproval,
    };
  }

  private calculateFixedAmountRefund(
    input: RefundCalculationInput,
    policy: RefundPolicyEntity,
  ): RefundCalculationResult {
    const cancellationFee = Number(policy.fixedCancellationFee);
    const refundAmount = Math.max(0, input.bookingAmount - cancellationFee);
    const refundPercentage = (refundAmount / input.bookingAmount) * 100;

    return {
      refundAmount,
      cancellationFee,
      refundPercentage,
      isRefundable: refundAmount > 0,
      reason: `Fixed cancellation fee of ₹${cancellationFee}`,
      processingDays: policy.processingDays,
      requiresApproval: policy.requireApproval,
    };
  }

  private calculateSystemDefaultRefund(
    input: RefundCalculationInput,
  ): RefundCalculationResult {
    const hoursBeforeStart = this.calculateHoursBeforeStart(
      input.cancellationTime,
      input.bookingStartTime,
    );

    // System default: 24 hours notice for 80% refund, 12 hours for 50%, less than 12 hours no refund
    if (hoursBeforeStart >= 24) {
      return {
        refundAmount: input.bookingAmount * 0.8,
        cancellationFee: input.bookingAmount * 0.2,
        refundPercentage: 80,
        isRefundable: true,
        reason: 'System default: 80% refund for 24+ hours notice',
        processingDays: 5,
        requiresApproval: false,
      };
    } else if (hoursBeforeStart >= 12) {
      return {
        refundAmount: input.bookingAmount * 0.5,
        cancellationFee: input.bookingAmount * 0.5,
        refundPercentage: 50,
        isRefundable: true,
        reason: 'System default: 50% refund for 12-24 hours notice',
        processingDays: 5,
        requiresApproval: false,
      };
    } else {
      return {
        refundAmount: 0,
        cancellationFee: input.bookingAmount,
        refundPercentage: 0,
        isRefundable: false,
        reason: 'System default: No refund for less than 12 hours notice',
        processingDays: 5,
        requiresApproval: false,
      };
    }
  }

  async deleteRefundPolicy(policyId: string, partnerId: string): Promise<void> {
    const policy = await this.refundPolicyRepository.findOne({
      where: { id: policyId, partnerId },
    });

    if (!policy) {
      throw ErrorResponseUtil.notFound('Refund Policy', policyId);
    }

    if (policy.isDefault) {
      throw ErrorResponseUtil.badRequest('Cannot delete default refund policy');
    }

    await this.refundPolicyRepository.softDelete(policyId);
  }

  async createDefaultPolicies(
    partnerId: string,
  ): Promise<RefundPolicyEntity[]> {
    const policies = [];

    // Flexible policy
    const flexiblePolicy = await this.createRefundPolicy(partnerId, {
      name: 'Flexible Cancellation',
      description: 'Full refund up to 24 hours before booking',
      type: RefundPolicyType.FLEXIBLE,
      calculationType: RefundCalculationType.PERCENTAGE,
      minimumNoticeHours: 24,
      noRefundHours: 2,
      defaultRefundPercentage: 100,
      fixedCancellationFee: 0,
      allowSameDayRefund: true,
      allowPartialRefund: true,
      requireApproval: false,
      processingDays: 3,
      forceMajeureFullRefund: true,
      isActive: true,
      isDefault: false,
    });
    policies.push(flexiblePolicy);

    // Moderate policy (default)
    const moderatePolicy = await this.createRefundPolicy(partnerId, {
      name: 'Moderate Cancellation',
      description: 'Tiered refund based on cancellation timing',
      type: RefundPolicyType.MODERATE,
      calculationType: RefundCalculationType.TIERED,
      minimumNoticeHours: 12,
      noRefundHours: 2,
      defaultRefundPercentage: 80,
      fixedCancellationFee: 0,
      refundTiers: [
        {
          hoursBeforeStart: 48,
          refundPercentage: 100,
          description: 'Full refund for 48+ hours notice',
        },
        {
          hoursBeforeStart: 24,
          refundPercentage: 80,
          description: '80% refund for 24-48 hours notice',
        },
        {
          hoursBeforeStart: 12,
          refundPercentage: 50,
          description: '50% refund for 12-24 hours notice',
        },
      ],
      allowSameDayRefund: false,
      allowPartialRefund: true,
      requireApproval: false,
      processingDays: 5,
      forceMajeureFullRefund: true,
      isActive: true,
      isDefault: true,
    });
    policies.push(moderatePolicy);

    // Strict policy
    const strictPolicy = await this.createRefundPolicy(partnerId, {
      name: 'Strict Cancellation',
      description: 'Limited refund with high cancellation fees',
      type: RefundPolicyType.STRICT,
      calculationType: RefundCalculationType.PERCENTAGE,
      minimumNoticeHours: 48,
      noRefundHours: 24,
      defaultRefundPercentage: 50,
      fixedCancellationFee: 500, // ₹500 fixed fee
      allowSameDayRefund: false,
      allowPartialRefund: true,
      requireApproval: true,
      processingDays: 7,
      forceMajeureFullRefund: false,
      isActive: true,
      isDefault: false,
    });
    policies.push(strictPolicy);

    return policies;
  }
}
