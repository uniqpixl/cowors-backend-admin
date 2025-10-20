import {
  Body,
  Controller,
  DefaultValuePipe,
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
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseCoworsIdPipe } from '../common/pipes/parse-cowors-id.pipe';
import { CreatePartnerOfferingDto } from '../dto/partner-offering/create-partner-offering.dto';
import { PartnerOfferingResponseDto } from '../dto/partner-offering/partner-offering-response.dto';
import { UpdatePartnerOfferingDto } from '../dto/partner-offering/update-partner-offering.dto';
import { PartnerOfferingService } from '../services/partner-offering.service';

@ApiTags('Partner Offerings')
@Controller('partner-offerings')
export class PartnerOfferingController {
  constructor(private readonly offeringService: PartnerOfferingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new partner offering' })
  @ApiResponse({
    status: 201,
    description: 'Partner offering created successfully',
    type: PartnerOfferingResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Partner or category not found' })
  @ApiConflictResponse({
    description: 'Offering with this slug already exists for the partner',
  })
  async create(
    @Body() createDto: CreatePartnerOfferingDto,
  ): Promise<PartnerOfferingResponseDto> {
    return this.offeringService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all partner offerings with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of partner offerings',
    type: [PartnerOfferingResponseDto],
  })
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
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'isFeatured',
    required: false,
    description: 'Filter by featured status',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive offerings',
    type: Boolean,
  })
  async findAll(
    @Query('partnerId') partnerId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('isActive') isActive?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<PartnerOfferingResponseDto[]> {
    return this.offeringService.findAll(
      partnerId,
      categoryId,
      subcategoryId,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      includeInactive === 'true' ? true : false,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a partner offering by ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner offering details',
    type: PartnerOfferingResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Partner offering not found' })
  @ApiParam({ name: 'id', description: 'Partner offering ID' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive offering',
    type: Boolean,
  })
  async findOne(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
    includeInactive?: boolean,
  ): Promise<PartnerOfferingResponseDto> {
    return this.offeringService.findOne(id, includeInactive);
  }

  @Get('partner/:partnerId/slug/:slug')
  @ApiOperation({ summary: 'Get a partner offering by partner ID and slug' })
  @ApiResponse({
    status: 200,
    description: 'Partner offering details',
    type: PartnerOfferingResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Partner offering not found' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiParam({ name: 'slug', description: 'Offering slug' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive offering',
    type: Boolean,
  })
  async findBySlug(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @Param('slug') slug: string,
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
    includeInactive?: boolean,
  ): Promise<PartnerOfferingResponseDto> {
    return this.offeringService.findBySlug(partnerId, slug, includeInactive);
  }

  @Get('partner/:partnerId')
  @ApiOperation({ summary: 'Get all offerings for a specific partner' })
  @ApiResponse({
    status: 200,
    description: 'List of partner offerings',
    type: [PartnerOfferingResponseDto],
  })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
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
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'isFeatured',
    required: false,
    description: 'Filter by featured status',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive offerings',
    type: Boolean,
  })
  async findByPartner(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('isActive', new DefaultValuePipe(undefined), ParseBoolPipe)
    isActive?: boolean,
    @Query('isFeatured', new DefaultValuePipe(undefined), ParseBoolPipe)
    isFeatured?: boolean,
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
    includeInactive?: boolean,
  ): Promise<PartnerOfferingResponseDto[]> {
    return this.offeringService.findAll(
      partnerId,
      categoryId,
      subcategoryId,
      isActive,
      isFeatured,
      includeInactive,
    );
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get all offerings for a specific category' })
  @ApiResponse({
    status: 200,
    description: 'List of partner offerings',
    type: [PartnerOfferingResponseDto],
  })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    description: 'Filter by partner ID',
  })
  @ApiQuery({
    name: 'subcategoryId',
    required: false,
    description: 'Filter by subcategory ID',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'isFeatured',
    required: false,
    description: 'Filter by featured status',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive offerings',
    type: Boolean,
  })
  async findByCategory(
    @Param('categoryId', ParseCoworsIdPipe) categoryId: string,
    @Query('partnerId') partnerId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('isActive', new DefaultValuePipe(undefined), ParseBoolPipe)
    isActive?: boolean,
    @Query('isFeatured', new DefaultValuePipe(undefined), ParseBoolPipe)
    isFeatured?: boolean,
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
    includeInactive?: boolean,
  ): Promise<PartnerOfferingResponseDto[]> {
    return this.offeringService.findAll(
      partnerId,
      categoryId,
      subcategoryId,
      isActive,
      isFeatured,
      includeInactive,
    );
  }

  @Get('subcategory/:subcategoryId')
  @ApiOperation({ summary: 'Get all offerings for a specific subcategory' })
  @ApiResponse({
    status: 200,
    description: 'List of partner offerings',
    type: [PartnerOfferingResponseDto],
  })
  @ApiParam({ name: 'subcategoryId', description: 'Subcategory ID' })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    description: 'Filter by partner ID',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'isFeatured',
    required: false,
    description: 'Filter by featured status',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive offerings',
    type: Boolean,
  })
  async findBySubcategory(
    @Param('subcategoryId', ParseCoworsIdPipe) subcategoryId: string,
    @Query('partnerId') partnerId?: string,
    @Query('isActive', new DefaultValuePipe(undefined), ParseBoolPipe)
    isActive?: boolean,
    @Query('isFeatured', new DefaultValuePipe(undefined), ParseBoolPipe)
    isFeatured?: boolean,
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
    includeInactive?: boolean,
  ): Promise<PartnerOfferingResponseDto[]> {
    return this.offeringService.findAll(
      partnerId,
      undefined,
      subcategoryId,
      isActive,
      isFeatured,
      includeInactive,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a partner offering' })
  @ApiResponse({
    status: 200,
    description: 'Partner offering updated successfully',
    type: PartnerOfferingResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Partner offering not found' })
  @ApiConflictResponse({
    description: 'Offering with this slug already exists for the partner',
  })
  @ApiParam({ name: 'id', description: 'Partner offering ID' })
  async update(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdatePartnerOfferingDto,
  ): Promise<PartnerOfferingResponseDto> {
    return this.offeringService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a partner offering' })
  @ApiResponse({
    status: 204,
    description: 'Partner offering deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Partner offering not found' })
  @ApiBadRequestResponse({
    description: 'Cannot delete offering with existing bookings',
  })
  @ApiParam({ name: 'id', description: 'Partner offering ID' })
  async remove(@Param('id', ParseCoworsIdPipe) id: string): Promise<void> {
    return this.offeringService.remove(id);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle active status of a partner offering' })
  @ApiResponse({
    status: 200,
    description: 'Partner offering status toggled successfully',
    type: PartnerOfferingResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Partner offering not found' })
  @ApiParam({ name: 'id', description: 'Partner offering ID' })
  async toggleActive(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerOfferingResponseDto> {
    return this.offeringService.toggleActive(id);
  }

  @Patch(':id/toggle-featured')
  @ApiOperation({ summary: 'Toggle featured status of a partner offering' })
  @ApiResponse({
    status: 200,
    description: 'Partner offering featured status toggled successfully',
    type: PartnerOfferingResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Partner offering not found' })
  @ApiParam({ name: 'id', description: 'Partner offering ID' })
  async toggleFeatured(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerOfferingResponseDto> {
    return this.offeringService.toggleFeatured(id);
  }

  @Post('partner/:partnerId/reorder')
  @ApiOperation({ summary: 'Reorder partner offerings' })
  @ApiResponse({
    status: 200,
    description: 'Partner offerings reordered successfully',
    type: [PartnerOfferingResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'Invalid offering IDs or partner mismatch',
  })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  async reorder(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @Body('offeringIds') offeringIds: string[],
  ): Promise<PartnerOfferingResponseDto[]> {
    return this.offeringService.reorder(partnerId, offeringIds);
  }
}
