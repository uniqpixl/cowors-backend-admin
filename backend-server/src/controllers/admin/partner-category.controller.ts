import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import { CreatePartnerCategoryDto } from '../../dto/partner-category/create-partner-category.dto';
import { PartnerCategoryResponseDto } from '../../dto/partner-category/partner-category-response.dto';
import { UpdatePartnerCategoryDto } from '../../dto/partner-category/update-partner-category.dto';
import { RolesGuard } from '../../guards/roles.guard';
import { PartnerCategoryService } from '../../services/partner-category.service';

@ApiTags('Admin - Partner Categories')
@ApiBearerAuth()
@Controller('admin/partner-categories')
@UseGuards(AuthGuard, RolesGuard)
export class AdminPartnerCategoryController {
  constructor(
    private readonly partnerCategoryService: PartnerCategoryService,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new partner category' })
  @ApiResponse({
    status: 201,
    description: 'Partner category created successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Partner category already exists' })
  async create(
    @Body() createPartnerCategoryDto: CreatePartnerCategoryDto,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.create(createPartnerCategoryDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all partner categories' })
  @ApiQuery({
    name: 'partnerTypeId',
    required: false,
    type: String,
    description: 'Filter by partner type ID',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive partner categories',
  })
  @ApiQuery({
    name: 'includeCounts',
    required: false,
    type: Boolean,
    description: 'Include subcategory and offering counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Partner categories retrieved successfully',
    type: [PartnerCategoryResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query('partnerTypeId') partnerTypeId?: string,
    @Query('includeInactive') includeInactive?: boolean,
    @Query('includeCounts') includeCounts?: boolean,
  ): Promise<PartnerCategoryResponseDto[]> {
    if (partnerTypeId) {
      return this.partnerCategoryService.findByPartnerType(
        partnerTypeId,
        includeInactive,
      );
    }
    return this.partnerCategoryService.findAll(undefined, includeInactive);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get partner category by ID' })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  @ApiQuery({
    name: 'includeCounts',
    required: false,
    type: Boolean,
    description: 'Include subcategory and offering counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Partner category retrieved successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  async findOne(
    @Param('id') id: string,
    @Query('includeCounts') includeCounts?: boolean,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.findOne(id);
  }

  @Get('slug/:slug')
  @Roles('admin')
  @ApiOperation({ summary: 'Get partner category by slug' })
  @ApiParam({ name: 'slug', description: 'Partner category slug' })
  @ApiQuery({
    name: 'includeCounts',
    required: false,
    type: Boolean,
    description: 'Include subcategory and offering counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Partner category retrieved successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  async findBySlug(
    @Param('slug') slug: string,
    @Query('includeCounts') includeCounts?: boolean,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.findBySlug(slug);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update partner category' })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner category updated successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  @ApiResponse({
    status: 409,
    description: 'Partner category name/slug already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePartnerCategoryDto: UpdatePartnerCategoryDto,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.update(id, updatePartnerCategoryDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete partner category' })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner category deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.partnerCategoryService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles('admin')
  @ApiOperation({ summary: 'Toggle partner category active status' })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner category status toggled successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  async toggleActive(
    @Param('id') id: string,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.toggleActive(id);
  }

  @Put('reorder')
  @Roles('admin')
  @ApiOperation({ summary: 'Reorder partner categories' })
  @ApiResponse({
    status: 200,
    description: 'Partner categories reordered successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async reorder(
    @Body() reorderData: { id: string; sortOrder: number }[],
  ): Promise<PartnerCategoryResponseDto[]> {
    return this.partnerCategoryService.reorder(reorderData);
  }

  // Rule management endpoints
  @Get(':id/pricing-rules')
  @Roles('admin')
  @ApiOperation({ summary: 'Get effective pricing rules for partner category' })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  @ApiResponse({
    status: 200,
    description: 'Pricing rules retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  async getPricingRules(@Param('id') id: string): Promise<any> {
    return this.partnerCategoryService.getEffectivePricingRules(id);
  }

  @Patch(':id/pricing-rules')
  @Roles('admin')
  @ApiOperation({ summary: 'Update pricing rules for partner category' })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  @ApiResponse({
    status: 200,
    description: 'Pricing rules updated successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  async updatePricingRules(
    @Param('id') id: string,
    @Body() pricingRules: any,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.updatePricingRules(id, pricingRules);
  }

  @Get(':id/feature-rules')
  @Roles('admin')
  @ApiOperation({ summary: 'Get effective feature rules for partner category' })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  @ApiResponse({
    status: 200,
    description: 'Feature rules retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  async getFeatureRules(@Param('id') id: string): Promise<any> {
    return this.partnerCategoryService.getEffectiveFeatureRules(id);
  }

  @Patch(':id/feature-rules')
  @Roles('admin')
  @ApiOperation({ summary: 'Update feature rules for partner category' })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  @ApiResponse({
    status: 200,
    description: 'Feature rules updated successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  async updateFeatureRules(
    @Param('id') id: string,
    @Body() featureRules: any,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.updateFeatureRules(id, featureRules);
  }

  @Get(':id/validation-rules')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get effective validation rules for partner category',
  })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  @ApiResponse({
    status: 200,
    description: 'Validation rules retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  async getValidationRules(@Param('id') id: string): Promise<any> {
    return this.partnerCategoryService.getEffectiveValidationRules(id);
  }

  @Patch(':id/validation-rules')
  @Roles('admin')
  @ApiOperation({ summary: 'Update validation rules for partner category' })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  @ApiResponse({
    status: 200,
    description: 'Validation rules updated successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  async updateValidationRules(
    @Param('id') id: string,
    @Body() validationRules: any,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.updateValidationRules(
      id,
      validationRules,
    );
  }
}
