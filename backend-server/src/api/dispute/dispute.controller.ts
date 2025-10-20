import { Role } from '@/api/user/user.enum';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ErrorDto } from '@/common/dto/error.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { RequestWithUser } from '@/common/interfaces/request-with-user.interface';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { DisputeService } from './dispute.service';
import {
  CreateDisputeDto,
  DisputeDto,
  DisputeQueryDto,
  DisputeStatsDto,
  EscalateDisputeDto,
  ResolveDisputeDto,
  UpdateDisputeDto,
} from './dto/dispute.dto';

@ApiTags('Disputes')
@Controller('disputes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dispute' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Dispute created successfully',
    type: DisputeDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    type: ErrorDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or booking not found',
    type: ErrorDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Active dispute already exists',
    type: ErrorDto,
  })
  async create(
    @Body() createDisputeDto: CreateDisputeDto,
    @Request() req: RequestWithUser,
  ): Promise<DisputeDto> {
    return this.disputeService.create(createDisputeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all disputes with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Disputes retrieved successfully',
    type: OffsetPaginatedDto<DisputeDto>,
  })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async findAll(
    @Query() query: DisputeQueryDto,
  ): Promise<OffsetPaginatedDto<DisputeDto>> {
    return this.disputeService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dispute statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dispute statistics retrieved successfully',
    type: DisputeStatsDto,
  })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getStats(): Promise<DisputeStatsDto> {
    return this.disputeService.getStats();
  }

  @Get('my-disputes')
  @ApiOperation({ summary: 'Get current user disputes' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User disputes retrieved successfully',
    type: OffsetPaginatedDto<DisputeDto>,
  })
  async getUserDisputes(
    @Query() query: DisputeQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<OffsetPaginatedDto<DisputeDto>> {
    return this.disputeService.getUserDisputes(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute by ID' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dispute retrieved successfully',
    type: DisputeDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dispute not found',
    type: ErrorDto,
  })
  async findOne(@Param('id') id: string): Promise<DisputeDto> {
    return this.disputeService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update dispute' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dispute updated successfully',
    type: DisputeDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dispute not found',
    type: ErrorDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ErrorDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDisputeDto: UpdateDisputeDto,
    @Request() req: RequestWithUser,
  ): Promise<DisputeDto> {
    return this.disputeService.update(id, updateDisputeDto, req.user.id);
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: 'Escalate dispute to higher authority' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dispute escalated successfully',
    type: DisputeDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dispute not found',
    type: ErrorDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Dispute already escalated',
    type: ErrorDto,
  })
  async escalate(
    @Param('id') id: string,
    @Body() escalateDto: EscalateDisputeDto,
    @Request() req: RequestWithUser,
  ): Promise<DisputeDto> {
    return this.disputeService.escalate(id, escalateDto, req.user.id);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve dispute' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dispute resolved successfully',
    type: DisputeDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dispute not found',
    type: ErrorDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions to resolve dispute',
    type: ErrorDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Dispute already resolved',
    type: ErrorDto,
  })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async resolve(
    @Param('id') id: string,
    @Body() resolveDto: ResolveDisputeDto,
    @Request() req: RequestWithUser,
  ): Promise<DisputeDto> {
    return this.disputeService.resolve(id, resolveDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete dispute (Admin only)' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Dispute deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dispute not found',
    type: ErrorDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only admins can delete disputes',
    type: ErrorDto,
  })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    return this.disputeService.remove(id, req.user.id);
  }

  // Additional endpoints for specific dispute types

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get disputes for a specific booking' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking disputes retrieved successfully',
    type: OffsetPaginatedDto<DisputeDto>,
  })
  async getBookingDisputes(
    @Param('bookingId') bookingId: string,
    @Query() query: DisputeQueryDto,
  ): Promise<OffsetPaginatedDto<DisputeDto>> {
    const queryWithBooking = Object.assign({}, query, { bookingId });
    return this.disputeService.findAll(queryWithBooking);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get disputes involving a specific user (Admin/Moderator only)',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User disputes retrieved successfully',
    type: OffsetPaginatedDto<DisputeDto>,
  })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getSpecificUserDisputes(
    @Param('userId') userId: string,
    @Query() query: DisputeQueryDto,
  ): Promise<OffsetPaginatedDto<DisputeDto>> {
    return this.disputeService.getUserDisputes(userId, query);
  }

  @Get('assigned/me')
  @ApiOperation({
    summary: 'Get disputes assigned to current user (Admin/Moderator only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assigned disputes retrieved successfully',
    type: OffsetPaginatedDto<DisputeDto>,
  })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getAssignedDisputes(
    @Query() query: DisputeQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<OffsetPaginatedDto<DisputeDto>> {
    const queryWithAssigned = Object.assign({}, query, {
      assignedTo: req.user.id,
    });
    return this.disputeService.findAll(queryWithAssigned);
  }

  @Get('escalated/all')
  @ApiOperation({ summary: 'Get all escalated disputes (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Escalated disputes retrieved successfully',
    type: OffsetPaginatedDto<DisputeDto>,
  })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async getEscalatedDisputes(
    @Query() query: DisputeQueryDto,
  ): Promise<OffsetPaginatedDto<DisputeDto>> {
    const queryWithEscalated = Object.assign({}, query, { isEscalated: true });
    return this.disputeService.findAll(queryWithEscalated);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign dispute to moderator/admin' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dispute assigned successfully',
    type: DisputeDto,
  })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async assignDispute(
    @Param('id') id: string,
    @Body('assignedTo') assignedTo: string,
    @Request() req: RequestWithUser,
  ): Promise<DisputeDto> {
    return this.disputeService.update(id, { assignedTo }, req.user.id);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen a resolved dispute (Admin only)' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dispute reopened successfully',
    type: DisputeDto,
  })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async reopenDispute(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: RequestWithUser,
  ): Promise<DisputeDto> {
    return this.disputeService.update(
      id,
      {
        status: 'UNDER_REVIEW' as any,
        timeline: [
          {
            event: 'Dispute reopened',
            timestamp: new Date(),
            actor: 'Admin',
            details: reason || 'Dispute reopened by admin',
          },
        ],
      },
      req.user.id,
    );
  }
}
