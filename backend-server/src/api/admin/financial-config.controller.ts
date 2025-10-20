import { Role as UserRole } from '@/api/user/user.enum';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { DynamicFinancialConfigService } from '@/common/services/dynamic-financial-config.service';
import { RealTimeConfigService } from '@/common/services/real-time-config.service';
import {
  ConfigurationScope,
  ConfigurationType,
  ConfigurationValue,
  ConfigurationVersion,
} from '@/common/types/financial-configuration.types';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

export class UpdateConfigurationDto {
  configuration: Record<string, ConfigurationValue>;
  reason?: string;
  notifySubscribers?: boolean = true;
}

export class CreateConfigurationDto {
  type: ConfigurationType;
  scope: ConfigurationScope;
  scopeId?: string;
  configuration: Record<string, ConfigurationValue>;
  description?: string;
  notifySubscribers?: boolean = true;
}

export class RollbackConfigurationDto {
  targetVersion: number;
  reason?: string;
  notifySubscribers?: boolean = true;
}

export class ConfigurationResponseDto {
  type: ConfigurationType;
  scope: ConfigurationScope;
  scopeId?: string;
  configuration: any;
  version?: number;
  lastUpdated?: Date;
  updatedBy?: string;
}

export class ConfigurationVersionResponseDto {
  id: string;
  configId: string;
  version: number;
  configuration: Record<string, ConfigurationValue>;
  createdBy: string;
  createdAt: Date;
  description?: string;
  isActive: boolean;
}

export class EffectiveConfigurationDto {
  type: ConfigurationType;
  partnerId?: string;
  region?: string;
  category?: string;
}

export class SubscribeToUpdatesDto {
  configTypes?: ConfigurationType[];
  scopes?: ConfigurationScope[];
}

export class ConfigurationStatsDto {
  totalConfigurations: number;
  totalVersions: number;
  totalSubscribers: number;
  recentChanges: number;
  cacheHitRate: number;
  averageResponseTime: number;
}

export class ConfigurationHealthDto {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  lastHealthCheck: Date;
}

@ApiTags('Admin - Financial Configuration')
@Controller({ path: 'admin/financial-config', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin)
@ApiBearerAuth()
export class FinancialConfigController {
  constructor(
    private readonly configService: DynamicFinancialConfigService,
    private readonly realTimeConfigService: RealTimeConfigService,
  ) {}

  @Get(':type')
  @ApiOperation({ summary: 'Get financial configuration' })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully',
  })
  async getConfiguration(
    @Param('type') type: ConfigurationType,
    @Query('scope') scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    @Query('scopeId') scopeId?: string,
  ): Promise<ConfigurationResponseDto> {
    const configuration = await this.configService.getConfiguration(
      type,
      scope,
      scopeId,
    );

    return {
      type,
      scope,
      scopeId,
      configuration,
    };
  }

  @Get(':type/effective')
  @ApiOperation({
    summary: 'Get effective financial configuration with inheritance',
  })
  @ApiResponse({
    status: 200,
    description: 'Effective configuration retrieved successfully',
  })
  async getEffectiveConfiguration(
    @Param('type') type: ConfigurationType,
    @Query('partnerId') partnerId?: string,
    @Query('region') region?: string,
    @Query('category') category?: string,
  ): Promise<ConfigurationResponseDto> {
    // Implementation would determine effective configuration based on hierarchy
    const configuration = await this.configService.getConfiguration(
      type,
      ConfigurationScope.GLOBAL,
    );

    return {
      type,
      scope: ConfigurationScope.GLOBAL,
      configuration,
    };
  }

  @Put(':type')
  @ApiOperation({ summary: 'Update financial configuration' })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
  })
  async updateConfiguration(
    @Param('type') type: ConfigurationType,
    @Body() updateDto: UpdateConfigurationDto,
    @Query('scope') scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    @Query('scopeId') scopeId?: string,
    @Request() req?: any,
  ): Promise<ConfigurationVersionResponseDto> {
    const userId = req.user?.id;

    const version = await this.configService.updateConfiguration(
      type,
      updateDto.configuration,
      scope,
      scopeId,
      userId,
      updateDto.reason,
    );

    return this.mapVersionToResponse(version);
  }

  @Post()
  @ApiOperation({ summary: 'Create new financial configuration' })
  @ApiResponse({
    status: 201,
    description: 'Configuration created successfully',
  })
  async createConfiguration(
    @Body() createDto: CreateConfigurationDto,
    @Request() req?: any,
  ): Promise<ConfigurationVersionResponseDto> {
    const userId = req.user?.id;

    const version = await this.configService.updateConfiguration(
      createDto.type,
      createDto.configuration,
      createDto.scope,
      createDto.scopeId,
      userId,
      createDto.description,
    );

    return this.mapVersionToResponse(version);
  }

  @Get(':type/versions')
  @ApiOperation({ summary: 'Get configuration version history' })
  @ApiResponse({
    status: 200,
    description: 'Version history retrieved successfully',
  })
  async getConfigurationVersions(
    @Param('type') type: ConfigurationType,
    @Query('scope') scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    @Query('scopeId') scopeId?: string,
  ): Promise<ConfigurationVersionResponseDto[]> {
    const versions = await this.configService.getConfigurationVersions(
      type,
      scope,
      scopeId,
    );
    return versions.map((version) => this.mapVersionToResponse(version));
  }

  @Post(':type/rollback')
  @ApiOperation({ summary: 'Rollback configuration to previous version' })
  @ApiResponse({
    status: 200,
    description: 'Configuration rolled back successfully',
  })
  async rollbackConfiguration(
    @Param('type') type: ConfigurationType,
    @Body() rollbackDto: RollbackConfigurationDto,
    @Query('scope') scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    @Query('scopeId') scopeId?: string,
    @Request() req?: any,
  ): Promise<ConfigurationVersionResponseDto> {
    const userId = req.user?.id;
    const version = await this.configService.rollbackConfiguration(
      type,
      rollbackDto.targetVersion,
      scope,
      scopeId,
      userId,
      rollbackDto.reason,
    );
    return this.mapVersionToResponse(version);
  }

  // Real-time configuration management endpoints

  @Post('realtime/subscribe')
  @ApiOperation({
    summary: 'Subscribe admin to real-time configuration updates',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully subscribed to configuration updates',
  })
  async subscribeToRealTimeUpdates(
    @Body() subscribeDto: SubscribeToUpdatesDto,
    @Request() req?: any,
  ): Promise<{ message: string; subscriptionId: string }> {
    const userId = req.user?.id;

    await this.realTimeConfigService.subscribeAdminToAllUpdates(userId);

    return {
      message: 'Successfully subscribed to real-time configuration updates',
      subscriptionId: userId,
    };
  }

  @Delete('realtime/subscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unsubscribe from real-time configuration updates' })
  @ApiResponse({
    status: 204,
    description: 'Successfully unsubscribed from configuration updates',
  })
  async unsubscribeFromRealTimeUpdates(@Request() req?: any): Promise<void> {
    const userId = req.user?.id;
    this.realTimeConfigService.unsubscribeFromConfigUpdates(userId);
  }

  @Get('realtime/stats')
  @ApiOperation({
    summary: 'Get real-time configuration subscription statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription statistics retrieved successfully',
  })
  async getRealTimeStats(): Promise<any> {
    return this.realTimeConfigService.getSubscriptionStats();
  }

  @Post('realtime/refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Force refresh configuration for all subscribers' })
  @ApiResponse({
    status: 204,
    description: 'Configuration refreshed for all subscribers',
  })
  async forceRefreshConfiguration(): Promise<void> {
    await this.realTimeConfigService.forceRefreshConfiguration();
  }

  // Enhanced admin features

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get comprehensive configuration statistics' })
  @ApiResponse({
    status: 200,
    description: 'Configuration statistics retrieved successfully',
    type: ConfigurationStatsDto,
  })
  async getConfigurationStats(): Promise<ConfigurationStatsDto> {
    const cacheStats = this.configService.getCacheStats();
    const realtimeStats = this.realTimeConfigService.getSubscriptionStats();

    return {
      totalConfigurations: cacheStats.totalConfigurations || 0,
      totalVersions: cacheStats.totalVersions || 0,
      totalSubscribers: realtimeStats.totalSubscriptions || 0,
      recentChanges: 0, // Not available in cache stats
      cacheHitRate: 0, // Not available in cache stats
      averageResponseTime: 0, // Not available in cache stats
    };
  }

  @Get('health/check')
  @ApiOperation({ summary: 'Perform configuration system health check' })
  @ApiResponse({
    status: 200,
    description: 'Health check completed successfully',
    type: ConfigurationHealthDto,
  })
  async performHealthCheck(): Promise<ConfigurationHealthDto> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check configuration service health
      const cacheStats = this.configService.getCacheStats();

      // Basic health checks based on available cache stats
      if (cacheStats.totalConfigurations === 0) {
        issues.push('No configurations found in cache');
        recommendations.push('Consider loading default configurations');
      }

      // Check real-time service health
      const realtimeStats = this.realTimeConfigService.getSubscriptionStats();

      if (realtimeStats.totalSubscriptions > 1000) {
        issues.push('High number of real-time subscriptions');
        recommendations.push(
          'Consider implementing subscription limits or batching',
        );
      }

      const status =
        issues.length === 0
          ? 'healthy'
          : issues.length <= 2
            ? 'warning'
            : 'critical';

      return {
        status,
        issues,
        recommendations,
        lastHealthCheck: new Date(),
      };
    } catch (error) {
      return {
        status: 'critical',
        issues: [`Health check failed: ${error.message}`],
        recommendations: ['Check system logs and database connectivity'],
        lastHealthCheck: new Date(),
      };
    }
  }

  @Get('types/all')
  @ApiOperation({ summary: 'Get all configuration types' })
  @ApiResponse({
    status: 200,
    description: 'Configuration types retrieved successfully',
  })
  async getAllConfigurationTypes(): Promise<{
    types: ConfigurationType[];
    scopes: ConfigurationScope[];
  }> {
    return {
      types: Object.values(ConfigurationType),
      scopes: Object.values(ConfigurationScope),
    };
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Get configuration cache statistics' })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics retrieved successfully',
  })
  async getCacheStats(): Promise<{
    totalConfigurations: number;
    totalVersions: number;
    totalSubscribers: number;
    cacheKeys: string[];
  }> {
    return this.configService.getCacheStats();
  }

  @Delete('cache')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear configuration cache' })
  @ApiResponse({ status: 204, description: 'Cache cleared successfully' })
  async clearCache(@Query('type') type?: ConfigurationType): Promise<void> {
    await this.configService.clearCache(type);
  }

  @Post('cache/refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Refresh configuration cache' })
  @ApiResponse({ status: 204, description: 'Cache refreshed successfully' })
  async refreshCache(): Promise<void> {
    await this.configService.refreshConfigurationCache();
  }

  @Get('defaults/:type')
  @ApiOperation({ summary: 'Get default configuration for a type' })
  @ApiResponse({
    status: 200,
    description: 'Default configuration retrieved successfully',
  })
  async getDefaultConfiguration(
    @Param('type') type: ConfigurationType,
  ): Promise<ConfigurationResponseDto> {
    // Get configuration will return default if none exists in database
    const defaultConfig = await this.configService.getConfiguration(
      type,
      ConfigurationScope.GLOBAL,
    );

    return {
      type,
      scope: ConfigurationScope.GLOBAL,
      configuration: defaultConfig,
    };
  }

  @Get('validation/schema/:type')
  @ApiOperation({ summary: 'Get validation schema for configuration type' })
  @ApiResponse({
    status: 200,
    description: 'Validation schema retrieved successfully',
  })
  async getValidationSchema(
    @Param('type') type: ConfigurationType,
  ): Promise<{ schema: Record<string, any> }> {
    const schema = await this.configService.getValidationSchema(type);
    return { schema };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate configuration without saving' })
  @ApiResponse({ status: 200, description: 'Configuration validation result' })
  async validateConfiguration(
    @Body()
    validateDto: {
      type: ConfigurationType;
      configuration: Record<string, ConfigurationValue>;
    },
  ): Promise<{
    isValid: boolean;
    errors?: string[];
  }> {
    return await this.configService.validateConfigurationOnly(
      validateDto.type,
      validateDto.configuration,
    );
  }

  @Get('bulk/export')
  @ApiOperation({ summary: 'Export all configurations' })
  @ApiResponse({
    status: 200,
    description: 'Configurations exported successfully',
  })
  async exportConfigurations(
    @Query('types') types?: string,
    @Query('scopes') scopes?: string,
  ): Promise<{
    configurations: ConfigurationResponseDto[];
    exportedAt: Date;
    totalCount: number;
  }> {
    const typeList = types
      ? (types.split(',') as ConfigurationType[])
      : Object.values(ConfigurationType);
    const scopeList = scopes
      ? (scopes.split(',') as ConfigurationScope[])
      : Object.values(ConfigurationScope);

    const configurations: ConfigurationResponseDto[] = [];

    for (const type of typeList) {
      for (const scope of scopeList) {
        try {
          const config = await this.configService.getConfiguration(type, scope);
          configurations.push({
            type,
            scope,
            configuration: config,
          });
        } catch (error) {
          // Skip configurations that don't exist
        }
      }
    }

    return {
      configurations,
      exportedAt: new Date(),
      totalCount: configurations.length,
    };
  }

  @Post('bulk/import')
  @ApiOperation({ summary: 'Import configurations in bulk' })
  @ApiResponse({
    status: 200,
    description: 'Configurations imported successfully',
  })
  async importConfigurations(
    @Body()
    importDto: {
      configurations: Array<{
        type: ConfigurationType;
        scope: ConfigurationScope;
        scopeId?: string;
        configuration: Record<string, ConfigurationValue>;
        description?: string;
      }>;
      overwriteExisting?: boolean;
    },
    @Request() req?: any,
  ): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    const userId = req.user?.id;
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const configData of importDto.configurations) {
      try {
        await this.configService.updateConfiguration(
          configData.type,
          configData.configuration,
          configData.scope,
          configData.scopeId,
          userId,
          configData.description || 'Bulk import',
        );
        imported++;
      } catch (error) {
        failed++;
        errors.push(
          `Failed to import ${configData.type}:${configData.scope}: ${error.message}`,
        );
      }
    }

    return {
      imported,
      failed,
      errors,
    };
  }

  @Get('audit/changes')
  @ApiOperation({ summary: 'Get configuration change audit trail' })
  @ApiResponse({
    status: 200,
    description: 'Audit trail retrieved successfully',
  })
  async getConfigurationAuditTrail(
    @Query('type') type?: ConfigurationType,
    @Query('scope') scope?: ConfigurationScope,
    @Query('scopeId') scopeId?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit: number = 100,
  ): Promise<{
    changes: any[];
    totalCount: number;
  }> {
    const auditResult = await this.configService.getConfigurationAuditTrail(
      {
        type,
        scope,
        scopeId,
        userId,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      },
      limit,
    );

    return {
      changes: auditResult.changes,
      totalCount: auditResult.totalCount,
    };
  }

  private mapVersionToResponse(
    version: ConfigurationVersion,
  ): ConfigurationVersionResponseDto {
    return {
      id: version.id,
      configId: version.configId,
      version: version.version,
      configuration: version.configuration,
      createdBy: version.createdBy,
      createdAt: version.createdAt,
      description: version.description,
      isActive: version.isActive,
    };
  }
}
