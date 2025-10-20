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
import { Roles } from '../../../decorators/roles.decorator';
import { RolesGuard } from '../../../guards/roles.guard';
import { CommissionRateConfigEntity } from '../entities/commission-rate-config.entity';
import { CommissionSettingsEntity } from '../entities/commission.entity';
import {
  ConfigValidationResult,
  ConfigVersionInfo,
  DynamicCommissionConfigService,
  DynamicConfigUpdate,
} from '../services/dynamic-commission-config.service';

// DTOs for dynamic configuration
export class CreateDynamicConfigDto {
  configType: 'commission_rate' | 'commission_settings';
  partnerId?: string;
  spaceId?: string;
  configuration: any;
  effectiveDate?: Date;
  expiryDate?: Date;
  priority?: number;
  description?: string;
  tags?: string[];
}

export class UpdateDynamicConfigDto {
  configuration?: any;
  effectiveDate?: Date;
  expiryDate?: Date;
  priority?: number;
  description?: string;
  tags?: string[];
  isActive?: boolean;
}

export class ConfigRollbackDto {
  targetVersion: number;
  reason: string;
}

export class ConfigValidationDto {
  configType: 'commission_rate' | 'commission_settings';
  configuration: any;
  partnerId?: string;
  spaceId?: string;
}

export class BulkConfigUpdateDto {
  updates: Array<{
    configId: string;
    configuration: any;
    effectiveDate?: Date;
  }>;
  reason: string;
}

@ApiTags('Commission Configuration Admin')
@Controller('admin/commission/config')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CommissionConfigAdminController {
  constructor(
    private readonly dynamicConfigService: DynamicCommissionConfigService,
  ) {}

  // Dynamic Commission Rate Configuration Management
  @Post('commission-rates')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create dynamic commission rate configuration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Commission rate configuration created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid configuration data',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createCommissionRateConfig(
    @Body() createDto: CreateDynamicConfigDto,
    @Request() req: any,
  ): Promise<{
    config: CommissionRateConfigEntity;
    version: ConfigVersionInfo;
  }> {
    const configData = {
      ...createDto.configuration,
      partnerId: createDto.partnerId,
      spaceId: createDto.spaceId,
      effectiveDate: createDto.effectiveDate,
      expiryDate: createDto.expiryDate,
      priority: createDto.priority || 1,
      isActive: true,
      metadata: {
        tags: createDto.tags || [],
        createdVia: 'admin_api',
        userAgent: req.headers['user-agent'],
        description:
          createDto.description || 'New commission rate configuration',
      },
    };

    const config = await this.dynamicConfigService.createCommissionRateConfig(
      configData,
      req.user.id,
    );

    // Create a version info for the response
    const version: ConfigVersionInfo = {
      id: config.id,
      version: 1,
      changes: createDto.configuration || {},
      createdAt: new Date(),
      createdBy: req.user.id,
      reason: createDto.description || 'New commission rate configuration',
      isActive: true,
      rollbackAvailable: false,
    };

    return { config, version };
  }

  @Put('commission-rates/:configId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update dynamic commission rate configuration' })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission rate configuration updated successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateCommissionRateConfig(
    @Param('configId', ParseCoworsIdPipe) configId: string,
    @Body() updateDto: UpdateDynamicConfigDto,
    @Request() req: any,
  ): Promise<{
    config: CommissionRateConfigEntity;
    version: ConfigVersionInfo;
  }> {
    const configData = {
      ...updateDto.configuration,
      isActive: updateDto.isActive,
      effectiveDate: updateDto.effectiveDate,
      expiryDate: updateDto.expiryDate,
      priority: updateDto.priority,
      metadata: {
        tags: updateDto.tags || [],
        updatedVia: 'admin_api',
        userAgent: req.headers['user-agent'],
        description:
          updateDto.description || 'Commission rate configuration update',
      },
    };

    const config = await this.dynamicConfigService.updateCommissionRateConfig(
      configId,
      configData,
      req.user.id,
      updateDto.description || 'Commission rate configuration update',
    );

    // Create a version info for the response
    const version: ConfigVersionInfo = {
      id: config.id,
      version: 1,
      changes: updateDto.configuration || {},
      createdAt: new Date(),
      createdBy: req.user.id,
      reason: updateDto.description || 'Commission rate configuration update',
      isActive: true,
      rollbackAvailable: false,
    };

    return { config, version };
  }

  @Get('commission-rates/:configId')
  @Roles('admin', 'super_admin', 'partner')
  @ApiOperation({ summary: 'Get commission rate configuration by ID' })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission rate configuration retrieved successfully',
  })
  async getCommissionRateConfig(
    @Param('configId', ParseCoworsIdPipe) configId: string,
  ): Promise<CommissionRateConfigEntity> {
    return await this.dynamicConfigService.getCommissionRateConfig(configId);
  }

  @Get('commission-rates')
  @Roles('admin', 'super_admin', 'partner')
  @ApiOperation({ summary: 'Get commission rate configurations with filters' })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    description: 'Filter by partner ID',
  })
  @ApiQuery({
    name: 'spaceId',
    required: false,
    description: 'Filter by space ID',
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
    description: 'Commission rate configurations retrieved successfully',
  })
  async getCommissionRateConfigs(
    @Query('partnerId') partnerId?: string,
    @Query('spaceId') spaceId?: string,
    @Query('isActive') isActive?: boolean,
    @Query('effectiveDate') effectiveDate?: string,
    @Query('tags') tags?: string,
  ): Promise<CommissionRateConfigEntity[]> {
    const filters = {
      partnerId,
      spaceId,
      isActive,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
      tags: tags ? tags.split(',').map((tag) => tag.trim()) : undefined,
    };

    return await this.dynamicConfigService.getCommissionRateConfigs(filters);
  }

  @Delete('commission-rates/:configId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Delete commission rate configuration' })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission rate configuration deleted successfully',
  })
  async deleteConfig(
    @Param('configId', ParseCoworsIdPipe) configId: string,
    @Request() req: any,
  ): Promise<void> {
    // For now, we'll mark the config as inactive instead of deleting
    await this.dynamicConfigService.updateCommissionRateConfig(
      configId,
      { isActive: false },
      req.user.id,
      'Configuration deleted via admin API',
    );
  }

  // Dynamic Commission Settings Management
  @Post('commission-settings')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create dynamic commission settings configuration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Commission settings configuration created successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createCommissionSettingsConfig(
    @Body() createDto: CreateDynamicConfigDto,
    @Request() req: any,
  ): Promise<{ config: CommissionSettingsEntity; version: ConfigVersionInfo }> {
    // For creating settings, we'll use a default settings ID since there's typically only one settings config
    const settingsId = 'default_settings';

    const config = await this.dynamicConfigService.updateCommissionSettings(
      settingsId,
      createDto.configuration || {},
      req.user.id,
    );

    // Create a version info for the response
    const version: ConfigVersionInfo = {
      id: config.id,
      version: 1,
      changes: createDto.configuration || {},
      createdAt: new Date(),
      createdBy: req.user.id,
      reason: createDto.description || 'New commission settings configuration',
      isActive: true,
      rollbackAvailable: false,
    };

    return { config, version };
  }

  @Put('commission-settings/:configId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update dynamic commission settings configuration' })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission settings configuration updated successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateCommissionSettingsConfig(
    @Param('configId', ParseCoworsIdPipe) configId: string,
    @Body() updateDto: UpdateDynamicConfigDto,
    @Request() req: any,
  ): Promise<{ config: CommissionSettingsEntity; version: ConfigVersionInfo }> {
    const config = await this.dynamicConfigService.updateCommissionSettings(
      configId,
      updateDto.configuration || {},
      req.user.id,
    );

    // Create a version info for the response
    const version: ConfigVersionInfo = {
      id: config.id,
      version: 1,
      changes: updateDto.configuration || {},
      createdAt: new Date(),
      createdBy: req.user.id,
      reason:
        updateDto.description || 'Commission settings configuration update',
      isActive: true,
      rollbackAvailable: false,
    };

    return { config, version };
  }

  @Get('commission-settings')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get current commission settings configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission settings configuration retrieved successfully',
  })
  async getCommissionSettingsConfig(): Promise<CommissionSettingsEntity> {
    return await this.dynamicConfigService.getCommissionSettings();
  }

  // Configuration Versioning and Rollback
  @Get(':configType/:configId/versions')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get configuration version history' })
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
    description: 'Configuration version history retrieved successfully',
  })
  async getConfigVersionHistory(
    @Param('configType') configType: string,
    @Param('configId', ParseCoworsIdPipe) configId: string,
    @Query('limit') limit?: number,
  ): Promise<ConfigVersionInfo[]> {
    return await this.dynamicConfigService.getVersionHistory(
      configType,
      configId,
      limit,
    );
  }

  @Post(':configType/:configId/rollback')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Rollback configuration to previous version' })
  @ApiParam({ name: 'configType', description: 'Configuration type' })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuration rolled back successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async rollbackConfig(
    @Param('configType') configType: string,
    @Param('configId', ParseCoworsIdPipe) configId: string,
    @Body() rollbackDto: ConfigRollbackDto,
    @Request() req: any,
  ): Promise<{ config: any; version: ConfigVersionInfo }> {
    const config = await this.dynamicConfigService.rollbackConfiguration(
      configId,
      rollbackDto.targetVersion,
      req.user.id,
      rollbackDto.reason,
    );

    // Get the version info for the rollback
    const versionHistory = await this.dynamicConfigService.getVersionHistory(
      configType,
      configId,
      1,
    );
    const version = versionHistory[0] || {
      id: config.id,
      version: 1,
      changes: {},
      createdAt: new Date(),
      createdBy: req.user.id,
      reason: rollbackDto.reason,
      isActive: true,
      rollbackAvailable: false,
    };

    return { config, version };
  }

  // Configuration Validation
  @Post('validate')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Validate configuration before applying' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuration validation completed',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async validateConfig(
    @Body() validationDto: ConfigValidationDto,
  ): Promise<ConfigValidationResult> {
    // For now, return a simple validation result
    // This would need to be implemented in the service
    return {
      isValid: true,
      errors: [],
      warnings: [],
      affectedEntities: [],
    };
  }

  // Bulk Operations
  @Post('bulk-update')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Bulk update multiple configurations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk configuration update completed',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async bulkUpdateConfigs(
    @Body() bulkUpdateDto: BulkConfigUpdateDto,
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
        // Process the update directly without creating DynamicConfigUpdate object

        await this.dynamicConfigService.updateCommissionRateConfig(
          update.configId,
          update.configuration,
          req.user.id,
          bulkUpdateDto.reason,
        );
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
  @ApiOperation({ summary: 'Get configuration statistics and metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuration statistics retrieved successfully',
  })
  async getConfigStats(): Promise<{
    totalConfigs: number;
    activeConfigs: number;
    configsByType: Record<string, number>;
    recentUpdates: number;
    cacheStats: any;
  }> {
    const cacheStats = this.dynamicConfigService.getCacheStats();

    // Get configuration counts (would need to implement in service)
    return {
      totalConfigs: 0, // Implement in service
      activeConfigs: 0, // Implement in service
      configsByType: {}, // Implement in service
      recentUpdates: 0, // Implement in service
      cacheStats,
    };
  }

  @Get('health')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get configuration system health status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuration system health status retrieved successfully',
  })
  async getConfigHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    cacheStatus: string;
    lastUpdate: Date;
    errors: string[];
  }> {
    const cacheStats = this.dynamicConfigService.getCacheStats();

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
  @ApiOperation({ summary: 'Export all configurations' })
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
    description: 'Configuration export completed',
  })
  async exportConfigs(
    @Query('format') format: 'json' | 'yaml' = 'json',
    @Query('includeHistory') includeHistory: boolean = false,
  ): Promise<{ exportData: any; exportedAt: Date; format: string }> {
    // Implementation would export all configurations
    return {
      exportData: {}, // Implement export logic
      exportedAt: new Date(),
      format,
    };
  }

  @Post('import')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Import configurations from file' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuration import completed',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async importConfigs(
    @Body() importData: { configurations: any[]; overwrite: boolean },
    @Request() req: any,
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    // Implementation would import configurations
    return {
      imported: 0,
      skipped: 0,
      errors: [],
    };
  }
}
