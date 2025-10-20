import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PartnerCommissionSettingsEntity } from '../database/entities/partner-commission-settings.entity';
import { CreatePartnerCommissionSettingsDto } from '../dto/create-partner-commission-settings.dto';
import { UpdatePartnerCommissionSettingsDto } from '../dto/update-partner-commission-settings.dto';

@Injectable()
export class PartnerCommissionSettingsService {
  constructor(
    @InjectRepository(PartnerCommissionSettingsEntity)
    private readonly commissionSettingsRepository: Repository<PartnerCommissionSettingsEntity>,
  ) {}

  async create(
    createDto: CreatePartnerCommissionSettingsDto,
  ): Promise<PartnerCommissionSettingsEntity> {
    const settings = this.commissionSettingsRepository.create(createDto);
    return await this.commissionSettingsRepository.save(settings);
  }

  async findAll(): Promise<PartnerCommissionSettingsEntity[]> {
    return await this.commissionSettingsRepository.find({
      relations: ['partner'],
    });
  }

  async findByPartnerId(
    partnerId: string,
  ): Promise<PartnerCommissionSettingsEntity> {
    const settings = await this.commissionSettingsRepository.findOne({
      where: { partnerId },
      relations: ['partner'],
    });

    if (!settings) {
      throw new NotFoundException(
        `Commission settings not found for partner ${partnerId}`,
      );
    }

    return settings;
  }

  async findById(id: string): Promise<PartnerCommissionSettingsEntity> {
    const settings = await this.commissionSettingsRepository.findOne({
      where: { id },
      relations: ['partner'],
    });

    if (!settings) {
      throw new NotFoundException(
        `Commission settings not found with id ${id}`,
      );
    }

    return settings;
  }

  async updateByPartnerId(
    partnerId: string,
    updateDto: UpdatePartnerCommissionSettingsDto,
  ): Promise<PartnerCommissionSettingsEntity> {
    const settings = await this.findByPartnerId(partnerId);
    Object.assign(settings, updateDto);
    return await this.commissionSettingsRepository.save(settings);
  }

  async update(
    id: string,
    updateDto: UpdatePartnerCommissionSettingsDto,
  ): Promise<PartnerCommissionSettingsEntity> {
    const settings = await this.findById(id);
    Object.assign(settings, updateDto);
    return await this.commissionSettingsRepository.save(settings);
  }

  async remove(id: string): Promise<void> {
    const settings = await this.findById(id);
    await this.commissionSettingsRepository.remove(settings);
  }

  async getOrCreateForPartner(
    partnerId: string,
  ): Promise<PartnerCommissionSettingsEntity> {
    try {
      return await this.findByPartnerId(partnerId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Create default settings for partner
        return await this.create({ partnerId });
      }
      throw error;
    }
  }

  async getCommissionRate(
    partnerId: string,
    spaceType?: string,
  ): Promise<number> {
    const settings = await this.getOrCreateForPartner(partnerId);

    // Check for custom rate for specific space type
    if (spaceType && settings.customRates && settings.customRates[spaceType]) {
      return Number(settings.customRates[spaceType]);
    }

    return Number(settings.commissionRate);
  }

  async calculateCommission(
    partnerId: string,
    amount: number,
    spaceType?: string,
  ): Promise<number> {
    const rate = await this.getCommissionRate(partnerId, spaceType);
    return (amount * rate) / 100;
  }
}
