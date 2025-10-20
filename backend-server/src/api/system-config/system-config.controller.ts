import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '@/auth/auth.guard';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import { CreateSystemConfigDto } from './dto/create-system-config.dto';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { SystemConfigService } from './system-config.service';

@ApiTags('System Configuration')
@Controller('admin/config')
@UseGuards(AuthGuard, RolesGuard)
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Post()
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create a new system configuration' })
  @ApiResponse({
    status: 201,
    description: 'Configuration created successfully',
  })
  async create(@Body() createDto: CreateSystemConfigDto) {
    return this.systemConfigService.create(createDto);
  }

  @Get()
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get all system configurations' })
  @ApiResponse({
    status: 200,
    description: 'Configurations retrieved successfully',
  })
  async findAll() {
    return this.systemConfigService.getAllConfigsGrouped();
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public system configurations' })
  @ApiResponse({
    status: 200,
    description: 'Public configurations retrieved successfully',
  })
  async getPublicConfigs() {
    return this.systemConfigService.getPublicConfigs();
  }

  @Get('category/:category')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get configurations by category' })
  @ApiResponse({
    status: 200,
    description: 'Category configurations retrieved successfully',
  })
  async findByCategory(@Param('category') category: string) {
    return this.systemConfigService.findByCategory(category);
  }

  @Get(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get a system configuration by ID' })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async findOne(@Param('id') id: string) {
    return this.systemConfigService.findOne(id);
  }

  @Put(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update a system configuration' })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSystemConfigDto,
  ) {
    return this.systemConfigService.update(id, updateDto);
  }

  @Put('category/:category/key/:key')
  @Roles('admin', 'super_admin')
  @ApiOperation({
    summary: 'Update a system configuration by category and key',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async updateByKey(
    @Param('category') category: string,
    @Param('key') key: string,
    @Body() updateDto: UpdateSystemConfigDto,
  ) {
    return this.systemConfigService.updateByKey(category, key, updateDto);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Delete a system configuration' })
  @ApiResponse({
    status: 200,
    description: 'Configuration deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async remove(@Param('id') id: string) {
    await this.systemConfigService.remove(id);
    return { message: 'Configuration deleted successfully' };
  }

  @Post('reset')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Reset all configurations to defaults' })
  @ApiResponse({
    status: 200,
    description: 'Configurations reset successfully',
  })
  async resetToDefaults() {
    await this.systemConfigService.resetToDefaults();
    return { message: 'Configurations reset to defaults successfully' };
  }
}
