import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthGuard } from '@/auth/auth.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CreatePartnerAddonDto } from '../../dto/partner-addon/create-partner-addon.dto';
import { PartnerAddonResponseDto } from '../../dto/partner-addon/partner-addon-response.dto';
import { UpdatePartnerAddonDto } from '../../dto/partner-addon/update-partner-addon.dto';
import { RolesGuard } from '../../guards/roles.guard';
import { PartnerAddonService } from '../../services/partner-addon.service';

@ApiTags('Admin - Partner Addons')
@ApiBearerAuth()
@Controller('admin/partner-addons')
@UseGuards(AuthGuard, RolesGuard)
export class AdminPartnerAddonController {
  constructor(private readonly partnerAddonService: PartnerAddonService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new partner addon' })
  @ApiResponse({
    status: 201,
    description: 'Partner addon created successfully',
    type: PartnerAddonResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Partner addon already exists' })
  async create(
    @Body() createPartnerAddonDto: CreatePartnerAddonDto,
  ): Promise<PartnerAddonResponseDto> {
    return this.partnerAddonService.create(createPartnerAddonDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all partner addons' })
  @ApiQuery({
    name: 'offeringId',
    required: false,
    type: String,
    description: 'Filter by offering ID',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive partner addons',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Partner addons retrieved successfully',
    type: [PartnerAddonResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query('offeringId') offeringId?: string,
    @Query('category') category?: string,
    @Query('includeInactive') includeInactive?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PartnerAddonResponseDto[]> {
    if (offeringId) {
      return this.partnerAddonService.findByOffering(
        offeringId,
        includeInactive,
      );
    }
    return this.partnerAddonService.findAll(
      offeringId,
      undefined,
      undefined,
      includeInactive,
    );
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get partner addon by ID' })
  @ApiParam({ name: 'id', description: 'Partner addon ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner addon retrieved successfully',
    type: PartnerAddonResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner addon not found' })
  async findOne(@Param('id') id: string): Promise<PartnerAddonResponseDto> {
    return this.partnerAddonService.findOne(id);
  }

  @Get('slug/:slug')
  @Roles('admin')
  @ApiOperation({ summary: 'Get partner addon by slug' })
  @ApiParam({ name: 'slug', description: 'Partner addon slug' })
  @ApiResponse({
    status: 200,
    description: 'Partner addon retrieved successfully',
    type: PartnerAddonResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner addon not found' })
  async findBySlug(
    @Param('slug') slug: string,
    @Query('offeringId') offeringId: string,
  ): Promise<PartnerAddonResponseDto> {
    return this.partnerAddonService.findBySlug(offeringId, slug);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update partner addon' })
  @ApiParam({ name: 'id', description: 'Partner addon ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner addon updated successfully',
    type: PartnerAddonResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner addon not found' })
  @ApiResponse({
    status: 409,
    description: 'Partner addon name/slug already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePartnerAddonDto: UpdatePartnerAddonDto,
  ): Promise<PartnerAddonResponseDto> {
    return this.partnerAddonService.update(id, updatePartnerAddonDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete partner addon' })
  @ApiParam({ name: 'id', description: 'Partner addon ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner addon deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner addon not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.partnerAddonService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles('admin')
  @ApiOperation({ summary: 'Toggle partner addon active status' })
  @ApiParam({ name: 'id', description: 'Partner addon ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner addon status toggled successfully',
    type: PartnerAddonResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner addon not found' })
  async toggleActive(
    @Param('id') id: string,
  ): Promise<PartnerAddonResponseDto> {
    return this.partnerAddonService.toggleActive(id);
  }

  @Patch(':id/toggle-required')
  @Roles('admin')
  @ApiOperation({ summary: 'Toggle partner addon required status' })
  @ApiParam({ name: 'id', description: 'Partner addon ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner addon required status toggled successfully',
    type: PartnerAddonResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner addon not found' })
  async toggleRequired(
    @Param('id') id: string,
  ): Promise<PartnerAddonResponseDto> {
    return this.partnerAddonService.toggleRequired(id);
  }

  @Patch('reorder')
  @Roles('admin')
  @ApiOperation({ summary: 'Reorder partner addons' })
  @ApiResponse({
    status: 200,
    description: 'Partner addons reordered successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async reorder(
    @Body() reorderData: { offeringId: string; addonIds: string[] },
  ): Promise<PartnerAddonResponseDto[]> {
    return this.partnerAddonService.reorder(
      reorderData.offeringId,
      reorderData.addonIds,
    );
  }

  @Patch(':id/pricing')
  @Roles('admin')
  @ApiOperation({ summary: 'Update partner addon pricing' })
  @ApiParam({ name: 'id', description: 'Partner addon ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner addon pricing updated successfully',
    type: PartnerAddonResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner addon not found' })
  async updatePricing(
    @Param('id') id: string,
    @Body() pricing: { price: number; currency: string },
  ): Promise<PartnerAddonResponseDto> {
    return this.partnerAddonService.updatePricing(
      id,
      pricing.price,
      pricing.currency,
    );
  }

  // Analytics endpoints
  @Get(':id/analytics')
  @Roles('admin')
  @ApiOperation({ summary: 'Get partner addon analytics' })
  @ApiParam({ name: 'id', description: 'Partner addon ID' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analytics (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analytics (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'Partner addon analytics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner addon not found' })
  async getAnalytics(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    // This would be implemented with analytics service
    // For now, return basic structure
    return {
      addonId: id,
      period: { startDate, endDate },
      metrics: {
        selections: 0,
        revenue: 0,
        conversionRate: 0,
        averageOrderValue: 0,
      },
    };
  }

  // Bulk operations
  @Patch('bulk/activate')
  @Roles('admin')
  @ApiOperation({ summary: 'Bulk activate partner addons' })
  @ApiResponse({
    status: 200,
    description: 'Partner addons activated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async bulkActivate(@Body() data: { ids: string[] }): Promise<void> {
    for (const id of data.ids) {
      await this.partnerAddonService.toggleActive(id);
    }
  }

  @Patch('bulk/deactivate')
  @Roles('admin')
  @ApiOperation({ summary: 'Bulk deactivate partner addons' })
  @ApiResponse({
    status: 200,
    description: 'Partner addons deactivated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async bulkDeactivate(@Body() data: { ids: string[] }): Promise<void> {
    for (const id of data.ids) {
      await this.partnerAddonService.toggleActive(id);
    }
  }
}
