import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { Role } from '../../api/user/user.enum';
import { CreatePartnerAddonDto } from '../../dto/partner-addon/create-partner-addon.dto';
import { PartnerAddonResponseDto } from '../../dto/partner-addon/partner-addon-response.dto';
import { UpdatePartnerAddonDto } from '../../dto/partner-addon/update-partner-addon.dto';
import { PartnerAddonService } from '../../services/partner-addon.service';

@ApiTags('Partner Addons')
@Controller('partner/addons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Partner)
@ApiBearerAuth()
export class PartnerAddonController {
  constructor(private readonly partnerAddonService: PartnerAddonService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new addon for partner offering' })
  @ApiResponse({
    status: 201,
    description: 'Addon created successfully',
    type: PartnerAddonResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Addon already exists' })
  async create(
    @Body() createPartnerAddonDto: CreatePartnerAddonDto,
    @CurrentUserSession() userSession: CurrentUserSession,
  ): Promise<PartnerAddonResponseDto> {
    return this.partnerAddonService.createForPartner(
      createPartnerAddonDto,
      userSession.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all addons for partner offerings' })
  @ApiQuery({
    name: 'offeringId',
    required: false,
    type: String,
    description: 'Filter by offering ID',
  })
  @ApiQuery({
    name: 'addonType',
    required: false,
    type: String,
    description:
      'Filter by addon type (FOOD, BEVERAGE, EQUIPMENT, SERVICE, AMENITY)',
  })
  @ApiQuery({
    name: 'isAvailable',
    required: false,
    type: Boolean,
    description: 'Filter by availability status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Partner addons retrieved successfully',
    type: [PartnerAddonResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query('offeringId') offeringId?: string,
    @Query('addonType') addonType?: string,
    @Query('isAvailable') isAvailable?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUserSession() userSession?: CurrentUserSession,
  ): Promise<PartnerAddonResponseDto[]> {
    return this.partnerAddonService.findAllForPartner(userSession.user.id, {
      offeringId,
      addonType,
      isAvailable,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get addon by ID' })
  @ApiParam({ name: 'id', description: 'Addon ID' })
  @ApiResponse({
    status: 200,
    description: 'Addon retrieved successfully',
    type: PartnerAddonResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Addon not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUserSession() userSession: CurrentUserSession,
  ): Promise<PartnerAddonResponseDto> {
    return this.partnerAddonService.findOneForPartner(id, userSession.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update addon' })
  @ApiParam({ name: 'id', description: 'Addon ID' })
  @ApiResponse({
    status: 200,
    description: 'Addon updated successfully',
    type: PartnerAddonResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Addon not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePartnerAddonDto: UpdatePartnerAddonDto,
    @CurrentUserSession() userSession: CurrentUserSession,
  ): Promise<PartnerAddonResponseDto> {
    return this.partnerAddonService.updateForPartner(
      id,
      updatePartnerAddonDto,
      userSession.user.id,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete addon' })
  @ApiParam({ name: 'id', description: 'Addon ID' })
  @ApiResponse({ status: 200, description: 'Addon deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Addon not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUserSession() userSession: CurrentUserSession,
  ): Promise<void> {
    return this.partnerAddonService.removeForPartner(id, userSession.user.id);
  }

  @Patch(':id/toggle-availability')
  @ApiOperation({ summary: 'Toggle addon availability' })
  @ApiParam({ name: 'id', description: 'Addon ID' })
  @ApiResponse({
    status: 200,
    description: 'Addon availability toggled successfully',
    type: PartnerAddonResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Addon not found' })
  async toggleAvailability(
    @Param('id') id: string,
    @CurrentUserSession() userSession: CurrentUserSession,
  ): Promise<PartnerAddonResponseDto> {
    return this.partnerAddonService.toggleAvailabilityForPartner(
      id,
      userSession.user.id,
    );
  }

  @Get('offering/:offeringId')
  @ApiOperation({ summary: 'Get all addons for a specific offering' })
  @ApiParam({ name: 'offeringId', description: 'Offering ID' })
  @ApiQuery({
    name: 'includeUnavailable',
    required: false,
    type: Boolean,
    description: 'Include unavailable addons',
  })
  @ApiResponse({
    status: 200,
    description: 'Offering addons retrieved successfully',
    type: [PartnerAddonResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Offering not found' })
  async findByOffering(
    @Param('offeringId') offeringId: string,
    @Query('includeUnavailable') includeUnavailable?: boolean,
    @CurrentUserSession() userSession?: CurrentUserSession,
  ): Promise<PartnerAddonResponseDto[]> {
    return this.partnerAddonService.findByOfferingForPartner(
      offeringId,
      userSession.user.id,
      { includeUnavailable },
    );
  }

  @Patch('offering/:offeringId/reorder')
  @ApiOperation({ summary: 'Reorder addons for an offering' })
  @ApiParam({ name: 'offeringId', description: 'Offering ID' })
  @ApiResponse({ status: 200, description: 'Addons reordered successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Offering not found' })
  async reorderAddons(
    @Param('offeringId') offeringId: string,
    @Body() reorderData: { addonIds: string[] },
    @CurrentUserSession() userSession: CurrentUserSession,
  ): Promise<void> {
    return this.partnerAddonService.reorderAddonsForPartner(
      offeringId,
      reorderData.addonIds,
      userSession.user.id,
    );
  }
}
