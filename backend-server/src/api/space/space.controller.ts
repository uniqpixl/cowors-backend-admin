import { AuthGuard } from '@/auth/auth.guard';
import { UserSession } from '@/auth/auth.type';
import { Uuid } from '@/common/types/common.type';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchSpaceDto } from './dto/search-space.dto';
import {
  CreateSpaceDto,
  CursorPaginatedSpaceDto,
  OffsetPaginatedSpaceDto,
  QuerySpacesCursorDto,
  QuerySpacesOffsetDto,
  SpaceDto,
  UpdateSpaceDto,
} from './space.dto';
import { SpaceService } from './space.service';

@ApiTags('Spaces')
@Controller('spaces')
export class SpaceController {
  constructor(private readonly spaceService: SpaceService) {}

  @Post()
  @ApiAuth()
  @ApiOperation({ summary: 'Create a new space' })
  @ApiResponse({
    status: 201,
    description: 'Space created successfully',
    type: SpaceDto,
  })
  async createSpace(
    @Body() createSpaceDto: CreateSpaceDto,
    @CurrentUserSession() user: UserSession,
  ) {
    // Get partner ID from user session
    const partner = await this.spaceService.getPartnerByUserId(
      user.user.id as Uuid,
    );
    return this.spaceService.createSpace(partner.id, createSpaceDto);
  }

  @Get('/test')
  @ApiOperation({ summary: 'Test database connection' })
  async testConnection(): Promise<{ message: string; count: number }> {
    try {
      console.log('Testing database connection...');
      const count = await this.spaceService.getSpaceCount();
      console.log('Database test successful, space count:', count);
      return { message: 'Database connection successful', count };
    } catch (error) {
      console.error('Database test failed:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all spaces with offset pagination' })
  @ApiResponse({
    status: 200,
    description: 'Spaces retrieved successfully',
    type: OffsetPaginatedSpaceDto,
  })
  async findAllSpaces(@Query() query: any) {
    console.log('Controller: findAllSpaces called with raw query:', query);

    // Create a simple queryDto with defaults
    const queryDto = {
      limit: parseInt(query.limit) || 20,
      page: parseInt(query.page) || 1,
      spaceType: query.spaceType,
      minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
      city: query.city,
      amenities: query.amenities,
      q: query.q,
    };

    console.log('Controller: Processed queryDto:', queryDto);

    try {
      const result = await this.spaceService.findAllSpaces(queryDto as any);
      console.log('Controller: findAllSpaces result:', result);
      return result;
    } catch (error) {
      console.error('Controller: findAllSpaces error:', error);
      throw error;
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Advanced search for spaces with filters' })
  @ApiResponse({
    status: 200,
    description: 'Spaces search results retrieved successfully',
    type: OffsetPaginatedSpaceDto,
  })
  async searchSpaces(@Query() searchDto: SearchSpaceDto) {
    return this.spaceService.searchSpaces(searchDto);
  }

  @Get('cursor')
  @ApiOperation({ summary: 'Get all spaces with cursor pagination' })
  @ApiResponse({
    status: 200,
    description: 'Spaces retrieved successfully',
    type: CursorPaginatedSpaceDto,
  })
  async findAllSpacesCursor(@Query() queryDto: QuerySpacesCursorDto) {
    return this.spaceService.findAllSpacesCursor(queryDto);
  }

  @Get('my-spaces')
  @ApiAuth()
  @ApiOperation({ summary: 'Get current user spaces' })
  @ApiResponse({
    status: 200,
    description: 'User spaces retrieved successfully',
    type: OffsetPaginatedSpaceDto,
  })
  async getMySpaces(
    @Query() queryDto: QuerySpacesOffsetDto,
    @CurrentUserSession() user: UserSession,
  ) {
    return this.spaceService.findSpacesByUserId(
      user.user.id as Uuid,
      queryDto,
      user,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get space by ID' })
  @ApiResponse({
    status: 200,
    description: 'Space retrieved successfully',
    type: SpaceDto,
  })
  async findOneSpace(@Param('id') id: string) {
    return this.spaceService.findOneSpace(id as Uuid);
  }

  @Put(':id')
  @ApiAuth()
  @ApiOperation({ summary: 'Update space' })
  @ApiResponse({
    status: 200,
    description: 'Space updated successfully',
    type: SpaceDto,
  })
  async updateSpace(
    @Param('id') id: string,
    @Body() updateSpaceDto: UpdateSpaceDto,
    @CurrentUserSession() user: UserSession,
  ) {
    return this.spaceService.updateSpace(id as Uuid, updateSpaceDto, user);
  }

  @Delete(':id')
  @ApiAuth()
  @ApiOperation({ summary: 'Delete space' })
  @ApiResponse({ status: 200, description: 'Space deleted successfully' })
  async deleteSpace(
    @Param('id') id: string,
    @CurrentUserSession() user: UserSession,
  ) {
    return this.spaceService.deleteSpace(id as Uuid, user);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check space availability' })
  @ApiResponse({
    status: 200,
    description: 'Space availability retrieved successfully',
  })
  async checkAvailability(
    @Param('id') id: string,
    @Query('date') date: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.spaceService.checkAvailability(
      id as Uuid,
      new Date(date),
      startTime,
      endTime,
    );
  }
}
