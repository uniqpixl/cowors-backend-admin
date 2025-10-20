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
  Put,
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
import { CreatePartnerSubcategoryDto } from '../dto/partner-subcategory/create-partner-subcategory.dto';
import { PartnerSubcategoryResponseDto } from '../dto/partner-subcategory/partner-subcategory-response.dto';
import { UpdatePartnerSubcategoryDto } from '../dto/partner-subcategory/update-partner-subcategory.dto';
import { PartnerSubcategoryService } from '../services/partner-subcategory.service';

@ApiTags('Partner Subcategories')
@Controller('partner-subcategories')
export class PartnerSubcategoryController {
  constructor(
    private readonly partnerSubcategoryService: PartnerSubcategoryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new partner subcategory' })
  @ApiResponse({
    status: 201,
    description: 'Partner subcategory created successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Partner category not found' })
  @ApiResponse({
    status: 409,
    description: 'Partner subcategory name or slug already exists',
  })
  async create(
    @Body() createPartnerSubcategoryDto: CreatePartnerSubcategoryDto,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.create(createPartnerSubcategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all partner subcategories' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
    type: String,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive subcategories',
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of partner subcategories',
    type: [PartnerSubcategoryResponseDto],
  })
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive = false,
  ): Promise<PartnerSubcategoryResponseDto[]> {
    return this.partnerSubcategoryService.findAll(categoryId, includeInactive);
  }

  @Get('by-category/:categoryId')
  @ApiOperation({ summary: 'Get subcategories by category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive subcategories',
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of partner subcategories for the specified category',
    type: [PartnerSubcategoryResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findByCategory(
    @Param('categoryId', ParseCoworsIdPipe) categoryId: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive = false,
  ): Promise<PartnerSubcategoryResponseDto[]> {
    return this.partnerSubcategoryService.findByCategory(
      categoryId,
      includeInactive,
    );
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get partner subcategory by slug' })
  @ApiParam({ name: 'slug', description: 'Partner subcategory slug' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Category ID for scoped search',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Partner subcategory details',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  async findBySlug(
    @Param('slug') slug: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.findBySlug(slug, categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get partner subcategory by ID' })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner subcategory details',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  async findOne(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update partner subcategory' })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner subcategory updated successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  @ApiResponse({
    status: 409,
    description: 'Partner subcategory name or slug already exists',
  })
  async update(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updatePartnerSubcategoryDto: UpdatePartnerSubcategoryDto,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.update(
      id,
      updatePartnerSubcategoryDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete partner subcategory' })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  @ApiResponse({
    status: 204,
    description: 'Partner subcategory deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete subcategory with associated offerings',
  })
  async remove(@Param('id', ParseCoworsIdPipe) id: string): Promise<void> {
    return this.partnerSubcategoryService.remove(id);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle partner subcategory active status' })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner subcategory status toggled successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Partner subcategory not found' })
  async toggleActive(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerSubcategoryResponseDto> {
    return this.partnerSubcategoryService.toggleActive(id);
  }

  @Put('reorder')
  @ApiOperation({ summary: 'Reorder partner subcategories' })
  @ApiBody({
    description: 'Array of subcategory IDs with their new sort orders',
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
    description: 'Partner subcategories reordered successfully',
    type: [PartnerSubcategoryResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'One or more partner subcategories not found',
  })
  async reorder(
    @Body() reorderData: { id: string; sortOrder: number }[],
  ): Promise<PartnerSubcategoryResponseDto[]> {
    return this.partnerSubcategoryService.reorder(reorderData);
  }
}
