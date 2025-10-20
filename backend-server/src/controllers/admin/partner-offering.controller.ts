import {
  BadRequestException,
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
import { CreatePartnerOfferingDto } from '../../dto/partner-offering/create-partner-offering.dto';
import { PartnerOfferingResponseDto } from '../../dto/partner-offering/partner-offering-response.dto';
import { UpdatePartnerOfferingDto } from '../../dto/partner-offering/update-partner-offering.dto';
import { RolesGuard } from '../../guards/roles.guard';
import { PartnerOfferingService } from '../../services/partner-offering.service';

@ApiTags('Admin - Partner Offerings')
@ApiBearerAuth()
@Controller('admin/partner-offerings')
@UseGuards(AuthGuard, RolesGuard)
export class AdminPartnerOfferingController {
  constructor(
    private readonly partnerOfferingService: PartnerOfferingService,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new partner offering' })
  @ApiResponse({
    status: 201,
    description: 'Partner offering created successfully',
    type: PartnerOfferingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Partner offering already exists' })
  async create(
    @Body() createPartnerOfferingDto: CreatePartnerOfferingDto,
  ): Promise<PartnerOfferingResponseDto> {
    return this.partnerOfferingService.create(createPartnerOfferingDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all partner offerings' })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: String,
    description: 'Filter by partner ID',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'subcategoryId',
    required: false,
    type: String,
    description: 'Filter by subcategory ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'active', 'inactive', 'suspended'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'featured',
    required: false,
    type: Boolean,
    description: 'Filter by featured status',
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
    description: 'Partner offerings retrieved successfully',
    type: [PartnerOfferingResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query('partnerId') partnerId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('status') status?: string,
    @Query('featured') featured?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PartnerOfferingResponseDto[]> {
    // Convert status string to boolean for isActive
    const isActive =
      status === 'active' ? true : status === 'inactive' ? false : undefined;
    const includeInactive = status === 'inactive' || status === undefined;

    return this.partnerOfferingService.findAll(
      partnerId,
      categoryId,
      subcategoryId,
      isActive,
      featured,
      includeInactive,
    );
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get partner offering by ID' })
  @ApiParam({ name: 'id', description: 'Partner offering ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner offering retrieved successfully',
    type: PartnerOfferingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner offering not found' })
  async findOne(@Param('id') id: string): Promise<PartnerOfferingResponseDto> {
    return this.partnerOfferingService.findOne(id);
  }

  @Get('slug/:slug')
  @Roles('admin')
  @ApiOperation({ summary: 'Get partner offering by slug' })
  @ApiParam({ name: 'slug', description: 'Partner offering slug' })
  @ApiResponse({
    status: 200,
    description: 'Partner offering retrieved successfully',
    type: PartnerOfferingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner offering not found' })
  async findBySlug(
    @Param('slug') slug: string,
    @Query('partnerId') partnerId?: string,
  ): Promise<PartnerOfferingResponseDto> {
    if (!partnerId) {
      throw new BadRequestException('partnerId query parameter is required');
    }
    return this.partnerOfferingService.findBySlug(partnerId, slug, true);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update partner offering' })
  @ApiParam({ name: 'id', description: 'Partner offering ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner offering updated successfully',
    type: PartnerOfferingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner offering not found' })
  @ApiResponse({
    status: 409,
    description: 'Partner offering name/slug already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePartnerOfferingDto: UpdatePartnerOfferingDto,
  ): Promise<PartnerOfferingResponseDto> {
    return this.partnerOfferingService.update(id, updatePartnerOfferingDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete partner offering' })
  @ApiParam({ name: 'id', description: 'Partner offering ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner offering deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner offering not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.partnerOfferingService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles('admin')
  @ApiOperation({ summary: 'Toggle partner offering active status' })
  @ApiParam({ name: 'id', description: 'Partner offering ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner offering status toggled successfully',
    type: PartnerOfferingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner offering not found' })
  async toggleActive(
    @Param('id') id: string,
  ): Promise<PartnerOfferingResponseDto> {
    return this.partnerOfferingService.toggleActive(id);
  }

  @Patch(':id/toggle-featured')
  @Roles('admin')
  @ApiOperation({ summary: 'Toggle partner offering featured status' })
  @ApiParam({ name: 'id', description: 'Partner offering ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner offering featured status toggled successfully',
    type: PartnerOfferingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner offering not found' })
  async toggleFeatured(
    @Param('id') id: string,
  ): Promise<PartnerOfferingResponseDto> {
    return this.partnerOfferingService.toggleFeatured(id);
  }

  @Patch('reorder')
  @Roles('admin')
  @ApiOperation({ summary: 'Reorder partner offerings' })
  @ApiResponse({
    status: 200,
    description: 'Partner offerings reordered successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async reorder(
    @Body() reorderData: { id: string; sortOrder: number }[],
  ): Promise<void> {
    return this.partnerOfferingService.reorder(reorderData);
  }

  // Status management
  @Patch(':id/approve')
  @Roles('admin')
  @ApiOperation({ summary: 'Approve partner offering' })
  @ApiParam({ name: 'id', description: 'Partner offering ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner offering approved successfully',
    type: PartnerOfferingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner offering not found' })
  async approve(@Param('id') id: string): Promise<PartnerOfferingResponseDto> {
    return this.partnerOfferingService.update(id, { isActive: true });
  }

  @Patch(':id/suspend')
  @Roles('admin')
  @ApiOperation({ summary: 'Suspend partner offering' })
  @ApiParam({ name: 'id', description: 'Partner offering ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner offering suspended successfully',
    type: PartnerOfferingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner offering not found' })
  async suspend(@Param('id') id: string): Promise<PartnerOfferingResponseDto> {
    return this.partnerOfferingService.update(id, { isActive: false });
  }

  // Analytics endpoints
  @Get(':id/analytics')
  @Roles('admin')
  @ApiOperation({ summary: 'Get partner offering analytics' })
  @ApiParam({ name: 'id', description: 'Partner offering ID' })
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
    description: 'Partner offering analytics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner offering not found' })
  async getAnalytics(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    // This would be implemented with analytics service
    // For now, return basic structure
    return {
      offeringId: id,
      period: { startDate, endDate },
      metrics: {
        views: 0,
        bookings: 0,
        revenue: 0,
        conversionRate: 0,
      },
    };
  }
}
