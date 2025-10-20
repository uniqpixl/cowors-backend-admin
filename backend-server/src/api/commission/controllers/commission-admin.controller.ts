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
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { UserEntity } from '../../../auth/entities/user.entity';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { EnhancedCommissionService } from '../../../common/services/enhanced-commission.service';
import { FinancialConfigIntegrationService } from '../../../common/services/financial-config-integration.service';
import { ConfigurationScope } from '../../../common/types/financial-configuration.types';
import { GetUser } from '../../../decorators/auth/get-user.decorator';
import { Roles } from '../../../decorators/roles.decorator';
import { RolesGuard } from '../../../guards/roles.guard';

// DTOs for admin configuration management
export class PerformanceMultipliersDto {
  @ApiPropertyOptional({ description: 'Bronze tier multiplier' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  bronze?: number;

  @ApiPropertyOptional({ description: 'Silver tier multiplier' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  silver?: number;

  @ApiPropertyOptional({ description: 'Gold tier multiplier' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  gold?: number;

  @ApiPropertyOptional({ description: 'Platinum tier multiplier' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  platinum?: number;
}

export class CategoryOverrideDto {
  @ApiProperty({ description: 'Category name' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Commission percentage for this category' })
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercentage: number;

  @ApiPropertyOptional({ description: 'Minimum commission for this category' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumCommission?: number;

  @ApiPropertyOptional({ description: 'Maximum commission for this category' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumCommission?: number;
}

export class PartnerTierDto {
  @ApiProperty({ description: 'Partner ID' })
  @IsUUID()
  partnerId: string;

  @ApiProperty({ description: 'Partner tier' })
  @IsString()
  tier: string;

  @ApiProperty({ description: 'Tier multiplier' })
  @IsNumber()
  @Min(0)
  @Max(10)
  multiplier: number;

  @ApiPropertyOptional({ description: 'Custom rates for specific categories' })
  @IsOptional()
  @IsObject()
  customRates?: Record<string, number>;
}

export class AdminCommissionSettingsDto {
  @ApiProperty({ description: 'Default commission percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultCommissionPercentage: number;

  @ApiProperty({ description: 'Minimum commission amount' })
  @IsNumber()
  @Min(0)
  minimumCommission: number;

  @ApiProperty({ description: 'Maximum commission amount' })
  @IsNumber()
  @Min(0)
  maximumCommission: number;

  @ApiProperty({ description: 'Payment term days' })
  @IsNumber()
  @Min(1)
  @Max(365)
  paymentTermDays: number;

  @ApiProperty({ description: 'Enable automatic payments' })
  @IsBoolean()
  autoPayment: boolean;

  @ApiProperty({ description: 'Holdback percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  holdbackPercentage: number;

  @ApiProperty({ description: 'Performance multipliers' })
  @ValidateNested()
  @Type(() => PerformanceMultipliersDto)
  performanceMultipliers: PerformanceMultipliersDto;

  @ApiPropertyOptional({ description: 'Category-specific overrides' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryOverrideDto)
  categoryOverrides?: CategoryOverrideDto[];

  @ApiPropertyOptional({ description: 'Partner tier configurations' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartnerTierDto)
  partnerTiers?: PartnerTierDto[];

  @ApiPropertyOptional({ description: 'Reason for configuration change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ConfigurationHistoryDto {
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

export class RollbackRequestDto {
  @ApiProperty({ description: 'Target version to rollback to' })
  @IsNumber()
  @Min(1)
  targetVersion: number;

  @ApiProperty({ description: 'Reason for rollback' })
  @IsString()
  reason: string;
}

export class BulkConfigurationUpdateDto {
  @ApiProperty({ description: 'Global commission settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminCommissionSettingsDto)
  globalSettings?: AdminCommissionSettingsDto;

  @ApiPropertyOptional({ description: 'Partner-specific settings' })
  @IsOptional()
  @IsArray()
  partnerSettings?: Array<{
    partnerId: string;
    settings: AdminCommissionSettingsDto;
  }>;

  @ApiPropertyOptional({ description: 'Category-specific settings' })
  @IsOptional()
  @IsArray()
  categorySettings?: Array<{
    category: string;
    settings: AdminCommissionSettingsDto;
  }>;

  @ApiProperty({ description: 'Reason for bulk update' })
  @IsString()
  reason: string;
}

@ApiTags('Commission Admin')
@Controller('admin/commission')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CommissionAdminController {
  constructor(
    private readonly enhancedCommissionService: EnhancedCommissionService,
    private readonly configIntegrationService: FinancialConfigIntegrationService,
  ) {}

  @Get('settings/global')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get global commission settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Global commission settings retrieved successfully',
    type: AdminCommissionSettingsDto,
  })
  async getGlobalSettings(): Promise<AdminCommissionSettingsDto> {
    const settings =
      await this.enhancedCommissionService.getCommissionSettings();
    return this.mapToAdminDto(settings);
  }

  @Put('settings/global')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update global commission settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Global commission settings updated successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateGlobalSettings(
    @Body() settingsDto: AdminCommissionSettingsDto,
    @GetUser() user: UserEntity,
  ): Promise<{ success: boolean; version: number }> {
    const enhancedSettings = this.mapFromAdminDto(settingsDto);

    await this.enhancedCommissionService.updateCommissionSettings(
      enhancedSettings,
      ConfigurationScope.GLOBAL,
      undefined,
      user.id,
      settingsDto.reason,
    );

    return { success: true, version: 1 }; // Version will be returned from the service
  }

  @Get('settings/partner/:partnerId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get partner-specific commission settings' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner commission settings retrieved successfully',
    type: AdminCommissionSettingsDto,
  })
  async getPartnerSettings(
    @Param('partnerId') partnerId: string,
  ): Promise<AdminCommissionSettingsDto> {
    const settings =
      await this.enhancedCommissionService.getCommissionSettings(partnerId);
    return this.mapToAdminDto(settings);
  }

  @Put('settings/partner/:partnerId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update partner-specific commission settings' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner commission settings updated successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updatePartnerSettings(
    @Param('partnerId') partnerId: string,
    @Body() settingsDto: AdminCommissionSettingsDto,
    @GetUser() user: UserEntity,
  ): Promise<{ success: boolean; version: number }> {
    const enhancedSettings = this.mapFromAdminDto(settingsDto);

    await this.enhancedCommissionService.updateCommissionSettings(
      enhancedSettings,
      ConfigurationScope.PARTNER,
      partnerId,
      user.id,
      settingsDto.reason,
    );

    return { success: true, version: 1 };
  }

  @Get('settings/category/:category')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get category-specific commission settings' })
  @ApiParam({ name: 'category', description: 'Category name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category commission settings retrieved successfully',
    type: AdminCommissionSettingsDto,
  })
  async getCategorySettings(
    @Param('category') category: string,
  ): Promise<AdminCommissionSettingsDto> {
    const settings = await this.enhancedCommissionService.getCommissionSettings(
      undefined,
      category,
    );
    return this.mapToAdminDto(settings);
  }

  @Put('settings/category/:category')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update category-specific commission settings' })
  @ApiParam({ name: 'category', description: 'Category name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category commission settings updated successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateCategorySettings(
    @Param('category') category: string,
    @Body() settingsDto: AdminCommissionSettingsDto,
    @GetUser() user: UserEntity,
  ): Promise<{ success: boolean; version: number }> {
    const enhancedSettings = this.mapFromAdminDto(settingsDto);

    await this.enhancedCommissionService.updateCommissionSettings(
      enhancedSettings,
      ConfigurationScope.CATEGORY,
      category,
      user.id,
      settingsDto.reason,
    );

    return { success: true, version: 1 };
  }

  @Get('history/global')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get global commission settings history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission settings history retrieved successfully',
    type: [ConfigurationHistoryDto],
  })
  async getGlobalHistory(): Promise<ConfigurationHistoryDto[]> {
    const history = await this.enhancedCommissionService.getCommissionHistory();
    return history.map((item) => ({
      version: item.version,
      configuration: item.configuration,
      timestamp: item.timestamp,
      updatedBy: item.updatedBy,
      reason: item.reason,
      isActive: item.isActive,
    }));
  }

  @Get('history/partner/:partnerId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get partner commission settings history' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner commission settings history retrieved successfully',
    type: [ConfigurationHistoryDto],
  })
  async getPartnerHistory(
    @Param('partnerId') partnerId: string,
  ): Promise<ConfigurationHistoryDto[]> {
    const history = await this.enhancedCommissionService.getCommissionHistory(
      ConfigurationScope.PARTNER,
      partnerId,
    );
    return history.map((item) => ({
      version: item.version,
      configuration: item.configuration,
      timestamp: item.timestamp,
      updatedBy: item.updatedBy,
      reason: item.reason,
      isActive: item.isActive,
    }));
  }

  @Post('rollback/global')
  @Roles('admin', 'super_admin')
  @ApiOperation({
    summary: 'Rollback global commission settings to a previous version',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission settings rolled back successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async rollbackGlobalSettings(
    @Body() rollbackDto: RollbackRequestDto,
    @GetUser() user: UserEntity,
  ): Promise<{ success: boolean; rolledBackToVersion: number }> {
    await this.enhancedCommissionService.rollbackCommissionSettings(
      rollbackDto.targetVersion,
      ConfigurationScope.GLOBAL,
      undefined,
      user.id,
      rollbackDto.reason,
    );

    return { success: true, rolledBackToVersion: rollbackDto.targetVersion };
  }

  @Post('rollback/partner/:partnerId')
  @Roles('admin', 'super_admin')
  @ApiOperation({
    summary: 'Rollback partner commission settings to a previous version',
  })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner commission settings rolled back successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async rollbackPartnerSettings(
    @Param('partnerId') partnerId: string,
    @Body() rollbackDto: RollbackRequestDto,
    @GetUser() user: UserEntity,
  ): Promise<{ success: boolean; rolledBackToVersion: number }> {
    await this.enhancedCommissionService.rollbackCommissionSettings(
      rollbackDto.targetVersion,
      ConfigurationScope.PARTNER,
      partnerId,
      user.id,
      rollbackDto.reason,
    );

    return { success: true, rolledBackToVersion: rollbackDto.targetVersion };
  }

  @Post('bulk-update')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Perform bulk commission settings update' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk commission settings update completed successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async bulkUpdateSettings(
    @Body() bulkUpdateDto: BulkConfigurationUpdateDto,
    @GetUser() user: UserEntity,
  ): Promise<{ success: boolean; updatedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let updatedCount = 0;

    try {
      // Update global settings if provided
      if (bulkUpdateDto.globalSettings) {
        const enhancedSettings = this.mapFromAdminDto(
          bulkUpdateDto.globalSettings,
        );
        await this.enhancedCommissionService.updateCommissionSettings(
          enhancedSettings,
          ConfigurationScope.GLOBAL,
          undefined,
          user.id,
          bulkUpdateDto.reason,
        );
        updatedCount++;
      }

      // Update partner settings if provided
      if (bulkUpdateDto.partnerSettings) {
        for (const partnerSetting of bulkUpdateDto.partnerSettings) {
          try {
            const enhancedSettings = this.mapFromAdminDto(
              partnerSetting.settings,
            );
            await this.enhancedCommissionService.updateCommissionSettings(
              enhancedSettings,
              ConfigurationScope.PARTNER,
              partnerSetting.partnerId,
              user.id,
              bulkUpdateDto.reason,
            );
            updatedCount++;
          } catch (error) {
            errors.push(
              `Failed to update partner ${partnerSetting.partnerId}: ${error.message}`,
            );
          }
        }
      }

      // Update category settings if provided
      if (bulkUpdateDto.categorySettings) {
        for (const categorySetting of bulkUpdateDto.categorySettings) {
          try {
            const enhancedSettings = this.mapFromAdminDto(
              categorySetting.settings,
            );
            await this.enhancedCommissionService.updateCommissionSettings(
              enhancedSettings,
              ConfigurationScope.CATEGORY,
              categorySetting.category,
              user.id,
              bulkUpdateDto.reason,
            );
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

  @Get('statistics')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get commission configuration statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission configuration statistics retrieved successfully',
  })
  async getStatistics(): Promise<any> {
    return await this.enhancedCommissionService.getCommissionStatistics();
  }

  @Get('export')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Export all commission configurations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission configurations exported successfully',
  })
  async exportConfigurations(): Promise<any[]> {
    return await this.enhancedCommissionService.exportCommissionSettings();
  }

  @Post('import')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Import commission configurations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission configurations imported successfully',
  })
  async importConfigurations(
    @Body() configurations: any[],
    @Query('overwrite') overwrite: boolean = false,
    @GetUser() user: UserEntity,
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    return await this.enhancedCommissionService.importCommissionSettings(
      configurations,
      overwrite,
      user.id,
    );
  }

  @Delete('settings/partner/:partnerId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Delete partner-specific commission settings' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner commission settings deleted successfully',
  })
  async deletePartnerSettings(
    @Param('partnerId') partnerId: string,
    @GetUser() user: UserEntity,
  ): Promise<{ success: boolean }> {
    // This would need to be implemented in the enhanced commission service
    // For now, we can set it to use global settings
    const globalSettings =
      await this.enhancedCommissionService.getCommissionSettings();
    await this.enhancedCommissionService.updateCommissionSettings(
      globalSettings,
      ConfigurationScope.PARTNER,
      partnerId,
      user.id,
      'Reset to global settings',
    );

    return { success: true };
  }

  private mapToAdminDto(settings: any): AdminCommissionSettingsDto {
    return {
      defaultCommissionPercentage:
        settings.defaultCommissionPercentage ||
        settings.defaultPercentage ||
        10,
      minimumCommission: settings.minimumCommission || 0,
      maximumCommission: settings.maximumCommission || 10000,
      paymentTermDays: settings.paymentTermDays || 30,
      autoPayment: settings.autoPayment || false,
      holdbackPercentage: settings.holdbackPercentage || 0,
      performanceMultipliers: settings.performanceMultipliers || {
        bronze: 1.0,
        silver: 1.1,
        gold: 1.2,
        platinum: 1.3,
      },
      categoryOverrides: settings.categoryOverrides || [],
      partnerTiers: settings.partnerTiers || [],
    };
  }

  private mapFromAdminDto(dto: AdminCommissionSettingsDto): any {
    return {
      defaultCommissionPercentage: dto.defaultCommissionPercentage,
      defaultPercentage: dto.defaultCommissionPercentage,
      minimumCommission: dto.minimumCommission,
      maximumCommission: dto.maximumCommission,
      paymentTermDays: dto.paymentTermDays,
      autoPayment: dto.autoPayment,
      holdbackPercentage: dto.holdbackPercentage,
      performanceMultipliers: dto.performanceMultipliers,
      categoryOverrides: dto.categoryOverrides,
      partnerTiers: dto.partnerTiers,
    };
  }
}
