import { ErrorResponseUtil } from '@/common/utils/error-response.util';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SystemConfigEntity } from '@/database/entities/system-config.entity';
import { CreateSystemConfigDto } from './dto/create-system-config.dto';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfigEntity)
    private readonly systemConfigRepository: Repository<SystemConfigEntity>,
  ) {}

  async create(createDto: CreateSystemConfigDto): Promise<SystemConfigEntity> {
    const config = this.systemConfigRepository.create({
      ...createDto,
      isPublic: createDto.isPublic ?? false,
    });
    return this.systemConfigRepository.save(config);
  }

  async findAll(): Promise<SystemConfigEntity[]> {
    return this.systemConfigRepository.find({
      order: { category: 'ASC', key: 'ASC' },
    });
  }

  async findByCategory(category: string): Promise<SystemConfigEntity[]> {
    return this.systemConfigRepository.find({
      where: { category },
      order: { key: 'ASC' },
    });
  }

  async findOne(id: string): Promise<SystemConfigEntity> {
    const config = await this.systemConfigRepository.findOne({
      where: { id },
    });
    if (!config) {
      throw ErrorResponseUtil.notFound('System config', id);
    }
    return config;
  }

  async findByKey(category: string, key: string): Promise<SystemConfigEntity> {
    const config = await this.systemConfigRepository.findOne({
      where: { category, key },
    });
    if (!config) {
      throw ErrorResponseUtil.notFound('System config', `${category}/${key}`);
    }
    return config;
  }

  async update(
    id: string,
    updateDto: UpdateSystemConfigDto,
  ): Promise<SystemConfigEntity> {
    const config = await this.findOne(id);
    Object.assign(config, updateDto);
    return this.systemConfigRepository.save(config);
  }

  async updateByKey(
    category: string,
    key: string,
    updateDto: UpdateSystemConfigDto,
  ): Promise<SystemConfigEntity> {
    const config = await this.findByKey(category, key);
    Object.assign(config, updateDto);
    return this.systemConfigRepository.save(config);
  }

  async remove(id: string): Promise<void> {
    const config = await this.findOne(id);
    await this.systemConfigRepository.remove(config);
  }

  async getPublicConfigs(): Promise<Record<string, any>> {
    const configs = await this.systemConfigRepository.find({
      where: { isPublic: true },
    });

    const result: Record<string, any> = {};
    configs.forEach((config) => {
      if (!result[config.category]) {
        result[config.category] = {};
      }
      result[config.category][config.key] = config.value;
    });

    return result;
  }

  async getAllConfigsGrouped(): Promise<Record<string, any>> {
    const configs = await this.findAll();

    const result: Record<string, any> = {};
    configs.forEach((config) => {
      if (!result[config.category]) {
        result[config.category] = {};
      }
      result[config.category][config.key] = {
        value: config.value,
        dataType: config.dataType,
        description: config.description,
        isPublic: config.isPublic,
      };
    });

    return result;
  }

  async resetToDefaults(): Promise<void> {
    // This would typically load default configurations from a file or predefined set
    // For now, we'll just clear all configs
    await this.systemConfigRepository.clear();

    // Initialize with default platform settings
    await this.initializeDefaults();
  }

  private async initializeDefaults(): Promise<void> {
    const defaults = [
      {
        category: 'platform',
        key: 'userRegistration',
        value: true,
        dataType: 'boolean',
        description: 'Allow new user registration',
        isPublic: true,
      },
      {
        category: 'platform',
        key: 'instantBooking',
        value: true,
        dataType: 'boolean',
        description: 'Enable instant booking feature',
        isPublic: true,
      },
      {
        category: 'platform',
        key: 'maintenanceMode',
        value: false,
        dataType: 'boolean',
        description: 'Enable maintenance mode',
        isPublic: true,
      },
      {
        category: 'contact',
        key: 'companyName',
        value: 'Cowors',
        dataType: 'string',
        description: 'Company name',
        isPublic: true,
      },
      {
        category: 'contact',
        key: 'supportEmail',
        value: 'support@cowors.com',
        dataType: 'string',
        description: 'Support email address',
        isPublic: true,
      },
      {
        category: 'payouts',
        key: 'defaultCommissionRate',
        value: 10,
        dataType: 'number',
        description: 'Default commission rate percentage',
        isPublic: false,
      },
      {
        category: 'security',
        key: 'sessionTimeout',
        value: 3600,
        dataType: 'number',
        description: 'Session timeout in seconds',
        isPublic: false,
      },
    ];

    for (const defaultConfig of defaults) {
      await this.systemConfigRepository.save(
        this.systemConfigRepository.create(defaultConfig),
      );
    }
  }
}
