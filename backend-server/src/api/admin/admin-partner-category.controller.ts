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
import { CreatePartnerCategoryDto } from '../../dto/partner-category/create-partner-category.dto';
import { PartnerCategoryResponseDto } from '../../dto/partner-category/partner-category-response.dto';
import { UpdatePartnerCategoryDto } from '../../dto/partner-category/update-partner-category.dto';
import { RolesGuard } from '../../guards/roles.guard';
import { AdminPartnerCategoryService } from './admin-partner-category.service';
import {
  AdminBulkPartnerCategoryActionDto,
  AdminCategoryUsageAnalyticsDto,
  AdminPartnerCategoryAnalyticsDto,
  AdminPartnerCategoryListResponseDto,
  AdminPartnerCategoryQueryDto,
  AdminReorderPartnerCategoriesDto,
  AdminUpdateRuleTemplatesDto,
} from './dto/admin-partner-category.dto';

@ApiTags('Admin Partner Categories')
@Controller({ path: 'admin/partner-categories', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin)
@ApiBearerAuth()
export class AdminPartnerCategoryController {
  constructor(
    private readonly adminPartnerCategoryService: AdminPartnerCategoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all partner categories with admin filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner categories retrieved successfully',
    type: AdminPartnerCategoryListResponseDto,
  })
  @ApiQuery({ type: AdminPartnerCategoryQueryDto })
  async findAll(
    @Query() query: AdminPartnerCategoryQueryDto,
  ): Promise<AdminPartnerCategoryListResponseDto> {
    return await this.adminPartnerCategoryService.findAllWithFilters(query);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get partner category analytics and statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner category analytics retrieved successfully',
    type: AdminPartnerCategoryAnalyticsDto,
  })
  async getAnalytics(): Promise<AdminPartnerCategoryAnalyticsDto> {
    return await this.adminPartnerCategoryService.getStatistics();
  }

  @Get('usage-analytics')
  @ApiOperation({ summary: 'Get category usage analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category usage analytics retrieved successfully',
    type: [AdminCategoryUsageAnalyticsDto],
  })
  async getUsageAnalytics(): Promise<AdminCategoryUsageAnalyticsDto[]> {
    return await this.adminPartnerCategoryService.getCategoryUsageAnalytics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get partner category by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner category retrieved successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner category not found',
  })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  async findById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerCategoryResponseDto> {
    return await this.adminPartnerCategoryService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new partner category' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Partner category created successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Partner category with this name or slug already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid partner type ID',
  })
  async create(
    @Body() createDto: CreatePartnerCategoryDto,
  ): Promise<PartnerCategoryResponseDto> {
    return await this.adminPartnerCategoryService.create(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update partner category' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner category updated successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner category not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Partner category with this name or slug already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid partner type ID',
  })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  async update(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdatePartnerCategoryDto,
  ): Promise<PartnerCategoryResponseDto> {
    return await this.adminPartnerCategoryService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete partner category' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Partner category deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner category not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete partner category with dependencies',
  })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  async delete(@Param('id', ParseCoworsIdPipe) id: string): Promise<void> {
    await this.adminPartnerCategoryService.delete(id);
  }

  @Put(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle partner category active status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner category status toggled successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner category not found',
  })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  async toggleStatus(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerCategoryResponseDto> {
    return await this.adminPartnerCategoryService.toggleStatus(id);
  }

  @Post('bulk-action')
  @ApiOperation({ summary: 'Perform bulk actions on partner categories' })
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
    @Body() bulkActionDto: AdminBulkPartnerCategoryActionDto,
  ): Promise<{ affected: number }> {
    return await this.adminPartnerCategoryService.bulkAction(bulkActionDto);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder partner categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner categories reordered successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid partner category IDs provided',
  })
  async reorder(
    @Body() reorderDto: AdminReorderPartnerCategoriesDto,
  ): Promise<void> {
    await this.adminPartnerCategoryService.reorder(reorderDto);
  }

  @Put(':id/rule-templates')
  @ApiOperation({ summary: 'Update rule templates for partner category' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rule templates updated successfully',
    type: PartnerCategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner category not found',
  })
  @ApiParam({ name: 'id', description: 'Partner category ID' })
  async updateRuleTemplates(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateRuleTemplatesDto: AdminUpdateRuleTemplatesDto,
  ): Promise<PartnerCategoryResponseDto> {
    return await this.adminPartnerCategoryService.updateRuleTemplates(
      id,
      updateRuleTemplatesDto,
    );
  }
}
