import { UserEntity } from '@/auth/entities/user.entity';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/decorators/auth/get-user.decorator';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { FinancialConfigIntegrationService } from '../../../common/services/financial-config-integration.service';
import { ConfigurationScope } from '../../../common/types/financial-configuration.types';
import { TaxRuleStatus } from '../dto/tax-management.dto';
import { DynamicTaxConfigService } from '../services/dynamic-tax-config.service';

// DTOs for admin tax configuration management
export class TaxRateDto {
  @ApiProperty({ description: 'Tax rate percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;

  @ApiPropertyOptional({ description: 'Minimum taxable amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum taxable amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;
}

export class RegionalTaxConfigDto {
  @ApiProperty({ description: 'Region code' })
  @IsString()
  region: string;

  @ApiProperty({ description: 'Tax configuration for this region' })
  @ValidateNested()
  @Type(() => TaxRateDto)
  taxConfig: TaxRateDto;

  @ApiPropertyOptional({ description: 'Region-specific exemptions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exemptions?: string[];
}

export class AdminTaxSettingsDto {
  @ApiProperty({ description: 'Tax rule name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tax type (e.g., GST, VAT, Sales Tax)' })
  @IsString()
  taxType: string;

  @ApiProperty({ description: 'Tax category' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Default tax rate' })
  @ValidateNested()
  @Type(() => TaxRateDto)
  defaultRate: TaxRateDto;

  @ApiPropertyOptional({ description: 'Regional tax configurations' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegionalTaxConfigDto)
  regionalConfigs?: RegionalTaxConfigDto[];

  @ApiProperty({ description: 'Applicable regions' })
  @IsArray()
  @IsString({ each: true })
  applicableRegions: string[];

  @ApiProperty({ description: 'Effective from date' })
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional({ description: 'Effective until date' })
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @ApiProperty({ description: 'Tax rule status' })
  @IsEnum(TaxRuleStatus)
  status: TaxRuleStatus;

  @ApiPropertyOptional({ description: 'Tax rule conditions' })
  @IsOptional()
  @IsObject()
  conditions?: any;

  @ApiPropertyOptional({ description: 'Reason for configuration change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class TaxConfigurationHistoryDto {
  @ApiProperty({ description: 'Configuration version' })
  version: number;

  @ApiProperty({ description: 'Configuration data' })
  configuration: any;

  @ApiProperty({ description: 'Change timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'User who made the change' })
  updatedBy: string;

  @ApiPropertyOptional({ description: 'Reason for change' })
  reason?: string;

  @ApiProperty({ description: 'Is this version active' })
  isActive: boolean;
}

export class TaxRollbackRequestDto {
  @ApiProperty({ description: 'Target version to rollback to' })
  @IsNumber()
  @Min(1)
  targetVersion: number;

  @ApiProperty({ description: 'Reason for rollback' })
  @IsString()
  reason: string;
}

export class BulkTaxConfigurationUpdateDto {
  @ApiProperty({ description: 'Global tax settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminTaxSettingsDto)
  globalSettings?: AdminTaxSettingsDto;

  @ApiPropertyOptional({ description: 'Region-specific settings' })
  @IsOptional()
  @IsArray()
  regionSettings?: Array<{
    region: string;
    settings: AdminTaxSettingsDto;
  }>;

  @ApiPropertyOptional({ description: 'Category-specific settings' })
  @IsOptional()
  @IsArray()
  categorySettings?: Array<{
    category: string;
    settings: AdminTaxSettingsDto;
  }>;

  @ApiProperty({ description: 'Reason for bulk update' })
  @IsString()
  reason: string;
}

export class TaxCalculationTestDto {
  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Region code' })
  @IsString()
  region: string;

  @ApiProperty({ description: 'Tax category' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: 'Transaction date' })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({ description: 'Additional context' })
  @IsOptional()
  @IsObject()
  context?: any;
}

export class TaxCalculationResultDto {
  @ApiProperty({ description: 'Base amount' })
  baseAmount: number;

  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Total amount including tax' })
  totalAmount: number;

  @ApiProperty({ description: 'Applied tax rate' })
  appliedRate: number;

  @ApiProperty({ description: 'Tax rule used' })
  taxRule: any;

  @ApiProperty({ description: 'Calculation breakdown' })
  breakdown: any;
}

@ApiTags('Tax Admin')
@Controller('admin/tax')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TaxAdminController {
  constructor(
    private readonly dynamicTaxConfigService: DynamicTaxConfigService,
    private readonly configIntegrationService: FinancialConfigIntegrationService,
  ) {}

  @Get('settings/global')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get global tax settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Global tax settings retrieved successfully',
    type: [AdminTaxSettingsDto],
  })
  async getGlobalSettings(): Promise<AdminTaxSettingsDto[]> {
    const settings = await this.configIntegrationService.getTaxSettings();
    return this.mapToAdminDtoArray(settings);
  }

  @Post('settings/global')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create new global tax setting' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Global tax setting created successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createGlobalSetting(
    @Body() settingDto: AdminTaxSettingsDto,
    @GetUser() user: UserEntity,
  ): Promise<{ success: boolean; id: string }> {
    const taxRuleData = this.mapFromAdminDto(settingDto);
    const result = await this.dynamicTaxConfigService.createTaxRuleConfig({
      configType: 'tax_rule',
      configId: 'global',
      configuration: taxRuleData,
      updatedBy: user.id,
      reason: settingDto.reason || 'Global tax setting creation',
    });

    return { success: true, id: result.config.id };
  }

  @Put('settings/global/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update global tax setting' })
  @ApiParam({ name: 'id', description: 'Tax rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Global tax setting updated successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateGlobalSetting(
    @Param('id') id: string,
    @Body() settingDto: AdminTaxSettingsDto,
    @GetUser() user: UserEntity,
  ): Promise<{ success: boolean; version: number }> {
    const updateData = this.mapFromAdminDto(settingDto);
    await this.dynamicTaxConfigService.updateTaxRuleConfig({
      configType: 'tax_rule',
      configId: id,
      configuration: updateData,
      updatedBy: user.id,
      reason: settingDto.reason || 'Global setting update',
    });

    return { success: true, version: 1 };
  }

  @Get('settings/region/:region')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get region-specific tax settings' })
  @ApiParam({ name: 'region', description: 'Region code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Region tax settings retrieved successfully',
    type: [AdminTaxSettingsDto],
  })
  async getRegionSettings(
    @Param('region') region: string,
  ): Promise<AdminTaxSettingsDto[]> {
    const settings = await this.configIntegrationService.getTaxSettings(
      undefined,
      region,
    );
    return this.mapToAdminDtoArray(settings);
  }

  @Post('settings/region/:region')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create region-specific tax setting' })
  @ApiParam({ name: 'region', description: 'Region code' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Region tax setting created successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createRegionSetting(
    @Param('region') region: string,
    @Body() settingDto: AdminTaxSettingsDto,
    @GetUser() user: UserEntity,
  ): Promise<{ success: boolean; id: string }> {
    const taxRuleData = this.mapFromAdminDto(settingDto);
    taxRuleData.applicableRegions = [region];

    const result = await this.dynamicTaxConfigService.createTaxRuleConfig({
      configType: 'tax_rule',
      configId: `region_${region}`,
      configuration: taxRuleData,
      updatedBy: user.id,
      reason: settingDto.reason || `Region ${region} tax setting creation`,
    });

    return { success: true, id: result.config.id };
  }

  @Get('settings/category/:category')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get category-specific tax settings' })
  @ApiParam({ name: 'category', description: 'Tax category' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category tax settings retrieved successfully',
    type: [AdminTaxSettingsDto],
  })
  async getCategorySettings(
    @Param('category') category: string,
  ): Promise<AdminTaxSettingsDto[]> {
    const allSettings = await this.configIntegrationService.getTaxSettings();
    const categorySettings = Array.isArray(allSettings)
      ? allSettings.filter((setting) => setting.category === category)
      : [];
    return this.mapToAdminDtoArray(categorySettings);
  }

  @Post('settings/category/:category')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create category-specific tax setting' })
  @ApiParam({ name: 'category', description: 'Tax category' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category tax setting created successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createCategorySetting(
    @Param('category') category: string,
    @Body() settingDto: AdminTaxSettingsDto,
    @GetUser() user: UserEntity,
  ): Promise<{ success: boolean; id: string }> {
    const taxRuleData = this.mapFromAdminDto(settingDto);
    taxRuleData.category = category;

    const result = await this.dynamicTaxConfigService.createTaxRuleConfig({
      configType: 'tax_rule',
      configId: `category_${category}`,
      configuration: taxRuleData,
      updatedBy: user.id,
      reason: settingDto.reason || `Category ${category} tax setting creation`,
    });

    return { success: true, id: result.config.id };
  }

  @Get('history/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get tax configuration history' })
  @ApiParam({ name: 'id', description: 'Tax rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration history retrieved successfully',
    type: [TaxConfigurationHistoryDto],
  })
  async getConfigurationHistory(
    @Param('id') id: string,
  ): Promise<TaxConfigurationHistoryDto[]> {
    const history = await this.dynamicTaxConfigService.getVersionHistory(
      'tax_rule',
      id,
    );
    return history.map((item) => ({
      version: item.version || 1,
      configuration: item.configuration,
      timestamp: item.updatedAt,
      updatedBy: item.updatedBy,
      reason: item.reason,
      isActive: true, // Assume active for now
    }));
  }

  @Post('rollback/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Rollback tax configuration to a previous version' })
  @ApiParam({ name: 'id', description: 'Tax rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration rolled back successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async rollbackConfiguration(
    @Param('id') id: string,
    @Body() rollbackDto: TaxRollbackRequestDto,
    @GetUser() user: UserEntity,
  ): Promise<{ success: boolean; rolledBackToVersion: number }> {
    await this.dynamicTaxConfigService.rollbackTaxRuleConfig(
      id,
      rollbackDto.targetVersion,
      user.id,
      rollbackDto.reason,
    );

    return { success: true, rolledBackToVersion: rollbackDto.targetVersion };
  }

  @Post('bulk-update')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Perform bulk tax settings update' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk tax settings update completed successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async bulkUpdateSettings(
    @Body() bulkUpdateDto: BulkTaxConfigurationUpdateDto,
    @GetUser() user: UserEntity,
  ): Promise<{ success: boolean; updatedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let updatedCount = 0;

    try {
      // Update global settings if provided
      if (bulkUpdateDto.globalSettings) {
        try {
          const taxRuleData = this.mapFromAdminDto(
            bulkUpdateDto.globalSettings,
          );
          await this.dynamicTaxConfigService.createTaxRuleConfig({
            configType: 'tax_rule',
            configId: 'global',
            configuration: taxRuleData,
            updatedBy: user.id,
            reason: bulkUpdateDto.reason || 'Bulk update - global settings',
          });
          updatedCount++;
        } catch (error) {
          errors.push(`Failed to update global settings: ${error.message}`);
        }
      }

      // Update region settings if provided
      if (bulkUpdateDto.regionSettings) {
        for (const regionSetting of bulkUpdateDto.regionSettings) {
          try {
            const taxRuleData = this.mapFromAdminDto(regionSetting.settings);
            taxRuleData.applicableRegions = [regionSetting.region];
            await this.dynamicTaxConfigService.createTaxRuleConfig({
              configType: 'tax_rule',
              configId: `region_${regionSetting.region}`,
              configuration: taxRuleData,
              updatedBy: user.id,
              reason: bulkUpdateDto.reason || 'Bulk update - region settings',
            });
            updatedCount++;
          } catch (error) {
            errors.push(
              `Failed to update region ${regionSetting.region}: ${error.message}`,
            );
          }
        }
      }

      // Update category settings if provided
      if (bulkUpdateDto.categorySettings) {
        for (const categorySetting of bulkUpdateDto.categorySettings) {
          try {
            const taxRuleData = this.mapFromAdminDto(categorySetting.settings);
            taxRuleData.category = categorySetting.category;
            await this.dynamicTaxConfigService.createTaxRuleConfig({
              configType: 'tax_rule',
              configId: `category_${categorySetting.category}`,
              configuration: taxRuleData,
              updatedBy: user.id,
              reason: bulkUpdateDto.reason || 'Bulk update - category settings',
            });
            updatedCount++;
          } catch (error) {
            errors.push(
              `Failed to update category ${categorySetting.category}: ${error.message}`,
            );
          }
        }
      }

      return { success: true, updatedCount, errors };
    } catch (error) {
      errors.push(`Bulk update failed: ${error.message}`);
      return { success: false, updatedCount, errors };
    }
  }

  @Post('test-calculation')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Test tax calculation with current settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax calculation test completed successfully',
    type: TaxCalculationResultDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async testTaxCalculation(
    @Body() testDto: TaxCalculationTestDto,
  ): Promise<TaxCalculationResultDto> {
    const result = await this.dynamicTaxConfigService.calculateTax(
      testDto.amount,
      testDto.region,
      testDto.category,
    );

    return {
      baseAmount: testDto.amount,
      taxAmount: result.taxAmount,
      totalAmount: result.totalAmount,
      appliedRate:
        result.appliedRules.length > 0 ? result.appliedRules[0].rate : 0,
      taxRule: result.appliedRules.length > 0 ? result.appliedRules[0] : null,
      breakdown: result.breakdown,
    };
  }

  @Get('statistics')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get tax configuration statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration statistics retrieved successfully',
  })
  async getStatistics(): Promise<any> {
    return await this.dynamicTaxConfigService.getTaxConfigStatistics();
  }

  @Get('export')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Export all tax configurations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configurations exported successfully',
  })
  async exportConfigurations(): Promise<any> {
    return await this.dynamicTaxConfigService.exportTaxConfigurations();
  }

  @Post('import')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Import tax configurations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configurations imported successfully',
  })
  async importConfigurations(
    @Body() configurations: any[],
    @Query('overwrite') overwrite: boolean = false,
    @GetUser() user: UserEntity,
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    const result = await this.dynamicTaxConfigService.importTaxConfigurations(
      { taxRules: configurations, overwriteExisting: overwrite },
      user.id,
    );

    return {
      imported: result.imported.taxRules + result.imported.taxSettings,
      failed: result.skipped.taxRules + result.skipped.taxSettings,
      errors: result.errors,
    };
  }

  @Delete('settings/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Delete tax configuration' })
  @ApiParam({ name: 'id', description: 'Tax rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration deleted successfully',
  })
  async deleteConfiguration(
    @Param('id') id: string,
    @GetUser() user: UserEntity,
  ): Promise<{ success: boolean }> {
    await this.dynamicTaxConfigService.deleteTaxRuleConfig(id, user.id);
    return { success: true };
  }

  @Get('validate/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Validate tax configuration' })
  @ApiParam({ name: 'id', description: 'Tax rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration validation completed',
  })
  async validateConfiguration(
    @Param('id') id: string,
  ): Promise<{ isValid: boolean; errors?: string[]; warnings?: string[] }> {
    return await this.dynamicTaxConfigService.validateTaxRuleConfig(id);
  }

  private mapToAdminDtoArray(settings: any): AdminTaxSettingsDto[] {
    if (!settings) return [];

    const settingsArray = Array.isArray(settings) ? settings : [settings];
    return settingsArray.map((setting) => this.mapToAdminDto(setting));
  }

  private mapToAdminDto(setting: any): AdminTaxSettingsDto {
    return {
      name: setting.name || 'Default Tax Rule',
      taxType: setting.taxType || 'GST',
      category: setting.category || 'general',
      defaultRate: {
        rate: setting.rate || setting.defaultRate || 0,
        minAmount: setting.minAmount,
        maxAmount: setting.maxAmount,
      },
      regionalConfigs: setting.regionalConfigs || [],
      applicableRegions: setting.applicableRegions || [],
      effectiveFrom: setting.effectiveFrom || new Date().toISOString(),
      effectiveUntil: setting.effectiveUntil,
      status: setting.status || TaxRuleStatus.ACTIVE,
      conditions: setting.conditions,
    };
  }

  private mapFromAdminDto(dto: AdminTaxSettingsDto): any {
    return {
      name: dto.name,
      taxType: dto.taxType,
      category: dto.category,
      rate: dto.defaultRate.rate,
      minAmount: dto.defaultRate.minAmount,
      maxAmount: dto.defaultRate.maxAmount,
      applicableRegions: dto.applicableRegions,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveUntil: dto.effectiveUntil
        ? new Date(dto.effectiveUntil)
        : undefined,
      status: dto.status,
      conditions: dto.conditions,
      regionalConfigs: dto.regionalConfigs,
    };
  }
}
