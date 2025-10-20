import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
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
import { AdminPartnerSubcategoryService } from '../../api/admin/admin-partner-subcategory.service';
import {
  AdminPartnerSubcategoryListResponseDto,
  AdminPartnerSubcategoryQueryDto,
  AdminReorderPartnerSubcategoriesDto,
} from '../../api/admin/dto/admin-partner-subcategory.dto';
import { PartnerSubcategoryEntity } from '../../database/entities/partner-subcategory.entity';
import { Roles } from '../../decorators/roles.decorator';
import { CreatePartnerSubcategoryDto } from '../../dto/partner-subcategory/create-partner-subcategory.dto';
import { PartnerSubcategoryResponseDto } from '../../dto/partner-subcategory/partner-subcategory-response.dto';
import { UpdatePartnerSubcategoryDto } from '../../dto/partner-subcategory/update-partner-subcategory.dto';
import { RolesGuard } from '../../guards/roles.guard';
import { PartnerSubcategoryService } from '../../services/partner-subcategory.service';

@ApiTags('Admin - Partner Subcategories')
@ApiBearerAuth()
@Controller('admin/partner-subcategories')
@UseGuards(AuthGuard, RolesGuard)
export class AdminPartnerSubcategoryController {
  constructor(
    private readonly partnerSubcategoryService: PartnerSubcategoryService,
    private readonly adminPartnerSubcategoryService: AdminPartnerSubcategoryService,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new partner subcategory' })
  @ApiResponse({
    status: 201,
    description: 'Partner subcategory created successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({
    status: 409,
    description: 'Partner subcategory already exists',
  })
  async create(
    @Body() createPartnerSubcategoryDto: CreatePartnerSubcategoryDto,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.create(createPartnerSubcategoryDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all partner subcategories' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by partner category ID',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive partner subcategories',
  })
  @ApiQuery({
    name: 'includeCounts',
    required: false,
    type: Boolean,
    description: 'Include offering counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Partner subcategories retrieved successfully',
    type: [PartnerSubcategoryResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('includeInactive') includeInactive?: boolean,
    @Query('includeCounts') includeCounts?: boolean,
  ): Promise<PartnerSubcategoryResponseDto[]> {
    return this.partnerSubcategoryService.findAll(categoryId, includeInactive);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get partner subcategory by ID' })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  @ApiQuery({
    name: 'includeCounts',
    required: false,
    type: Boolean,
    description: 'Include offering counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Partner subcategory retrieved successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  async findOne(
    @Param('id') id: string,
    @Query('includeCounts') includeCounts?: boolean,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.findOne(id);
  }

  @Get('slug/:slug')
  @Roles('admin')
  @ApiOperation({ summary: 'Get partner subcategory by slug' })
  @ApiParam({ name: 'slug', description: 'Partner subcategory slug' })
  @ApiQuery({
    name: 'includeCounts',
    required: false,
    type: Boolean,
    description: 'Include offering counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Partner subcategory retrieved successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  async findBySlug(
    @Param('slug') slug: string,
    @Query('includeCounts') includeCounts?: boolean,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.findBySlug(slug);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update partner subcategory' })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner subcategory updated successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  @ApiResponse({
    status: 409,
    description: 'Partner subcategory name/slug already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePartnerSubcategoryDto: UpdatePartnerSubcategoryDto,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.update(
      id,
      updatePartnerSubcategoryDto,
    );
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete partner subcategory' })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner subcategory deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.partnerSubcategoryService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles('admin')
  @ApiOperation({ summary: 'Toggle partner subcategory active status' })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner subcategory status toggled successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  async toggleActive(
    @Param('id') id: string,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.toggleActive(id);
  }

  @Patch('reorder')
  @Roles('admin')
  @ApiOperation({ summary: 'Reorder partner subcategories' })
  @ApiResponse({
    status: 200,
    description: 'Partner subcategories reordered successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async reorder(
    @Body() reorderDto: AdminReorderPartnerSubcategoriesDto,
  ): Promise<PartnerSubcategoryResponseDto[]> {
    // Convert orderedIds to reorder format
    const reorderData = reorderDto.orderedIds.map((id, index) => ({
      id,
      sortOrder: index,
    }));
    return this.partnerSubcategoryService.reorder(reorderData);
  }

  // Rule management endpoints
  @Get(':id/pricing-rules')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get effective pricing rules for partner subcategory',
  })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  @ApiResponse({
    status: 200,
    description: 'Pricing rules retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  async getPricingRules(@Param('id') id: string): Promise<any> {
    return this.partnerSubcategoryService.getEffectivePricingRules(id);
  }

  @Patch(':id/pricing-rules')
  @Roles('admin')
  @ApiOperation({ summary: 'Update pricing rules for partner subcategory' })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  @ApiResponse({
    status: 200,
    description: 'Pricing rules updated successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  async updatePricingRules(
    @Param('id') id: string,
    @Body() pricingRules: any,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.updatePricingRules(id, pricingRules);
  }

  @Get(':id/feature-rules')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get effective feature rules for partner subcategory',
  })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  @ApiResponse({
    status: 200,
    description: 'Feature rules retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  async getFeatureRules(@Param('id') id: string): Promise<any> {
    return this.partnerSubcategoryService.getEffectiveFeatureRules(id);
  }

  @Patch(':id/feature-rules')
  @Roles('admin')
  @ApiOperation({ summary: 'Update feature rules for partner subcategory' })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  @ApiResponse({
    status: 200,
    description: 'Feature rules updated successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  async updateFeatureRules(
    @Param('id') id: string,
    @Body() featureRules: any,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.updateFeatureRules(id, featureRules);
  }

  @Get(':id/validation-rules')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get effective validation rules for partner subcategory',
  })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  @ApiResponse({
    status: 200,
    description: 'Validation rules retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  async getValidationRules(@Param('id') id: string): Promise<any> {
    return this.partnerSubcategoryService.getEffectiveValidationRules(id);
  }

  @Patch(':id/validation-rules')
  @Roles('admin')
  @ApiOperation({ summary: 'Update validation rules for partner subcategory' })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  @ApiResponse({
    status: 200,
    description: 'Validation rules updated successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  async updateValidationRules(
    @Param('id') id: string,
    @Body() validationRules: any,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.updateValidationRules(
      id,
      validationRules,
    );
  }
}
