import { RefundPolicyEntity } from '@/database/entities/refund-policy.entity';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../decorators/auth/get-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { Role as UserRole } from '../user/user.enum';
import {
  CreateRefundPolicyDto,
  RefundCalculationDto,
  UpdateRefundPolicyDto,
} from './dto/refund-policy.dto';
import {
  RefundCalculationInput,
  RefundPolicyService,
} from './refund-policy.service';

@ApiTags('Refund Policies')
@Controller('refund-policies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RefundPolicyController {
  constructor(private readonly refundPolicyService: RefundPolicyService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.Partner, UserRole.Admin)
  @ApiOperation({ summary: 'Create a new refund policy' })
  @ApiResponse({
    status: 201,
    description: 'Refund policy created successfully',
  })
  async createRefundPolicy(
    @GetUser('id') userId: string,
    @Body() createDto: CreateRefundPolicyDto,
  ): Promise<RefundPolicyEntity> {
    return this.refundPolicyService.createRefundPolicy(userId, createDto);
  }

  @Get('partner/:partnerId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Partner, UserRole.Admin)
  @ApiOperation({ summary: 'Get all refund policies for a partner' })
  @ApiResponse({
    status: 200,
    description: 'Refund policies retrieved successfully',
  })
  async getPartnerRefundPolicies(
    @Param('partnerId') partnerId: string,
  ): Promise<RefundPolicyEntity[]> {
    return this.refundPolicyService.getPartnerRefundPolicies(partnerId);
  }

  @Get('partner/:partnerId/default')
  @ApiOperation({ summary: 'Get default refund policy for a partner' })
  @ApiResponse({
    status: 200,
    description: 'Default refund policy retrieved successfully',
  })
  async getDefaultRefundPolicy(
    @Param('partnerId') partnerId: string,
  ): Promise<RefundPolicyEntity | null> {
    return this.refundPolicyService.getDefaultRefundPolicy(partnerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get refund policy by ID' })
  @ApiResponse({
    status: 200,
    description: 'Refund policy retrieved successfully',
  })
  async getRefundPolicyById(
    @Param('id') id: string,
  ): Promise<RefundPolicyEntity> {
    return this.refundPolicyService.getRefundPolicyById(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Partner, UserRole.Admin)
  @ApiOperation({ summary: 'Update a refund policy' })
  @ApiResponse({
    status: 200,
    description: 'Refund policy updated successfully',
  })
  async updateRefundPolicy(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateDto: UpdateRefundPolicyDto,
  ): Promise<RefundPolicyEntity> {
    return this.refundPolicyService.updateRefundPolicy(id, userId, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Partner, UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a refund policy' })
  @ApiResponse({
    status: 204,
    description: 'Refund policy deleted successfully',
  })
  async deleteRefundPolicy(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return this.refundPolicyService.deleteRefundPolicy(id, userId);
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate refund amount based on policy' })
  @ApiResponse({
    status: 200,
    description: 'Refund calculation completed successfully',
  })
  async calculateRefund(@Body() calculationDto: RefundCalculationDto) {
    const input: RefundCalculationInput = {
      bookingAmount: calculationDto.bookingAmount,
      bookingStartTime: new Date(calculationDto.bookingStartTime),
      cancellationTime: new Date(calculationDto.cancellationTime),
      partnerId: calculationDto.partnerId,
      spaceType: calculationDto.spaceType,
      isEmergency: calculationDto.isEmergency,
    };

    return this.refundPolicyService.calculateRefund(input);
  }

  @Post('partner/:partnerId/defaults')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Partner, UserRole.Admin)
  @ApiOperation({ summary: 'Create default refund policies for a partner' })
  @ApiResponse({
    status: 201,
    description: 'Default policies created successfully',
  })
  async createDefaultPolicies(
    @Param('partnerId') partnerId: string,
  ): Promise<RefundPolicyEntity[]> {
    return this.refundPolicyService.createDefaultPolicies(partnerId);
  }
}
