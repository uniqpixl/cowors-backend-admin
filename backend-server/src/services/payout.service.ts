import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

import { UserEntity } from '@/auth/entities/user.entity';
import { PayoutStatus } from '../api/payout/dto/payout.dto';
import { PayoutEntity } from '../database/entities/payout.entity';
import { CreatePayoutDto } from '../dto/create-payout.dto';
import { UpdatePayoutDto } from '../dto/update-payout.dto';

@Injectable()
export class PayoutService {
  constructor(
    @InjectRepository(PayoutEntity)
    private readonly payoutRepository: Repository<PayoutEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(
    createPayoutDto: CreatePayoutDto,
    processedBy: string,
  ): Promise<PayoutEntity> {
    // Verify partner exists
    const partner = await this.userRepository.findOne({
      where: { id: createPayoutDto.partnerId },
    });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    const payout = this.payoutRepository.create({
      ...createPayoutDto,
      processedBy,
    });

    return await this.payoutRepository.save(payout);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: PayoutStatus,
    partnerId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    payouts: PayoutEntity[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const queryBuilder = this.payoutRepository
      .createQueryBuilder('payout')
      .leftJoinAndSelect('payout.partner', 'partner')
      .leftJoinAndSelect('payout.processor', 'processor');

    if (status) {
      queryBuilder.andWhere('payout.status = :status', { status });
    }

    if (partnerId) {
      queryBuilder.andWhere('payout.partnerId = :partnerId', { partnerId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'payout.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    const total = await queryBuilder.getCount();
    const payouts = await queryBuilder
      .orderBy('payout.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      payouts,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async findOne(id: string): Promise<PayoutEntity> {
    const payout = await this.payoutRepository.findOne({
      where: { id },
      relations: ['partner', 'processor'],
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    return payout;
  }

  async findByPartner(
    partnerId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    payouts: PayoutEntity[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const [payouts, total] = await this.payoutRepository.findAndCount({
      where: { partnerId },
      relations: ['processor'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      payouts,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async update(
    id: string,
    updatePayoutDto: UpdatePayoutDto,
    processedBy?: string,
  ): Promise<PayoutEntity> {
    const payout = await this.findOne(id);

    // Update processed info if status is being changed
    if (updatePayoutDto.status && updatePayoutDto.status !== payout.status) {
      if (processedBy) {
        payout.processedBy = processedBy;
        payout.processedDate = new Date();
      }
    }

    Object.assign(payout, updatePayoutDto);

    // Remove periodStart and periodEnd as they don't exist in PayoutEntity

    return await this.payoutRepository.save(payout);
  }

  async remove(id: string): Promise<void> {
    const payout = await this.findOne(id);

    // Only allow deletion of pending payouts
    if (payout.status !== PayoutStatus.PENDING) {
      throw new Error('Only pending payouts can be deleted');
    }

    await this.payoutRepository.remove(payout);
  }

  async processPayout(id: string, processedBy: string): Promise<PayoutEntity> {
    const payout = await this.findOne(id);

    if (payout.status !== PayoutStatus.PENDING) {
      throw new Error('Only pending payouts can be processed');
    }

    // Here you would integrate with actual payment providers
    // For now, we'll simulate processing
    payout.status = PayoutStatus.PROCESSING;
    payout.processedBy = processedBy;
    payout.processedDate = new Date();

    // Set external transaction ID for tracking
    payout.externalTransactionId = `txn_${Date.now()}`;

    return await this.payoutRepository.save(payout);
  }

  async getPayoutSummary(
    startDate?: Date,
    endDate?: Date,
    partnerId?: string,
  ): Promise<{
    totalPayouts: number;
    totalAmount: number;
    totalCommission: number;
    totalFees: number;
    payoutsByStatus: Record<PayoutStatus, number>;
    payoutsByMethod: Record<string, number>;
  }> {
    const queryBuilder = this.payoutRepository.createQueryBuilder('payout');

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'payout.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    if (partnerId) {
      queryBuilder.andWhere('payout.partnerId = :partnerId', { partnerId });
    }

    const payouts = await queryBuilder.getMany();

    const summary = {
      totalPayouts: payouts.length,
      totalAmount: payouts.reduce((sum, p) => sum + Number(p.amount), 0),
      totalCommission: 0, // Commission tracking not implemented in current entity
      totalFees: payouts.reduce((sum, p) => sum + Number(p.processingFee), 0),
      payoutsByStatus: {} as Record<PayoutStatus, number>,
      payoutsByMethod: {} as Record<string, number>,
    };

    // Count by status
    Object.values(PayoutStatus).forEach((status) => {
      summary.payoutsByStatus[status] = payouts.filter(
        (p) => p.status === status,
      ).length;
    });

    // Count by method
    payouts.forEach((payout) => {
      const method = payout.payoutMethod;
      summary.payoutsByMethod[method] =
        (summary.payoutsByMethod[method] || 0) + 1;
    });

    return summary;
  }

  async getPendingPayouts(): Promise<PayoutEntity[]> {
    return await this.payoutRepository.find({
      where: { status: PayoutStatus.PENDING },
      relations: ['partner'],
      order: { createdAt: 'ASC' },
    });
  }

  async getPayoutsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<PayoutEntity[]> {
    return await this.payoutRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ['partner', 'processor'],
      order: { createdAt: 'DESC' },
    });
  }
}
