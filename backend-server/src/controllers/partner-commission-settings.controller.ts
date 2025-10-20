import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthGuard } from '@/auth/auth.guard';
import { PartnerCommissionSettingsEntity } from '../database/entities/partner-commission-settings.entity';
import { Roles } from '../decorators/roles.decorator';
import { CreatePartnerCommissionSettingsDto } from '../dto/create-partner-commission-settings.dto';
import { UpdatePartnerCommissionSettingsDto } from '../dto/update-partner-commission-settings.dto';
import { RolesGuard } from '../guards/roles.guard';
import { PartnerCommissionSettingsService } from '../services/partner-commission-settings.service';

@ApiTags('Partner Commission Settings')
@ApiBearerAuth()
@Controller('v1/partner-commission-settings')
@UseGuards(AuthGuard, RolesGuard)
export class PartnerCommissionSettingsController {
  constructor(
    private readonly commissionSettingsService: PartnerCommissionSettingsService,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create partner commission settings' })
  @ApiResponse({
    status: 201,
    description: 'Commission settings created successfully',
    type: PartnerCommissionSettingsEntity,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Body() createDto: CreatePartnerCommissionSettingsDto,
  ): Promise<PartnerCommissionSettingsEntity> {
    return await this.commissionSettingsService.create(createDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all partner commission settings' })
  @ApiResponse({
    status: 200,
    description: 'Commission settings retrieved successfully',
    type: [PartnerCommissionSettingsEntity],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(): Promise<PartnerCommissionSettingsEntity[]> {
    return await this.commissionSettingsService.findAll();
  }

  @Get('partner/:partnerId')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get commission settings by partner ID' })
  @ApiResponse({
    status: 200,
    description: 'Commission settings retrieved successfully',
    type: PartnerCommissionSettingsEntity,
  })
  @ApiResponse({ status: 404, description: 'Commission settings not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findByPartnerId(
    @Param('partnerId') partnerId: string,
  ): Promise<PartnerCommissionSettingsEntity> {
    return await this.commissionSettingsService.findByPartnerId(partnerId);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get commission settings by ID' })
  @ApiResponse({
    status: 200,
    description: 'Commission settings retrieved successfully',
    type: PartnerCommissionSettingsEntity,
  })
  @ApiResponse({ status: 404, description: 'Commission settings not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findById(
    @Param('id') id: string,
  ): Promise<PartnerCommissionSettingsEntity> {
    return await this.commissionSettingsService.findById(id);
  }

  @Put('partner/:partnerId')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Update commission settings by partner ID' })
  @ApiResponse({
    status: 200,
    description: 'Commission settings updated successfully',
    type: PartnerCommissionSettingsEntity,
  })
  @ApiResponse({ status: 404, description: 'Commission settings not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateByPartnerId(
    @Param('partnerId') partnerId: string,
    @Body() updateDto: UpdatePartnerCommissionSettingsDto,
  ): Promise<PartnerCommissionSettingsEntity> {
    return await this.commissionSettingsService.updateByPartnerId(
      partnerId,
      updateDto,
    );
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update commission settings by ID' })
  @ApiResponse({
    status: 200,
    description: 'Commission settings updated successfully',
    type: PartnerCommissionSettingsEntity,
  })
  @ApiResponse({ status: 404, description: 'Commission settings not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePartnerCommissionSettingsDto,
  ): Promise<PartnerCommissionSettingsEntity> {
    return await this.commissionSettingsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete commission settings' })
  @ApiResponse({
    status: 200,
    description: 'Commission settings deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Commission settings not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.commissionSettingsService.remove(id);
    return { message: 'Commission settings deleted successfully' };
  }

  @Get('partner/:partnerId/commission-rate')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get commission rate for partner' })
  @ApiResponse({
    status: 200,
    description: 'Commission rate retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getCommissionRate(
    @Param('partnerId') partnerId: string,
  ): Promise<{ commissionRate: number }> {
    const rate =
      await this.commissionSettingsService.getCommissionRate(partnerId);
    return { commissionRate: rate };
  }
}
