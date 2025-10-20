import { AuthGuard } from '@/auth/auth.guard';
import { UserSession } from '@/auth/auth.type';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { BookingEntity } from '@/database/entities/booking.entity';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
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
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AvailabilityResponseDto,
  BookingDto,
  BookingKycStatusDto,
  CheckAvailabilityDto,
  CreateBookingDto,
  CursorPaginatedBookingDto,
  OffsetPaginatedBookingDto,
  QueryBookingsCursorDto,
  QueryBookingsOffsetDto,
  UpdateBookingDto,
} from './booking.dto';
import { BookingService } from './booking.service';

@ApiTags('Bookings')
@Controller('v1/bookings')
@UseGuards(AuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('check-availability')
  @ApiOperation({ summary: 'Check space availability' })
  @ApiResponse({ status: 200, type: AvailabilityResponseDto })
  async checkAvailability(
    @Body() checkAvailabilityDto: CheckAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    return this.bookingService.checkAvailability(checkAvailabilityDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, type: BookingDto })
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUserSession() user: UserSession,
  ) {
    return this.bookingService.createBooking(
      user.user.id as Uuid,
      createBookingDto,
    );
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest bookings' })
  @ApiResponse({ status: 200, type: [BookingEntity] })
  async getLatestBookings(
    @Query('limit') limit: string = '5',
  ): Promise<BookingEntity[]> {
    const limitNum = parseInt(limit, 10) || 5;
    return this.bookingService.getLatestBookings(limitNum);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings with pagination' })
  @ApiOkResponse({ type: OffsetPaginatedBookingDto })
  async findAllBookings(
    @Query() queryDto: QueryBookingsOffsetDto,
  ): Promise<OffsetPaginatedDto<BookingEntity>> {
    return this.bookingService.findAllBookings(queryDto);
  }

  @Get('cursor')
  @ApiOperation({ summary: 'Get all bookings with cursor pagination' })
  @ApiOkResponse({ type: CursorPaginatedBookingDto })
  async findAllBookingsCursor(
    @Query() queryDto: QueryBookingsCursorDto,
  ): Promise<CursorPaginatedDto<BookingEntity>> {
    return this.bookingService.findAllBookingsCursor(queryDto);
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get current user bookings' })
  @ApiResponse({ status: 200, type: OffsetPaginatedBookingDto })
  async getMyBookings(
    @Query() queryDto: QueryBookingsOffsetDto,
    @CurrentUserSession() user: UserSession,
  ) {
    return this.bookingService.findBookingsByUserId(
      user.user.id as Uuid,
      queryDto,
      user,
    );
  }

  @Get('partner/:partnerId')
  @ApiOperation({ summary: 'Get bookings for a specific partner' })
  @ApiResponse({ status: 200, type: OffsetPaginatedBookingDto })
  async getPartnerBookings(
    @Param('partnerId') partnerId: string,
    @Query() queryDto: QueryBookingsOffsetDto,
    @CurrentUserSession() user: UserSession,
  ) {
    return this.bookingService.findBookingsByPartnerId(
      partnerId as Uuid,
      queryDto,
      user,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, type: BookingDto })
  async findOneBooking(@Param('id') id: string) {
    return this.bookingService.findOneBooking(id as Uuid);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update booking' })
  @ApiResponse({ status: 200, type: BookingDto })
  async updateBooking(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentUserSession() user: UserSession,
  ) {
    return this.bookingService.updateBooking(
      id as Uuid,
      updateBookingDto,
      user,
    );
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm booking (partner only)' })
  @ApiResponse({ status: 200, type: BookingDto })
  async confirmBooking(
    @Param('id') id: string,
    @CurrentUserSession() user: UserSession,
  ) {
    return this.bookingService.confirmBooking(id as Uuid, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({ status: 200, type: BookingDto })
  async cancelBooking(
    @Param('id') id: string,
    @CurrentUserSession() user: UserSession,
  ) {
    return this.bookingService.cancelBooking(id as Uuid, user);
  }

  @Get(':id/kyc-status')
  @ApiOperation({ summary: 'Get KYC status for a booking' })
  @ApiResponse({ status: 200, type: BookingKycStatusDto })
  async getBookingKycStatus(
    @Param('id') id: string,
    @CurrentUserSession() user: UserSession,
  ) {
    return this.bookingService.getBookingKycStatus(id as Uuid, user);
  }

  @Post(':id/require-kyc')
  @ApiOperation({
    summary: 'Mark booking as requiring KYC verification (partner only)',
  })
  @ApiResponse({ status: 200, type: BookingDto })
  async requireKycForBooking(
    @Param('id') id: string,
    @CurrentUserSession() user: UserSession,
  ) {
    return this.bookingService.requireKycForBooking(id as Uuid, user);
  }
}
