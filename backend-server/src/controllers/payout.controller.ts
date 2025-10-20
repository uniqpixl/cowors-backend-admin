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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { PayoutStatus } from '../api/payout/dto/payout.dto';
import { PayoutEntity } from '../database/entities/payout.entity';
import { Roles } from '../decorators/roles.decorator';
import { CreatePayoutDto } from '../dto/create-payout.dto';
import { UpdatePayoutDto } from '../dto/update-payout.dto';
import { RolesGuard } from '../guards/roles.guard';
import { PayoutService } from '../services/payout.service';

@ApiTags('Payouts')
@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @Post()
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Create a new payout' })
  @ApiResponse({
    status: 201,
    description: 'Payout created successfully',
    type: PayoutEntity,
  })
  async create(
    @Body() createPayoutDto: CreatePayoutDto,
    @CurrentUserSession() user: any,
  ): Promise<PayoutEntity> {
    return await this.payoutService.create(createPayoutDto, user.id);
  }

  @Get()
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get all payouts with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PayoutStatus,
    example: PayoutStatus.PENDING,
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Payouts retrieved successfully',
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: PayoutStatus,
    @Query('partnerId') partnerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    payouts: PayoutEntity[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    return await this.payoutService.findAll(
      page,
      limit,
      status,
      partnerId,
      startDateObj,
      endDateObj,
    );
  }

  @Get('summary')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get payout summary and analytics' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2024-01-31',
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Payout summary retrieved successfully',
  })
  async getPayoutSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('partnerId') partnerId?: string,
  ): Promise<{
    totalPayouts: number;
    totalAmount: number;
    totalCommission: number;
    totalFees: number;
    payoutsByStatus: Record<PayoutStatus, number>;
    payoutsByMethod: Record<string, number>;
  }> {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    return await this.payoutService.getPayoutSummary(
      startDateObj,
      endDateObj,
      partnerId,
    );
  }

  @Get('pending')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get all pending payouts' })
  @ApiResponse({
    status: 200,
    description: 'Pending payouts retrieved successfully',
    type: [PayoutEntity],
  })
  async getPendingPayouts(): Promise<PayoutEntity[]> {
    return await this.payoutService.getPendingPayouts();
  }

  @Get('partner/:partnerId')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get payouts for a specific partner' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Partner payouts retrieved successfully',
  })
  async findByPartner(
    @Param('partnerId') partnerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @CurrentUserSession() user: any,
  ): Promise<{
    payouts: PayoutEntity[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    // Partners can only view their own payouts
    if (user.role === 'partner' && user.id !== partnerId) {
      throw new Error('Access denied: You can only view your own payouts');
    }

    return await this.payoutService.findByPartner(partnerId, page, limit);
  }

  @Get(':id')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get a specific payout by ID' })
  @ApiResponse({
    status: 200,
    description: 'Payout retrieved successfully',
    type: PayoutEntity,
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUserSession() user: any,
  ): Promise<PayoutEntity> {
    const payout = await this.payoutService.findOne(id);

    // Partners can only view their own payouts
    if (user.role === 'partner' && user.id !== payout.partnerId) {
      throw new Error('Access denied: You can only view your own payouts');
    }

    return payout;
  }

  @Patch(':id')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Update a payout' })
  @ApiResponse({
    status: 200,
    description: 'Payout updated successfully',
    type: PayoutEntity,
  })
  async update(
    @Param('id') id: string,
    @Body() updatePayoutDto: UpdatePayoutDto,
    @CurrentUserSession() user: any,
  ): Promise<PayoutEntity> {
    return await this.payoutService.update(id, updatePayoutDto, user.id);
  }

  @Post(':id/process')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Process a pending payout' })
  @ApiResponse({
    status: 200,
    description: 'Payout processed successfully',
    type: PayoutEntity,
  })
  async processPayout(
    @Param('id') id: string,
    @CurrentUserSession() user: any,
  ): Promise<PayoutEntity> {
    return await this.payoutService.processPayout(id, user.id);
  }

  @Delete(':id')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Delete a payout (only pending payouts)' })
  @ApiResponse({
    status: 200,
    description: 'Payout deleted successfully',
  })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.payoutService.remove(id);
    return { message: 'Payout deleted successfully' };
  }

  @Get('date-range/:startDate/:endDate')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get payouts within a specific date range' })
  @ApiResponse({
    status: 200,
    description: 'Payouts retrieved successfully',
    type: [PayoutEntity],
  })
  async getPayoutsByDateRange(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
  ): Promise<PayoutEntity[]> {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    return await this.payoutService.getPayoutsByDateRange(
      startDateObj,
      endDateObj,
    );
  }
}
