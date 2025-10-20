import { AuthGuard } from '@/auth/auth.guard';
import {
  CityEntity,
  LaunchStatus,
  TierClassification,
} from '@/database/entities/city.entity';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@ApiTags('Cities')
@Controller('serviceable-cities')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List serviceable cities' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: LaunchStatus,
    description: 'Filter by launch status',
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Filter by state name (ILIKE)',
  })
  @ApiQuery({
    name: 'tier',
    required: false,
    enum: TierClassification,
    description: 'Filter by tier classification',
  })
  @ApiResponse({
    status: 200,
    description: 'Serviceable cities fetched',
    type: [CityEntity],
  })
  async list(
    @Query('status') status?: LaunchStatus,
    @Query('state') state?: string,
    @Query('tier') tier?: TierClassification,
  ) {
    return this.citiesService.list({ status, state, tier });
  }

  @Post()
  @ApiOperation({ summary: 'Create a serviceable city' })
  @ApiResponse({ status: 201, description: 'City created', type: CityEntity })
  async create(@Body() dto: CreateCityDto) {
    return this.citiesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a serviceable city' })
  @ApiResponse({ status: 200, description: 'City updated', type: CityEntity })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateCityDto,
  ) {
    return this.citiesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a serviceable city' })
  @ApiResponse({ status: 204, description: 'City deleted' })
  @HttpCode(204)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.citiesService.remove(id);
  }
}
