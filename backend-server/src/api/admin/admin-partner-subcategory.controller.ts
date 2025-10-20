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
import { CreatePartnerSubcategoryDto } from '../../dto/partner-subcategory/create-partner-subcategory.dto';
import { PartnerSubcategoryResponseDto } from '../../dto/partner-subcategory/partner-subcategory-response.dto';
import { UpdatePartnerSubcategoryDto } from '../../dto/partner-subcategory/update-partner-subcategory.dto';
import { RolesGuard } from '../../guards/roles.guard';
import { AdminPartnerSubcategoryService } from './admin-partner-subcategory.service';
import {
  AdminBulkPartnerSubcategoryActionDto,
  AdminPartnerSubcategoryAnalyticsDto,
  AdminPartnerSubcategoryListResponseDto,
  AdminPartnerSubcategoryQueryDto,
  AdminReorderPartnerSubcategoriesDto,
  AdminSubcategoryPerformanceDto,
  AdminUpdatePartnerSubcategoryDto,
  AdminUpdateRuleOverridesDto,
} from './dto/admin-partner-subcategory.dto';

@ApiTags('Admin Partner Subcategories')
@Controller({ path: 'admin/partner-subcategories', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin)
@ApiBearerAuth()
export class AdminPartnerSubcategoryController {
  constructor(
    private readonly adminPartnerSubcategoryService: AdminPartnerSubcategoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all partner subcategories with admin filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner subcategories retrieved successfully',
    type: AdminPartnerSubcategoryListResponseDto,
  })
  @ApiQuery({ type: AdminPartnerSubcategoryQueryDto })
  async findAll(
    @Query() query: AdminPartnerSubcategoryQueryDto,
  ): Promise<AdminPartnerSubcategoryListResponseDto> {
    return await this.adminPartnerSubcategoryService.findAllWithFilters(query);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get partner subcategory analytics and statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner subcategory analytics retrieved successfully',
    type: AdminPartnerSubcategoryAnalyticsDto,
  })
  async getAnalytics(): Promise<AdminPartnerSubcategoryAnalyticsDto> {
    return await this.adminPartnerSubcategoryService.getStatistics();
  }

  @Get('performance-analytics')
  @ApiOperation({ summary: 'Get subcategory performance analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subcategory performance analytics retrieved successfully',
    type: [AdminSubcategoryPerformanceDto],
  })
  async getPerformanceAnalytics(): Promise<AdminSubcategoryPerformanceDto[]> {
    return await this.adminPartnerSubcategoryService.getPerformanceAnalytics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get partner subcategory by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner subcategory retrieved successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner subcategory not found',
  })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  async findById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerSubcategoryResponseDto> {
    return await this.adminPartnerSubcategoryService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new partner subcategory' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Partner subcategory created successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Partner subcategory with this name or slug already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid partner category ID',
  })
  async create(
    @Body() createDto: CreatePartnerSubcategoryDto,
  ): Promise<PartnerSubcategoryResponseDto> {
    return await this.adminPartnerSubcategoryService.create(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update partner subcategory' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner subcategory updated successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner subcategory not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Partner subcategory with this name or slug already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid partner category ID',
  })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  async update(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: AdminUpdatePartnerSubcategoryDto,
  ): Promise<PartnerSubcategoryResponseDto> {
    return await this.adminPartnerSubcategoryService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete partner subcategory' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Partner subcategory deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner subcategory not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete partner subcategory with dependencies',
  })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  async delete(@Param('id', ParseCoworsIdPipe) id: string): Promise<void> {
    await this.adminPartnerSubcategoryService.delete(id);
  }

  @Put(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle partner subcategory active status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner subcategory status toggled successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner subcategory not found',
  })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  async toggleStatus(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerSubcategoryResponseDto> {
    return await this.adminPartnerSubcategoryService.toggleStatus(id);
  }

  @Post('bulk-action')
  @ApiOperation({ summary: 'Perform bulk actions on partner subcategories' })
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
    @Body() bulkActionDto: AdminBulkPartnerSubcategoryActionDto,
  ): Promise<{ affected: number }> {
    return await this.adminPartnerSubcategoryService.bulkAction(bulkActionDto);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder partner subcategories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner subcategories reordered successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid partner subcategory IDs provided',
  })
  async reorder(
    @Body() reorderDto: AdminReorderPartnerSubcategoriesDto,
  ): Promise<void> {
    await this.adminPartnerSubcategoryService.reorder(reorderDto);
  }

  @Put(':id/rule-overrides')
  @ApiOperation({ summary: 'Update rule overrides for partner subcategory' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rule overrides updated successfully',
    type: PartnerSubcategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner subcategory not found',
  })
  @ApiParam({ name: 'id', description: 'Partner subcategory ID' })
  async updateRuleOverrides(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateRuleOverridesDto: AdminUpdateRuleOverridesDto,
  ): Promise<PartnerSubcategoryResponseDto> {
    return await this.adminPartnerSubcategoryService.updateRuleOverrides(
      id,
      updateRuleOverridesDto,
    );
  }
}
