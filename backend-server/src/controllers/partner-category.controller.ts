import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseCoworsIdPipe } from '../common/pipes/parse-cowors-id.pipe';
import { CreatePartnerCategoryDto } from '../dto/partner-category/create-partner-category.dto';
import { PartnerCategoryResponseDto } from '../dto/partner-category/partner-category-response.dto';
import { UpdatePartnerCategoryDto } from '../dto/partner-category/update-partner-category.dto';
import { PartnerCategoryService } from '../services/partner-category.service';

@ApiTags('Partner Categories')
@Controller('partner-categories')
export class PartnerCategoryController {
  constructor(
    private readonly partnerCategoryService: PartnerCategoryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new partner category' })
  @ApiResponse({
    status: 201,
    description: 'Partner category created successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Partner type not found' })
  @ApiResponse({
    status: 409,
    description: 'Partner category name or slug already exists',
  })
  async create(
    @Body() createPartnerCategoryDto: CreatePartnerCategoryDto,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.create(createPartnerCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all partner categories' })
  @ApiQuery({
    name: 'partnerTypeId',
    required: false,
    description: 'Filter by partner type ID',
    type: String,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive categories',
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of partner categories',
    type: [PartnerCategoryResponseDto],
  })
  async findAll(
    @Query('partnerTypeId') partnerTypeId?: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive = false,
  ): Promise<PartnerCategoryResponseDto[]> {
    return this.partnerCategoryService.findAll(partnerTypeId, includeInactive);
  }

  @Get('by-partner-type/:partnerTypeId')
  @ApiOperation({ summary: 'Get categories by partner type' })
  @ApiParam({ name: 'partnerTypeId', description: 'Partner type ID' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive categories',
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of partner categories for the specified partner type',
    type: [PartnerCategoryResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Partner type not found' })
  async findByPartnerType(
    @Param('partnerTypeId', ParseCoworsIdPipe) partnerTypeId: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive = false,
  ): Promise<PartnerCategoryResponseDto[]> {
    return this.partnerCategoryService.findByPartnerType(
      partnerTypeId,
      includeInactive,
    );
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get partner category by slug' })
  @ApiParam({ name: 'slug', description: 'Partner category slug' })
  @ApiQuery({
    name: 'partnerTypeId',
    required: false,
    description: 'Partner type ID for scoped search',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Partner category details',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  async findBySlug(
    @Param('slug') slug: string,
    @Query('partnerTypeId') partnerTypeId?: string,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.findBySlug(slug, partnerTypeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get partner category by ID' })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner category details',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  async findOne(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update partner category' })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner category updated successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  @ApiResponse({
    status: 409,
    description: 'Partner category name or slug already exists',
  })
  async update(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updatePartnerCategoryDto: UpdatePartnerCategoryDto,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.update(id, updatePartnerCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete partner category' })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  @ApiResponse({
    status: 204,
    description: 'Partner category deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  @ApiResponse({
    status: 400,
    description:
      'Cannot delete category with associated subcategories or offerings',
  })
  async remove(@Param('id', ParseCoworsIdPipe) id: string): Promise<void> {
    return this.partnerCategoryService.remove(id);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle partner category active status' })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner category status toggled successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  async toggleActive(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerCategoryResponseDto> {
    return this.partnerCategoryService.toggleActive(id);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder partner categories' })
  @ApiBody({
    description: 'Array of category IDs with their new sort orders',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          sortOrder: { type: 'number' },
        },
        required: ['id', 'sortOrder'],
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Partner categories reordered successfully',
    type: [PartnerCategoryResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'One or more partner categories not found',
  })
  async reorder(
    @Body() reorderData: { id: string; sortOrder: number }[],
  ): Promise<PartnerCategoryResponseDto[]> {
    return this.partnerCategoryService.reorder(reorderData);
  }
}
