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
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ParseCoworsIdPipe } from '../../../common/pipes/parse-cowors-id.pipe';
import {
  TaxRuleEntity,
  TaxSettingsEntity,
} from '../entities/tax-management.entity';
import {
  DynamicTaxConfigService,
  DynamicTaxConfigUpdate,
  TaxConfigValidationResult,
  TaxConfigVersionInfo,
} from '../services/dynamic-tax-config.service';

// DTOs for dynamic tax configuration
export class CreateDynamicTaxConfigDto {
  configType: 'tax_rule' | 'tax_settings';
  region?: string;
  taxType?: string;
  configuration: any;
  effectiveDate?: Date;
  expiryDate?: Date;
  priority?: number;
  description?: string;
  tags?: string[];
}

export class UpdateDynamicTaxConfigDto {
  configuration?: any;
  region?: string;
  taxType?: string;
  effectiveDate?: Date;
  expiryDate?: Date;
  priority?: number;
  description?: string;
  tags?: string[];
  isActive?: boolean;
}

export class TaxConfigRollbackDto {
  targetVersion: number;
  reason: string;
}

export class TaxConfigValidationDto {
  configType: 'tax_rule' | 'tax_settings';
  configuration: any;
  region?: string;
  taxType?: string;
}

export class BulkTaxConfigUpdateDto {
  updates: Array<{
    configId: string;
    configuration: any;
    effectiveDate?: Date;
  }>;
  reason: string;
}

@ApiTags('Tax Configuration Admin')
@Controller('admin/tax/config')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TaxConfigAdminController {
  constructor(
    private readonly dynamicTaxConfigService: DynamicTaxConfigService,
  ) {}

  // Dynamic Tax Rule Configuration Management
  @Post('tax-rules')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create dynamic tax rule configuration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tax rule configuration created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid configuration data',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createTaxRuleConfig(
    @Body() createDto: CreateDynamicTaxConfigDto,
    @Request() req: any,
  ): Promise<{ config: TaxRuleEntity; version: TaxConfigVersionInfo }> {
    const update: DynamicTaxConfigUpdate = {
      configType: 'tax_rule',
      configId: `rule_${Date.now()}`,
      configuration: createDto.configuration,
      region: createDto.region,
      taxType: createDto.taxType,
      effectiveDate: createDto.effectiveDate,
      expiryDate: createDto.expiryDate,
      priority: createDto.priority || 1,
      updatedBy: req.user.id,
      reason: createDto.description || 'New tax rule configuration',
      metadata: {
        tags: createDto.tags || [],
        createdVia: 'admin_api',
        userAgent: req.headers['user-agent'],
      },
    };

    return await this.dynamicTaxConfigService.createTaxRuleConfig(update);
  }

  @Put('tax-rules/:configId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update dynamic tax rule configuration' })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rule configuration updated successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateTaxRuleConfig(
    @Param('configId', ParseCoworsIdPipe) configId: string,
    @Body() updateDto: UpdateDynamicTaxConfigDto,
    @Request() req: any,
  ): Promise<{ config: TaxRuleEntity; version: TaxConfigVersionInfo }> {
    const update: DynamicTaxConfigUpdate = {
      configType: 'tax_rule',
      configId,
      configuration: updateDto.configuration,
      region: updateDto.region,
      taxType: updateDto.taxType,
      effectiveDate: updateDto.effectiveDate,
      expiryDate: updateDto.expiryDate,
      priority: updateDto.priority,
      updatedBy: req.user.id,
      reason: updateDto.description || 'Tax rule configuration update',
      metadata: {
        tags: updateDto.tags || [],
        updatedVia: 'admin_api',
        userAgent: req.headers['user-agent'],
        isActive: updateDto.isActive,
      },
    };

    return await this.dynamicTaxConfigService.updateTaxRuleConfig(update);
  }

  @Get('tax-rules/:configId')
  @Roles('admin', 'super_admin', 'partner')
  @ApiOperation({ summary: 'Get tax rule configuration by ID' })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rule configuration retrieved successfully',
  })
  async getTaxRuleConfig(
    @Param('configId', ParseCoworsIdPipe) configId: string,
  ): Promise<TaxRuleEntity> {
    return await this.dynamicTaxConfigService.getTaxRuleConfig(configId);
  }

  @Get('tax-rules')
  @Roles('admin', 'super_admin', 'partner')
  @ApiOperation({ summary: 'Get tax rule configurations with filters' })
  @ApiQuery({
    name: 'region',
    required: false,
    description: 'Filter by region',
  })
  @ApiQuery({
    name: 'taxType',
    required: false,
    description: 'Filter by tax type',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'effectiveDate',
    required: false,
    description: 'Filter by effective date',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    description: 'Filter by tags (comma-separated)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rule configurations retrieved successfully',
  })
  async getTaxRuleConfigs(
    @Query('region') region?: string,
    @Query('taxType') taxType?: string,
    @Query('isActive') isActive?: boolean,
    @Query('effectiveDate') effectiveDate?: string,
    @Query('tags') tags?: string,
  ): Promise<TaxRuleEntity[]> {
    const filters = {
      region,
      taxType,
      isActive,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
      tags: tags ? tags.split(',').map((tag) => tag.trim()) : undefined,
    };

    return await this.dynamicTaxConfigService.getTaxRuleConfigs(filters);
  }

  @Delete('tax-rules/:configId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Delete tax rule configuration' })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rule configuration deleted successfully',
  })
  async deleteTaxRuleConfig(
    @Param('configId', ParseCoworsIdPipe) configId: string,
    @Request() req: any,
  ): Promise<void> {
    await this.dynamicTaxConfigService.deleteTaxRuleConfig(
      configId,
      req.user.id,
    );
  }

  // Dynamic Tax Settings Management
  @Post('tax-settings')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create dynamic tax settings configuration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tax settings configuration created successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createTaxSettingsConfig(
    @Body() createDto: CreateDynamicTaxConfigDto,
    @Request() req: any,
  ): Promise<{ config: TaxSettingsEntity; version: TaxConfigVersionInfo }> {
    const update: DynamicTaxConfigUpdate = {
      configType: 'tax_settings',
      configId: `settings_${Date.now()}`,
      configuration: createDto.configuration,
      effectiveDate: createDto.effectiveDate,
      expiryDate: createDto.expiryDate,
      priority: createDto.priority || 1,
      updatedBy: req.user.id,
      reason: createDto.description || 'New tax settings configuration',
      metadata: {
        tags: createDto.tags || [],
        createdVia: 'admin_api',
        userAgent: req.headers['user-agent'],
      },
    };

    return await this.dynamicTaxConfigService.updateTaxSettings(update);
  }

  @Put('tax-settings/:configId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update dynamic tax settings configuration' })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax settings configuration updated successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateTaxSettingsConfig(
    @Param('configId', ParseCoworsIdPipe) configId: string,
    @Body() updateDto: UpdateDynamicTaxConfigDto,
    @Request() req: any,
  ): Promise<{ config: TaxSettingsEntity; version: TaxConfigVersionInfo }> {
    const update: DynamicTaxConfigUpdate = {
      configType: 'tax_settings',
      configId,
      configuration: updateDto.configuration,
      effectiveDate: updateDto.effectiveDate,
      expiryDate: updateDto.expiryDate,
      priority: updateDto.priority,
      updatedBy: req.user.id,
      reason: updateDto.description || 'Tax settings configuration update',
      metadata: {
        tags: updateDto.tags || [],
        updatedVia: 'admin_api',
        userAgent: req.headers['user-agent'],
        isActive: updateDto.isActive,
      },
    };

    return await this.dynamicTaxConfigService.updateTaxSettings(update);
  }

  @Get('tax-settings')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get current tax settings configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax settings configuration retrieved successfully',
  })
  async getTaxSettingsConfig(): Promise<TaxSettingsEntity> {
    return await this.dynamicTaxConfigService.getTaxSettings();
  }

  // Configuration Versioning and Rollback
  @Get(':configType/:configId/versions')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get tax configuration version history' })
  @ApiParam({ name: 'configType', description: 'Configuration type' })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit number of versions',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration version history retrieved successfully',
  })
  async getTaxConfigVersionHistory(
    @Param('configType') configType: string,
    @Param('configId', ParseCoworsIdPipe) configId: string,
    @Query('limit') limit?: number,
  ): Promise<TaxConfigVersionInfo[]> {
    return await this.dynamicTaxConfigService.getVersionHistory(
      configType,
      configId,
      limit,
    );
  }

  @Post(':configType/:configId/rollback')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Rollback tax configuration to previous version' })
  @ApiParam({ name: 'configType', description: 'Configuration type' })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration rolled back successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async rollbackTaxConfig(
    @Param('configType') configType: string,
    @Param('configId', ParseCoworsIdPipe) configId: string,
    @Body() rollbackDto: TaxConfigRollbackDto,
    @Request() req: any,
  ): Promise<{ config: any; version: TaxConfigVersionInfo }> {
    return await this.dynamicTaxConfigService.rollbackConfiguration(
      configType,
      configId,
      rollbackDto.targetVersion,
      req.user.id,
      rollbackDto.reason,
    );
  }

  // Configuration Validation
  @Post('validate')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Validate tax configuration before applying' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration validation completed',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async validateTaxConfig(
    @Body() validationDto: TaxConfigValidationDto,
  ): Promise<TaxConfigValidationResult> {
    return await this.dynamicTaxConfigService.validateTaxConfiguration(
      validationDto.configType,
      validationDto.configuration,
      validationDto.region,
      validationDto.taxType,
    );
  }

  // Bulk Operations
  @Post('bulk-update')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Bulk update multiple tax configurations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk tax configuration update completed',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async bulkUpdateTaxConfigs(
    @Body() bulkUpdateDto: BulkTaxConfigUpdateDto,
    @Request() req: any,
  ): Promise<{
    successful: string[];
    failed: Array<{ configId: string; error: string }>;
  }> {
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ configId: string; error: string }>,
    };

    for (const update of bulkUpdateDto.updates) {
      try {
        const dynamicUpdate: DynamicTaxConfigUpdate = {
          configType: 'tax_rule', // Default, should be determined from config
          configId: update.configId,
          configuration: update.configuration,
          effectiveDate: update.effectiveDate,
          updatedBy: req.user.id,
          reason: bulkUpdateDto.reason,
          metadata: {
            bulkUpdate: true,
            userAgent: req.headers['user-agent'],
          },
        };

        await this.dynamicTaxConfigService.updateTaxRuleConfig(dynamicUpdate);
        results.successful.push(update.configId);
      } catch (error) {
        results.failed.push({
          configId: update.configId,
          error: error.message,
        });
      }
    }

    return results;
  }

  // Configuration Monitoring and Analytics
  @Get('stats')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get tax configuration statistics and metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration statistics retrieved successfully',
  })
  async getTaxConfigStats(): Promise<{
    totalConfigs: number;
    activeConfigs: number;
    configsByType: Record<string, number>;
    configsByRegion: Record<string, number>;
    recentUpdates: number;
    cacheStats: any;
  }> {
    const cacheStats = this.dynamicTaxConfigService.getCacheStats();

    // Get configuration counts (would need to implement in service)
    return {
      totalConfigs: 0, // Implement in service
      activeConfigs: 0, // Implement in service
      configsByType: {}, // Implement in service
      configsByRegion: {}, // Implement in service
      recentUpdates: 0, // Implement in service
      cacheStats,
    };
  }

  @Get('health')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get tax configuration system health status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Tax configuration system health status retrieved successfully',
  })
  async getTaxConfigHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    cacheStatus: string;
    lastUpdate: Date;
    errors: string[];
  }> {
    const cacheStats = this.dynamicTaxConfigService.getCacheStats();

    return {
      status: 'healthy', // Implement health checks
      cacheStatus: cacheStats.size > 0 ? 'active' : 'empty',
      lastUpdate: new Date(),
      errors: [],
    };
  }

  // Configuration Export/Import
  @Get('export')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Export all tax configurations' })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'yaml'],
    description: 'Export format',
  })
  @ApiQuery({
    name: 'includeHistory',
    required: false,
    type: Boolean,
    description: 'Include version history',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration export completed',
  })
  async exportTaxConfigs(
    @Query('format') format: 'json' | 'yaml' = 'json',
    @Query('includeHistory') includeHistory: boolean = false,
  ): Promise<{ exportData: any; exportedAt: Date; format: string }> {
    // Implementation would export all tax configurations
    return {
      exportData: {}, // Implement export logic
      exportedAt: new Date(),
      format,
    };
  }

  @Post('import')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Import tax configurations from file' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration import completed',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async importTaxConfigs(
    @Body() importData: { configurations: any[]; overwrite: boolean },
    @Request() req: any,
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    // Implementation would import tax configurations
    return {
      imported: 0,
      skipped: 0,
      errors: [],
    };
  }

  // Tax Rate Lookup and Testing
  @Post('test-calculation')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Test tax calculation with current configurations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax calculation test completed',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async testTaxCalculation(
    @Body()
    testData: {
      amount: number;
      region?: string;
      taxType?: string;
      transactionDate?: Date;
    },
  ): Promise<{
    appliedRules: any[];
    totalTax: number;
    breakdown: Array<{
      rule: string;
      rate: number;
      amount: number;
      tax: number;
    }>;
    effectiveRate: number;
  }> {
    // Implementation would test tax calculation
    return {
      appliedRules: [],
      totalTax: 0,
      breakdown: [],
      effectiveRate: 0,
    };
  }

  @Get('regions')
  @Roles('admin', 'super_admin', 'partner')
  @ApiOperation({ summary: 'Get available tax regions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available tax regions retrieved successfully',
  })
  async getAvailableRegions(): Promise<string[]> {
    // Implementation would get unique regions from tax rules
    return [];
  }

  @Get('tax-types')
  @Roles('admin', 'super_admin', 'partner')
  @ApiOperation({ summary: 'Get available tax types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available tax types retrieved successfully',
  })
  async getAvailableTaxTypes(): Promise<string[]> {
    // Implementation would get unique tax types from tax rules
    return [];
  }
}
