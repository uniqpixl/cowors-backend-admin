import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { OffsetPaginationDto } from '../../common/dto/offset-pagination/offset-pagination.dto';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import { Roles } from '../../decorators/roles.decorator';
import {
  CreatePricingRuleDto,
  PricingCalculationRequestDto,
  PricingCalculationResponseDto,
  PricingRuleResponseDto,
  UpdatePricingRuleDto,
} from '../../dto/dynamic-pricing.dto';
import { RolesGuard } from '../../guards/roles.guard';
import { DynamicPricingService } from '../../services/dynamic-pricing.service';
import { Role } from '../user/user.enum';

@ApiTags('Dynamic Pricing')
@Controller('dynamic-pricing')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class DynamicPricingController {
  constructor(private readonly dynamicPricingService: DynamicPricingService) {}

  private convertDtoToEntity(
    dto: CreatePricingRuleDto | UpdatePricingRuleDto,
  ): any {
    const entityData: any = { ...dto };

    // Convert string dates to Date objects
    if (dto.validFrom) {
      entityData.validFrom = new Date(dto.validFrom);
    }
    if ('validUntil' in dto && dto.validUntil) {
      entityData.validTo = new Date(dto.validUntil);
      delete entityData.validUntil; // Remove the DTO property
    }

    return entityData;
  }

  @Post('rules')
  @UseGuards(RolesGuard)
  @Roles(Role.Partner, Role.Admin)
  @ApiOperation({ summary: 'Create a new pricing rule' })
  @ApiResponse({
    status: 201,
    description: 'Pricing rule created successfully',
    type: PricingRuleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async createPricingRule(
    @Request() req: any,
    @Body() createPricingRuleDto: CreatePricingRuleDto,
  ): Promise<PricingRuleResponseDto> {
    try {
      const partnerId = req.user.role === Role.Partner ? req.user.id : null;

      if (!partnerId && req.user.role !== Role.Admin) {
        throw new HttpException(
          'Only partners and admins can create pricing rules',
          HttpStatus.FORBIDDEN,
        );
      }

      const ruleData = this.convertDtoToEntity(createPricingRuleDto);
      const rule = await this.dynamicPricingService.createPricingRule(
        partnerId || req.body.partnerId,
        ruleData,
      );

      return this.mapEntityToResponse(rule);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create pricing rule',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('rules')
  @UseGuards(RolesGuard)
  @Roles(Role.Partner, Role.Admin)
  @ApiOperation({ summary: 'Get pricing rules for partner' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'spaceId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Pricing rules retrieved successfully',
    type: [PricingRuleResponseDto],
  })
  async getPricingRules(
    @Request() req: any,
    @Query() pagination: OffsetPaginationDto,
    @Query('spaceId') spaceId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    try {
      const partnerId = req.user.role === Role.Partner ? req.user.id : null;

      const rules = await this.dynamicPricingService.getPricingRules(
        partnerId,
        {
          spaceId,
          isActive,
        },
        pagination,
      );

      return {
        data: rules.data.map((rule) => this.mapEntityToResponse(rule)),
        pagination: rules.pagination,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve pricing rules',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('rules/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Partner, Role.Admin)
  @ApiOperation({ summary: 'Get pricing rule by ID' })
  @ApiParam({ name: 'id', description: 'Pricing rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Pricing rule retrieved successfully',
    type: PricingRuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pricing rule not found' })
  async getPricingRule(
    @Request() req: any,
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PricingRuleResponseDto> {
    try {
      const partnerId = req.user.role === Role.Partner ? req.user.id : null;

      const rule = await this.dynamicPricingService.getPricingRule(
        id,
        partnerId,
      );

      if (!rule) {
        throw new HttpException('Pricing rule not found', HttpStatus.NOT_FOUND);
      }

      return this.mapEntityToResponse(rule);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve pricing rule',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('rules/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Partner, Role.Admin)
  @ApiOperation({ summary: 'Update pricing rule' })
  @ApiParam({ name: 'id', description: 'Pricing rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Pricing rule updated successfully',
    type: PricingRuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pricing rule not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async updatePricingRule(
    @Request() req: any,
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updatePricingRuleDto: UpdatePricingRuleDto,
  ): Promise<PricingRuleResponseDto> {
    try {
      const partnerId = req.user.role === Role.Partner ? req.user.id : null;

      const updateData = this.convertDtoToEntity(updatePricingRuleDto);
      const rule = await this.dynamicPricingService.updatePricingRule(
        id,
        updateData,
        partnerId,
      );

      return this.mapEntityToResponse(rule);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update pricing rule',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('rules/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Partner, Role.Admin)
  @ApiOperation({ summary: 'Delete pricing rule' })
  @ApiParam({ name: 'id', description: 'Pricing rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Pricing rule deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Pricing rule not found' })
  async deletePricingRule(
    @Request() req: any,
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<{ message: string }> {
    try {
      const partnerId = req.user.role === Role.Partner ? req.user.id : null;

      await this.dynamicPricingService.deletePricingRule(id, partnerId);

      return { message: 'Pricing rule deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete pricing rule',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('calculate')
  @UseGuards(RolesGuard)
  @Roles(Role.User, Role.Partner, Role.Admin)
  @ApiOperation({ summary: 'Calculate dynamic pricing for a booking' })
  @ApiResponse({
    status: 200,
    description: 'Price calculated successfully',
    type: PricingCalculationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid calculation request' })
  async calculatePrice(
    @Body() calculationRequest: PricingCalculationRequestDto,
  ): Promise<PricingCalculationResponseDto> {
    try {
      const result = await this.dynamicPricingService.calculateDynamicPrice({
        spaceId: calculationRequest.spaceId,
        startDateTime: new Date(calculationRequest.startDateTime),
        endDateTime: new Date(calculationRequest.endDateTime),
        basePrice: calculationRequest.basePrice,
        bookingDuration: calculationRequest.bookingDuration,
      });

      return result;
    } catch (error) {
      throw new HttpException(
        'Failed to calculate pricing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('rules/:id/activate')
  @UseGuards(RolesGuard)
  @Roles(Role.Partner, Role.Admin)
  @ApiOperation({ summary: 'Activate pricing rule' })
  @ApiParam({ name: 'id', description: 'Pricing rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Pricing rule activated successfully',
  })
  async activatePricingRule(
    @Request() req: any,
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<{ message: string }> {
    try {
      const partnerId = req.user.role === Role.Partner ? req.user.id : null;

      await this.dynamicPricingService.updatePricingRule(
        id,
        { isActive: true },
        partnerId,
      );

      return { message: 'Pricing rule activated successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to activate pricing rule',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('rules/:id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.Partner, Role.Admin)
  @ApiOperation({ summary: 'Deactivate pricing rule' })
  @ApiParam({ name: 'id', description: 'Pricing rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Pricing rule deactivated successfully',
  })
  async deactivatePricingRule(
    @Request() req: any,
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<{ message: string }> {
    try {
      const partnerId = req.user.role === Role.Partner ? req.user.id : null;

      await this.dynamicPricingService.updatePricingRule(
        id,
        { isActive: false },
        partnerId,
      );

      return { message: 'Pricing rule deactivated successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to deactivate pricing rule',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private mapEntityToResponse(entity: any): PricingRuleResponseDto {
    return {
      id: entity.id,
      partnerId: entity.partnerId,
      spaceId: entity.spaceId,
      name: entity.name,
      description: entity.description,
      ruleType: entity.ruleType,
      multiplier: entity.multiplier,
      isActive: entity.isActive,
      priority: entity.priority,
      validFrom: entity.validFrom,
      validUntil: entity.validUntil,
      conditions: entity.conditions,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
