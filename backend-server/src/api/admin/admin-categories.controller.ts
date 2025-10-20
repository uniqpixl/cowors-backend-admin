import { Role } from '@/api/user/user.enum';
import { AuthGuard } from '@/auth/auth.guard';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('Admin - Categories')
@Controller({ path: 'admin/categories', version: '1' })
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
@ApiBearerAuth()
export class AdminCategoriesController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async getCategories(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<any> {
    return {
      data: [],
      total: 0,
      page: page || 1,
      limit: limit || 10,
      message: 'Categories endpoint implemented',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiResponse({
    status: 200,
    description: 'Category statistics retrieved successfully',
  })
  async getCategoryStats(): Promise<any> {
    return {
      totalCategories: 0,
      activeCategories: 0,
      categoriesWithSpaces: 0,
      topCategories: [],
      message: 'Category stats endpoint implemented',
    };
  }
}
