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
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseCoworsIdPipe } from '../common/pipes/parse-cowors-id.pipe';
import { CreatePartnerTypeDto } from '../dto/partner-type/create-partner-type.dto';
import { PartnerTypeResponseDto } from '../dto/partner-type/partner-type-response.dto';
import { UpdatePartnerTypeDto } from '../dto/partner-type/update-partner-type.dto';
import { PartnerTypeService } from '../services/partner-type.service';

@ApiTags('Partner Types')
@Controller('partner-types')
@ApiBearerAuth()
export class PartnerTypeController {
  constructor(private readonly partnerTypeService: PartnerTypeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new partner type' })
  @ApiResponse({
    status: 201,
    description: 'Partner type created successfully',
    type: PartnerTypeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 409,
    description: 'Partner type with name or slug already exists',
  })
  async create(
    @Body() createPartnerTypeDto: CreatePartnerTypeDto,
  ): Promise<PartnerTypeResponseDto> {
    return this.partnerTypeService.create(createPartnerTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all partner types' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive partner types in the response',
  })
  @ApiResponse({
    status: 200,
    description: 'List of partner types retrieved successfully',
    type: [PartnerTypeResponseDto],
  })
  async findAll(
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive = false,
  ): Promise<PartnerTypeResponseDto[]> {
    return this.partnerTypeService.findAll(includeInactive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a partner type by ID' })
  @ApiParam({ name: 'id', description: 'Partner type UUID' })
  @ApiResponse({
    status: 200,
    description: 'Partner type retrieved successfully',
    type: PartnerTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Partner type not found' })
  async findOne(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerTypeResponseDto> {
    return this.partnerTypeService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a partner type by slug' })
  @ApiParam({ name: 'slug', description: 'Partner type slug' })
  @ApiResponse({
    status: 200,
    description: 'Partner type retrieved successfully',
    type: PartnerTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Partner type not found' })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<PartnerTypeResponseDto> {
    return this.partnerTypeService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a partner type' })
  @ApiParam({ name: 'id', description: 'Partner type UUID' })
  @ApiResponse({
    status: 200,
    description: 'Partner type updated successfully',
    type: PartnerTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Partner type not found' })
  @ApiResponse({
    status: 409,
    description: 'Partner type with name or slug already exists',
  })
  async update(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updatePartnerTypeDto: UpdatePartnerTypeDto,
  ): Promise<PartnerTypeResponseDto> {
    return this.partnerTypeService.update(id, updatePartnerTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a partner type' })
  @ApiParam({ name: 'id', description: 'Partner type UUID' })
  @ApiResponse({
    status: 204,
    description: 'Partner type deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Partner type not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete partner type with associated data',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseCoworsIdPipe) id: string): Promise<void> {
    return this.partnerTypeService.remove(id);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle active status of a partner type' })
  @ApiParam({ name: 'id', description: 'Partner type UUID' })
  @ApiResponse({
    status: 200,
    description: 'Partner type active status toggled successfully',
    type: PartnerTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Partner type not found' })
  async toggleActive(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerTypeResponseDto> {
    return this.partnerTypeService.toggleActive(id);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder partner types' })
  @ApiResponse({
    status: 200,
    description: 'Partner types reordered successfully',
    type: [PartnerTypeResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'One or more partner types not found',
  })
  async reorder(
    @Body() reorderData: { id: string; sortOrder: number }[],
  ): Promise<PartnerTypeResponseDto[]> {
    return this.partnerTypeService.reorder(reorderData);
  }
}
