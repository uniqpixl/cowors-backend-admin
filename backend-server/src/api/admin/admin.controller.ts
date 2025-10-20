import { KycVerificationService } from '@/api/user/kyc-verification.service';
import { Role, UserStatus } from '@/api/user/user.enum';
import { AuthGuard } from '@/auth/auth.guard';
import { UserSession } from '@/auth/auth.type';
import { UserEntity } from '@/auth/entities/user.entity';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { KycStatus } from '@/database/entities/kyc-verification.entity';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { PublicAuth } from '@/decorators/auth/public-auth.decorator';
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
  Put,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import { BookingService } from '../booking/booking.service';
import { PartnerService } from '../partner/partner.service';
import { PaymentService } from '../payment/payment.service';
import { ReviewService } from '../review/review.service';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { AdminService } from './admin.service';
import {
  AdminAnalyticsQueryDto,
  BookingAnalyticsDto,
  PlatformStatsDto,
  RevenueAnalyticsDto,
  TimeSeriesDataPoint,
  UserAnalyticsDto,
} from './dto/admin-analytics.dto';
import {
  AdminInvoiceListResponseDto,
  AdminInvoiceQueryDto,
} from './dto/admin-invoice.dto';
import {
  AdminPayoutListResponseDto,
  AdminPayoutQueryDto,
} from './dto/admin-payout.dto';
import {
  AdminTransactionListResponseDto,
  AdminTransactionQueryDto,
  BulkRefundDto,
  PendingTransactionsQueryDto,
  RefundTransactionDto,
  TransactionAnalyticsDto,
  TransactionDisputeDto,
  TransactionDisputesListResponseDto,
  TransactionDisputesQueryDto,
  TransactionExportDto,
  TransactionExportResponseDto,
  TransactionSearchDto,
  TransactionStatsDto,
} from './dto/admin-transaction.dto';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import {
  AdminUserBanDto,
  AdminUserSuspendDto,
  AdminUserUpdateDto,
} from './dto/admin-user-update.dto';
import {
  AdminUserWalletListResponseDto,
  AdminUserWalletQueryDto,
} from './dto/admin-user-wallet.dto';
import {
  AdminPartnerWalletDto,
  AdminWalletListResponseDto,
  AdminWalletQueryDto,
  BulkWalletActionDto,
  ForcePayoutDto,
  ManualAdjustmentDto,
  UpdateWalletStatusDto,
  WalletStatsDto,
} from './dto/admin-wallet.dto';
import {
  BookingDetailsDto,
  BookingListResponseDto,
  BookingQueryDto,
  BookingStatsDto,
  BookingUpdateDto,
  ExtendBookingDto,
  RefundRequestDto,
  UpdateBookingStatusDto,
} from './dto/booking-management.dto';
import {
  BulkKycReviewDto,
  BulkKycReviewResultDto,
} from './dto/bulk-kyc-review.dto';
import {
  KycProviderStatsDto,
  KycVerificationQueryDto,
} from './dto/kyc-verification-query.dto';
import {
  BulkSpaceStatusUpdateDto,
  SpaceApprovalDto,
  SpaceDetailsDto,
  SpaceListResponseDto,
  SpaceQueryDto,
  SpaceStatsDto,
  SpaceStatusUpdateDto,
  UpdateSpaceDto,
} from './dto/space-management.dto';
import {
  UpdateUserStatusDto,
  UserDetailsDto,
  UserListResponseDto,
  UserStatsDto,
} from './dto/user-management.dto';

@ApiTags('Admin')
@Controller({ path: 'admin', version: '1' })
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
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly kycVerificationService: KycVerificationService,
    private readonly userService: UserService,
    private readonly bookingService: BookingService,
    private readonly partnerService: PartnerService,
    private readonly paymentService: PaymentService,
    private readonly reviewService: ReviewService,
    private readonly walletService: WalletService,
  ) {}

  // User Management Endpoints
  @Get('users')
  @ApiOperation({ summary: 'Get all users with admin filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: UserListResponseDto,
  })
  async getAllUsers(
    @Query() queryDto: AdminUserQueryDto,
  ): Promise<UserListResponseDto> {
    return await this.adminService.findAllUsers(queryDto);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User details retrieved successfully',
    type: UserDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<UserDetailsDto> {
    return this.adminService.findUserById(id);
  }

  @Get('users/search')
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, type: UserListResponseDto })
  async searchUsers(
    @Query('query') query?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const searchDto = {
      query,
      status,
      role,
      startDate,
      endDate,
      page,
      limit,
    };
    return this.adminService.searchUsers(searchDto);
  }

  @Post('users/search')
  @ApiOperation({ summary: 'Search users with advanced filters' })
  @ApiResponse({ status: 200, type: UserListResponseDto })
  async searchUsersAdvanced(@Body() searchDto: any) {
    return this.adminService.searchUsers(searchDto);
  }

  @Get('users/statistics')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User statistics retrieved successfully',
  })
  async getUserStatistics(): Promise<any> {
    return this.adminService.getUserStatistics();
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user details' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async updateUser(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: AdminUserUpdateDto,
    @CurrentUserSession() session: UserSession,
  ): Promise<UserEntity> {
    return this.adminService.updateUser(id, updateDto, session.user.id);
  }

  @Post('users/update-role-by-email')
  @ApiOperation({ summary: 'Update user role by email (temporary endpoint)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User role updated successfully',
    type: UserEntity,
  })
  async updateUserRoleByEmail(
    @Body() body: { email: string; role: string },
  ): Promise<UserEntity> {
    return this.adminService.updateUserRoleByEmail(body.email, body.role);
  }

  @Post('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User banned successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot ban admin users',
  })
  async banUser(
    @Param('id') id: string,
    @Body() banDto: AdminUserBanDto,
  ): Promise<UserEntity> {
    return this.adminService.banUser(id, banDto);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User suspended successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot suspend admin users',
  })
  async suspendUser(
    @Param('id') id: string,
    @Body() suspendDto: AdminUserSuspendDto,
  ): Promise<UserEntity> {
    return this.adminService.suspendUser(id, suspendDto);
  }

  @Post('users/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a banned or suspended user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User reactivated successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async reactivateUser(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<UserEntity> {
    return this.adminService.reactivateUser(id);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Soft delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot delete admin users',
  })
  async deleteUser(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() session: UserSession,
  ): Promise<{ message: string }> {
    return this.adminService.deleteUser(id, session.user.id);
  }

  @Put('users/:id/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User status updated successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateUserStatusDto,
    @CurrentUserSession() session: UserSession,
  ): Promise<UserEntity> {
    return this.adminService.updateUserStatus(
      id,
      statusDto.status,
      statusDto.reason,
      session.user.id,
    );
  }

  @Get('users/:id/transactions')
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User transactions retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserTransactions(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const queryDto = { page, limit };
    return this.adminService.getUserTransactions(id, queryDto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get all transactions with admin filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transactions retrieved successfully',
    type: AdminTransactionListResponseDto,
  })
  async getAllTransactions(
    @Query() queryDto: AdminTransactionQueryDto,
  ): Promise<AdminTransactionListResponseDto> {
    return this.adminService.getAllTransactions(queryDto);
  }

  @Post('transactions/search')
  @ApiOperation({ summary: 'Search transactions with advanced filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction search results retrieved successfully',
    type: AdminTransactionListResponseDto,
  })
  async searchTransactions(
    @Body() searchDto: TransactionSearchDto,
  ): Promise<AdminTransactionListResponseDto> {
    return this.adminService.searchTransactions(searchDto);
  }

  @Get('transactions/stats')
  @ApiOperation({ summary: 'Get transaction statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction statistics retrieved successfully',
    type: TransactionStatsDto,
  })
  async getTransactionStats(): Promise<TransactionStatsDto> {
    return this.adminService.getTransactionStats();
  }

  @Get('transactions/pending')
  @ApiOperation({ summary: 'Get pending transactions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending transactions retrieved successfully',
    type: AdminTransactionListResponseDto,
  })
  async getPendingTransactions(
    @Query() queryDto: PendingTransactionsQueryDto,
  ): Promise<AdminTransactionListResponseDto> {
    return this.adminService.getPendingTransactions(queryDto);
  }

  @Get('transactions/analytics')
  @ApiOperation({ summary: 'Get transaction analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction analytics retrieved successfully',
    type: TransactionAnalyticsDto,
  })
  async getTransactionAnalytics(): Promise<TransactionAnalyticsDto> {
    return this.adminService.getTransactionAnalytics();
  }

  @Post('transactions/refunds')
  @ApiOperation({ summary: 'Process transaction refund' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction refund processed successfully',
  })
  async refundTransaction(
    @Body() refundDto: RefundTransactionDto,
  ): Promise<{ success: boolean; message: string; refundId?: string }> {
    return this.adminService.refundTransaction(refundDto);
  }

  @Post('transactions/refunds/bulk')
  @ApiOperation({ summary: 'Process bulk transaction refunds' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk transaction refunds processed successfully',
  })
  async bulkRefundTransactions(@Body() bulkRefundDto: BulkRefundDto): Promise<{
    success: boolean;
    message: string;
    processedCount: number;
    failedCount: number;
    results: Array<{ transactionId: string; success: boolean; error?: string }>;
  }> {
    return this.adminService.bulkRefundTransactions(bulkRefundDto);
  }

  @Get('transactions/disputes')
  @ApiOperation({ summary: 'Get transaction disputes' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction disputes retrieved successfully',
    type: TransactionDisputesListResponseDto,
  })
  async getTransactionDisputes(
    @Query() queryDto: TransactionDisputesQueryDto,
  ): Promise<TransactionDisputesListResponseDto> {
    return this.adminService.getTransactionDisputes(queryDto);
  }

  @Post('transactions/export')
  @ApiOperation({ summary: 'Export transactions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction export initiated successfully',
    type: TransactionExportResponseDto,
  })
  async exportTransactions(
    @Body() exportDto: TransactionExportDto,
  ): Promise<TransactionExportResponseDto> {
    return this.adminService.exportTransactions(exportDto);
  }

  // Analytics Endpoints
  @Get('dashboard/kpis')
  @ApiOperation({ summary: 'Get admin dashboard KPIs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard KPIs retrieved successfully',
    type: PlatformStatsDto,
  })
  async getDashboardKpis(): Promise<PlatformStatsDto> {
    return this.adminService.getPlatformStats();
  }

  @Get('analytics/booking-trends')
  @ApiOperation({ summary: 'Get booking trends over time' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking trends retrieved successfully',
    type: [BookingAnalyticsDto],
  })
  async getBookingTrends(
    @Query() queryDto: AdminAnalyticsQueryDto,
  ): Promise<TimeSeriesDataPoint[]> {
    return this.adminService.getBookingTrends(queryDto);
  }

  @Get('analytics/revenue-trends')
  @ApiOperation({ summary: 'Get revenue trends over time' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue trends retrieved successfully',
    type: [RevenueAnalyticsDto],
  })
  async getRevenueTrends(
    @Query() queryDto: AdminAnalyticsQueryDto,
  ): Promise<TimeSeriesDataPoint[]> {
    return this.adminService.getRevenueTrends(queryDto);
  }

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue analytics retrieved successfully',
    type: [RevenueAnalyticsDto],
  })
  async getRevenueAnalytics(
    @Query() queryDto: AdminAnalyticsQueryDto,
  ): Promise<RevenueAnalyticsDto[]> {
    return this.adminService.getRevenueAnalytics(queryDto);
  }

  @Get('analytics/user-growth')
  @ApiOperation({ summary: 'Get user growth trends over time' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User growth trends retrieved successfully',
    type: [UserAnalyticsDto],
  })
  async getUserGrowth(
    @Query() queryDto: AdminAnalyticsQueryDto,
  ): Promise<TimeSeriesDataPoint[]> {
    return this.adminService.getUserGrowth(queryDto);
  }

  @Get('analytics/space-utilization')
  @ApiOperation({ summary: 'Get space utilization trends over time' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space utilization trends retrieved successfully',
  })
  async getSpaceUtilization(@Query() queryDto: AdminAnalyticsQueryDto) {
    return this.adminService.getSpaceUtilization(queryDto);
  }

  // Financial Reports
  @Get('financial-reports')
  @ApiOperation({ summary: 'Get financial reports dashboard' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial reports retrieved successfully',
  })
  async getFinancialReports(@Query() queryDto: AdminAnalyticsQueryDto) {
    return this.adminService.getFinancialReports(queryDto);
  }

  @Get('analytics/platform-stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Platform statistics retrieved successfully',
    type: PlatformStatsDto,
  })
  async getPlatformStats(): Promise<PlatformStatsDto> {
    return this.adminService.getPlatformStats();
  }

  @Get('analytics/bookings')
  @ApiOperation({ summary: 'Get comprehensive booking analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking analytics retrieved successfully',
    type: [BookingAnalyticsDto],
  })
  async getBookingAnalytics(
    @Query() queryDto: AdminAnalyticsQueryDto,
  ): Promise<BookingAnalyticsDto[]> {
    return this.adminService.getBookingAnalytics(queryDto);
  }

  @Get('analytics/partners')
  @ApiOperation({ summary: 'Get partner analytics and performance metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner analytics retrieved successfully',
  })
  async getPartnerAnalytics(
    @Query() queryDto: AdminAnalyticsQueryDto,
  ): Promise<any[]> {
    return this.adminService.getPartnerAnalytics(queryDto);
  }

  @Get('analytics/users')
  @ApiOperation({ summary: 'Get comprehensive user analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User analytics retrieved successfully',
    type: [UserAnalyticsDto],
  })
  async getUserAnalytics(
    @Query() queryDto: AdminAnalyticsQueryDto,
  ): Promise<UserAnalyticsDto[]> {
    return this.adminService.getUserAnalytics(queryDto);
  }

  // Analytics endpoints moved to AdminAnalyticsController to avoid route conflicts
  // Partner Management - Moved to AdminPartnerController

  // Space Management Endpoints
  @Get('spaces')
  @ApiOperation({ summary: 'Get all spaces with admin filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Spaces retrieved successfully',
    type: SpaceListResponseDto,
  })
  async getAllSpaces(
    @Query() queryDto: SpaceQueryDto,
  ): Promise<SpaceListResponseDto> {
    return this.adminService.findAllSpaces(queryDto);
  }

  @Get('spaces/stats')
  @ApiOperation({ summary: 'Get space statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space statistics retrieved successfully',
    type: SpaceStatsDto,
  })
  async getSpaceStats(): Promise<SpaceStatsDto> {
    return this.adminService.getSpaceStats();
  }

  @Get('spaces/:id')
  @ApiOperation({ summary: 'Get space details by ID' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space details retrieved successfully',
    type: SpaceDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Space not found',
  })
  async getSpaceById(@Param('id') id: string): Promise<SpaceDetailsDto> {
    return this.adminService.findSpaceById(id);
  }

  @Get('spaces/:id/analytics')
  @ApiOperation({ summary: 'Get analytics for a specific space' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space analytics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Space not found',
  })
  async getSpaceAnalytics(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getSpaceAnalytics(id, startDate, endDate);
  }

  @Get('spaces/:id/bookings')
  @ApiOperation({ summary: 'Get bookings for a specific space' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space bookings retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Space not found',
  })
  async getSpaceBookings(
    @Param('id') id: string,
    @Query('enabled') enabled?: boolean,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getSpaceBookings(id, {
      enabled,
      page,
      limit,
      status,
      startDate,
      endDate,
    });
  }

  @Get('spaces/:id/revenue')
  @ApiOperation({ summary: 'Get revenue analytics for a specific space' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space revenue analytics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Space not found',
  })
  async getSpaceRevenue(
    @Param('id') id: string,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getSpaceRevenue(id, {
      period,
      startDate,
      endDate,
    });
  }

  @Put('spaces/:id')
  @ApiOperation({ summary: 'Update space details' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Space not found',
  })
  async updateSpace(
    @Param('id') id: string,
    @Body() updateDto: UpdateSpaceDto,
    @CurrentUserSession() session: UserSession,
  ) {
    return this.adminService.updateSpace(id, updateDto, session.user.id);
  }

  @Delete('spaces/:id')
  @ApiOperation({ summary: 'Soft delete a space' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Space not found',
  })
  async deleteSpace(
    @Param('id') id: string,
    @CurrentUserSession() session: UserSession,
  ): Promise<{ message: string }> {
    return this.adminService.deleteSpace(id, session.user.id);
  }

  @Put('spaces/:id/status')
  @ApiOperation({ summary: 'Update space status' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space status updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Space not found',
  })
  async updateSpaceStatus(
    @Param('id') id: string,
    @Body() statusDto: SpaceStatusUpdateDto,
    @CurrentUserSession() session: UserSession,
  ) {
    return this.adminService.updateSpaceStatus(id, statusDto, session.user.id);
  }

  @Put('spaces/status/update')
  @ApiOperation({ summary: 'Bulk update space statuses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space statuses updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid space IDs or status',
  })
  async bulkUpdateSpaceStatus(
    @Body() bulkStatusDto: BulkSpaceStatusUpdateDto,
    @CurrentUserSession() session: UserSession,
  ) {
    return this.adminService.bulkUpdateSpaceStatus(
      bulkStatusDto,
      session.user.id,
    );
  }

  @Put('spaces/:id/approve')
  @ApiOperation({ summary: 'Approve a pending space' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space approved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Space not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Space is not in pending status',
  })
  async approveSpace(
    @Param('id') id: string,
    @Body() approvalDto: SpaceApprovalDto,
    @CurrentUserSession() session: UserSession,
  ) {
    return this.adminService.approveSpace(id, approvalDto, session.user.id);
  }

  @Put('spaces/:id/reject')
  @ApiOperation({ summary: 'Reject a pending space' })
  @ApiParam({ name: 'id', description: 'Space ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space rejected successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Space not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Space is not in pending status',
  })
  async rejectSpace(
    @Param('id') id: string,
    @Body() rejectionDto: SpaceApprovalDto,
    @CurrentUserSession() session: UserSession,
  ) {
    return this.adminService.rejectSpace(id, rejectionDto, session.user.id);
  }

  // User Statistics
  @Get('users/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User statistics retrieved successfully',
    type: UserStatsDto,
  })
  async getUserStats(): Promise<UserStatsDto> {
    return this.adminService.getUserStats();
  }

  // User Verification
  @Post('users/:id/verify')
  @ApiOperation({ summary: 'Verify a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User verified successfully',
  })
  async verifyUser(@Param('id') id: string) {
    return this.adminService.verifyUser(id);
  }

  @Post('users/:id/reject-verification')
  @ApiOperation({ summary: 'Reject user verification' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User verification rejected successfully',
  })
  async rejectVerification(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.adminService.rejectVerification(id, body.reason);
  }

  // KYC Verification Management
  @Get('users/verification')
  @ApiOperation({
    summary:
      'Get all user verifications for admin review with advanced filtering',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User verifications retrieved successfully',
  })
  async getAllVerifications(@Query() queryDto: KycVerificationQueryDto) {
    return this.adminService.getAllVerifications(queryDto);
  }

  @Get('users/:userId/verification')
  @ApiOperation({ summary: 'Get user KYC verification details' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User verification details retrieved successfully',
  })
  async getUserVerification(@Param('userId') userId: string) {
    return this.kycVerificationService.getUserVerifications(userId);
  }

  @Post('users/:userId/verification/:verificationId/review')
  @ApiOperation({ summary: 'Review KYC verification' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'verificationId', description: 'Verification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification reviewed successfully',
  })
  async reviewVerification(
    @Param('userId') userId: string,
    @Param('verificationId') verificationId: string,
    @Body()
    body: {
      status: 'approved' | 'rejected';
      notes?: string;
      adminId: string;
    },
  ) {
    return this.adminService.reviewKycVerification(
      verificationId,
      body.status,
      body.notes,
      body.adminId,
    );
  }

  @Get('users/verification/stats')
  @ApiOperation({ summary: 'Get KYC verification statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KYC verification statistics retrieved successfully',
  })
  async getVerificationStats() {
    return this.adminService.getVerificationStats();
  }

  @Get('kyc/providers/stats')
  @ApiOperation({
    summary: 'Get KYC provider-specific statistics and performance metrics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KYC provider statistics retrieved successfully',
  })
  async getKycProviderStats(@Query() queryDto: KycProviderStatsDto) {
    return this.adminService.getKycProviderStats(queryDto);
  }

  @Get('kyc/providers')
  @ApiOperation({
    summary: 'Get all available KYC providers and their configurations',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KYC providers retrieved successfully',
  })
  async getKycProviders() {
    return this.adminService.getKycProviders();
  }

  @Post('kyc/bulk-review')
  @ApiOperation({ summary: 'Bulk review multiple KYC verifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk KYC review completed successfully',
    type: BulkKycReviewResultDto,
  })
  async bulkReviewKyc(
    @Body() bulkReviewDto: BulkKycReviewDto,
    @Request() req: any,
  ): Promise<BulkKycReviewResultDto> {
    return this.adminService.bulkReviewKyc(
      bulkReviewDto.verificationIds,
      bulkReviewDto.action,
      bulkReviewDto.notes,
      req.user?.id,
    );
  }

  // User Documents
  @Get('users/:id/documents')
  @ApiOperation({ summary: 'Get user documents' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User documents retrieved successfully',
  })
  async getUserDocuments(@Param('id') id: string) {
    return this.adminService.getUserDocuments(id);
  }

  @Post('users/:id/request-documents')
  @ApiOperation({ summary: 'Request documents from user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document request sent successfully',
  })
  async requestDocuments(
    @Param('id') id: string,
    @Body() body: { documentTypes: string[]; message?: string },
  ) {
    return this.adminService.requestDocuments(
      id,
      body.documentTypes,
      body.message,
    );
  }

  @Post('users/:userId/documents/:documentId/review')
  @ApiOperation({ summary: 'Review user document' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document reviewed successfully',
  })
  async reviewDocument(
    @Param('userId') userId: string,
    @Param('documentId') documentId: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.adminService.reviewDocument(
      userId,
      documentId,
      body.status,
      body.notes,
    );
  }

  // User Flags
  @Post('users/:id/flags')
  @ApiOperation({ summary: 'Add flag to user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Flag added successfully',
  })
  async addFlag(
    @Param('id') id: string,
    @Body() body: { type: string; reason: string; severity?: string },
  ) {
    return this.adminService.addFlag(id, body.type, body.reason, body.severity);
  }

  @Put('users/:userId/flags/:flagId')
  @ApiOperation({ summary: 'Update user flag' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'flagId', description: 'Flag ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Flag updated successfully',
  })
  async updateFlag(
    @Param('userId') userId: string,
    @Param('flagId') flagId: string,
    @Body() body: { reason?: string; severity?: string; resolved?: boolean },
  ) {
    return this.adminService.updateFlag(userId, flagId, body);
  }

  @Delete('users/:userId/flags/:flagId')
  @ApiOperation({ summary: 'Remove user flag' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'flagId', description: 'Flag ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Flag removed successfully',
  })
  async removeFlag(
    @Param('userId') userId: string,
    @Param('flagId') flagId: string,
  ) {
    return this.adminService.removeFlag(userId, flagId);
  }

  // Booking Management - Moved to AdminBookingController

  // User History
  @Get('users/:id/bookings')
  @ApiOperation({ summary: 'Get user booking history' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User bookings retrieved successfully',
  })
  async getUserBookings(@Param('id') id: string, @Query() queryDto: any) {
    return this.adminService.getUserBookings(id, queryDto);
  }

  @Get('users/:id/payments')
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User payments retrieved successfully',
  })
  async getUserPayments(@Param('id') id: string, @Query() queryDto: any) {
    return this.adminService.getUserPayments(id, queryDto);
  }

  // User Communication
  @Post('users/:id/notifications')
  @ApiOperation({ summary: 'Send notification to user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification sent successfully',
  })
  async sendNotification(
    @Param('id') id: string,
    @Body() body: { title: string; message: string; type?: string },
  ) {
    return this.adminService.sendNotification(
      id,
      body.title,
      body.message,
      body.type,
    );
  }

  @Post('users/bulk-notifications')
  @ApiOperation({ summary: 'Send bulk notifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk notifications sent successfully',
  })
  async bulkSendNotification(
    @Body()
    body: {
      userIds: string[];
      title: string;
      message: string;
      type?: string;
    },
  ) {
    return this.adminService.bulkSendNotification(
      body.userIds,
      body.title,
      body.message,
      body.type,
    );
  }

  // Data Export
  @Get('users/export')
  @ApiOperation({ summary: 'Export users data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users data exported successfully',
  })
  async exportUsers(@Query() queryDto: AdminUserQueryDto) {
    return this.adminService.exportUsers(queryDto);
  }

  // Bulk Operations
  @Post('users/bulk-update-status')
  @ApiOperation({ summary: 'Bulk update user status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users status updated successfully',
  })
  async bulkUpdateStatus(
    @Body() body: { userIds: string[]; status: string; reason?: string },
  ) {
    return this.adminService.bulkUpdateStatus(
      body.userIds,
      body.status as UserStatus,
      body.reason,
    );
  }

  // Financial Statistics
  @Get('financial/stats')
  @ApiOperation({ summary: 'Get financial statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial statistics retrieved successfully',
  })
  async getFinancialStats(@Query('period') period?: string) {
    return this.adminService.getFinancialStats(period);
  }

  // Support Statistics
  @Get('support/stats')
  @ApiOperation({ summary: 'Get support ticket statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Support statistics retrieved successfully',
  })
  async getSupportStats() {
    return this.adminService.getSupportStats();
  }

  // User Analytics for Reports
  @Get('analytics/users/activity')
  @ApiOperation({ summary: 'Get user activity data for reports' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User activity data retrieved successfully',
  })
  async getUserActivityData(@Query() queryDto: AdminAnalyticsQueryDto) {
    return this.adminService.getUserActivityData(queryDto);
  }

  @Get('analytics/users/segments')
  @ApiOperation({ summary: 'Get user segments data for reports' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User segments data retrieved successfully',
  })
  async getUserSegments(@Query() queryDto: AdminAnalyticsQueryDto) {
    return this.adminService.getUserSegments(queryDto);
  }

  @Get('analytics/users/top-users')
  @ApiOperation({ summary: 'Get top users by engagement' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top users data retrieved successfully',
  })
  async getTopUsers(@Query() queryDto: AdminAnalyticsQueryDto) {
    return this.adminService.getTopUsers(queryDto);
  }

  @Get('analytics/users/metrics')
  @ApiOperation({ summary: 'Get user engagement metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User metrics retrieved successfully',
  })
  async getUserMetrics(@Query() queryDto: AdminAnalyticsQueryDto) {
    return this.adminService.getUserMetrics(queryDto);
  }

  // Dashboard Endpoints

  @Get('dashboard/notifications')
  @ApiOperation({ summary: 'Get dashboard notifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard notifications retrieved successfully',
  })
  async getDashboardNotifications() {
    return this.adminService.getDashboardNotifications();
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard statistics retrieved successfully',
  })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('activity/feed')
  @ApiOperation({ summary: 'Get recent activity feed' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Activity feed retrieved successfully',
  })
  async getActivityFeed(@Query() queryDto: any) {
    return this.adminService.getActivityFeed(queryDto);
  }

  @Patch('dashboard/notifications/:notificationId/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'notificationId', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read',
  })
  async markNotificationAsRead(
    @Param('notificationId') notificationId: string,
  ) {
    return this.adminService.markNotificationAsRead(notificationId);
  }

  @Patch('dashboard/notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked as read',
  })
  async markAllNotificationsAsRead() {
    return this.adminService.markAllNotificationsAsRead();
  }

  // System Health
  @Get('system/health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System health status',
  })
  async getSystemHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  // Partner Wallet Management
  @Get('partner-wallets')
  @ApiOperation({
    summary: 'Get all partner wallets with pagination and filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner wallets retrieved successfully',
    type: AdminWalletListResponseDto,
  })
  async getPartnerWallets(
    @Query() queryDto: AdminWalletQueryDto,
  ): Promise<AdminWalletListResponseDto> {
    return this.adminService.getPartnerWallets(queryDto);
  }

  @Get('partner-wallets/stats')
  @ApiOperation({ summary: 'Get partner wallet statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallet statistics retrieved successfully',
    type: WalletStatsDto,
  })
  async getWalletStats(): Promise<WalletStatsDto> {
    return this.adminService.getWalletStats();
  }

  @Get('partner-wallets/:id')
  @ApiOperation({ summary: 'Get specific partner wallet details' })
  @ApiParam({ name: 'id', description: 'Wallet ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner wallet details retrieved successfully',
    type: AdminPartnerWalletDto,
  })
  async getPartnerWalletDetails(
    @Param('id') id: string,
  ): Promise<AdminPartnerWalletDto> {
    return this.adminService.getPartnerWalletDetails(id);
  }

  @Put('partner-wallets/:id/status')
  @ApiOperation({ summary: 'Update partner wallet status (freeze/unfreeze)' })
  @ApiParam({ name: 'id', description: 'Wallet ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallet status updated successfully',
  })
  async updateWalletStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateWalletStatusDto,
  ) {
    return this.adminService.updateWalletStatus(id, updateDto);
  }

  @Post('partner-wallets/:id/payout')
  @ApiOperation({ summary: 'Process force payout for partner wallet' })
  @ApiParam({ name: 'id', description: 'Wallet ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout processed successfully',
  })
  async forceWalletPayout(
    @Param('id') id: string,
    @Body() payoutDto: ForcePayoutDto,
  ) {
    return this.adminService.forceWalletPayout(id, payoutDto);
  }

  @Post('partner-wallets/:id/adjust')
  @ApiOperation({ summary: 'Manual wallet balance adjustment' })
  @ApiParam({ name: 'id', description: 'Wallet ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallet balance adjusted successfully',
  })
  async adjustWalletBalance(
    @Param('id') id: string,
    @Body() adjustmentDto: ManualAdjustmentDto,
  ) {
    return this.adminService.adjustWalletBalance(id, adjustmentDto);
  }

  @Get('partner-wallets/:id/transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  @ApiParam({ name: 'id', description: 'Wallet ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallet transactions retrieved successfully',
  })
  async getWalletTransactions(@Param('id') id: string, @Query() queryDto: any) {
    return this.adminService.getWalletTransactions(id, queryDto);
  }

  @Post('partner-wallets/bulk-action')
  @ApiOperation({ summary: 'Perform bulk action on multiple wallets' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk action completed successfully',
  })
  async bulkWalletAction(@Body() bulkActionDto: BulkWalletActionDto) {
    return this.adminService.bulkWalletAction(bulkActionDto);
  }

  // User Wallets Finance Section
  @Get('finance/user-wallets')
  @ApiOperation({
    summary: 'Get all user wallets with pagination and filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User wallets retrieved successfully',
    type: AdminUserWalletListResponseDto,
  })
  async getUserWallets(
    @Query() queryDto: AdminUserWalletQueryDto,
  ): Promise<AdminUserWalletListResponseDto> {
    return this.adminService.getUserWallets(queryDto);
  }

  // Payout Management Endpoints
  @Get('payouts')
  @ApiOperation({ summary: 'Get all payouts with admin filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payouts retrieved successfully',
    type: AdminPayoutListResponseDto,
  })
  async getAllPayouts(
    @Query() queryDto: AdminPayoutQueryDto,
  ): Promise<AdminPayoutListResponseDto> {
    return this.adminService.getAllPayouts(queryDto);
  }

  // Invoice Management Endpoints
  @Get('invoices/partner')
  @ApiOperation({ summary: 'Get all partner invoices with admin filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner invoices retrieved successfully',
    type: AdminInvoiceListResponseDto,
  })
  async getAllPartnerInvoices(
    @Query() queryDto: AdminInvoiceQueryDto,
  ): Promise<AdminInvoiceListResponseDto> {
    return await this.adminService.getAllPartnerInvoices(queryDto);
  }

  // TEMPORARY TEST ENDPOINT - NO AUTH
  @Get('test/simple')
  @PublicAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'Simple test endpoint' })
  async testSimple(): Promise<{ message: string }> {
    return { message: 'Test endpoint working' };
  }

  @Get('test/invoices/partner')
  @PublicAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'TEST: Get all partner invoices without auth' })
  async testGetAllPartnerInvoices(
    @Query() queryDto: AdminInvoiceQueryDto,
  ): Promise<AdminInvoiceListResponseDto> {
    return this.adminService.getAllPartnerInvoices(queryDto);
  }

  @Get('invoices/user')
  @ApiOperation({ summary: 'Get all user invoices with admin filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User invoices retrieved successfully',
    type: AdminInvoiceListResponseDto,
  })
  async getAllUserInvoices(
    @Query() queryDto: AdminInvoiceQueryDto,
  ): Promise<AdminInvoiceListResponseDto> {
    return this.adminService.getAllUserInvoices(queryDto);
  }

  // Review Management Endpoints
  @Get('reviews')
  @ApiOperation({ summary: 'Get all reviews with admin filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reviews retrieved successfully',
  })
  async getAllReviews(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isVerified') isVerified?: boolean,
    @Query('isFlagged') isFlagged?: boolean,
    @Query('spaceId') spaceId?: string,
    @Query('partnerId') partnerId?: string,
    @Query('userId') userId?: string,
    @Query('minRating') minRating?: number,
    @Query('maxRating') maxRating?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const queryDto = {
      page: page || 1,
      limit: limit || 10,
      isVerified,
      isFlagged,
      spaceId,
      partnerId,
      userId,
      minRating,
      maxRating,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    };

    return await this.adminService.getAllReviews(queryDto);
  }

  @Get('reviews/analytics')
  @ApiOperation({ summary: 'Get review analytics for admin dashboard' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review analytics retrieved successfully',
  })
  async getReviewAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.adminService.getReviewAnalytics({ startDate, endDate });
  }

  @Get('reviews/:id')
  @ApiOperation({ summary: 'Get review details by ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review details retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found',
  })
  async getReviewById(@Param('id') id: string) {
    return this.reviewService.findOneReview(id);
  }

  @Put('reviews/:id/status')
  @ApiOperation({ summary: 'Update review status' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review status updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found',
  })
  async updateReviewStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
  ) {
    const { status, reason } = body;

    if (status === 'verified') {
      return this.reviewService.verifyReview(id);
    } else if (status === 'hidden') {
      return this.reviewService.hideReview(id);
    }

    // For other status updates, we'd need to add a general update method
    throw new Error(`Status '${status}' is not supported`);
  }

  @Post('reviews/:id/flag')
  @ApiOperation({ summary: 'Flag a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review flagged successfully',
  })
  async flagReview(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUserSession() session: UserSession,
  ) {
    return this.reviewService.flagReview(
      id,
      body.reason || '',
      session.user.id,
    );
  }

  @Delete('reviews/:id/flag')
  @ApiOperation({ summary: 'Unflag a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review unflagged successfully',
  })
  async unflagReview(@Param('id') id: string) {
    // We'd need to add an unflag method to the review service
    // For now, we can use the hideReview method to reverse the flag
    return { message: 'Review unflagged successfully' };
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found',
  })
  async deleteReview(
    @Param('id') id: string,
    @CurrentUserSession() session: UserSession,
  ) {
    return this.reviewService.deleteReview(id, session.user.id);
  }

  @Post('reviews/bulk-update')
  @ApiOperation({ summary: 'Bulk update review statuses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reviews updated successfully',
  })
  async bulkUpdateReviews(
    @Body() body: { reviewIds: string[]; status: string; reason?: string },
  ) {
    const { reviewIds, status, reason } = body;
    const results = [];

    for (const reviewId of reviewIds) {
      try {
        if (status === 'verified') {
          await this.reviewService.verifyReview(reviewId);
        } else if (status === 'hidden') {
          await this.reviewService.hideReview(reviewId);
        }
        results.push({ reviewId, success: true });
      } catch (error) {
        results.push({ reviewId, success: false, error: error.message });
      }
    }

    return { results };
  }

  // ===== MISSING USER VERIFICATION ENDPOINTS =====
  @Get('users/verification/pending')
  @ApiOperation({ summary: 'Get pending user verifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending verifications retrieved successfully',
  })
  async getPendingVerifications(@Query() queryDto: KycVerificationQueryDto) {
    // Filter for pending status
    const pendingQuery = { ...queryDto, status: KycStatus.PENDING };
    return this.adminService.getAllVerifications(pendingQuery);
  }

  @Get('users/verification/all')
  @ApiOperation({ summary: 'Get all user verifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All verifications retrieved successfully',
  })
  async getAllUserVerifications(@Query() queryDto: KycVerificationQueryDto) {
    return this.adminService.getAllVerifications(queryDto);
  }

  @Post('users/verification/review')
  @ApiOperation({ summary: 'Review user verification' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification reviewed successfully',
  })
  async reviewUserVerification(
    @Body() reviewDto: { userId: string; status: string; reason?: string },
    @CurrentUserSession() session: UserSession,
  ) {
    return this.adminService.reviewKycVerification(
      reviewDto.userId,
      reviewDto.status as 'approved' | 'rejected',
      reviewDto.reason,
      session.user.id,
    );
  }

  // ===== MISSING KYC ENDPOINTS =====
  @Get('users/kyc/stats')
  @ApiOperation({ summary: 'Get KYC verification statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KYC statistics retrieved successfully',
  })
  async getKycVerificationStats() {
    return this.adminService.getVerificationStats();
  }

  @Get('users/kyc/pending')
  @ApiOperation({ summary: 'Get pending KYC verifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending KYC verifications retrieved successfully',
  })
  async getPendingKycVerifications(@Query() queryDto: KycVerificationQueryDto) {
    // Filter for pending status
    const pendingQuery = { ...queryDto, status: KycStatus.PENDING };
    return this.adminService.getAllVerifications(pendingQuery);
  }

  @Post('users/kyc/review')
  @ApiOperation({ summary: 'Review KYC verification' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KYC verification reviewed successfully',
  })
  async reviewKycVerificationEndpoint(
    @Body() reviewDto: { kycId: string; status: string; reason?: string },
    @CurrentUserSession() session: UserSession,
  ) {
    return this.adminService.reviewKycVerification(
      reviewDto.kycId,
      reviewDto.status as 'approved' | 'rejected',
      reviewDto.reason,
      session.user.id,
    );
  }

  @Post('users/kyc/bulk-review')
  @ApiOperation({ summary: 'Bulk review KYC verifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk KYC review completed successfully',
  })
  async bulkReviewKycEndpoint(
    @Body()
    bulkReviewDto: {
      verificationIds: string[];
      action: string;
      notes?: string;
    },
    @CurrentUserSession() session: UserSession,
  ) {
    return this.adminService.bulkReviewKyc(
      bulkReviewDto.verificationIds,
      bulkReviewDto.action as 'approve' | 'reject',
      bulkReviewDto.notes,
      session.user.id,
    );
  }

  // ===== MISSING USER FLAGS ENDPOINTS =====
  @Post('users/flags/add')
  @ApiOperation({ summary: 'Add flag to user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User flag added successfully',
  })
  async addUserFlagEndpoint(
    @Body()
    flagDto: {
      userId: string;
      flagType: string;
      reason: string;
      severity?: string;
    },
    @CurrentUserSession() session: UserSession,
  ) {
    return await this.adminService.addFlag(
      flagDto.userId,
      flagDto.flagType,
      flagDto.reason,
      flagDto.severity,
    );
  }

  @Put('users/flags/update')
  @ApiOperation({ summary: 'Update user flag' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User flag updated successfully',
  })
  async updateUserFlagEndpoint(
    @Body() updateDto: { userId: string; flagId: string; updates: any },
    @CurrentUserSession() session: UserSession,
  ) {
    return await this.adminService.updateFlag(
      updateDto.userId,
      updateDto.flagId,
      updateDto.updates,
    );
  }

  @Delete('users/flags/remove')
  @ApiOperation({ summary: 'Remove user flag' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User flag removed successfully',
  })
  async removeUserFlagEndpoint(
    @Body() removeDto: { userId: string; flagId: string },
    @CurrentUserSession() session: UserSession,
  ) {
    return this.adminService.removeFlag(removeDto.userId, removeDto.flagId);
  }

  // User Extensions
  @Get('users/:id/wallet')
  @ApiOperation({ summary: 'Get user wallet details' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User wallet details retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or wallet not found',
  })
  async getUserWallet(@Param('id', ParseCoworsIdPipe) id: string) {
    return this.adminService.getUserWallet(id);
  }

  @Get('users/:id/activity')
  @ApiOperation({ summary: 'Get user activity history' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User activity history retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserActivity(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getUserActivity(id, {
      page,
      limit,
      type,
      startDate,
      endDate,
    });
  }

  @Get('partners/:id/analytics')
  @ApiOperation({ summary: 'Get partner analytics' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner analytics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Partner not found',
  })
  async getPartnerAnalyticsById(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getPartnerAnalyticsById(id, {
      period,
      startDate,
      endDate,
    });
  }

  // ===== ADVANCED FEATURES ENDPOINTS =====

  @Get('permissions')
  @ApiOperation({ summary: 'Get all available permissions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available permissions retrieved successfully',
  })
  async getPermissions() {
    return this.adminService.getAvailablePermissions();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs with filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit logs retrieved successfully',
  })
  async getAuditLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getAuditLogs({
      page,
      limit,
      action,
      userId,
      startDate,
      endDate,
    });
  }

  @Post('reports/generate')
  @ApiOperation({ summary: 'Generate custom reports' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report generation initiated successfully',
  })
  async generateReport(
    @Body()
    reportDto: {
      type: string;
      format: string;
      filters?: any;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.adminService.generateReport(reportDto);
  }

  @Post('exports/data')
  @ApiOperation({ summary: 'Export data in various formats' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data export initiated successfully',
  })
  async exportData(
    @Body()
    exportDto: {
      type: string;
      format: string;
      filters?: any;
      includeFields?: string[];
    },
  ) {
    return this.adminService.exportData(exportDto);
  }

  @Post('imports/data')
  @ApiOperation({ summary: 'Import data from external sources' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data import initiated successfully',
  })
  async importData(
    @Body()
    importDto: {
      type: string;
      source: string;
      mapping?: any;
      validateOnly?: boolean;
    },
  ) {
    return this.adminService.importData(importDto);
  }
}
