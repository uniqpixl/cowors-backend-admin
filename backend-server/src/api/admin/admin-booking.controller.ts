import { Role } from '@/api/user/user.enum';
import { AuthGuard } from '@/auth/auth.guard';
import { UserSession } from '@/auth/auth.type';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  BookingDetailsDto,
  BookingListResponseDto,
  BookingQueryDto,
  BookingStatsDto,
  BookingUpdateDto,
  BulkBookingStatusUpdateDto,
  ExtendBookingDto,
  RefundRequestDto,
  UpdateBookingStatusDto,
} from './dto/booking-management.dto';

@ApiTags('Admin - Bookings')
@Controller({ path: 'admin/bookings', version: '1' })
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
@ApiBearerAuth()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    validateCustomDecorators: true,
  }),
)
export class AdminBookingController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all bookings with filtering, pagination, and search',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bookings retrieved successfully',
    type: BookingListResponseDto,
  })
  async getAllBookings(
    @Query() queryDto: BookingQueryDto,
  ): Promise<BookingListResponseDto> {
    return this.adminService.findAllBookings(queryDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get booking statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking statistics retrieved successfully',
    type: BookingStatsDto,
  })
  async getBookingStats(): Promise<BookingStatsDto> {
    return this.adminService.getBookingStats();
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest bookings for admin dashboard' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Latest bookings retrieved successfully',
  })
  async getLatestBookings(@Query('limit') limit: string = '5'): Promise<any[]> {
    const limitNum = parseInt(limit, 10) || 5;
    return this.adminService.getLatestBookings(limitNum);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent bookings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent bookings retrieved successfully',
  })
  async getRecentBookings(@Query('limit') limit: string = '10') {
    const limitNum = parseInt(limit, 10) || 10;
    return this.adminService.getRecentBookings(limitNum);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending bookings awaiting confirmation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending bookings retrieved successfully',
  })
  async getPendingBookings(): Promise<any> {
    return this.adminService.getPendingBookings();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details by ID' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking details retrieved successfully',
    type: BookingDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  async getBookingById(@Param('id') id: string): Promise<BookingDetailsDto> {
    return this.adminService.findBookingById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update booking information' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking updated successfully',
    type: BookingDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid booking data',
  })
  async updateBooking(
    @Param('id') id: string,
    @Body() updateDto: BookingUpdateDto,
    @CurrentUserSession() session: UserSession,
  ): Promise<BookingDetailsDto> {
    return this.adminService.updateBooking(id, updateDto, session.user.id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking status updated successfully',
    type: BookingDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition',
  })
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateBookingStatusDto,
    @CurrentUserSession() session: UserSession,
  ): Promise<BookingDetailsDto> {
    return this.adminService.updateBookingStatus(
      id,
      statusDto,
      session.user.id,
    );
  }

  @Put('status/update')
  @ApiOperation({ summary: 'Bulk update booking status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bookings status updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        updatedCount: { type: 'number' },
        failedIds: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async bulkUpdateBookingStatus(
    @Body() bulkStatusDto: BulkBookingStatusUpdateDto,
    @CurrentUserSession() session: UserSession,
  ): Promise<{ message: string; updatedCount: number; failedIds: string[] }> {
    return this.adminService.bulkUpdateBookingStatus(
      bulkStatusDto,
      session.user.id,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking cancelled successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Booking cannot be cancelled',
  })
  async cancelBooking(
    @Param('id') id: string,
    @CurrentUserSession() session: UserSession,
  ): Promise<{ message: string }> {
    return this.adminService.cancelBooking(id, session.user.id);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Process booking refund' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Refund processed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Refund cannot be processed',
  })
  async processRefund(
    @Param('id') id: string,
    @Body() refundDto: RefundRequestDto,
    @CurrentUserSession() session: UserSession,
  ): Promise<{ message: string; refundId: string }> {
    return this.adminService.processRefund(id, refundDto, session.user.id);
  }

  @Put(':id/extend')
  @ApiOperation({ summary: 'Extend booking duration' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking extended successfully',
    type: BookingDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Booking cannot be extended',
  })
  async extendBooking(
    @Param('id') id: string,
    @Body() extendDto: ExtendBookingDto,
    @CurrentUserSession() session: UserSession,
  ): Promise<BookingDetailsDto> {
    return this.adminService.extendBooking(id, extendDto, session.user.id);
  }
}
