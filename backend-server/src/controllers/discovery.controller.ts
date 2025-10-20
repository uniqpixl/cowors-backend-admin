import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseBoolPipe,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseCoworsIdPipe } from '../common/pipes/parse-cowors-id.pipe';

import { PartnerCategoryResponseDto } from '../dto/partner-category/partner-category-response.dto';
import { PartnerOfferingResponseDto } from '../dto/partner-offering/partner-offering-response.dto';
import { PartnerSubcategoryResponseDto } from '../dto/partner-subcategory/partner-subcategory-response.dto';
import { PartnerTypeResponseDto } from '../dto/partner-type/partner-type-response.dto';
import { PartnerCategoryService } from '../services/partner-category.service';
import { PartnerOfferingService } from '../services/partner-offering.service';
import { PartnerSubcategoryService } from '../services/partner-subcategory.service';
import { PartnerTypeService } from '../services/partner-type.service';

@ApiTags('Public Discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(
    private readonly partnerTypeService: PartnerTypeService,
    private readonly partnerCategoryService: PartnerCategoryService,
    private readonly partnerSubcategoryService: PartnerSubcategoryService,
    private readonly partnerOfferingService: PartnerOfferingService,
  ) {}

  // Partner Types Discovery
  @Get('partner-types')
  @ApiOperation({ summary: 'Browse partner types' })
  @ApiResponse({
    status: 200,
    description: 'Partner types retrieved successfully',
  })
  async browsePartnerTypes(): Promise<PartnerTypeResponseDto[]> {
    console.log('=== DiscoveryController.browsePartnerTypes called ===');
    console.log('partnerTypeService exists:', !!this.partnerTypeService);
    console.log('partnerTypeService type:', typeof this.partnerTypeService);
    console.log(
      'partnerTypeService constructor:',
      this.partnerTypeService?.constructor?.name,
    );

    try {
      console.log('Calling partnerTypeService.findAll()...');
      const result = await this.partnerTypeService.findAll();
      console.log('partnerTypeService.findAll() result:', result);
      console.log('Result length:', result?.length);
      return result;
    } catch (error) {
      console.error('=== Error in browsePartnerTypes ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      throw error;
    }
  }

  @Get('partner-types/:typeId')
  @ApiOperation({ summary: 'Get partner type details' })
  @ApiParam({ name: 'typeId', description: 'Partner type ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner type details',
    type: PartnerTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Partner type not found' })
  async getPartnerType(
    @Param('typeId', ParseCoworsIdPipe) typeId: string,
  ): Promise<PartnerTypeResponseDto> {
    return this.partnerTypeService.findOne(typeId);
  }

  @Get('partner-types/slug/:slug')
  @ApiOperation({ summary: 'Get partner type by slug' })
  @ApiParam({ name: 'slug', description: 'Partner type slug' })
  @ApiResponse({
    status: 200,
    description: 'Partner type details',
    type: PartnerTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Partner type not found' })
  async getPartnerTypeBySlug(
    @Param('slug') slug: string,
  ): Promise<PartnerTypeResponseDto> {
    return this.partnerTypeService.findBySlug(slug);
  }

  // Categories Discovery
  @Get('categories')
  @ApiOperation({ summary: 'Browse all active categories' })
  @ApiQuery({
    name: 'partnerTypeId',
    required: false,
    description: 'Filter by partner type ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of active categories',
    type: [PartnerCategoryResponseDto],
  })
  async browseCategories(
    @Query('partnerTypeId') partnerTypeId?: string,
  ): Promise<PartnerCategoryResponseDto[]> {
    return this.partnerCategoryService.findAll(partnerTypeId, false); // Only active categories
  }

  @Get('categories/:categoryId')
  @ApiOperation({ summary: 'Get category details' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Category details',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategory(
    @Param('categoryId', ParseCoworsIdPipe) categoryId: string,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.findOne(categoryId);
  }

  @Get('categories/slug/:slug')
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiParam({ name: 'slug', description: 'Category slug' })
  @ApiQuery({
    name: 'partnerTypeId',
    required: false,
    description: 'Partner type ID for scoped search',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Category details',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryBySlug(
    @Param('slug') slug: string,
    @Query('partnerTypeId') partnerTypeId?: string,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.findBySlug(slug, partnerTypeId);
  }

  @Get('partner-types/:typeId/categories')
  @ApiOperation({ summary: 'Browse categories by partner type' })
  @ApiParam({ name: 'typeId', description: 'Partner type ID' })
  @ApiResponse({
    status: 200,
    description: 'List of categories for the partner type',
    type: [PartnerCategoryResponseDto],
  })
  async getCategoriesByType(
    @Param('typeId', ParseCoworsIdPipe) typeId: string,
  ): Promise<PartnerCategoryResponseDto[]> {
    return this.partnerCategoryService.findByPartnerType(typeId, false); // Only active categories
  }

  // Subcategories Discovery
  @Get('subcategories')
  @ApiOperation({ summary: 'Browse all active subcategories' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of active subcategories',
    type: [PartnerSubcategoryResponseDto],
  })
  async browseSubcategories(
    @Query('categoryId') categoryId?: string,
  ): Promise<PartnerSubcategoryResponseDto[]> {
    return this.partnerSubcategoryService.findAll(categoryId, false); // Only active subcategories
  }

  @Get('subcategories/:subcategoryId')
  @ApiOperation({ summary: 'Get subcategory details' })
  @ApiParam({ name: 'subcategoryId', description: 'Subcategory ID' })
  @ApiResponse({
    status: 200,
    description: 'Subcategory details',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Subcategory not found' })
  async getSubcategory(
    @Param('subcategoryId', ParseCoworsIdPipe) subcategoryId: string,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.findOne(subcategoryId);
  }

  @Get('subcategories/slug/:slug')
  @ApiOperation({ summary: 'Get subcategory by slug' })
  @ApiParam({ name: 'slug', description: 'Subcategory slug' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Category ID for scoped search',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Subcategory details',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Subcategory not found' })
  async getSubcategoryBySlug(
    @Param('slug') slug: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.findBySlug(slug, categoryId);
  }

  @Get('categories/:categoryId/subcategories')
  @ApiOperation({ summary: 'Browse subcategories by category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'List of subcategories for the category',
    type: [PartnerSubcategoryResponseDto],
  })
  async getSubcategoriesByCategory(
    @Param('categoryId', ParseCoworsIdPipe) categoryId: string,
  ): Promise<PartnerSubcategoryResponseDto[]> {
    return this.partnerSubcategoryService.findByCategory(categoryId, false); // Only active subcategories
  }

  // Offerings Discovery
  @Get('offerings')
  @ApiOperation({ summary: 'Browse all active offerings' })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    description: 'Filter by partner ID',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'subcategoryId',
    required: false,
    description: 'Filter by subcategory ID',
  })
  @ApiQuery({
    name: 'isFeatured',
    required: false,
    description: 'Filter by featured status',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Filter by location',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price filter',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price filter',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort by field (price, rating, name, created)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (asc, desc)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active offerings',
    type: [PartnerOfferingResponseDto],
  })
  async browseOfferings(
    @Query('partnerId') partnerId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('isFeatured', new DefaultValuePipe(undefined), ParseBoolPipe)
    isFeatured?: boolean,
    @Query('location') location?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<PartnerOfferingResponseDto[]> {
    // Only return active offerings for public discovery
    return this.partnerOfferingService.findAll(
      partnerId,
      categoryId,
      subcategoryId,
      true, // isActive = true
      isFeatured,
      false, // includeInactive = false
    );
  }

  @Get('offerings/:offeringId')
  @ApiOperation({ summary: 'Get offering details' })
  @ApiParam({ name: 'offeringId', description: 'Offering ID' })
  @ApiResponse({
    status: 200,
    description: 'Offering details',
    type: PartnerOfferingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Offering not found' })
  async getOffering(
    @Param('offeringId', ParseCoworsIdPipe) offeringId: string,
  ): Promise<PartnerOfferingResponseDto> {
    return this.partnerOfferingService.findOne(offeringId, false); // Only active offerings
  }

  @Get('offerings/slug/:partnerId/:slug')
  @ApiOperation({ summary: 'Get offering by partner and slug' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiParam({ name: 'slug', description: 'Offering slug' })
  @ApiResponse({
    status: 200,
    description: 'Offering details',
    type: PartnerOfferingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Offering not found' })
  async getOfferingBySlug(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @Param('slug') slug: string,
  ): Promise<PartnerOfferingResponseDto> {
    return this.partnerOfferingService.findBySlug(partnerId, slug, false); // Only active offerings
  }

  @Get('categories/:categoryId/offerings')
  @ApiOperation({ summary: 'Browse offerings by category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiQuery({
    name: 'subcategoryId',
    required: false,
    description: 'Filter by subcategory ID',
  })
  @ApiQuery({
    name: 'isFeatured',
    required: false,
    description: 'Filter by featured status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'List of offerings for the category',
    type: [PartnerOfferingResponseDto],
  })
  async getOfferingsByCategory(
    @Param('categoryId', ParseCoworsIdPipe) categoryId: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('isFeatured', new DefaultValuePipe(undefined), ParseBoolPipe)
    isFeatured?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PartnerOfferingResponseDto[]> {
    return this.partnerOfferingService.findAll(
      undefined, // partnerId
      categoryId,
      subcategoryId,
      true, // isActive = true
      isFeatured,
      false, // includeInactive = false
    );
  }

  @Get('subcategories/:subcategoryId/offerings')
  @ApiOperation({ summary: 'Browse offerings by subcategory' })
  @ApiParam({ name: 'subcategoryId', description: 'Subcategory ID' })
  @ApiQuery({
    name: 'isFeatured',
    required: false,
    description: 'Filter by featured status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'List of offerings for the subcategory',
    type: [PartnerOfferingResponseDto],
  })
  async getOfferingsBySubcategory(
    @Param('subcategoryId', ParseCoworsIdPipe) subcategoryId: string,
    @Query('isFeatured', new DefaultValuePipe(undefined), ParseBoolPipe)
    isFeatured?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PartnerOfferingResponseDto[]> {
    return this.partnerOfferingService.findAll(
      undefined, // partnerId
      undefined, // categoryId
      subcategoryId,
      true, // isActive = true
      isFeatured,
      false, // includeInactive = false
    );
  }

  // Featured and Popular Offerings
  @Get('featured-offerings')
  @ApiOperation({ summary: 'Get featured offerings' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items to return',
  })
  @ApiResponse({
    status: 200,
    description: 'List of featured offerings',
    type: [PartnerOfferingResponseDto],
  })
  async getFeaturedOfferings(
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: number,
  ): Promise<PartnerOfferingResponseDto[]> {
    return this.partnerOfferingService.findAll(
      undefined, // partnerId
      categoryId,
      undefined, // subcategoryId
      true, // isActive = true
      true, // isFeatured = true
      false, // includeInactive = false
    );
  }

  // Search functionality
  @Get('search')
  @ApiOperation({ summary: 'Search offerings and categories' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Search type (offerings, categories, all)',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Filter by location',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    schema: {
      type: 'object',
      properties: {
        offerings: {
          type: 'array',
          items: { $ref: '#/components/schemas/PartnerOfferingResponseDto' },
        },
        categories: {
          type: 'array',
          items: { $ref: '#/components/schemas/PartnerCategoryResponseDto' },
        },
        subcategories: {
          type: 'array',
          items: { $ref: '#/components/schemas/PartnerSubcategoryResponseDto' },
        },
        total: { type: 'number' },
      },
    },
  })
  async search(
    @Query('q') query: string,
    @Query('type') type: string = 'all',
    @Query('categoryId') categoryId?: string,
    @Query('location') location?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<any> {
    // This is a simplified search implementation
    // In a real application, you would use a proper search engine like Elasticsearch
    const results: any = {
      offerings: [],
      categories: [],
      subcategories: [],
      total: 0,
    };

    if (type === 'all' || type === 'offerings') {
      // Search offerings by name, description, etc.
      results.offerings = await this.partnerOfferingService.findAll(
        undefined, // partnerId
        categoryId,
        undefined, // subcategoryId
        true, // isActive = true
        undefined, // isFeatured
        false, // includeInactive = false
      );
      // Filter by search query (simplified)
      results.offerings = results.offerings.filter(
        (offering: any) =>
          offering.name.toLowerCase().includes(query.toLowerCase()) ||
          offering.description?.toLowerCase().includes(query.toLowerCase()),
      );
    }

    if (type === 'all' || type === 'categories') {
      // Search categories by name, description
      results.categories = await this.partnerCategoryService.findAll(
        undefined,
        false,
      );
      results.categories = results.categories.filter(
        (category: any) =>
          category.name.toLowerCase().includes(query.toLowerCase()) ||
          category.description?.toLowerCase().includes(query.toLowerCase()),
      );
    }

    if (type === 'all' || type === 'subcategories') {
      // Search subcategories by name, description
      results.subcategories = await this.partnerSubcategoryService.findAll(
        categoryId,
        false,
      );
      results.subcategories = results.subcategories.filter(
        (subcategory: any) =>
          subcategory.name.toLowerCase().includes(query.toLowerCase()) ||
          subcategory.description?.toLowerCase().includes(query.toLowerCase()),
      );
    }

    results.total =
      results.offerings.length +
      results.categories.length +
      results.subcategories.length;

    return results;
  }
}
