import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
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
import { Role as UserRole } from '../../api/user/user.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import { Roles } from '../../decorators/roles.decorator';
import { CreatePartnerTypeDto } from '../../dto/partner-type/create-partner-type.dto';
import { PartnerTypeResponseDto } from '../../dto/partner-type/partner-type-response.dto';
import { UpdatePartnerTypeDto } from '../../dto/partner-type/update-partner-type.dto';
import { RolesGuard } from '../../guards/roles.guard';
import { AdminPartnerTypeService } from './admin-partner-type.service';
import {
  AdminBulkPartnerTypeActionDto,
  AdminPartnerTypeAnalyticsDto,
  AdminPartnerTypeListResponseDto,
  AdminPartnerTypeQueryDto,
  AdminReorderPartnerTypesDto,
} from './dto/admin-partner-type.dto';

@ApiTags('Admin Partner Types')
@Controller({ path: 'admin/partner-types', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin)
@ApiBearerAuth()
export class AdminPartnerTypeController {
  constructor(
    private readonly adminPartnerTypeService: AdminPartnerTypeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all partner types with admin filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner types retrieved successfully',
    type: AdminPartnerTypeListResponseDto,
  })
  @ApiQuery({ type: AdminPartnerTypeQueryDto })
  async findAll(
    @Query() query: AdminPartnerTypeQueryDto,
  ): Promise<AdminPartnerTypeListResponseDto> {
    return await this.adminPartnerTypeService.findAllWithFilters(query);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get partner type analytics and statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner type analytics retrieved successfully',
    type: AdminPartnerTypeAnalyticsDto,
  })
  async getAnalytics(): Promise<AdminPartnerTypeAnalyticsDto> {
    return await this.adminPartnerTypeService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get partner type by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner type retrieved successfully',
    type: PartnerTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner type not found',
  })
  @ApiParam({ name: 'id', description: 'Partner type ID' })
  async findById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerTypeResponseDto> {
    return await this.adminPartnerTypeService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new partner type' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Partner type created successfully',
    type: PartnerTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Partner type with this name or slug already exists',
  })
  async create(
    @Body() createDto: CreatePartnerTypeDto,
  ): Promise<PartnerTypeResponseDto> {
    return await this.adminPartnerTypeService.create(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update partner type' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner type updated successfully',
    type: PartnerTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner type not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Partner type with this name or slug already exists',
  })
  @ApiParam({ name: 'id', description: 'Partner type ID' })
  async update(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdatePartnerTypeDto,
  ): Promise<PartnerTypeResponseDto> {
    return await this.adminPartnerTypeService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete partner type' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Partner type deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner type not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete partner type with dependencies',
  })
  @ApiParam({ name: 'id', description: 'Partner type ID' })
  async delete(@Param('id', ParseCoworsIdPipe) id: string): Promise<void> {
    await this.adminPartnerTypeService.delete(id);
  }

  @Put(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle partner type active status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner type status toggled successfully',
    type: PartnerTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner type not found',
  })
  @ApiParam({ name: 'id', description: 'Partner type ID' })
  async toggleStatus(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerTypeResponseDto> {
    return await this.adminPartnerTypeService.toggleStatus(id);
  }

  @Post('bulk-action')
  @ApiOperation({ summary: 'Perform bulk actions on partner types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk action performed successfully',
    schema: {
      type: 'object',
      properties: {
        affected: {
          type: 'number',
          description: 'Number of affected records',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk action or dependencies exist',
  })
  async bulkAction(
    @Body() bulkActionDto: AdminBulkPartnerTypeActionDto,
  ): Promise<{ affected: number }> {
    return await this.adminPartnerTypeService.bulkAction(bulkActionDto);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder partner types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner types reordered successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid partner type IDs provided',
  })
  async reorder(
    @Body() reorderDto: AdminReorderPartnerTypesDto,
  ): Promise<void> {
    await this.adminPartnerTypeService.reorder(reorderDto);
  }
}
