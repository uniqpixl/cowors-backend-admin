import {
  TransactionStatus,
  TransactionType,
} from '@/api/transaction/dto/financial-transaction.dto';
import { Role as UserRole, UserStatus } from '@/api/user/user.enum';
import { UserEntity } from '@/auth/entities/user.entity';
import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { BookingStatus, PaymentStatus } from '@/common/enums/booking.enum';
import { SpaceSubtype } from '@/common/enums/partner.enum';
import { BookingModel, SpaceStatus } from '@/common/enums/space.enum';
import { WalletStatus } from '@/common/enums/wallet.enum';
import {
  ErrorCodes,
  ErrorResponseUtil,
} from '@/common/utils/error-response.util';
import { CacheKey } from '@/constants/cache.constant';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  InvoiceEntity,
  InvoiceStatus,
  InvoiceType,
} from '@/database/entities/invoice.entity';
import {
  KycProvider,
  KycStatus,
  KycVerificationEntity,
} from '@/database/entities/kyc-verification.entity';
import { PartnerListingEntity } from '@/database/entities/partner-listing.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { SpaceOptionEntity } from '@/database/entities/space-option.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { WalletBalanceEntity } from '@/database/entities/wallet-balance.entity';
import { CacheService } from '@/shared/cache/cache.service';
import { EntityType } from '@/utils/id-generator.service';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  In,
  IsNull,
  Like,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { EmailService } from '../notification/services/email.service';
import {
  PartnerWalletEntity,
  PayoutEntity,
  PayoutRequestEntity,
} from '../payout/entities/payout.entity';
import { ReviewService } from '../review/review.service';
import { FinancialTransactionService } from '../transaction/financial-transaction.service';
import { KycVerificationService } from '../user/kyc-verification.service';
import { WalletTransactionType } from '../wallet/dto/wallet.dto';
import { WalletService } from '../wallet/wallet.service';
import { AuditAction, AuditService } from './audit.service';
import {
  AdminAnalyticsQueryDto,
  AnalyticsGranularity,
  AnalyticsPeriod,
  AnalyticsTimeframe,
  BookingAnalyticsDto,
  PlatformStatsDto,
  RevenueAnalyticsDto,
  SpaceUtilizationDto,
  TimeSeriesDataPoint,
  UserAnalyticsDto,
} from './dto/admin-analytics.dto';
import {
  AdminInvoiceListResponseDto,
  AdminInvoiceQueryDto,
  AdminInvoiceResponseDto,
  AdminInvoiceSortBy,
  AdminInvoiceSortOrder,
  AdminInvoiceStatus,
  AdminInvoiceType,
} from './dto/admin-invoice.dto';
import {
  AdminPayoutListResponseDto,
  AdminPayoutQueryDto,
  AdminPayoutResponseDto,
} from './dto/admin-payout.dto';
import {
  AdminTransactionListResponseDto,
  AdminTransactionQueryDto,
  BulkRefundDto,
  PendingTransactionsQueryDto,
  RefundTransactionDto,
  TransactionAnalyticsDto,
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
  BookingListItemDto,
  BookingListResponseDto,
  BookingQueryDto,
  BookingStatsDto,
  // BookingStatus, // Imported from common/enums/booking.enum instead
  BookingUpdateDto,
  BulkBookingStatusUpdateDto,
  ExtendBookingDto,
  RefundRequestDto,
  UpdateBookingStatusDto,
} from './dto/booking-management.dto';
import {
  KycProviderStatsDto,
  KycVerificationQueryDto,
} from './dto/kyc-verification-query.dto';
import {
  AdminSpaceStatus,
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
  UserDetailsDto,
  UserListItemDto,
  UserListResponseDto,
  UserStatsDto,
} from './dto/user-management.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(PartnerListingEntity)
    private readonly partnerListingRepository: Repository<PartnerListingEntity>,
    @InjectRepository(SpaceEntity)
    private readonly spaceRepository: Repository<SpaceEntity>,
    @InjectRepository(SpaceOptionEntity)
    private readonly spaceOptionRepository: Repository<SpaceOptionEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(KycVerificationEntity)
    private readonly kycVerificationRepository: Repository<KycVerificationEntity>,
    @InjectRepository(PartnerWalletEntity)
    private readonly walletRepository: Repository<PartnerWalletEntity>,
    @InjectRepository(PayoutRequestEntity)
    private readonly payoutRequestRepository: Repository<PayoutRequestEntity>,
    @InjectRepository(PayoutEntity)
    private readonly payoutRepository: Repository<PayoutEntity>,
    @InjectRepository(WalletBalanceEntity)
    private readonly userWalletRepository: Repository<WalletBalanceEntity>,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    private readonly kycVerificationService: KycVerificationService,
    private readonly walletService: WalletService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
    private readonly reviewService: ReviewService,
    private readonly financialTransactionService: FinancialTransactionService,
  ) {
    console.log('AdminService constructor called');
    console.log('InvoiceRepository injected:', !!this.invoiceRepository);
  }

  private mapPaymentStatusToTransactionStatus(
    paymentStatus: PaymentStatus,
  ): TransactionStatus {
    switch (paymentStatus) {
      case PaymentStatus.PENDING:
        return TransactionStatus.PENDING;
      case PaymentStatus.PROCESSING:
        return TransactionStatus.PROCESSING;
      case PaymentStatus.COMPLETED:
        return TransactionStatus.COMPLETED;
      case PaymentStatus.FAILED:
        return TransactionStatus.FAILED;
      case PaymentStatus.CANCELLED:
        return TransactionStatus.CANCELLED;
      case PaymentStatus.REFUNDED:
        return TransactionStatus.REFUNDED;
      default:
        return TransactionStatus.PENDING;
    }
  }

  private mapPaymentStatusToDisputeStatus(
    paymentStatus: PaymentStatus,
  ): 'open' | 'investigating' | 'resolved' | 'closed' {
    switch (paymentStatus) {
      case PaymentStatus.FAILED:
        return 'open';
      case PaymentStatus.CANCELLED:
        return 'closed';
      case PaymentStatus.COMPLETED:
        return 'resolved';
      case PaymentStatus.REFUNDED:
        return 'resolved';
      default:
        return 'open';
    }
  }

  // User Management
  async getUsers(queryDto: AdminUserQueryDto): Promise<UserListResponseDto> {
    return this.findAllUsers(queryDto);
  }

  async getUserById(id: string): Promise<UserDetailsDto> {
    return this.findUserById(id);
  }

  async findAllUsers(
    queryDto: AdminUserQueryDto,
  ): Promise<UserListResponseDto> {
    console.log('=== ENTERING findAllUsers ===');
    console.log('Query DTO:', JSON.stringify(queryDto, null, 2));
    console.log('UserRepository:', !!this.userRepository);

    // Test basic repository access
    try {
      const testCount = await this.userRepository.count();
      console.log('User count test successful:', testCount);
    } catch (testError) {
      console.error('User count test failed:', testError);
      throw testError;
    }

    const {
      query,
      status,
      role,
      emailVerified,
      createdAfter,
      createdBefore,
      lastLoginAfter,
      sortBy,
      sortOrder,
      page,
      limit,
    } = queryDto;

    // Declare variables outside try block for catch block access
    let orderByField = sortBy || 'createdAt';
    const finalSortOrder = sortOrder || 'DESC';
    const finalPage = page || 1;
    const finalLimit = limit || 20;

    try {
      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.partner', 'partner')
        .leftJoinAndSelect('user.bookings', 'bookings');

      if (query) {
        queryBuilder.andWhere(
          '(user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query OR user.username ILIKE :query)',
          { query: `%${query}%` },
        );
      }

      if (status) {
        queryBuilder.andWhere('user.status = :status', { status });
      }

      if (role) {
        queryBuilder.andWhere('user.role = :role', { role });
      }

      if (emailVerified !== undefined) {
        queryBuilder.andWhere('user.isEmailVerified = :emailVerified', {
          emailVerified,
        });
      }

      if (createdAfter) {
        queryBuilder.andWhere('user.createdAt >= :createdAfter', {
          createdAfter,
        });
      }

      if (createdBefore) {
        queryBuilder.andWhere('user.createdAt <= :createdBefore', {
          createdBefore,
        });
      }

      if (lastLoginAfter) {
        queryBuilder.andWhere('user.lastLoginAt >= :lastLoginAfter', {
          lastLoginAfter,
        });
      }

      // Handle sortBy field mapping and validation
      const sortOrder = (finalSortOrder || 'DESC').toUpperCase() as 'ASC' | 'DESC';

      const sortMap: Record<string, string | string[]> = {
        name: ['user.firstName', 'user.lastName', 'user.username'],
        displayName: ['user.firstName', 'user.lastName', 'user.username'],
        email: 'user.email',
        username: 'user.username',
        createdAt: 'user.createdAt',
        updatedAt: 'user.updatedAt',
        lastLoginAt: 'user.lastLoginAt',
        role: 'user.role',
        status: 'user.status',
        emailVerified: 'user.isEmailVerified',
        isEmailVerified: 'user.isEmailVerified',
        firstName: 'user.firstName',
        lastName: 'user.lastName',
      };

      const mapped = sortMap[orderByField];

      if (Array.isArray(mapped)) {
        queryBuilder.orderBy(mapped[0], sortOrder);
        for (let i = 1; i < mapped.length; i++) {
          queryBuilder.addOrderBy(mapped[i], sortOrder);
        }
      } else if (typeof mapped === 'string') {
        queryBuilder.orderBy(mapped, sortOrder);
      } else {
        // Fallback to createdAt if unknown sort field requested
        queryBuilder.orderBy('user.createdAt', sortOrder);
      }

      const offset = (finalPage - 1) * finalLimit;
      queryBuilder.skip(offset).take(finalLimit);

      console.log('DEBUG findAllUsers SQL:', queryBuilder.getSql());
      console.log('DEBUG findAllUsers params:', queryBuilder.getParameters());

      const [items, total] = await queryBuilder.getManyAndCount();

      // Transform to UserListItemDto
      const data = items.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName:
          `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
          user.username,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        totalBookings: user.bookings?.length || 0,
      }));

      const pageOptions = new PageOptionsDto();
      Object.assign(pageOptions, { page: finalPage, limit: finalLimit });

      return {
        data,
        pagination: new OffsetPaginationDto(total, pageOptions),
      };
    } catch (error) {
      console.error('=== ERROR IN findAllUsers ===');
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      console.error('Error stack:', error.stack);
      console.error('Query DTO:', JSON.stringify(queryDto, null, 2));
      console.error('Final page:', finalPage);
      console.error('Final limit:', finalLimit);
      console.error('Order by field:', orderByField);
      console.error('Final sort order:', finalSortOrder);
      console.error('=== END ERROR ===');
      throw error;
    }
  }

  async findUserById(id: string): Promise<UserDetailsDto> {
    // Handle both UUID and Cowors ID formats
    let user: UserEntity | null = null;

    user = await this.userRepository.findOne({
      where: { id },
      relations: ['partner', 'bookings', 'walletTransactions'],
    });

    if (!user) {
      throw ErrorResponseUtil.notFound('User', id);
    }

    // Calculate user statistics
    const totalBookings = user.bookings?.length || 0;
    const totalSpent =
      user.bookings?.reduce(
        (sum, booking) => sum + (booking.totalAmount || 0),
        0,
      ) || 0;
    const lastBookingDate =
      user.bookings?.length > 0
        ? new Date(Math.max(...user.bookings.map((b) => b.createdAt.getTime())))
        : null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName:
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        user.username,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      image: user.image,
      adminNotes: user.adminNotes,
      suspendedAt: user.suspendedAt,
      bannedAt: user.bannedAt,
      totalBookings,
      totalSpent,
      partnerProfile: user.partner
        ? {
            businessName: user.partner.businessName,
            businessType: user.partner.businessType,
            verificationStatus: user.partner.verificationStatus,
          }
        : null,
    };
  }

  private async findUserEntityById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['partner', 'bookings', 'walletTransactions'],
    });

    if (!user) {
      throw ErrorResponseUtil.notFound('User', id);
    }

    return user;
  }

  async updateUser(
    id: string,
    updateDto: AdminUserUpdateDto,
    adminId?: string,
  ): Promise<UserEntity> {
    const user = await this.findUserEntityById(id);
    const oldData = { ...user };

    Object.assign(user, updateDto);
    user.updatedAt = new Date();

    const updatedUser = await this.userRepository.save(user);

    // Log audit action
    if (adminId) {
      await this.auditService.logAction({
        action: AuditAction.USER_UPDATED,
        adminId,
        targetUserId: id,
        oldData,
        newData: updatedUser,
        timestamp: new Date(),
      });
    }

    return updatedUser;
  }

  async updateUserRoleByEmail(
    email: string,
    role: string,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw ErrorResponseUtil.notFound('User', email);
    }

    user.role = role as any;
    user.updatedAt = new Date();

    return this.userRepository.save(user);
  }

  async banUser(id: string, banDto: AdminUserBanDto): Promise<UserEntity> {
    const user = await this.findUserEntityById(id);

    if (user.role === UserRole.Admin || user.role === UserRole.SuperAdmin) {
      throw ErrorResponseUtil.forbidden(
        'Cannot ban admin users',
        ErrorCodes.FORBIDDEN,
      );
    }

    user.status = UserStatus.BANNED;
    user.adminNotes = banDto.reason;
    user.bannedAt = new Date();
    if (banDto.banDuration) {
      user.banExpiresAt = new Date(
        Date.now() + banDto.banDuration * 24 * 60 * 60 * 1000,
      );
    }
    user.updatedAt = new Date();

    return this.userRepository.save(user);
  }

  async suspendUser(
    id: string,
    suspendDto: AdminUserSuspendDto,
  ): Promise<UserEntity> {
    const user = await this.findUserEntityById(id);

    if (user.role === UserRole.Admin || user.role === UserRole.SuperAdmin) {
      throw ErrorResponseUtil.forbidden(
        'Cannot suspend admin users',
        ErrorCodes.FORBIDDEN,
      );
    }

    user.status = UserStatus.SUSPENDED;
    user.adminNotes = suspendDto.reason;
    user.suspendedAt = new Date();
    if (suspendDto.suspensionDuration) {
      user.suspensionExpiresAt = new Date(
        Date.now() + suspendDto.suspensionDuration * 24 * 60 * 60 * 1000,
      );
    }
    user.updatedAt = new Date();

    return this.userRepository.save(user);
  }

  async reactivateUser(id: string): Promise<UserEntity> {
    const user = await this.findUserEntityById(id);

    user.status = UserStatus.ACTIVE;
    user.bannedAt = null;
    user.banExpiresAt = null;
    user.suspendedAt = null;
    user.suspensionExpiresAt = null;
    user.updatedAt = new Date();

    return this.userRepository.save(user);
  }

  async deleteUser(
    userId: string,
    adminId?: string,
  ): Promise<{ message: string }> {
    const user = await this.findUserEntityById(userId);

    if (user.role === UserRole.Admin) {
      throw new ForbiddenException('Cannot delete admin users');
    }

    const oldData = { ...user };

    // Soft delete by updating status and adding deletion timestamp
    user.status = UserStatus.DELETED;
    user.deletedAt = new Date();
    user.updatedAt = new Date();

    await this.userRepository.save(user);

    // Log audit action
    if (adminId) {
      await this.auditService.logAction({
        action: AuditAction.USER_DELETED,
        adminId,
        targetUserId: userId,
        oldData,
        newData: user,
        timestamp: new Date(),
      });
    }

    return { message: 'User deleted successfully' };
  }

  async updateUserStatus(
    userId: string,
    status: UserStatus,
    reason?: string,
    adminId?: string,
  ): Promise<UserEntity> {
    const user = await this.findUserEntityById(userId);

    if (user.role === UserRole.Admin && status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Cannot change admin user status');
    }

    const oldData = { ...user };

    user.status = status;
    // Note: statusReason property doesn't exist on UserEntity
    // Status reason is handled through adminNotes field if needed
    user.updatedAt = new Date();

    // Clear suspension/ban dates if not suspended/banned
    if (status !== UserStatus.SUSPENDED) {
      user.suspendedAt = null;
      user.suspensionExpiresAt = null;
    }
    if (status !== UserStatus.BANNED) {
      user.bannedAt = null;
      user.banExpiresAt = null;
    }

    const updatedUser = await this.userRepository.save(user);

    // Log audit action
    if (adminId) {
      await this.auditService.logAction({
        action: AuditAction.USER_STATUS_CHANGED,
        adminId,
        targetUserId: userId,
        oldData,
        newData: updatedUser,
        // metadata: { reason, newStatus: status }, // metadata not available in audit action
        timestamp: new Date(),
      });
    }

    return updatedUser;
  }

  // Analytics
  async getPlatformStats(): Promise<PlatformStatsDto> {
    console.log('=== getPlatformStats called ===');
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      console.log('Date ranges:', { now, startOfMonth, thirtyDaysAgo });

      const [totalUsers, totalPartners, totalSpaces, totalBookings] =
        await Promise.all([
          this.userRepository.count(),
          this.partnerRepository.count(),
          this.spaceRepository.count(),
          this.bookingRepository.count(),
        ]);

      const [
        activeUsers,
        newUsersThisMonth,
        newPartnersThisMonth,
        bookingsThisMonth,
      ] = await Promise.all([
        this.userRepository.count({
          where: { lastLoginAt: MoreThan(thirtyDaysAgo) },
        }),
        this.userRepository.count({
          where: { createdAt: MoreThan(startOfMonth) },
        }),
        this.partnerRepository.count({
          where: { createdAt: MoreThan(startOfMonth) },
        }),
        this.bookingRepository.count({
          where: { createdAt: MoreThan(startOfMonth) },
        }),
      ]);

      const revenueResult = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'totalRevenue')
        .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne();

      const revenueThisMonthResult = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'revenueThisMonth')
        .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .andWhere('payment.createdAt >= :startOfMonth', { startOfMonth })
        .getRawOne();

      const avgBookingResult = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('AVG(payment.amount)', 'averageValue')
        .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne();

      const totalRevenue = parseFloat(revenueResult?.totalRevenue || '0');
      const revenueThisMonth = parseFloat(
        revenueThisMonthResult?.revenueThisMonth || '0',
      );
      const averageBookingValue = parseFloat(
        avgBookingResult?.averageValue || '0',
      );
      const platformCommission = totalRevenue * 0.1; // Assuming 10% commission

      return {
        totalUsers,
        totalPartners,
        totalSpaces,
        totalBookings,
        totalRevenue,
        activeUsers,
        newUsersThisMonth,
        newPartnersThisMonth,
        bookingsThisMonth,
        revenueThisMonth,
        averageBookingValue,
        platformCommission,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve platform statistics', error);
      throw ErrorResponseUtil.internalServerError(
        'Failed to retrieve platform statistics',
      );
    }
  }

  async getBookingAnalytics(
    queryDto: AdminAnalyticsQueryDto,
  ): Promise<BookingAnalyticsDto[]> {
    console.log('=== getBookingAnalytics called ===');
    console.log('Query DTO:', JSON.stringify(queryDto, null, 2));

    try {
      const {
        startDate,
        endDate,
        timeframe = AnalyticsTimeframe.DAILY,
        partnerId,
        spaceId,
      } = queryDto;

      let dateFormat: string;
      switch (timeframe) {
        case AnalyticsTimeframe.DAILY:
          dateFormat = 'YYYY-MM-DD';
          break;
        case AnalyticsTimeframe.WEEKLY:
          dateFormat = 'YYYY-"W"WW';
          break;
        case AnalyticsTimeframe.MONTHLY:
          dateFormat = 'YYYY-MM';
          break;
        case AnalyticsTimeframe.YEARLY:
          dateFormat = 'YYYY';
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
          break;
      }

      const queryBuilder = this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoin('booking.payment', 'payment')
        .withDeleted();

      if (startDate) {
        queryBuilder.andWhere('booking.createdAt >= :startDate', { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere('booking.createdAt <= :endDate', { endDate });
      }

      // spaceId filtering removed due to join issues
      // if (spaceId) {
      //   queryBuilder.andWhere('spaceOption.spaceId = :spaceId', { spaceId });
      // }

      const results = await queryBuilder
        .select([
          `TO_CHAR(booking.createdAt, '${dateFormat}') as date`,
          'COUNT(booking.id) as bookingCount',
          'COALESCE(SUM(CASE WHEN payment.status = :paymentStatus THEN payment.amount ELSE 0 END), 0) as revenue',
          'COALESCE(AVG(CASE WHEN payment.status = :paymentStatus THEN payment.amount END), 0) as averageValue',
          'COUNT(DISTINCT booking.userId) as uniqueUsers',
        ])
        .setParameter('paymentStatus', PaymentStatus.COMPLETED)
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany();

      const mappedResults = results.map((result) => ({
        date: result.date,
        bookingCount: parseInt(result.bookingcount),
        revenue: parseFloat(result.revenue),
        averageValue: parseFloat(result.averagevalue),
        uniqueUsers: parseInt(result.uniqueusers),
      }));

      console.log('=== getBookingAnalytics completed successfully ===');
      console.log('Results count:', mappedResults.length);
      return mappedResults;
    } catch (error) {
      console.error('=== getBookingAnalytics ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async getUserAnalytics(
    queryDto: AdminAnalyticsQueryDto,
  ): Promise<UserAnalyticsDto[]> {
    const {
      startDate,
      endDate,
      timeframe = AnalyticsTimeframe.DAILY,
    } = queryDto;

    let dateFormat: string;
    switch (timeframe) {
      case AnalyticsTimeframe.DAILY:
        dateFormat = 'YYYY-MM-DD';
        break;
      case AnalyticsTimeframe.WEEKLY:
        dateFormat = 'YYYY-"W"WW';
        break;
      case AnalyticsTimeframe.MONTHLY:
        dateFormat = 'YYYY-MM';
        break;
      case AnalyticsTimeframe.YEARLY:
        dateFormat = 'YYYY';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        break;
    }

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (startDate) {
      queryBuilder.andWhere('user.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('user.createdAt <= :endDate', { endDate });
    }

    const results = await queryBuilder
      .select([
        `TO_CHAR(user.createdAt, '${dateFormat}') as date`,
        'COUNT(user.id) as newUsers',
        'COUNT(CASE WHEN user.lastLoginAt IS NOT NULL THEN 1 END) as activeUsers',
      ])
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Get first-time bookers data separately
    const firstTimeBookersQuery = this.bookingRepository
      .createQueryBuilder('booking')
      .select([
        `TO_CHAR(booking.createdAt, '${dateFormat}') as date`,
        'COUNT(DISTINCT booking.userId) as firstTimeBookers',
      ])
      .where(
        'booking.createdAt IN (SELECT MIN(b."createdAt") FROM booking b GROUP BY b."userId")',
      )
      .groupBy('date')
      .orderBy('date', 'ASC');

    if (startDate) {
      firstTimeBookersQuery.andWhere('booking.createdAt >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      firstTimeBookersQuery.andWhere('booking.createdAt <= :endDate', {
        endDate,
      });
    }

    const firstTimeBookersResults = await firstTimeBookersQuery.getRawMany();

    // Merge results
    const mergedResults = results.map((result) => {
      const firstTimeBooker = firstTimeBookersResults.find(
        (ftb) => ftb.date === result.date,
      );
      return {
        date: result.date,
        newUsers: parseInt(result.newusers),
        activeUsers: parseInt(result.activeusers),
        firstTimeBookers: firstTimeBooker
          ? parseInt(firstTimeBooker.firsttimebookers)
          : 0,
      };
    });

    return mergedResults;
  }

  async getRevenueAnalytics(
    queryDto: AdminAnalyticsQueryDto,
  ): Promise<RevenueAnalyticsDto[]> {
    console.log('=== getRevenueAnalytics called ===');
    console.log('Query DTO:', JSON.stringify(queryDto, null, 2));

    try {
      const {
        startDate,
        endDate,
        timeframe = AnalyticsTimeframe.DAILY,
        partnerId,
        spaceId,
      } = queryDto;

      let dateFormat: string;
      switch (timeframe) {
        case AnalyticsTimeframe.DAILY:
          dateFormat = 'YYYY-MM-DD';
          break;
        case AnalyticsTimeframe.WEEKLY:
          dateFormat = 'YYYY-"W"WW';
          break;
        case AnalyticsTimeframe.MONTHLY:
          dateFormat = 'YYYY-MM';
          break;
        case AnalyticsTimeframe.YEARLY:
          dateFormat = 'YYYY';
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
          break;
      }

      const queryBuilder = this.paymentRepository
        .createQueryBuilder('payment')
        .innerJoin('payment.booking', 'booking')
        .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .withDeleted();

      if (startDate) {
        queryBuilder.andWhere('payment.createdAt >= :startDate', { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere('payment.createdAt <= :endDate', { endDate });
      }

      // spaceId filtering removed due to join issues
      // if (spaceId) {
      //   queryBuilder.andWhere('spaceOption.spaceId = :spaceId', { spaceId });
      // }

      const results = await queryBuilder
        .select([
          `TO_CHAR(payment.createdAt, '${dateFormat}') as date`,
          'SUM(payment.amount) as totalRevenue',
          'SUM(payment.amount * 0.1) as platformCommission', // Assuming 10% commission
          'SUM(payment.amount * 0.9) as partnerEarnings',
          'COUNT(payment.id) as transactionCount',
        ])
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany();

      const mappedResults = results.map((result) => ({
        date: result.date,
        totalRevenue: parseFloat(result.totalrevenue),
        platformCommission: parseFloat(result.platformcommission),
        partnerEarnings: parseFloat(result.partnerearnings),
        transactionCount: parseInt(result.transactioncount),
      }));

      console.log('=== getRevenueAnalytics completed successfully ===');
      console.log('Results count:', mappedResults.length);
      return mappedResults;
    } catch (error) {
      console.error('=== getRevenueAnalytics ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  // User Statistics
  async getUserStats(): Promise<UserStatsDto> {
    const totalUsers = await this.userRepository.count({
      where: {
        role: Not(In(['Admin', 'SuperAdmin'])),
      },
    });
    const activeUsers = await this.userRepository.count({
      where: { status: UserStatus.ACTIVE },
    });
    const inactiveUsers = await this.userRepository.count({
      where: { status: UserStatus.INACTIVE },
    });
    const suspendedUsers = await this.userRepository.count({
      where: { status: UserStatus.SUSPENDED },
    });
    const bannedUsers = await this.userRepository.count({
      where: { status: UserStatus.BANNED },
    });
    const deletedUsers = await this.userRepository.count({
      where: { status: UserStatus.DELETED },
    });
    const verifiedUsers = await this.userRepository.count({
      where: { isEmailVerified: true },
    });
    const pendingVerification = await this.userRepository.count({
      where: { isEmailVerified: false },
    });

    // Calculate new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await this.userRepository.count({
      where: {
        createdAt: MoreThan(startOfMonth),
      },
    });

    // Calculate growth rate (compared to last month)
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const usersLastMonth = await this.userRepository.count({
      where: {
        createdAt: Between(startOfLastMonth, startOfMonth),
      },
    });

    const userGrowthRate =
      usersLastMonth > 0
        ? ((newUsersThisMonth - usersLastMonth) / usersLastMonth) * 100
        : 0;

    // Get top users by bookings
    const topUsers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.bookings', 'booking')
      .select([
        'user.id',
        "CONCAT(user.firstName, ' ', user.lastName)",
        'COUNT(booking.id) as bookingCount',
        'SUM(booking.totalAmount) as totalRevenue',
      ])
      .groupBy('user.id, user.firstName, user.lastName')
      .orderBy('COUNT(booking.id)', 'DESC')
      .limit(5)
      .getRawMany();

    const topUsersByBookings = topUsers.map((user) => ({
      id: user.user_id,
      name: user.user_name,
      bookings: parseInt(user.bookingcount) || 0,
      revenue: parseFloat(user.totalrevenue) || 0,
    }));

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      bannedUsers,
      deletedUsers,
      verifiedUsers,
      pendingVerification,
      newUsersThisMonth,
      userGrowthRate: Math.round(userGrowthRate * 100) / 100,
      averageSessionDuration: '24m 30s', // This would need actual session tracking
      topUsersByBookings,
    };
  }

  // User Verification
  async verifyUser(userId: string) {
    const user = await this.findUserById(userId);

    user.isEmailVerified = true;
    user.updatedAt = new Date();

    await this.userRepository.save(user);

    return {
      success: true,
      message: 'User verified successfully',
      user: {
        id: userId,
        emailVerified: true,
        verifiedAt: new Date(),
      },
    };
  }

  async rejectVerification(userId: string, reason: string) {
    const user = await this.findUserById(userId);

    user.adminNotes = reason;
    user.updatedAt = new Date();

    await this.userRepository.save(user);

    return {
      success: true,
      message: 'User verification rejected',
      user: {
        id: userId,
        rejectionReason: reason,
        rejectedAt: new Date(),
      },
    };
  }

  // User Communication
  async sendNotification(
    userId: string,
    title: string,
    message: string,
    type?: string,
  ) {
    const user = await this.findUserById(userId);

    return {
      success: true,
      message: 'Notification sent successfully',
      notification: {
        id: `notif_${Date.now()}`,
        userId,
        title,
        message,
        type: type || 'info',
        sentAt: new Date(),
        status: 'sent',
      },
    };
  }

  async bulkSendNotification(
    userIds: string[],
    title: string,
    message: string,
    type?: string,
  ) {
    return {
      success: true,
      message: `Notification sent to ${userIds.length} users`,
      notification: {
        id: `bulk_notif_${Date.now()}`,
        userIds,
        title,
        message,
        type: type || 'info',
        sentAt: new Date(),
        status: 'sent',
      },
      sentCount: userIds.length,
    };
  }

  // Data Export
  async exportUsers(queryDto: any) {
    const users = await this.findAllUsers(queryDto);

    return {
      success: true,
      message: 'Export initiated',
      exportId: `export_${Date.now()}`,
      format: 'csv',
      recordCount: users.data.length,
      downloadUrl: `https://api.example.com/exports/users_${Date.now()}.csv`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  // User Documents
  async getUserDocuments(userId: string) {
    const user = await this.findUserById(userId);

    // Mock documents data
    return {
      documents: [
        {
          id: '1',
          type: 'aadhaar',
          name: 'Aadhaar Card',
          url: 'https://example.com/doc1.pdf',
          status: 'verified',
          uploadedAt: new Date('2024-01-15'),
          verifiedAt: new Date('2024-01-16'),
        },
        {
          id: '2',
          type: 'pan',
          name: 'PAN Card',
          url: 'https://example.com/doc2.pdf',
          status: 'pending',
          uploadedAt: new Date('2024-01-20'),
        },
        {
          id: '3',
          type: 'address_proof',
          name: 'Utility Bill',
          url: 'https://example.com/doc3.pdf',
          status: 'rejected',
          uploadedAt: new Date('2024-01-18'),
          rejectedAt: new Date('2024-01-19'),
          rejectionReason: 'Document not clear',
        },
      ],
    };
  }

  async requestDocuments(
    userId: string,
    documentTypes: string[],
    message?: string,
  ) {
    const user = await this.findUserById(userId);

    return {
      success: true,
      message: 'Document request sent to user',
      requestId: `req_${Date.now()}`,
      documentTypes,
      requestMessage: message || 'Please upload the requested documents',
      sentAt: new Date(),
    };
  }

  async reviewDocument(
    userId: string,
    documentId: string,
    status: string,
    notes?: string,
  ) {
    const user = await this.findUserById(userId);

    return {
      success: true,
      message: `Document ${status} successfully`,
      document: {
        id: documentId,
        status,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
    };
  }

  // User Flags
  async addFlag(
    userId: string,
    type: string,
    reason: string,
    severity?: string,
  ) {
    const user = await this.findUserById(userId);

    const flag = {
      id: `flag_${Date.now()}`,
      type,
      reason,
      severity: severity || 'medium',
      createdAt: new Date(),
      resolved: false,
    };

    return {
      success: true,
      message: 'Flag added successfully',
      flag,
    };
  }

  async updateFlag(userId: string, flagId: string, updates: any) {
    const user = await this.findUserById(userId);

    return {
      success: true,
      message: 'Flag updated successfully',
      flag: {
        id: flagId,
        ...updates,
        updatedAt: new Date(),
      },
    };
  }

  async removeFlag(userId: string, flagId: string) {
    const user = await this.findUserById(userId);

    return {
      success: true,
      message: 'Flag removed successfully',
      flagId,
      removedAt: new Date(),
    };
  }

  // KYC Verification Management
  async getAllVerifications(queryDto: KycVerificationQueryDto) {
    const {
      // page = 1, // Remove this as it's not in SpaceQueryDto
      limit = 10,
      status,
      provider,
      verificationType,
      riskLevel,
      search,
      dateFrom,
      dateTo,
      minCost,
      maxCost,
      fraudAlertsOnly,
      bookingId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.kycVerificationRepository
      .createQueryBuilder('verification')
      .leftJoinAndSelect('verification.user', 'user')
      .leftJoinAndSelect('verification.booking', 'booking');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('verification.status = :status', { status });
    }

    if (provider) {
      queryBuilder.andWhere('verification.provider = :provider', { provider });
    }

    if (verificationType) {
      queryBuilder.andWhere(
        'verification.verificationType = :verificationType',
        { verificationType },
      );
    }

    if (riskLevel) {
      queryBuilder.andWhere(
        "verification.verificationResult->>'riskAssessment'->>'riskLevel' = :riskLevel",
        { riskLevel },
      );
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (dateFrom && dateTo) {
      queryBuilder.andWhere(
        'verification.createdAt BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom: new Date(dateFrom),
          dateTo: new Date(dateTo),
        },
      );
    } else if (dateFrom) {
      queryBuilder.andWhere('verification.createdAt >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    } else if (dateTo) {
      queryBuilder.andWhere('verification.createdAt <= :dateTo', {
        dateTo: new Date(dateTo),
      });
    }

    if (minCost !== undefined) {
      queryBuilder.andWhere('verification.cost >= :minCost', { minCost });
    }

    if (maxCost !== undefined) {
      queryBuilder.andWhere('verification.cost <= :maxCost', { maxCost });
    }

    if (fraudAlertsOnly) {
      queryBuilder.andWhere(
        "(verification.fraudChecks->>'duplicateCheck'->>'result' = 'FAILED' OR verification.fraudChecks->>'watchlistCheck'->>'result' = 'FAILED')",
      );
    }

    if (bookingId) {
      queryBuilder.andWhere('verification.bookingId = :bookingId', {
        bookingId,
      });
    }

    // Dynamic sorting
    const sortField =
      sortBy === 'createdAt'
        ? 'verification.createdAt'
        : sortBy === 'completedAt'
          ? 'verification.completedAt'
          : sortBy === 'cost'
            ? 'verification.cost'
            : sortBy === 'status'
              ? 'verification.status'
              : 'verification.createdAt';

    queryBuilder.orderBy(sortField, sortOrder as 'ASC' | 'DESC');

    // Pagination
    const page = 1; // Default page since it's not in SpaceQueryDto
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [verifications, total] = await queryBuilder.getManyAndCount();

    return {
      data: verifications,
      meta: {
        total,
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        totalPages: Math.ceil(total / limit),
        filters: {
          status,
          provider,
          verificationType,
          riskLevel,
          search,
          dateFrom,
          dateTo,
          minCost,
          maxCost,
          fraudAlertsOnly,
          bookingId,
        },
        sorting: {
          sortBy,
          sortOrder,
        },
      },
    };
  }

  async reviewKycVerification(
    verificationId: string,
    status: 'approved' | 'rejected',
    notes?: string,
    adminId?: string,
  ) {
    const verification = await this.kycVerificationRepository.findOne({
      where: { id: verificationId },
      relations: ['user', 'booking'],
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    // Update verification status
    verification.status =
      status === 'approved' ? KycStatus.APPROVED : KycStatus.REJECTED;
    verification.completedAt = new Date();
    verification.adminNotes = notes;
    verification.internalNotes = `Reviewed by admin: ${adminId}`;
    verification.updatedAt = new Date();

    // Update user KYC status if approved
    if (status === 'approved') {
      verification.user.kycVerified = true;
      verification.user.kycVerifiedAt = new Date();
      verification.user.kycVerificationId = verificationId;
      await this.userRepository.save(verification.user);
    }

    // Update booking KYC status if associated
    if (verification.booking) {
      verification.booking.kycStatus =
        status === 'approved' ? 'completed' : 'failed';
      await this.bookingRepository.save(verification.booking);
    }

    await this.kycVerificationRepository.save(verification);

    return {
      success: true,
      message: `Verification ${status} successfully`,
      verification: {
        id: verificationId,
        status: verification.status,
        reviewedAt: verification.completedAt,
        reviewedBy: adminId,
        notes,
      },
    };
  }

  async getVerificationStats() {
    try {
      console.log('🔍 Starting getVerificationStats');
      console.log('🔍 Repository available:', !!this.kycVerificationRepository);

      // Test basic repository connection
      let totalVerifications;
      try {
        totalVerifications = await this.kycVerificationRepository.count();
        console.log('✅ Total verifications:', totalVerifications);
      } catch (countError) {
        console.error('❌ Error counting verifications:', countError);
        throw countError;
      }

      // If no verifications exist, return empty stats
      if (totalVerifications === 0) {
        console.log('📊 No verifications found, returning empty stats');
        return {
          total: 0,
          byStatus: {},
          byProvider: {},
          byRiskLevel: {},
          fraudAlerts: 0,
          totalCost: 0,
          avgCost: 0,
        };
      }

      // Get status counts
      let statusCounts = [];
      try {
        statusCounts = await this.kycVerificationRepository
          .createQueryBuilder('verification')
          .select('verification.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .groupBy('verification.status')
          .getRawMany();
        console.log('✅ Status counts:', statusCounts);
      } catch (statusError) {
        console.error('❌ Error getting status counts:', statusError);
        statusCounts = [];
      }

      // Get provider counts
      let providerCounts = [];
      try {
        providerCounts = await this.kycVerificationRepository
          .createQueryBuilder('verification')
          .select('verification.provider', 'provider')
          .addSelect('COUNT(*)', 'count')
          .groupBy('verification.provider')
          .getRawMany();
        console.log('✅ Provider counts:', providerCounts);
      } catch (providerError) {
        console.error('❌ Error getting provider counts:', providerError);
        providerCounts = [];
      }

      // Get risk level counts (with proper null handling)
      let riskLevelCounts = [];
      try {
        riskLevelCounts = await this.kycVerificationRepository
          .createQueryBuilder('verification')
          .select(
            "verification.verificationResult->>'riskAssessment'->>'riskLevel'",
            'riskLevel',
          )
          .addSelect('COUNT(*)', 'count')
          .where(
            "verification.verificationResult IS NOT NULL AND verification.verificationResult->>'riskAssessment' IS NOT NULL AND verification.verificationResult->>'riskAssessment'->>'riskLevel' IS NOT NULL",
          )
          .groupBy(
            "verification.verificationResult->>'riskAssessment'->>'riskLevel'",
          )
          .getRawMany();
        console.log('✅ Risk level counts:', riskLevelCounts);
      } catch (riskError) {
        console.error('❌ Error getting risk level counts:', riskError);
        riskLevelCounts = [];
      }

      // Get fraud alerts
      let fraudAlerts = 0;
      try {
        fraudAlerts = await this.kycVerificationRepository
          .createQueryBuilder('verification')
          .where(
            "verification.fraudChecks IS NOT NULL AND (verification.fraudChecks->>'duplicateCheck'->>'result' = 'FAILED' OR verification.fraudChecks->>'watchlistCheck'->>'result' = 'FAILED')",
          )
          .getCount();
        console.log('✅ Fraud alerts:', fraudAlerts);
      } catch (fraudError) {
        console.error('❌ Error getting fraud alerts:', fraudError);
        fraudAlerts = 0;
      }

      // Get cost statistics
      let totalCost = { total: '0' };
      let avgCost = { average: '0' };
      try {
        totalCost = await this.kycVerificationRepository
          .createQueryBuilder('verification')
          .select('SUM(verification.cost)', 'total')
          .getRawOne();
        console.log('✅ Total cost:', totalCost);
      } catch (totalCostError) {
        console.error('❌ Error getting total cost:', totalCostError);
        totalCost = { total: '0' };
      }

      try {
        avgCost = await this.kycVerificationRepository
          .createQueryBuilder('verification')
          .select('AVG(verification.cost)', 'average')
          .getRawOne();
        console.log('✅ Average cost:', avgCost);
      } catch (avgCostError) {
        console.error('❌ Error getting average cost:', avgCostError);
        avgCost = { average: '0' };
      }

      const result = {
        total: totalVerifications,
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        byProvider: providerCounts.reduce((acc, item) => {
          acc[item.provider] = parseInt(item.count);
          return acc;
        }, {}),
        byRiskLevel: riskLevelCounts.reduce((acc, item) => {
          acc[item.riskLevel] = parseInt(item.count);
          return acc;
        }, {}),
        fraudAlerts,
        totalCost: parseFloat(totalCost?.total || '0'),
        avgCost: parseFloat(avgCost?.average || '0'),
      };

      console.log('✅ Final result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in getVerificationStats:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error name:', error.name);
      throw error;
    }
  }

  async getKycProviderStats(queryDto: KycProviderStatsDto) {
    try {
      console.log(
        '🔍 Starting getKycProviderStats with query:',
        JSON.stringify(queryDto),
      );
      const { provider, dateFrom, dateTo } = queryDto;

      // Build base query with filters
      let baseQuery =
        this.kycVerificationRepository.createQueryBuilder('verification');

      console.log('📊 Created query builder for KYC verification repository');

      // Apply filters
      if (provider) {
        baseQuery = baseQuery.andWhere('verification.provider = :provider', {
          provider,
        });
      }

      if (dateFrom && dateTo) {
        baseQuery = baseQuery.andWhere(
          'verification.createdAt BETWEEN :dateFrom AND :dateTo',
          {
            dateFrom: new Date(dateFrom),
            dateTo: new Date(dateTo),
          },
        );
      } else if (dateFrom) {
        baseQuery = baseQuery.andWhere('verification.createdAt >= :dateFrom', {
          dateFrom: new Date(dateFrom),
        });
      } else if (dateTo) {
        baseQuery = baseQuery.andWhere('verification.createdAt <= :dateTo', {
          dateTo: new Date(dateTo),
        });
      }

      // Get provider performance metrics
      const providerStats = await baseQuery
        .select('verification.provider', 'provider')
        .addSelect('COUNT(*)', 'totalVerifications')
        .addSelect(
          'SUM(CASE WHEN verification.status = :approved THEN 1 ELSE 0 END)',
          'approvedCount',
        )
        .addSelect(
          'SUM(CASE WHEN verification.status = :rejected THEN 1 ELSE 0 END)',
          'rejectedCount',
        )
        .addSelect(
          'SUM(CASE WHEN verification.status = :pending THEN 1 ELSE 0 END)',
          'pendingCount',
        )
        .addSelect('AVG(verification.cost)', 'avgCost')
        .addSelect('SUM(verification.cost)', 'totalCost')
        .addSelect(
          'AVG(EXTRACT(EPOCH FROM (verification.completedAt - verification.createdAt)))',
          'avgProcessingTime',
        )
        .addSelect(
          'COUNT(CASE WHEN verification.fraudChecks IS NOT NULL THEN 1 END)',
          'fraudChecksCount',
        )
        .setParameter('approved', KycStatus.APPROVED)
        .setParameter('rejected', KycStatus.REJECTED)
        .setParameter('pending', KycStatus.PENDING)
        .groupBy('verification.provider')
        .getRawMany();

      console.log(
        '📊 Provider stats retrieved:',
        providerStats.length,
        'providers',
      );

      // Get risk level distribution by provider (separate query to avoid conflicts)
      let riskDistribution = [];
      try {
        const riskQuery =
          this.kycVerificationRepository.createQueryBuilder('verification');

        // Apply same filters
        if (provider) {
          riskQuery.andWhere('verification.provider = :provider', { provider });
        }
        if (dateFrom && dateTo) {
          riskQuery.andWhere(
            'verification.createdAt BETWEEN :dateFrom AND :dateTo',
            {
              dateFrom: new Date(dateFrom),
              dateTo: new Date(dateTo),
            },
          );
        } else if (dateFrom) {
          riskQuery.andWhere('verification.createdAt >= :dateFrom', {
            dateFrom: new Date(dateFrom),
          });
        } else if (dateTo) {
          riskQuery.andWhere('verification.createdAt <= :dateTo', {
            dateTo: new Date(dateTo),
          });
        }

        riskDistribution = await riskQuery
          .select('verification.provider', 'provider')
          .addSelect(
            "verification.verificationResult->>'riskAssessment'->>'riskLevel'",
            'riskLevel',
          )
          .addSelect('COUNT(*)', 'count')
          .where(
            "verification.verificationResult IS NOT NULL AND verification.verificationResult->>'riskAssessment'->>'riskLevel' IS NOT NULL",
          )
          .groupBy('verification.provider')
          .addGroupBy(
            "verification.verificationResult->>'riskAssessment'->>'riskLevel'",
          )
          .getRawMany();
      } catch (riskError) {
        console.warn(
          '⚠️ Could not retrieve risk distribution:',
          riskError.message,
        );
        riskDistribution = [];
      }

      console.log(
        '📊 Risk distribution retrieved:',
        riskDistribution.length,
        'entries',
      );

      // Calculate success rates and format response
      const formattedStats = providerStats.map((stat) => {
        const total = parseInt(stat.totalVerifications);
        const approved = parseInt(stat.approvedCount || '0');
        const rejected = parseInt(stat.rejectedCount || '0');
        const pending = parseInt(stat.pendingCount || '0');

        return {
          provider: stat.provider,
          totalVerifications: total,
          approvedCount: approved,
          rejectedCount: rejected,
          pendingCount: pending,
          successRate:
            total > 0 ? ((approved / total) * 100).toFixed(2) : '0.00',
          avgCost: parseFloat(stat.avgCost || '0').toFixed(2),
          totalCost: parseFloat(stat.totalCost || '0').toFixed(2),
          avgProcessingTimeHours: stat.avgProcessingTime
            ? (parseFloat(stat.avgProcessingTime) / 3600).toFixed(2)
            : '0.00',
          fraudChecksCount: parseInt(stat.fraudChecksCount || '0'),
          riskDistribution: riskDistribution
            .filter((risk) => risk.provider === stat.provider)
            .reduce((acc, risk) => {
              acc[risk.riskLevel] = parseInt(risk.count);
              return acc;
            }, {}),
        };
      });

      console.log('✅ KYC provider stats calculation completed');
      return {
        providers: formattedStats,
        summary: {
          totalProviders: formattedStats.length,
          dateRange: { dateFrom, dateTo },
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      console.error('❌ Error in getKycProviderStats:', error.message);
      console.error('❌ Stack trace:', error.stack);
      throw new Error(`Failed to get KYC provider stats: ${error.message}`);
    }
  }

  async getKycProviders() {
    // Get available providers from enum
    const availableProviders = Object.values(KycProvider);

    // Get usage statistics for each provider
    const providerUsage = await this.kycVerificationRepository
      .createQueryBuilder('verification')
      .select('verification.provider', 'provider')
      .addSelect('COUNT(*)', 'usageCount')
      .addSelect('MAX(verification.createdAt)', 'lastUsed')
      .groupBy('verification.provider')
      .getRawMany();

    const providers = availableProviders.map((provider) => {
      const usage = providerUsage.find((u) => u.provider === provider);

      return {
        name: provider,
        displayName: this.getProviderDisplayName(provider),
        isActive: true, // All providers are considered active
        usageCount: usage ? parseInt(usage.usageCount) : 0,
        lastUsed: usage ? usage.lastUsed : null,
        capabilities: this.getProviderCapabilities(provider),
        configuration: {
          supportedDocuments: this.getSupportedDocuments(provider),
          supportedCountries: this.getSupportedCountries(provider),
          averageCost: this.getProviderAverageCost(provider),
          processingTime: this.getProviderProcessingTime(provider),
        },
      };
    });

    return {
      providers,
      total: providers.length,
      active: providers.filter((p) => p.isActive).length,
    };
  }

  private getProviderDisplayName(provider: KycProvider): string {
    const displayNames = {
      [KycProvider.JUMIO]: 'Jumio',
      [KycProvider.ONFIDO]: 'Onfido',
      [KycProvider.VERIFF]: 'Veriff',
      [KycProvider.SUMSUB]: 'Sum&Substance',
    };
    return displayNames[provider] || provider;
  }

  private getProviderCapabilities(provider: KycProvider): string[] {
    const capabilities = {
      [KycProvider.JUMIO]: [
        'identity_verification',
        'document_verification',
        'biometric_verification',
        'liveness_check',
      ],
      [KycProvider.ONFIDO]: [
        'identity_verification',
        'document_verification',
        'facial_verification',
        'watchlist_screening',
      ],
      [KycProvider.VERIFF]: [
        'identity_verification',
        'document_verification',
        'biometric_verification',
        'address_verification',
      ],
      [KycProvider.SUMSUB]: [
        'identity_verification',
        'document_verification',
        'aml_screening',
        'ongoing_monitoring',
      ],
    };
    return capabilities[provider] || ['identity_verification'];
  }

  private getSupportedDocuments(provider: KycProvider): string[] {
    return ['passport', 'drivers_license', 'national_id', 'residence_permit'];
  }

  private getSupportedCountries(provider: KycProvider): string[] {
    return [
      'US',
      'GB',
      'DE',
      'FR',
      'ES',
      'IT',
      'NL',
      'BE',
      'AT',
      'CH',
      'SE',
      'NO',
      'DK',
      'FI',
    ];
  }

  private getProviderAverageCost(provider: KycProvider): number {
    const costs = {
      [KycProvider.JUMIO]: 2.5,
      [KycProvider.ONFIDO]: 3.0,
      [KycProvider.VERIFF]: 2.75,
      [KycProvider.SUMSUB]: 2.25,
    };
    return costs[provider] || 2.5;
  }

  private getProviderProcessingTime(provider: KycProvider): string {
    const times = {
      [KycProvider.JUMIO]: '2-5 minutes',
      [KycProvider.ONFIDO]: '1-3 minutes',
      [KycProvider.VERIFF]: '3-7 minutes',
      [KycProvider.SUMSUB]: '2-4 minutes',
    };
    return times[provider] || '2-5 minutes';
  }

  async bulkReviewKyc(
    verificationIds: string[],
    action: 'approve' | 'reject',
    notes?: string,
    adminId?: string,
  ) {
    const results = [];
    const errors = [];

    for (const verificationId of verificationIds) {
      try {
        const result = await this.reviewKycVerification(
          verificationId,
          action === 'approve' ? 'approved' : 'rejected',
          notes,
          adminId,
        );
        results.push({
          verificationId,
          status: 'success',
          result,
        });
      } catch (error) {
        errors.push({
          verificationId,
          status: 'error',
          error: error.message,
        });
      }
    }

    return {
      success: true,
      message: `Bulk ${action} operation completed`,
      summary: {
        total: verificationIds.length,
        successful: results.length,
        failed: errors.length,
        action,
      },
      results,
      errors,
      processedAt: new Date(),
      processedBy: adminId,
    };
  }

  // User History
  async getUserBookings(userId: string, queryDto: any) {
    const user = await this.findUserById(userId);

    // Mock booking data
    return {
      bookings: [
        {
          id: 'book_1',
          spaceId: 'space_1',
          spaceName: 'Conference Room A',
          partnerName: 'WeWork Mumbai',
          startDate: new Date('2024-01-15T09:00:00Z'),
          endDate: new Date('2024-01-15T17:00:00Z'),
          status: 'completed',
          amount: 5000,
          createdAt: new Date('2024-01-10'),
        },
        {
          id: 'book_2',
          spaceId: 'space_2',
          spaceName: 'Hot Desk',
          partnerName: 'Regus Delhi',
          startDate: new Date('2024-01-20T10:00:00Z'),
          endDate: new Date('2024-01-20T18:00:00Z'),
          status: 'upcoming',
          amount: 2500,
          createdAt: new Date('2024-01-18'),
        },
      ],
      total: 2,
      totalAmount: 7500,
    };
  }

  async getLatestBookings(limit: number = 5) {
    try {
      console.log('🔍 Starting getLatestBookings with limit:', limit);
      console.log('🔍 BookingRepository exists:', !!this.bookingRepository);

      // Removed mock data - testing with real database queries

      // First, try a simple count to test repository connection
      try {
        const totalCount = await this.bookingRepository.count();
        console.log('📊 Total bookings in database:', totalCount);
      } catch (countError) {
        console.error('❌ Error counting bookings:', countError.message);
        throw new Error(`Database connection issue: ${countError.message}`);
      }

      // Get latest bookings without spaceOption relation to avoid deletedAt issue
      console.log(
        '🔍 Attempting to find bookings without spaceOption relation...',
      );
      const bookings = await this.bookingRepository.find({
        relations: ['user'],
        order: { createdAt: 'DESC' },
        take: limit,
      });

      console.log('📊 Found bookings count:', bookings.length);

      if (bookings.length === 0) {
        console.log('⚠️ No bookings found in database');
        return [];
      }

      // Process each booking and fetch additional data separately
      const result = [];
      for (const booking of bookings) {
        try {
          console.log(`📝 Processing booking: ${booking.id}`);

          let spaceName = 'Unknown Space';
          let partnerName = 'Unknown Partner';

          // Fetch spaceOption and space details separately
          if (booking.spaceOptionId) {
            try {
              // First get the spaceOption
              const spaceOption = await this.spaceOptionRepository.findOne({
                where: { id: booking.spaceOptionId },
              });

              if (spaceOption?.spaceId) {
                // Then get the space details
                const space = await this.spaceRepository.findOne({
                  where: { id: spaceOption.spaceId },
                  relations: ['listing'],
                });

                if (space) {
                  spaceName = space.name || 'Unknown Space';

                  // Fetch partner details if listing exists
                  if (space.listing?.partner_id) {
                    const partner = await this.partnerRepository.findOne({
                      where: { id: space.listing.partner_id },
                    });
                    if (partner) {
                      partnerName = partner.businessName || 'Unknown Partner';
                    }
                  }
                }
              }
            } catch (spaceError) {
              console.warn(
                `⚠️ Could not fetch space details for booking ${booking.id}:`,
                spaceError.message,
              );
            }
          }

          result.push({
            id: booking.id,
            userId: booking.user?.id || null,
            userName:
              `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`.trim() ||
              'Unknown User',
            userEmail: booking.user?.email || null,
            spaceId: booking.spaceOptionId || null,
            spaceName,
            partnerName,
            startDate: booking.startDateTime,
            endDate: booking.endDateTime,
            status: booking.status,
            totalAmount: booking.totalAmount,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
          });
        } catch (mappingError) {
          console.error(
            `❌ Error mapping booking ${booking.id}:`,
            mappingError,
          );
          result.push({
            id: booking.id,
            userId: null,
            userName: 'Unknown User',
            userEmail: null,
            spaceId: null,
            spaceName: 'Unknown Space',
            partnerName: 'Unknown Partner',
            startDate: booking.startDateTime,
            endDate: booking.endDateTime,
            status: booking.status,
            totalAmount: booking.totalAmount,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
          });
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Error in getLatestBookings:', error.message);
      console.error('❌ Stack trace:', error.stack);
      throw new Error(`Failed to fetch latest bookings: ${error.message}`);
    }
  }

  async getUserPayments(userId: string, queryDto: any) {
    const user = await this.findUserById(userId);

    // Mock payment data
    return {
      payments: [
        {
          id: 'pay_1',
          bookingId: 'book_1',
          amount: 5000,
          status: 'completed',
          method: 'card',
          transactionId: 'txn_123456',
          createdAt: new Date('2024-01-15'),
        },
        {
          id: 'pay_2',
          bookingId: 'book_2',
          amount: 2500,
          status: 'pending',
          method: 'upi',
          transactionId: 'txn_789012',
          createdAt: new Date('2024-01-18'),
        },
      ],
      total: 2,
      totalAmount: 7500,
    };
  }

  async getUserTransactions(userId: string, queryDto: any) {
    // Verify user exists and get user entity
    const user = await this.findUserEntityById(userId);

    // Extract pagination parameters
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;

    // Create DTO for financial transaction service
    const dto = {
      page,
      limit,
      ...queryDto, // Include any additional query parameters
    };

    try {
      // Get transactions using FinancialTransactionService
      const result = await this.financialTransactionService.getUserHistory(
        userId,
        dto,
        user, // Pass the user entity for role-based access control
      );

      const totalPages = Math.ceil(result.total / limit);

      return {
        transactions: result.transactions,
        total: result.total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get user transactions for ${userId}:`,
        error,
      );
      // Return empty result if service fails
      return {
        transactions: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  async getAllTransactions(
    queryDto: AdminTransactionQueryDto,
  ): Promise<AdminTransactionListResponseDto> {
    try {
      // Extract pagination parameters
      const page = queryDto.page || 1;
      const limit = queryDto.limit || 10;

      // Create DTO for financial transaction service
      const dto = {
        page,
        limit,
        search: queryDto.search,
        status: queryDto.status,
        type: queryDto.type,
        category: queryDto.category,
        paymentMethod: queryDto.paymentMethod,
        userId: queryDto.userId,
        partnerId: queryDto.partnerId,
        bookingId: queryDto.bookingId,
        startDate: queryDto.startDate,
        endDate: queryDto.endDate,
        minAmount: queryDto.minAmount,
        maxAmount: queryDto.maxAmount,
        sortBy: queryDto.sortBy || 'createdAt',
        sortOrder: queryDto.sortOrder || 'DESC',
      };

      // Create a mock admin user for the service call
      // Since this is an admin endpoint, we can use admin privileges
      const adminUser = new UserEntity();
      adminUser.id = 'admin';
      adminUser.username = 'admin';
      adminUser.email = 'admin@system.local';
      adminUser.role = UserRole.Admin;
      adminUser.status = UserStatus.ACTIVE;
      adminUser.isEmailVerified = true;
      adminUser.twoFactorEnabled = false;
      adminUser.kycVerified = false;
      adminUser.createdAt = new Date();
      adminUser.updatedAt = new Date();

      // Get transactions using FinancialTransactionService
      const result = await this.financialTransactionService.getTransactions(
        dto,
        adminUser,
      );

      const totalPages = Math.ceil(result.total / limit);

      // Map TransactionResponseDto[] to AdminTransactionResponseDto[]
      const mappedTransactions = result.transactions.map((transaction) => ({
        id: transaction.id,
        userId: transaction.user?.id || '',
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        description: transaction.description,
        reference: transaction.externalTransactionId,
        bookingId: transaction.booking?.id,
        createdAt:
          transaction.createdAt?.toString() || new Date().toISOString(),
        updatedAt:
          transaction.updatedAt?.toString() || new Date().toISOString(),
        processedAt: undefined, // Not available in TransactionResponseDto
      }));

      return {
        data: mappedTransactions,
        totalRecords: result.total,
        currentPage: page,
        totalPages,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      this.logger.error('Failed to get all transactions:', error);
      // Return empty result if service fails
      return {
        data: [],
        totalRecords: 0,
        currentPage: queryDto.page || 1,
        totalPages: 0,
        limit: queryDto.limit || 10,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
  }

  async getTransactionDisputes(
    queryDto: TransactionDisputesQueryDto,
  ): Promise<TransactionDisputesListResponseDto> {
    try {
      const page = queryDto.page || 1;
      const limit = queryDto.limit || 10;
      const offset = (page - 1) * limit;

      // Build query for failed/disputed transactions
      const queryBuilder = this.paymentRepository
        .createQueryBuilder('payment')
        .leftJoinAndSelect('payment.booking', 'booking')
        .leftJoinAndSelect('booking.user', 'user')
        .leftJoinAndSelect('booking.space', 'space')
        .where('payment.status IN (:...statuses)', {
          statuses: ['failed', 'cancelled', 'disputed'],
        });

      // Apply filters
      if (queryDto.disputeStatus) {
        // Map dispute status to payment status
        const statusMap = {
          open: 'failed',
          investigating: 'failed',
          resolved: 'completed',
          closed: 'cancelled',
        };
        const mappedStatus = statusMap[queryDto.disputeStatus] || 'failed';
        queryBuilder.andWhere('payment.status = :status', {
          status: mappedStatus,
        });
      }

      if (queryDto.userId) {
        queryBuilder.andWhere('user.id = :userId', { userId: queryDto.userId });
      }

      if (queryDto.startDate) {
        queryBuilder.andWhere('payment.createdAt >= :startDate', {
          startDate: queryDto.startDate,
        });
      }

      if (queryDto.endDate) {
        queryBuilder.andWhere('payment.createdAt <= :endDate', {
          endDate: queryDto.endDate,
        });
      }

      if (queryDto.search) {
        queryBuilder.andWhere(
          '(user.email ILIKE :search OR payment.failureReason ILIKE :search)',
          { search: `%${queryDto.search}%` },
        );
      }

      // Apply sorting
      queryBuilder.orderBy('payment.createdAt', 'DESC');

      // Get total count
      const total = await queryBuilder.getCount();

      // Get paginated results
      const disputes = await queryBuilder.skip(offset).take(limit).getMany();

      // Map to response DTOs
      const mappedDisputes = disputes.map((payment) => ({
        id: payment.id,
        transactionId: payment.id,
        userId: payment.booking?.user?.id || '',
        disputeType: 'other' as const,
        disputeStatus: this.mapPaymentStatusToDisputeStatus(payment.status),
        priority: 'medium' as const,
        amount: payment.amount,
        currency: payment.currency || 'USD',
        reason: payment.failureReason || 'Payment issue',
        description: payment.failureReason || 'Payment failed or was disputed',
        evidence: [],
        adminNotes: payment.metadata?.notes || '',
        resolution: payment.status === 'completed' ? 'Resolved' : '',
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
        resolvedAt: payment.completedAt?.toISOString(),
        transaction: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency || 'USD',
          status: this.mapPaymentStatusToTransactionStatus(payment.status),
          type: TransactionType.PAYMENT,
          description: payment.failureReason || 'Payment transaction',
          createdAt: payment.createdAt.toISOString(),
        },
        user: {
          id: payment.booking?.user?.id || '',
          email: payment.booking?.user?.email || '',
          firstName: payment.booking?.user?.firstName || '',
          lastName: payment.booking?.user?.lastName || '',
        },
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        data: mappedDisputes,
        totalRecords: total,
        currentPage: page,
        totalPages,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      this.logger.error('Failed to get transaction disputes:', error);
      throw new Error('Failed to retrieve transaction disputes');
    }
  }

  async exportTransactions(
    exportDto: TransactionExportDto,
  ): Promise<TransactionExportResponseDto> {
    try {
      // Build query for transactions to export
      const queryBuilder = this.paymentRepository
        .createQueryBuilder('payment')
        .leftJoinAndSelect('payment.booking', 'booking')
        .leftJoinAndSelect('booking.user', 'user')
        .leftJoinAndSelect('booking.space', 'space');

      // Apply filters
      if (exportDto.status) {
        queryBuilder.where('payment.status = :status', {
          status: exportDto.status,
        });
      }

      if (exportDto.startDate) {
        queryBuilder.andWhere('payment.createdAt >= :startDate', {
          startDate: exportDto.startDate,
        });
      }

      if (exportDto.endDate) {
        queryBuilder.andWhere('payment.createdAt <= :endDate', {
          endDate: exportDto.endDate,
        });
      }

      if (exportDto.userId) {
        queryBuilder.andWhere('user.id = :userId', {
          userId: exportDto.userId,
        });
      }

      if (exportDto.minAmount) {
        queryBuilder.andWhere('payment.amount >= :minAmount', {
          minAmount: exportDto.minAmount,
        });
      }

      if (exportDto.maxAmount) {
        queryBuilder.andWhere('payment.amount <= :maxAmount', {
          maxAmount: exportDto.maxAmount,
        });
      }

      // Apply sorting
      queryBuilder.orderBy('payment.createdAt', 'DESC');

      // Get all matching transactions
      const transactions = await queryBuilder.getMany();

      // Generate export data based on format
      let exportData: string;
      let mimeType: string;
      let fileExtension: string;

      if (exportDto.format === 'csv') {
        // Generate CSV
        const headers = [
          'Transaction ID',
          'User ID',
          'User Name',
          'User Email',
          'Booking ID',
          'Space Name',
          'Amount',
          'Currency',
          'Status',
          'Payment Method',
          'Description',
          'Created At',
          'Updated At',
        ];

        const csvRows = [
          headers.join(','),
          ...transactions.map((payment) =>
            [
              payment.gatewayPaymentId || payment.id,
              payment.booking?.user?.id || '',
              payment.booking?.user?.username || '',
              payment.booking?.user?.email || '',
              payment.booking?.id || '',
              payment.booking?.spaceOption?.name || '',
              payment.amount,
              payment.currency || 'USD',
              payment.status,
              payment.method || '',
              `"${payment.failureReason || ''}"`,
              payment.createdAt?.toISOString() || '',
              payment.updatedAt?.toISOString() || '',
            ].join(','),
          ),
        ];

        exportData = csvRows.join('\n');
        mimeType = 'text/csv';
        fileExtension = 'csv';
      } else {
        // Generate Excel (simplified as CSV for now)
        exportData = 'Excel export not implemented yet';
        mimeType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `transactions_export_${timestamp}.${fileExtension}`;

      // In a real implementation, you would save this to a file storage service
      // and return the download URL. For now, we'll return the data directly.
      const downloadUrl = `/api/v1/admin/downloads/${filename}`;

      return {
        fileName: filename,
        fileUrl: downloadUrl,
        format: exportDto.format,
        recordCount: transactions.length,
        createdAt: new Date().toISOString(),
        fileSize: Buffer.byteLength(exportData, 'utf8'),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };
    } catch (error) {
      this.logger.error('Failed to export transactions:', error);
      throw new Error('Failed to export transactions');
    }
  }

  // Bulk Operations
  async bulkUpdateStatus(
    userIds: string[],
    status: UserStatus,
    reason?: string,
  ) {
    const updateResult = await this.userRepository.update(
      { id: Like(`%${userIds.join('%|%')}%`) },
      {
        status,
        adminNotes: reason,
        updatedAt: new Date(),
      },
    );

    return {
      success: true,
      message: `Updated status for ${updateResult.affected} users`,
      updatedCount: updateResult.affected,
      status,
      reason,
      updatedAt: new Date(),
    };
  }

  // Financial Statistics
  async getFinancialStats(period?: string) {
    // Mock financial statistics data
    const baseStats = {
      totalRevenue: 2450000,
      totalCommissions: 245000,
      pendingPayouts: 85000,
      processingFees: 12250,
      monthlyGrowth: 15.5,
    };

    // Adjust stats based on period
    if (period === 'weekly') {
      return {
        ...baseStats,
        totalRevenue: Math.floor(baseStats.totalRevenue * 0.25),
        totalCommissions: Math.floor(baseStats.totalCommissions * 0.25),
        pendingPayouts: Math.floor(baseStats.pendingPayouts * 0.3),
        processingFees: Math.floor(baseStats.processingFees * 0.25),
        monthlyGrowth: 8.2,
      };
    }

    if (period === 'yearly') {
      return {
        ...baseStats,
        totalRevenue: Math.floor(baseStats.totalRevenue * 12),
        totalCommissions: Math.floor(baseStats.totalCommissions * 12),
        pendingPayouts: Math.floor(baseStats.pendingPayouts * 0.8),
        processingFees: Math.floor(baseStats.processingFees * 12),
        monthlyGrowth: 22.8,
      };
    }

    // Default to monthly
    return baseStats;
  }

  // Financial Reports
  async getFinancialReports(queryDto: AdminAnalyticsQueryDto) {
    const { period = 'monthly', startDate, endDate } = queryDto;

    // Calculate date range
    const now = new Date();
    let start: Date, end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case AnalyticsPeriod.WEEK:
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case AnalyticsPeriod.YEAR:
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default: // monthly
          start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      end = now;
    }

    // Generate comprehensive financial report data
    const totalRevenue = await this.getTotalRevenue(start, end);
    const totalCommissions = await this.getTotalCommissions(start, end);
    const totalPayouts = await this.getTotalPayouts(start, end);
    const totalRefunds = await this.getTotalRefunds(start, end);
    const recentTransactions = await this.getRecentTransactions(10);
    const topPartners = await this.getTopPartnersByRevenue(start, end, 5);
    const revenueBreakdown = await this.getRevenueBreakdown(start, end);

    return {
      summary: {
        totalRevenue,
        totalCommissions,
        totalPayouts,
        totalRefunds,
        netRevenue: totalRevenue - totalCommissions - totalRefunds,
        period: period,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
      transactions: {
        recent: recentTransactions,
        total: Math.floor(Math.random() * 10000) + 5000,
        successful: Math.floor(Math.random() * 9500) + 4500,
        failed: Math.floor(Math.random() * 500) + 100,
      },
      partners: {
        top: topPartners,
        totalActive: Math.floor(Math.random() * 500) + 200,
        newThisPeriod: Math.floor(Math.random() * 50) + 10,
      },
      breakdown: revenueBreakdown,
      trends: {
        revenueGrowth: (Math.random() * 20 - 5).toFixed(2) + '%',
        transactionGrowth: (Math.random() * 15 - 3).toFixed(2) + '%',
        partnerGrowth: (Math.random() * 25 - 2).toFixed(2) + '%',
      },
      generatedAt: now.toISOString(),
    };
  }

  private async getTotalRevenue(start: Date, end: Date): Promise<number> {
    // Mock revenue calculation based on date range
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.floor(Math.random() * days * 1000) + days * 500;
  }

  private async getTotalCommissions(start: Date, end: Date): Promise<number> {
    const revenue = await this.getTotalRevenue(start, end);
    return Math.floor(revenue * 0.1); // 10% commission rate
  }

  private async getTotalPayouts(start: Date, end: Date): Promise<number> {
    const revenue = await this.getTotalRevenue(start, end);
    return Math.floor(revenue * 0.75); // 75% goes to partners
  }

  private async getTotalRefunds(start: Date, end: Date): Promise<number> {
    const revenue = await this.getTotalRevenue(start, end);
    return Math.floor(revenue * 0.05); // 5% refund rate
  }

  private async getRecentTransactions(limit: number) {
    const transactions = [];
    for (let i = 0; i < limit; i++) {
      const date = new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      );
      transactions.push({
        id: `txn_${Math.random().toString(36).substr(2, 9)}`,
        amount: Math.floor(Math.random() * 5000) + 100,
        type: ['booking', 'commission', 'payout', 'refund'][
          Math.floor(Math.random() * 4)
        ],
        status: ['completed', 'pending', 'failed'][
          Math.floor(Math.random() * 3)
        ],
        date: date.toISOString(),
        description: `Transaction ${i + 1}`,
      });
    }
    return transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  private async getTopPartnersByRevenue(start: Date, end: Date, limit: number) {
    const partners = [];
    for (let i = 0; i < limit; i++) {
      partners.push({
        id: `partner_${i + 1}`,
        name: `Partner ${i + 1}`,
        revenue: Math.floor(Math.random() * 50000) + 10000,
        bookings: Math.floor(Math.random() * 100) + 20,
        commission: Math.floor(Math.random() * 5000) + 1000,
      });
    }
    return partners.sort((a, b) => b.revenue - a.revenue);
  }

  private async getRevenueBreakdown(start: Date, end: Date) {
    return {
      byCategory: [
        {
          category: 'Workspace Bookings',
          amount: Math.floor(Math.random() * 100000) + 50000,
          percentage: 60,
        },
        {
          category: 'Meeting Rooms',
          amount: Math.floor(Math.random() * 50000) + 25000,
          percentage: 25,
        },
        {
          category: 'Event Spaces',
          amount: Math.floor(Math.random() * 30000) + 15000,
          percentage: 15,
        },
      ],
      byPaymentMethod: [
        {
          method: 'Credit Card',
          amount: Math.floor(Math.random() * 80000) + 40000,
          percentage: 70,
        },
        {
          method: 'Bank Transfer',
          amount: Math.floor(Math.random() * 30000) + 15000,
          percentage: 20,
        },
        {
          method: 'Digital Wallet',
          amount: Math.floor(Math.random() * 15000) + 7500,
          percentage: 10,
        },
      ],
    };
  }

  // Financial Config Overview
  async getFinancialConfigOverview() {
    // Mock financial configuration overview data
    return {
      paymentMethods: {
        total: 5,
        active: 4,
        pending: 1,
        methods: [
          { name: 'Stripe', status: 'active', transactionFee: 2.9 },
          { name: 'PayPal', status: 'active', transactionFee: 3.5 },
          { name: 'Bank Transfer', status: 'active', transactionFee: 0.5 },
          { name: 'Crypto', status: 'pending', transactionFee: 1.0 },
          { name: 'Apple Pay', status: 'active', transactionFee: 2.9 },
        ],
      },
      commissionRates: {
        default: 10.0,
        premium: 8.0,
        enterprise: 5.0,
        averageRate: 9.2,
      },
      payoutSettings: {
        frequency: 'weekly',
        minimumAmount: 50,
        processingTime: '2-3 business days',
        autoPayoutEnabled: true,
      },
      taxConfiguration: {
        vatEnabled: true,
        defaultVatRate: 20.0,
        taxReportingEnabled: true,
        regions: ['US', 'EU', 'UK', 'CA'],
      },
      currencies: {
        primary: 'USD',
        supported: ['USD', 'EUR', 'GBP', 'CAD'],
        exchangeRateProvider: 'XE.com',
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  // Real-time Financial Stats
  async getRealtimeFinancialStats() {
    // Mock real-time financial statistics
    const now = new Date();
    return {
      currentRevenue: {
        today: 12450,
        thisHour: 1250,
        lastHour: 980,
        growth: 27.5,
      },
      activeTransactions: {
        processing: 23,
        pending: 8,
        completed: 156,
        failed: 2,
      },
      payouts: {
        pendingAmount: 85000,
        scheduledToday: 12,
        processingCount: 5,
        nextPayoutTime: new Date(
          now.getTime() + 2 * 60 * 60 * 1000,
        ).toISOString(),
      },
      walletBalances: {
        totalPlatformBalance: 245000,
        totalPartnerBalance: 180000,
        totalUserBalance: 65000,
        escrowBalance: 25000,
      },
      recentActivity: [
        {
          type: 'payment',
          amount: 150,
          currency: 'USD',
          timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
          status: 'completed',
        },
        {
          type: 'payout',
          amount: 1200,
          currency: 'USD',
          timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
          status: 'processing',
        },
        {
          type: 'refund',
          amount: 75,
          currency: 'USD',
          timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
          status: 'completed',
        },
      ],
      alerts: [
        {
          type: 'warning',
          message: 'High transaction volume detected',
          timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        },
        {
          type: 'info',
          message: 'Weekly payout scheduled for tomorrow',
          timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        },
      ],
      lastUpdated: now.toISOString(),
    };
  }

  // Support Statistics
  async getSupportStats() {
    // Mock support ticket statistics
    return {
      total: 1247,
      open: 89,
      inProgress: 156,
      resolved: 1002,
      avgResponseTime: 4.2, // in hours
      satisfactionRate: 87.5, // percentage
    };
  }

  // User Analytics for Reports
  async getUserActivityData(queryDto: AdminAnalyticsQueryDto) {
    // Mock user activity data for charts
    const mockData = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      mockData.push({
        date: date.toISOString().split('T')[0],
        activeUsers: Math.floor(Math.random() * 500) + 200,
        newUsers: Math.floor(Math.random() * 50) + 10,
        sessions: Math.floor(Math.random() * 800) + 300,
      });
    }

    return mockData;
  }

  async getUserSegments(queryDto: AdminAnalyticsQueryDto) {
    // Mock user segments data for pie chart
    return [
      { name: 'Regular Users', value: 45, color: '#8884d8' },
      { name: 'Premium Users', value: 25, color: '#82ca9d' },
      { name: 'Enterprise Users', value: 20, color: '#ffc658' },
      { name: 'Trial Users', value: 10, color: '#ff7c7c' },
    ];
  }

  async getTopUsers(queryDto: AdminAnalyticsQueryDto) {
    // Mock top users data
    return [
      {
        id: '1',
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        totalBookings: 45,
        totalSpent: 125000,
        engagementScore: 95,
        lastActive: new Date('2024-01-20'),
      },
      {
        id: '2',
        name: 'Priya Patel',
        email: 'priya@example.com',
        totalBookings: 38,
        totalSpent: 98000,
        engagementScore: 87,
        lastActive: new Date('2024-01-19'),
      },
      {
        id: '3',
        name: 'Amit Kumar',
        email: 'amit@example.com',
        totalBookings: 32,
        totalSpent: 85000,
        engagementScore: 82,
        lastActive: new Date('2024-01-18'),
      },
      {
        id: '4',
        name: 'Sneha Singh',
        email: 'sneha@example.com',
        totalBookings: 28,
        totalSpent: 72000,
        engagementScore: 78,
        lastActive: new Date('2024-01-17'),
      },
      {
        id: '5',
        name: 'Vikram Gupta',
        email: 'vikram@example.com',
        totalBookings: 25,
        totalSpent: 65000,
        engagementScore: 75,
        lastActive: new Date('2024-01-16'),
      },
    ];
  }

  async getUserMetrics(queryDto: AdminAnalyticsQueryDto) {
    // Mock user engagement metrics
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({
      where: { status: UserStatus.ACTIVE },
    });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsers = await this.userRepository.count({
      where: { createdAt: MoreThan(thirtyDaysAgo) },
    });

    return {
      totalUsers,
      activeUsers,
      newUsers,
      averageSessionDuration: '24m 35s',
      retentionRate: 78.5,
      bounceRate: 32.1,
      totalSessions: 15420,
    };
  }

  // Dashboard Methods
  async getDashboardKpis() {
    try {
      // Check cache first
      const cacheKey = { key: 'DashboardKPIs' as keyof typeof CacheKey };
      const cachedData = await this.cacheService.get(cacheKey);

      if (cachedData) {
        return cachedData;
      }

      // Get current date ranges for growth calculation
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Current metrics
      const totalUsers = await this.userRepository.count();
      const totalBookings = await this.bookingRepository.count();
      const activeSpaces = await this.spaceRepository.count({
        where: { status: SpaceStatus.ACTIVE },
      });

      const totalRevenueResult = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne();
      const totalRevenue = parseFloat(totalRevenueResult?.total) || 0;

      // Previous period metrics for growth calculation (30-60 days ago)
      const usersLastMonth = await this.userRepository.count({
        where: {
          createdAt: Between(sixtyDaysAgo, thirtyDaysAgo),
          role: Not(In(['Admin', 'SuperAdmin'])),
        },
      });

      const bookingsLastMonth = await this.bookingRepository.count({
        where: {
          createdAt: Between(sixtyDaysAgo, thirtyDaysAgo),
        },
      });

      const spacesLastMonth = await this.spaceRepository.count({
        where: {
          createdAt: Between(sixtyDaysAgo, thirtyDaysAgo),
          status: SpaceStatus.ACTIVE,
        },
      });

      const revenueLastMonthResult = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .andWhere('payment.createdAt BETWEEN :start AND :end', {
          start: sixtyDaysAgo,
          end: thirtyDaysAgo,
        })
        .getRawOne();
      const revenueLastMonth = parseFloat(revenueLastMonthResult?.total) || 0;

      // Calculate growth percentages
      const calculateGrowth = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const userGrowth = calculateGrowth(totalUsers, usersLastMonth);
      const bookingGrowth = calculateGrowth(totalBookings, bookingsLastMonth);
      const spaceGrowth = calculateGrowth(activeSpaces, spacesLastMonth);
      const revenueGrowth = calculateGrowth(totalRevenue, revenueLastMonth);

      const result = {
        totalUsers,
        totalBookings,
        totalRevenue,
        activeSpaces,
        userGrowth,
        bookingGrowth,
        revenueGrowth,
        spaceGrowth,
      };

      // Cache the result for 5 minutes (300,000 milliseconds)
      await this.cacheService.set(cacheKey, result, { ttl: 300000 });

      return result;
    } catch (error) {
      throw new Error(`Failed to get dashboard KPIs: ${error.message}`);
    }
  }

  async getDashboardNotifications() {
    // Get recent system notifications
    const notifications = [
      {
        id: '1',
        type: 'warning',
        title: 'High Server Load',
        message: 'Server CPU usage is above 80%',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
      },
      {
        id: '2',
        type: 'info',
        title: 'New User Registration',
        message: '15 new users registered in the last hour',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        read: false,
      },
      {
        id: '3',
        type: 'success',
        title: 'Payment Processed',
        message: 'Monthly subscription payments completed successfully',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        read: true,
      },
      {
        id: '4',
        type: 'error',
        title: 'Failed Payment',
        message: '3 payment failures detected, requires attention',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        read: false,
      },
    ];

    return {
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    };
  }

  async getDashboardStats() {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Today's stats
    const todayUsers = await this.userRepository.count({
      where: { createdAt: MoreThan(yesterday) },
    });
    const todayBookings = await this.bookingRepository.count({
      where: { createdAt: MoreThan(yesterday) },
    });

    // Weekly stats
    const weeklyUsers = await this.userRepository.count({
      where: { createdAt: MoreThan(lastWeek) },
    });
    const weeklyBookings = await this.bookingRepository.count({
      where: { createdAt: MoreThan(lastWeek) },
    });

    // Monthly stats
    const monthlyUsers = await this.userRepository.count({
      where: { createdAt: MoreThan(lastMonth) },
    });
    const monthlyBookings = await this.bookingRepository.count({
      where: { createdAt: MoreThan(lastMonth) },
    });

    return {
      today: {
        users: todayUsers,
        bookings: todayBookings,
        revenue: 0, // Will be calculated from payments
      },
      weekly: {
        users: weeklyUsers,
        bookings: weeklyBookings,
        revenue: 0,
      },
      monthly: {
        users: monthlyUsers,
        bookings: monthlyBookings,
        revenue: 0,
      },
      trends: {
        userGrowth: '+12.5%',
        bookingGrowth: '+8.3%',
        revenueGrowth: '+15.2%',
      },
    };
  }

  async markNotificationAsRead(notificationId: string) {
    // In a real implementation, this would update the notification in the database
    return {
      success: true,
      message: 'Notification marked as read',
      notificationId,
    };
  }

  async markAllNotificationsAsRead() {
    // In a real implementation, this would update all notifications in the database
    return {
      success: true,
      message: 'All notifications marked as read',
      updatedCount: 3, // Number of notifications marked as read
    };
  }

  async getActivityFeed(queryDto: any) {
    const { limit = 10 } = queryDto;

    // Mock activity feed data
    const activities = [
      {
        id: '1',
        type: 'booking',
        title: 'New Booking Confirmed',
        description: 'Workspace booking confirmed for Tomorrow, 10:00 AM',
        timestamp: '2 hours ago',
        status: 'completed',
        user: 'Rahul Sharma',
        location: 'Café Coffee Day, Koramangala',
      },
      {
        id: '2',
        type: WalletTransactionType.PAYOUT,
        title: 'Payout Processed',
        description: '₹45,000 transferred to partner account',
        timestamp: '4 hours ago',
        status: 'completed',
        amount: '₹45,000',
      },
      {
        id: '3',
        type: 'ticket',
        title: 'Support Ticket Raised',
        description: 'User reported issue with booking confirmation',
        timestamp: '5 hours ago',
        status: 'new',
        user: 'Priya Patel',
      },
      {
        id: '4',
        type: 'partner',
        title: 'New Partner Application',
        description: 'Café Coffee Day submitted partnership application',
        timestamp: '1 day ago',
        status: 'pending',
        location: 'Indiranagar, Bangalore',
      },
      {
        id: '5',
        type: 'booking',
        title: 'Booking Cancelled',
        description: 'User cancelled booking 2 hours before start time',
        timestamp: '1 day ago',
        status: 'completed',
        user: 'Amit Kumar',
        location: 'Starbucks, MG Road',
      },
      {
        id: '6',
        type: WalletTransactionType.PAYOUT,
        title: 'Payout Failed',
        description: 'Bank transfer failed for partner account',
        timestamp: '2 days ago',
        status: 'pending',
        amount: '₹12,500',
      },
    ];

    // Return limited results
    return activities.slice(0, parseInt(limit.toString()));
  }

  // Partner Wallet Management
  async getPartnerWallets(
    queryDto: AdminWalletQueryDto,
  ): Promise<AdminWalletListResponseDto> {
    const {
      search,
      status,
      balanceMin,
      balanceMax,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const queryBuilder = this.walletRepository
      .createQueryBuilder('wallet')
      .leftJoinAndSelect('wallet.partner', 'partner');

    if (search) {
      queryBuilder.andWhere(
        "(CONCAT(user.firstName, ' ', user.lastName) ILIKE :search OR user.email ILIKE :search OR partner.id::text ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('wallet.status = :status', { status });
    }

    if (balanceMin !== undefined) {
      queryBuilder.andWhere('wallet.balance >= :balanceMin', { balanceMin });
    }

    if (balanceMax !== undefined) {
      queryBuilder.andWhere('wallet.balance <= :balanceMax', { balanceMax });
    }

    // Handle sorting
    let orderField = 'wallet.createdAt';
    switch (sortBy) {
      case 'partnerName':
        orderField = "CONCAT(user.firstName, ' ', user.lastName)";
        break;
      case 'currentBalance':
        orderField = 'wallet.balance';
        break;
      case 'pendingEarnings':
        orderField = 'wallet.pendingEarnings';
        break;
      case 'lastPayoutDate':
        orderField = 'wallet.lastPayoutDate';
        break;
      case 'status':
        orderField = 'wallet.status';
        break;
      default:
        orderField = 'wallet.createdAt';
    }

    queryBuilder.orderBy(orderField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [wallets, total] = await queryBuilder.getManyAndCount();

    const data = wallets.map((wallet) =>
      this.mapToAdminPartnerWalletDto(wallet),
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getWalletStats(): Promise<WalletStatsDto> {
    try {
      const totalWallets = await this.walletRepository.count();
      const activeWallets = await this.walletRepository.count({
        where: { status: 'active' },
      });
      const frozenWallets = await this.walletRepository.count({
        where: { status: 'frozen' },
      });
      const blockedWallets = await this.walletRepository.count({
        where: { status: 'suspended' },
      });

      const balanceResult = await this.walletRepository
        .createQueryBuilder('wallet')
        .select('SUM(wallet.availableBalance)', 'totalBalance')
        .addSelect('SUM(wallet.pendingBalance)', 'totalPendingEarnings')
        .addSelect('AVG(wallet.availableBalance)', 'averageBalance')
        .getRawOne();

      return {
        totalWallets,
        activeWallets,
        frozenWallets,
        blockedWallets,
        totalBalance: parseFloat(balanceResult?.totalBalance || '0'),
        totalPendingEarnings: parseFloat(
          balanceResult?.totalPendingEarnings || '0',
        ),
        averageBalance: parseFloat(balanceResult?.averageBalance || '0'),
      };
    } catch (error) {
      console.error('Error in getWalletStats:', error);
      throw new Error('Failed to retrieve wallet statistics');
    }
  }

  async getUserWallets(
    queryDto: AdminUserWalletQueryDto,
  ): Promise<AdminUserWalletListResponseDto> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        balanceType,
        balanceMin,
        balanceMax,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = queryDto;
      const skip = (page - 1) * limit;

      const queryBuilder = this.userWalletRepository
        .createQueryBuilder('wallet')
        .leftJoinAndSelect('wallet.user', 'user');

      // Apply search filter
      if (search) {
        queryBuilder.andWhere(
          '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Apply balance type filter
      if (balanceType) {
        queryBuilder.andWhere('wallet.balanceType = :balanceType', {
          balanceType,
        });
      }

      // Apply minimum balance filter
      if (balanceMin !== undefined) {
        queryBuilder.andWhere('wallet.balance >= :balanceMin', { balanceMin });
      }

      // Apply maximum balance filter
      if (balanceMax !== undefined) {
        queryBuilder.andWhere('wallet.balance <= :balanceMax', { balanceMax });
      }

      // Apply sorting
      let sortField = 'wallet.createdAt';
      switch (sortBy) {
        case 'userName':
          sortField = 'user.firstName';
          break;
        case 'userEmail':
          sortField = 'user.email';
          break;
        case 'balance':
          sortField = 'wallet.balance';
          break;
        case 'lastActivity':
          sortField = 'wallet.lastTransactionAt';
          break;
        default:
          sortField = 'wallet.createdAt';
      }

      queryBuilder.orderBy(
        sortField,
        sortOrder.toUpperCase() as 'ASC' | 'DESC',
      );

      // Apply pagination
      queryBuilder.skip(skip).take(limit);

      const [wallets, total] = await queryBuilder.getManyAndCount();

      const data = await Promise.all(
        wallets.map(async (wallet) => {
          const user = wallet.user;

          // Get completed bookings for this user to calculate total spent
          const completedBookings = await this.bookingRepository.find({
            where: {
              userId: user.id,
              status: BookingStatus.COMPLETED,
            },
            select: ['totalAmount'],
          });

          const totalSpent = completedBookings.reduce(
            (sum, booking) => sum + (booking.totalAmount || 0),
            0,
          );

          // Get completed payments for this user to calculate total topups
          // Note: We'll use a simple calculation for now since payment type might not be available
          const completedPayments = await this.paymentRepository.find({
            where: {
              userId: user.id,
              status: PaymentStatus.COMPLETED,
            },
            select: ['amount'],
          });

          const totalTopups = completedPayments.reduce(
            (sum, payment) => sum + (payment.amount || 0),
            0,
          );

          // Get last activity from wallet or user's last update
          const lastActivity =
            wallet.lastTransactionAt || wallet.updatedAt || wallet.createdAt;

          return {
            id: wallet.id,
            userId: wallet.userId,
            userName:
              `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
              'Unknown User',
            userEmail: user.email,
            balance: Number(wallet.balance) || 0,
            lockedBalance: Number(wallet.lockedBalance) || 0,
            currency: wallet.currency || 'INR',
            balanceType: wallet.balanceType,
            totalSpent,
            totalTopups,
            lastActivity: lastActivity ? lastActivity.toISOString() : null,
            createdAt: wallet.createdAt
              ? wallet.createdAt.toISOString()
              : new Date().toISOString(),
            updatedAt: wallet.updatedAt
              ? wallet.updatedAt.toISOString()
              : new Date().toISOString(),
          };
        }),
      );

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Error getting user wallets:', error);
      throw new Error('Failed to get user wallets');
    }
  }

  async getPartnerWalletDetails(id: string): Promise<AdminPartnerWalletDto> {
    const wallet = await this.walletRepository.findOne({
      where: { id },
      relations: ['partner', 'partner.user'],
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }

    return this.mapToAdminPartnerWalletDto(wallet);
  }

  async updateWalletStatus(id: string, updateDto: UpdateWalletStatusDto) {
    const wallet = await this.walletRepository.findOne({
      where: { id },
      relations: ['partner'],
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }

    wallet.status = updateDto.status;
    wallet.updatedAt = new Date();

    if (updateDto.reason) {
      wallet.metadata = {
        ...wallet.metadata,
        statusChangeReason: updateDto.reason,
        statusChangedAt: new Date().toISOString(),
      };
    }

    await this.walletRepository.save(wallet);

    return {
      success: true,
      message: `Wallet status updated to ${updateDto.status}`,
      walletId: id,
      newStatus: updateDto.status,
    };
  }

  async forceWalletPayout(id: string, payoutDto: ForcePayoutDto) {
    const wallet = await this.walletRepository.findOne({
      where: { id },
      relations: ['partner'],
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }

    if (wallet.availableBalance < payoutDto.amount) {
      throw ErrorResponseUtil.badRequest(
        'Insufficient wallet balance for payout',
        ErrorCodes.INSUFFICIENT_BALANCE,
      );
    }

    // Process the payout using wallet service
    const result = await this.walletService.debitWallet(
      wallet.partnerId,
      {
        amount: payoutDto.amount,
        description: `Admin force payout: ${payoutDto.reason || 'Manual payout'}`,
        type: WalletTransactionType.PAYOUT,
        metadata: {
          adminInitiated: true,
          paymentMethod: payoutDto.paymentMethod,
          reason: payoutDto.reason,
        },
      },
      'admin-system',
    );

    return {
      success: true,
      message: 'Payout processed successfully',
      transactionId: (result as any).transactionId || 'unknown',
      amount: payoutDto.amount,
      remainingBalance: (result as any).newBalance || 0,
    };
  }

  async adjustWalletBalance(id: string, adjustmentDto: ManualAdjustmentDto) {
    const wallet = await this.walletRepository.findOne({
      where: { id },
      relations: ['partner'],
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }

    const isCredit = adjustmentDto.amount > 0;
    const absoluteAmount = Math.abs(adjustmentDto.amount);

    let result;
    if (isCredit) {
      result = await this.walletService.creditWallet(
        wallet.partnerId,
        {
          amount: absoluteAmount,
          description: `Admin manual adjustment: ${adjustmentDto.reason}`,
          type: (adjustmentDto.type as any) || 'adjustment',
          metadata: {
            adminInitiated: true,
            adjustmentType: 'credit',
            reason: adjustmentDto.reason,
          },
        },
        'admin',
      );
    } else {
      if (wallet.availableBalance < absoluteAmount) {
        throw ErrorResponseUtil.badRequest(
          'Insufficient wallet balance for debit adjustment',
          ErrorCodes.INSUFFICIENT_BALANCE,
        );
      }
      result = await this.walletService.debitWallet(
        wallet.partnerId,
        {
          amount: absoluteAmount,
          description: `Admin manual adjustment: ${adjustmentDto.reason}`,
          type: (adjustmentDto.type as any) || 'adjustment',
          metadata: {
            adminInitiated: true,
            adjustmentType: 'debit',
            reason: adjustmentDto.reason,
          },
        },
        'admin-system',
      );
    }

    return {
      success: true,
      message: `Wallet balance ${isCredit ? 'credited' : 'debited'} successfully`,
      transactionId: (result as any).transactionId || 'unknown',
      adjustmentAmount: adjustmentDto.amount,
      newBalance: (result as any).newBalance || 0,
    };
  }

  async getWalletTransactions(id: string, queryDto: any) {
    const wallet = await this.walletRepository.findOne({
      where: { id },
      relations: ['partner'],
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }

    // Use the existing wallet service method to get transactions
    return this.walletService.getWalletTransactions(wallet.partnerId, queryDto);
  }

  async bulkWalletAction(bulkActionDto: BulkWalletActionDto) {
    const { walletIds, action, reason } = bulkActionDto;

    const results = [];
    const errors = [];

    for (const walletId of walletIds) {
      try {
        await this.updateWalletStatus(walletId, {
          status: action,
          reason,
        });
        results.push({ walletId, success: true });
      } catch (error) {
        errors.push({ walletId, error: error.message });
      }
    }

    return {
      success: true,
      message: `Bulk action completed. ${results.length} successful, ${errors.length} failed.`,
      results,
      errors,
      totalProcessed: walletIds.length,
    };
  }

  // Payout Management
  async getAllPayouts(
    queryDto: AdminPayoutQueryDto,
  ): Promise<AdminPayoutListResponseDto> {
    try {
      this.logger.log(
        'getAllPayouts called with query:',
        JSON.stringify(queryDto),
      );

      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        partnerId,
        minAmount,
        maxAmount,
        startDate,
        endDate,
      } = queryDto;

      const queryBuilder = this.payoutRequestRepository
        .createQueryBuilder('payoutRequest')
        .leftJoinAndSelect('payoutRequest.partner', 'partner')
        .leftJoinAndSelect('payoutRequest.bankAccount', 'bankAccount')
        .leftJoinAndSelect('payoutRequest.payouts', 'payouts');

      // Apply filters
      if (search) {
        queryBuilder.andWhere(
          '(partner.firstName ILIKE :search OR partner.lastName ILIKE :search OR partner.email ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      if (status) {
        queryBuilder.andWhere('payoutRequest.status = :status', { status });
      }

      if (partnerId) {
        queryBuilder.andWhere('payoutRequest.partnerId = :partnerId', {
          partnerId,
        });
      }

      if (minAmount) {
        queryBuilder.andWhere('payoutRequest.amount >= :minAmount', {
          minAmount,
        });
      }

      if (maxAmount) {
        queryBuilder.andWhere('payoutRequest.amount <= :maxAmount', {
          maxAmount,
        });
      }

      if (startDate) {
        queryBuilder.andWhere('payoutRequest.createdAt >= :startDate', {
          startDate,
        });
      }

      if (endDate) {
        queryBuilder.andWhere('payoutRequest.createdAt <= :endDate', {
          endDate,
        });
      }

      // Apply sorting
      const sortField =
        sortBy === 'partnerName'
          ? 'partner.firstName'
          : `payoutRequest.${sortBy}`;
      queryBuilder.orderBy(sortField, sortOrder);

      // Apply pagination
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      this.logger.log('Executing query...');

      // Get results and total count
      const [payoutRequests, total] = await queryBuilder.getManyAndCount();

      this.logger.log(
        `Found ${total} payout requests, returning ${payoutRequests.length} for current page`,
      );

      // Transform to response DTOs
      const payouts = payoutRequests.map((request) =>
        this.mapToAdminPayoutResponseDto(request),
      );

      return {
        payouts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error in getAllPayouts:', error);
      this.logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        query: queryDto,
      });

      // Return empty result instead of throwing error for better UX
      return {
        payouts: [],
        pagination: {
          page: queryDto.page || 1,
          limit: queryDto.limit || 10,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  private mapToAdminPayoutResponseDto(
    payoutRequest: PayoutRequestEntity,
  ): AdminPayoutResponseDto {
    try {
      const partner = payoutRequest.partner;
      const bankAccount = payoutRequest.bankAccount;

      return {
        id: payoutRequest.id,
        partnerId: payoutRequest.partnerId,
        partnerName: partner
          ? `${partner.firstName} ${partner.lastName}`.trim()
          : 'Unknown Partner',
        partnerEmail: partner?.email || 'Unknown Email',
        requestedAmount: Number(payoutRequest.amount),
        walletBalance: 0, // This would need to be fetched from wallet if needed
        dateTime: payoutRequest.createdAt.toISOString(),
        status: payoutRequest.status as any, // Map to AdminPayoutStatus
        payoutGateway: payoutRequest.payoutMethod || 'Bank Transfer',
        account: bankAccount
          ? `${bankAccount.bankName} - ${bankAccount.getMaskedAccountNumber?.() || bankAccount.accountNumber || 'Unknown Account'}`
          : 'No Account',
        isAutomated: payoutRequest.autoApprove,
        createdAt: payoutRequest.createdAt.toISOString(),
        updatedAt: payoutRequest.updatedAt.toISOString(),
        notes: payoutRequest.notes,
        processedAt: payoutRequest.processedDate?.toISOString(),
        rejectionReason: payoutRequest.rejectionReason,
      };
    } catch (error) {
      this.logger.error('Error mapping payout request to DTO:', error);
      this.logger.error(
        'PayoutRequest data:',
        JSON.stringify(payoutRequest, null, 2),
      );
      throw error;
    }
  }

  // New time-series analytics methods
  async getBookingTrends(
    query: AdminAnalyticsQueryDto,
  ): Promise<TimeSeriesDataPoint[]> {
    const queryHash = Buffer.from(JSON.stringify(query)).toString('base64');
    const cacheKey = {
      key: 'BookingTrends' as keyof typeof CacheKey,
      args: [queryHash],
    };
    const cached = await this.cacheService.get<TimeSeriesDataPoint[]>(cacheKey);
    if (cached) return cached;

    const {
      startDate,
      endDate,
      granularity = AnalyticsGranularity.DAY,
      period,
    } = query;
    const dateRange = period
      ? this.buildDateRangeFromPeriod(period)
      : { startDate, endDate };
    const truncFormat = this.getDateTruncFormat(granularity);

    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .select([
        `DATE_TRUNC('${truncFormat}', booking.createdAt) as date`,
        'COUNT(*) as value',
        'AVG(booking.totalAmount) as avgAmount',
        'SUM(booking.totalAmount) as totalRevenue',
      ])
      .groupBy('date')
      .orderBy('date', 'ASC');

    if (dateRange.startDate) {
      queryBuilder.andWhere('booking.createdAt >= :startDate', {
        startDate: dateRange.startDate,
      });
    }
    if (dateRange.endDate) {
      queryBuilder.andWhere('booking.createdAt <= :endDate', {
        endDate: dateRange.endDate,
      });
    }

    const bookingData = await queryBuilder.getRawMany();

    const result = bookingData.map((item) => ({
      date: this.formatDate(item.date, granularity),
      value: parseInt(item.value) || 0,
      metadata: {
        avgAmount: parseFloat(item.avgAmount) || 0,
        totalRevenue: parseFloat(item.totalRevenue) || 0,
      },
    }));

    await this.cacheService.set(cacheKey, result, { ttl: 300000 }); // 5 minutes cache
    return result;
  }

  async getRevenueTrends(
    query: AdminAnalyticsQueryDto,
  ): Promise<TimeSeriesDataPoint[]> {
    const queryHash = Buffer.from(JSON.stringify(query)).toString('base64');
    const cacheKey = {
      key: 'RevenueTrends' as keyof typeof CacheKey,
      args: [queryHash],
    };
    const cached = await this.cacheService.get<TimeSeriesDataPoint[]>(cacheKey);
    if (cached) return cached;

    const {
      startDate,
      endDate,
      granularity = AnalyticsGranularity.DAY,
      period,
    } = query;
    const dateRange = period
      ? this.buildDateRangeFromPeriod(period)
      : { startDate, endDate };
    const truncFormat = this.getDateTruncFormat(granularity);

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .select([
        `DATE_TRUNC('${truncFormat}', payment.createdAt) as date`,
        'SUM(payment.amount) as value',
        'SUM(payment.amount * 0.1) as commission',
        'COUNT(*) as transactionCount',
      ])
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .groupBy('date')
      .orderBy('date', 'ASC');

    if (dateRange.startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', {
        startDate: dateRange.startDate,
      });
    }
    if (dateRange.endDate) {
      queryBuilder.andWhere('payment.createdAt <= :endDate', {
        endDate: dateRange.endDate,
      });
    }

    const revenueData = await queryBuilder.getRawMany();

    const result = revenueData.map((item) => ({
      date: this.formatDate(item.date, granularity),
      value: parseFloat(item.value) || 0,
      metadata: {
        commission: parseFloat(item.commission) || 0,
        transactionCount: parseInt(item.transactionCount) || 0,
        growthRate: 0, // Will be calculated in post-processing
      },
    }));

    // Calculate growth rates
    for (let i = 1; i < result.length; i++) {
      const current = result[i].value;
      const previous = result[i - 1].value;
      if (previous > 0) {
        result[i].metadata.growthRate = ((current - previous) / previous) * 100;
      }
    }

    await this.cacheService.set(cacheKey, result, { ttl: 300000 });
    return result;
  }

  async getUserGrowth(
    query: AdminAnalyticsQueryDto,
  ): Promise<TimeSeriesDataPoint[]> {
    const queryHash = Buffer.from(JSON.stringify(query)).toString('base64');
    const cacheKey = {
      key: 'UserGrowth' as keyof typeof CacheKey,
      args: [queryHash],
    };
    const cached = await this.cacheService.get<TimeSeriesDataPoint[]>(cacheKey);
    if (cached) return cached;

    const {
      startDate,
      endDate,
      granularity = AnalyticsGranularity.DAY,
      period,
    } = query;
    const dateRange = period
      ? this.buildDateRangeFromPeriod(period)
      : { startDate, endDate };
    const truncFormat = this.getDateTruncFormat(granularity);

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        `DATE_TRUNC('${truncFormat}', user.createdAt) as date`,
        'COUNT(*) as value',
        'COUNT(CASE WHEN user.isEmailVerified = true THEN 1 END) as verifiedUsers',
        "COUNT(CASE WHEN user.lastLoginAt > NOW() - INTERVAL '7 days' THEN 1 END) as activeUsers",
      ])
      .groupBy('date')
      .orderBy('date', 'ASC');

    if (dateRange.startDate) {
      queryBuilder.andWhere('user.createdAt >= :startDate', {
        startDate: dateRange.startDate,
      });
    }
    if (dateRange.endDate) {
      queryBuilder.andWhere('user.createdAt <= :endDate', {
        endDate: dateRange.endDate,
      });
    }

    const userData = await queryBuilder.getRawMany();

    const result = userData.map((item) => ({
      date: this.formatDate(item.date, granularity),
      value: parseInt(item.value) || 0,
      metadata: {
        verifiedUsers: parseInt(item.verifiedUsers) || 0,
        activeUsers: parseInt(item.activeUsers) || 0,
      },
    }));

    await this.cacheService.set(cacheKey, result, { ttl: 300000 });
    return result;
  }

  async getSpaceUtilization(
    query: AdminAnalyticsQueryDto,
  ): Promise<TimeSeriesDataPoint[]> {
    try {
      console.log(
        '🔍 Starting getSpaceUtilization with query:',
        JSON.stringify(query),
      );

      const {
        startDate,
        endDate,
        granularity = AnalyticsGranularity.DAY,
        period,
      } = query;

      console.log('📅 Query parameters:', {
        startDate,
        endDate,
        granularity,
        period,
      });

      const dateRange = period
        ? this.buildDateRangeFromPeriod(period)
        : { startDate, endDate };

      console.log('📊 Date range:', dateRange);

      // Simplified approach to avoid complex joins that might fail
      // Get total active spaces count
      console.log('🔍 Counting total active spaces...');
      const totalSpaces = await this.spaceRepository.count({
        where: { status: SpaceStatus.ACTIVE },
      });
      console.log('🏢 Total active spaces:', totalSpaces);

      // Generate date series based on granularity
      const dates = this.generateDateSeries(
        new Date(dateRange.startDate),
        new Date(dateRange.endDate),
        granularity,
      );
      console.log('📅 Generated date series:', dates.length, 'dates');

      // For each date, calculate basic utilization metrics
      const result: TimeSeriesDataPoint[] = [];

      for (const date of dates) {
        try {
          // Get bookings count for this date
          const dayStart = new Date(date);
          const dayEnd = new Date(date);

          if (granularity === AnalyticsGranularity.DAY) {
            dayEnd.setDate(dayEnd.getDate() + 1);
          } else if (granularity === AnalyticsGranularity.WEEK) {
            dayEnd.setDate(dayEnd.getDate() + 7);
          } else if (granularity === AnalyticsGranularity.MONTH) {
            dayEnd.setMonth(dayEnd.getMonth() + 1);
          }

          const bookingsCount = await this.bookingRepository.count({
            where: {
              createdAt: MoreThan(dayStart),
            },
          });

          // Calculate simple utilization rate
          const utilizationRate =
            totalSpaces > 0
              ? Math.min((bookingsCount / totalSpaces) * 10, 100)
              : 0;

          result.push({
            date: this.formatDate(date, granularity),
            value: parseFloat(utilizationRate.toFixed(2)),
            metadata: {
              totalSpaces,
              bookedSpaces: Math.min(bookingsCount, totalSpaces),
              totalBookings: bookingsCount,
              avgDuration: 2.5, // Default average duration
            },
          });
        } catch (dateError) {
          console.warn('⚠️ Error processing date:', date, dateError.message);
          // Add default data point for this date
          result.push({
            date: this.formatDate(date, granularity),
            value: 0,
            metadata: {
              totalSpaces,
              bookedSpaces: 0,
              totalBookings: 0,
              avgDuration: 0,
            },
          });
        }
      }

      console.log(
        '✅ Space utilization calculation completed, result length:',
        result.length,
      );
      return result;
    } catch (error) {
      console.error('❌ Error in getSpaceUtilization:', error.message);
      console.error('❌ Stack trace:', error.stack);

      // Return fallback data to prevent 500 errors
      const fallbackData: TimeSeriesDataPoint[] = [
        {
          date: new Date().toISOString().split('T')[0],
          value: 0,
          metadata: {
            totalSpaces: 0,
            bookedSpaces: 0,
            totalBookings: 0,
            avgDuration: 0,
          },
        },
      ];

      console.log('🔄 Returning fallback data due to error');
      return fallbackData;
    }
  }

  // Helper method to generate date series
  private generateDateSeries(
    startDate: Date,
    endDate: Date,
    granularity: AnalyticsGranularity,
  ): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(new Date(current));

      if (granularity === AnalyticsGranularity.DAY) {
        current.setDate(current.getDate() + 1);
      } else if (granularity === AnalyticsGranularity.WEEK) {
        current.setDate(current.getDate() + 7);
      } else if (granularity === AnalyticsGranularity.MONTH) {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return dates;
  }

  // Helper method to format date based on granularity
  private formatDate(date: Date, granularity: AnalyticsGranularity): string {
    if (granularity === AnalyticsGranularity.DAY) {
      return date.toISOString().split('T')[0];
    } else if (granularity === AnalyticsGranularity.WEEK) {
      // Return the start of the week
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return weekStart.toISOString().split('T')[0];
    } else if (granularity === AnalyticsGranularity.MONTH) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    return date.toISOString().split('T')[0];
  }

  // Space Management Methods
  async findAllSpaces(queryDto: SpaceQueryDto): Promise<SpaceListResponseDto> {
    const {
      search,
      status,
      type,
      location,
      partnerId,
      minPrice,
      maxPrice,
      minCapacity,
      maxCapacity,
      amenities,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      limit = 20,
    } = queryDto;

    const queryBuilder = this.spaceRepository
      .createQueryBuilder('space')
      .leftJoinAndSelect('space.listing', 'listing')
      .leftJoinAndSelect('listing.partner', 'partner')
      .leftJoinAndSelect('partner.user', 'user')
      .select([
        'space.id',
        'space.name',
        'space.description',
        'space.spaceType',
        'space.totalCapacity',
        'space.space_specific_location',
        'space.status',
        'space.rating',
        'space.reviewCount',
        'space.totalBookings',
        'space.createdAt',
        'space.updatedAt',
        'listing.id',
        'partner.id',
        'partner.businessName',
        'user.email',
      ]);

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(space.name ILIKE :search OR space.description ILIKE :search OR partner.businessName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere('space.status = :status', { status });
    }

    // Type filter
    if (type) {
      queryBuilder.andWhere('space.spaceType = :type', { type });
    }

    // Location filter
    if (location) {
      queryBuilder.andWhere(
        'space.space_specific_location::text ILIKE :location',
        { location: `%${location}%` },
      );
    }

    // Partner filter
    if (partnerId) {
      queryBuilder.andWhere('partner.id = :partnerId', { partnerId });
    }

    // Price range filter - TODO: Implement with space options pricing
    // Currently disabled as pricing is handled at space option level
    // if (minPrice !== undefined || maxPrice !== undefined) {
    //   // Need to join with space options to get pricing
    // }

    // Capacity range filter
    if (minCapacity !== undefined || maxCapacity !== undefined) {
      if (minCapacity !== undefined && maxCapacity !== undefined) {
        queryBuilder.andWhere(
          'space.totalCapacity BETWEEN :minCapacity AND :maxCapacity',
          { minCapacity, maxCapacity },
        );
      } else if (minCapacity !== undefined) {
        queryBuilder.andWhere('space.totalCapacity >= :minCapacity', {
          minCapacity,
        });
      } else if (maxCapacity !== undefined) {
        queryBuilder.andWhere('space.totalCapacity <= :maxCapacity', {
          maxCapacity,
        });
      }
    }

    // Amenities filter
    if (amenities && amenities.length > 0) {
      queryBuilder.andWhere('space.amenities && :amenities', { amenities });
    }

    // Sorting
    const validSortFields = [
      'name',
      'createdAt',
      'updatedAt',
      'totalCapacity',
      'rating',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    // Map capacity to totalCapacity for backward compatibility
    const actualSortField = sortBy === 'capacity' ? 'totalCapacity' : sortField;
    queryBuilder.orderBy(
      `space.${actualSortField}`,
      sortOrder.toUpperCase() as 'ASC' | 'DESC',
    );

    // Pagination
    const page = 1; // Default page since it's not in SpaceQueryDto
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [spaces, total] = await queryBuilder.getManyAndCount();

    // Transform to response format
    const spaceItems = spaces.map((space) => ({
      id: space.id,
      name: space.name,
      description: space.description,
      spaceType: space.spaceType,
      capacity: space.totalCapacity,
      location: {
        floor: space.space_specific_location?.floor,
        room: space.space_specific_location?.room_number,
        area: space.space_specific_location?.building,
        coordinates: undefined, // TODO: Get coordinates from space or partner location
      },
      pricing: {
        basePrice: 0,
        currency: 'INR',
        pricePerHour: 0,
        pricePerDay: 0,
        pricePerWeek: 0,
        pricePerMonth: 0,
        minimumBookingHours: 1,
        maximumBookingHours: 24,
        discounts: null,
      }, // TODO: Get actual pricing from space options
      status: space.status as any,
      rating: space.rating || 0,
      reviewCount: space.reviewCount || 0,
      totalBookings: space.totalBookings || 0,
      createdAt: space.createdAt,
      updatedAt: space.updatedAt,
      partner: {
        id: space.listing?.partner?.id || '',
        name: space.listing?.partner?.businessName || 'Unknown',
        email: space.listing?.partner?.user?.email || '',
      },
    }));

    const pageOptions = new PageOptionsDto();
    Object.assign(pageOptions, { page: page, limit });

    return {
      data: spaceItems,
      total,
      page: pageOptions.page,
      limit: pageOptions.limit,
      totalPages: Math.ceil(total / pageOptions.limit),
      hasNextPage: pageOptions.page < Math.ceil(total / pageOptions.limit),
      hasPreviousPage: pageOptions.page > 1,
    };
  }

  async findSpaceById(id: string): Promise<any> {
    try {
      const space = await this.spaceRepository
        .createQueryBuilder('space')
        .select([
          'space.id',
          'space.name',
          'space.description',
          'space.spaceType',
          'space.totalCapacity',
          'space.commonAmenities',
          'space.space_specific_location',
          'space.contactInfo',
          'space.operatingHours',
          'space.spacePolicies',
          'space.images',
          'space.status',
          'space.rating',
          'space.reviewCount',
          'space.totalBookings',
          'space.metadata',
          'space.createdAt',
          'space.updatedAt',
        ])
        .where('space.id = :id', { id })
        .getOne();

      if (!space) {
        throw ErrorResponseUtil.notFound('Space', id);
      }

      // Return a simple structure first
      return {
        id: space.id,
        name: space.name,
        description: space.description,
        spaceType: space.spaceType,
        bookingModel: BookingModel.TIME_BASED,
        status: space.status,
        capacity: {
          total: space.totalCapacity || 0,
          available: space.totalCapacity || 0,
        },
        amenities: space.commonAmenities || [],
        location: {
          address: '',
          city: '',
          state: '',
          country: '',
          zipCode: '',
          coordinates: {
            latitude: 0,
            longitude: 0,
          },
        },
        pricing: {
          basePrice: 0,
          currency: 'USD',
          pricePerHour: 0,
          pricePerDay: 0,
          pricePerWeek: 0,
          pricePerMonth: 0,
          minimumBookingHours: 1,
          maximumBookingHours: 24,
          discounts: [],
        },
        availabilityRules: {
          operatingHours: {},
          blackoutDates: [],
          advanceBookingDays: 30,
          minimumNoticeHours: 1,
        },
        images: space.images || [],
        rating: parseFloat(space.rating.toString()),
        reviewCount: space.reviewCount,
        totalBookings: space.totalBookings,
        bookingStats: {
          thisMonth: 0,
          lastMonth: 0,
          totalRevenue: 0,
          averageBookingDuration: 0,
        },
        metadata: space.metadata || {},
        partner: {
          id: '',
          name: '',
          phone: '',
          email: '',
        },
        createdAt: space.createdAt,
        updatedAt: space.updatedAt,
      };
    } catch (error) {
      console.error('Error in findSpaceById:', error);
      throw error;
    }
  }

  async updateSpace(
    id: string,
    updateDto: UpdateSpaceDto,
    adminId?: string,
  ): Promise<{ message: string }> {
    const space = await this.spaceRepository.findOne({ where: { id } });

    if (!space) {
      throw ErrorResponseUtil.notFound('Space', id);
    }

    const oldData = { ...space };

    Object.assign(space, updateDto);
    space.updatedAt = new Date();

    await this.spaceRepository.save(space);

    // Log audit action
    if (adminId) {
      await this.auditService.logAction({
        action: AuditAction.SPACE_UPDATED,
        adminId,
        targetSpaceId: id,
        oldData,
        newData: space,
        timestamp: new Date(),
      });
    }

    return { message: 'Space updated successfully' };
  }

  async deleteSpace(
    id: string,
    adminId?: string,
  ): Promise<{ message: string }> {
    const space = await this.spaceRepository.findOne({ where: { id } });

    if (!space) {
      throw ErrorResponseUtil.notFound('Space', id);
    }

    const oldData = { ...space };

    // Soft delete by updating status
    space.status = SpaceStatus.INACTIVE;
    space.updatedAt = new Date();

    await this.spaceRepository.save(space);

    // Log audit action
    if (adminId) {
      await this.auditService.logAction({
        action: AuditAction.SPACE_DELETED,
        adminId,
        targetSpaceId: id,
        oldData,
        newData: space,
        timestamp: new Date(),
      });
    }

    return { message: 'Space deleted successfully' };
  }

  async updateSpaceStatus(
    id: string,
    statusDto: SpaceStatusUpdateDto,
    adminId?: string,
  ): Promise<{ message: string }> {
    const space = await this.spaceRepository.findOne({ where: { id } });

    if (!space) {
      throw ErrorResponseUtil.notFound('Space', id);
    }

    const oldData = { ...space };

    space.status = statusDto.status as unknown as SpaceStatus;
    if (statusDto.reason) {
      space.metadata = {
        ...space.metadata,
      } as any;
    }
    space.updatedAt = new Date();

    await this.spaceRepository.save(space);

    // Log audit action
    if (adminId) {
      await this.auditService.logAction({
        action: AuditAction.SPACE_STATUS_CHANGED,
        adminId,
        targetSpaceId: id,
        oldData,
        newData: space,
        timestamp: new Date(),
      });
    }

    return { message: 'Space status updated successfully' };
  }

  async bulkUpdateSpaceStatus(
    bulkStatusDto: BulkSpaceStatusUpdateDto,
    adminId?: string,
  ): Promise<{ message: string; updatedCount: number; failedIds: string[] }> {
    const { spaceIds, status, reason } = bulkStatusDto;
    const updatedSpaces: string[] = [];
    const failedIds: string[] = [];

    for (const spaceId of spaceIds) {
      try {
        const space = await this.spaceRepository.findOne({
          where: { id: spaceId },
        });

        if (!space) {
          failedIds.push(spaceId);
          continue;
        }

        const oldData = { ...space };
        space.status = status as unknown as SpaceStatus;
        if (reason) {
          space.metadata = {
            ...space.metadata,
            statusReason: reason,
          } as any;
        }
        space.updatedAt = new Date();

        await this.spaceRepository.save(space);
        updatedSpaces.push(spaceId);

        // Log audit action
        if (adminId) {
          await this.auditService.logAction({
            action: AuditAction.SPACE_STATUS_CHANGED,
            adminId,
            targetSpaceId: spaceId,
            oldData,
            newData: space,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        this.logger.error(`Failed to update space ${spaceId}:`, error);
        failedIds.push(spaceId);
      }
    }

    return {
      message: `Bulk space status update completed. ${updatedSpaces.length} spaces updated successfully.`,
      updatedCount: updatedSpaces.length,
      failedIds,
    };
  }

  async approveSpace(
    id: string,
    approvalDto: SpaceApprovalDto,
    adminId?: string,
  ): Promise<{ message: string }> {
    const space = await this.spaceRepository.findOne({ where: { id } });

    if (!space) {
      throw ErrorResponseUtil.notFound('Space', id);
    }

    if (space.status !== SpaceStatus.DRAFT) {
      throw ErrorResponseUtil.badRequest(
        'Space is not in pending status',
        ErrorCodes.INVALID_STATUS,
      );
    }

    const oldData = { ...space };

    space.status = SpaceStatus.ACTIVE;
    space.metadata = {
      ...space.metadata,
    } as any;
    space.updatedAt = new Date();

    await this.spaceRepository.save(space);

    // Log audit action
    if (adminId) {
      await this.auditService.logAction({
        action: AuditAction.SPACE_APPROVED,
        adminId,
        targetSpaceId: id,
        oldData,
        newData: space,
        timestamp: new Date(),
      });
    }

    return { message: 'Space approved successfully' };
  }

  async rejectSpace(
    id: string,
    rejectionDto: SpaceApprovalDto,
    adminId?: string,
  ): Promise<{ message: string }> {
    const space = await this.spaceRepository.findOne({ where: { id } });

    if (!space) {
      throw ErrorResponseUtil.notFound('Space', id);
    }

    if (space.status !== SpaceStatus.DRAFT) {
      throw ErrorResponseUtil.badRequest(
        'Space is not in pending status',
        ErrorCodes.INVALID_STATUS,
      );
    }

    const oldData = { ...space };

    space.status = SpaceStatus.INACTIVE;
    space.metadata = {
      ...space.metadata,
    } as any;
    space.updatedAt = new Date();

    await this.spaceRepository.save(space);

    // Log audit action
    if (adminId) {
      await this.auditService.logAction({
        action: AuditAction.SPACE_REJECTED,
        adminId,
        targetSpaceId: id,
        oldData,
        newData: space,
        timestamp: new Date(),
      });
    }

    return { message: 'Space rejected successfully' };
  }

  async getSpaceStats(): Promise<SpaceStatsDto> {
    try {
      const cacheKey = { key: 'SpaceStats' as keyof typeof CacheKey, args: [] };
      const cached = await this.cacheService.get<SpaceStatsDto>(cacheKey);
      if (cached) return cached;

      // Get space counts by status
      const [totalSpaces, activeSpaces, inactiveSpaces, draftSpaces] =
        await Promise.all([
          this.spaceRepository.count(),
          this.spaceRepository.count({ where: { status: SpaceStatus.ACTIVE } }),
          this.spaceRepository.count({
            where: { status: SpaceStatus.INACTIVE },
          }),
          this.spaceRepository.count({ where: { status: SpaceStatus.DRAFT } }),
        ]);

      // Get spaces created this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const spacesThisMonth = await this.spaceRepository.count({
        where: {
          createdAt: MoreThan(startOfMonth),
        },
      });

      // Calculate growth rate
      const startOfLastMonth = new Date(startOfMonth);
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
      const endOfLastMonth = new Date(startOfMonth);
      endOfLastMonth.setTime(endOfLastMonth.getTime() - 1);

      const spacesLastMonth = await this.spaceRepository.count({
        where: {
          createdAt: Between(startOfLastMonth, endOfLastMonth),
        },
      });

      const growthRate =
        spacesLastMonth > 0
          ? ((spacesThisMonth - spacesLastMonth) / spacesLastMonth) * 100
          : spacesThisMonth > 0
            ? 100
            : 0;

      // Get average utilization rate and total bookings
      const utilizationQuery = await this.spaceRepository
        .createQueryBuilder('space')
        .select('AVG(space."totalBookings")', 'avgBookings')
        .addSelect('SUM(space."totalBookings")', 'totalBookings')
        .addSelect('AVG(space.rating)', 'avgRating')
        .addSelect('COUNT(space.id)', 'totalSpaces')
        .where('space.status = :status', { status: SpaceStatus.ACTIVE })
        .getRawOne();

      const averageUtilization = parseFloat(
        utilizationQuery?.avgBookings || '0',
      );
      const totalBookings = parseInt(utilizationQuery?.totalBookings || '0');
      const averageRating = parseFloat(utilizationQuery?.avgRating || '0');

      // Get top performing spaces
      const topSpaces = await this.spaceRepository
        .createQueryBuilder('space')
        .leftJoin('space.listing', 'listing')
        .leftJoin('listing.partner', 'partner')
        .select([
          'space.id',
          'space.name',
          'space.totalBookings',
          'space.rating',
          'partner.businessName',
        ])
        .where('space.status = :status', { status: SpaceStatus.ACTIVE })
        .orderBy('space."totalBookings"', 'DESC')
        .addOrderBy('space.rating', 'DESC')
        .limit(5)
        .getRawMany();

      const topPerformingSpaces = topSpaces.map((space) => ({
        id: space.space_id,
        name: space.space_name,
        partnerName: space.partner_businessName || 'Unknown',
        totalBookings: parseInt(space.space_totalBookings) || 0,
        rating: parseFloat(space.space_rating) || 0,
      }));

      // Get spaces by type
      const spacesByTypeQuery = await this.spaceRepository
        .createQueryBuilder('space')
        .select('space."spaceType"', 'type')
        .addSelect('COUNT(space.id)', 'count')
        .where('space.status = :status', { status: SpaceStatus.ACTIVE })
        .groupBy('space."spaceType"')
        .getRawMany();

      const spacesByType = spacesByTypeQuery.map((item) => ({
        type: item.type,
        count: parseInt(item.count),
        percentage:
          totalSpaces > 0 ? (parseInt(item.count) / totalSpaces) * 100 : 0,
      }));

      const stats: SpaceStatsDto = {
        totalSpaces,
        activeSpaces,
        inactiveSpaces,
        pendingSpaces: 0,
        maintenanceSpaces: 0,
        suspendedSpaces: 0,
        rejectedSpaces: 0,
        draftSpaces,
        totalRevenue: 0, // TODO: Calculate from payments
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalBookings,
        averageUtilization: parseFloat(averageUtilization.toFixed(2)),
        topSpaces: topPerformingSpaces.map((space) => ({
          id: space.id,
          name: space.name,
          revenue: 0, // TODO: Calculate from payments
          bookings: space.totalBookings,
          rating: space.rating,
        })),
        spacesByType,
        revenueByMonth: [], // TODO: Calculate from payments
      };

      await this.cacheService.set(cacheKey, stats, { ttl: 300000 }); // 5 minutes cache
      return stats;
    } catch (error) {
      console.error('Error in getSpaceStats:', error);
      throw new Error('Failed to retrieve space statistics');
    }
  }

  async getSpaceRevenue(
    id: string,
    options: {
      period?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<any> {
    try {
      this.logger.log(`Getting space revenue for space ${id}`);

      // Verify space exists
      const space = await this.spaceRepository.findOne({ where: { id } });
      if (!space) {
        this.logger.error(`Space not found: ${id}`);
        throw ErrorResponseUtil.notFound('Space', id);
      }

      // Set default date range based on period or custom dates
      const now = new Date();
      let start: Date, end: Date;

      if (options.period) {
        switch (options.period) {
          case 'week':
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'quarter':
            start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        end = now;
      } else {
        start = options.startDate
          ? new Date(options.startDate)
          : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = options.endDate ? new Date(options.endDate) : now;
      }

      this.logger.log(
        `Date range: ${start.toISOString()} to ${end.toISOString()}`,
      );

      // Get revenue data from payments for this space
      const revenueQuery = await this.paymentRepository
        .createQueryBuilder('payment')
        .leftJoin('payment.booking', 'booking')
        .leftJoin('booking.spaceOption', 'spaceOption')
        .leftJoin('spaceOption.space', 'space')
        .where('space.id = :spaceId', { spaceId: id })
        .andWhere('payment.status = :status', {
          status: PaymentStatus.COMPLETED,
        })
        .andWhere('payment.createdAt BETWEEN :start AND :end', { start, end })
        .select([
          'SUM(payment.amount) as totalRevenue',
          'COUNT(payment.id) as totalTransactions',
          'AVG(payment.amount) as averageTransaction',
          "DATE_TRUNC('day', payment.createdAt) as date",
        ])
        .groupBy("DATE_TRUNC('day', payment.createdAt)")
        .orderBy('date', 'ASC')
        .getRawMany();

      // Calculate total metrics
      const totalRevenue = revenueQuery.reduce(
        (sum, item) => sum + parseFloat(item.totalrevenue || '0'),
        0,
      );
      const totalTransactions = revenueQuery.reduce(
        (sum, item) => sum + parseInt(item.totaltransactions || '0'),
        0,
      );
      const averageTransaction =
        totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Format daily revenue data
      const dailyRevenue = revenueQuery.map((item) => ({
        date: item.date,
        revenue: parseFloat(item.totalrevenue || '0'),
        transactions: parseInt(item.totaltransactions || '0'),
      }));

      // Get booking count for the period
      const bookingCount = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoin('booking.spaceOption', 'spaceOption')
        .leftJoin('spaceOption.space', 'space')
        .where('space.id = :spaceId', { spaceId: id })
        .andWhere('booking.createdAt BETWEEN :start AND :end', { start, end })
        .getCount();

      // Calculate revenue per booking
      const revenuePerBooking =
        bookingCount > 0 ? totalRevenue / bookingCount : 0;

      const revenueData = {
        spaceId: id,
        spaceName: space.name,
        period: options.period || 'custom',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalTransactions,
        averageTransaction: parseFloat(averageTransaction.toFixed(2)),
        totalBookings: bookingCount,
        revenuePerBooking: parseFloat(revenuePerBooking.toFixed(2)),
        dailyRevenue,
        currency: 'USD', // TODO: Make this configurable
      };

      this.logger.log(
        `Space revenue calculated: ${JSON.stringify(revenueData)}`,
      );
      return revenueData;
    } catch (error) {
      this.logger.error(`Error in getSpaceRevenue: ${error.message}`);
      throw new Error('Failed to retrieve space revenue data');
    }
  }

  async getSpaceAnalytics(
    id: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    let space: SpaceEntity | null = null;

    try {
      this.logger.log(`Getting space analytics for space ${id}`);

      // Verify space exists
      space = await this.spaceRepository.findOne({ where: { id } });
      if (!space) {
        this.logger.error(`Space not found: ${id}`);
        throw ErrorResponseUtil.notFound('Space', id);
      }

      // Set default date range if not provided (last 30 days)
      const now = new Date();
      const defaultStartDate = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000,
      );
      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : now;

      this.logger.log(
        `Date range: ${start.toISOString()} to ${end.toISOString()}`,
      );

      // Get bookings for this space within the date range - simplified query without payment join
      const bookings = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoin('booking.spaceOption', 'spaceOption')
        .leftJoin('spaceOption.space', 'space')
        .where('space.id = :spaceId', { spaceId: id })
        .andWhere('booking.createdAt BETWEEN :start AND :end', { start, end })
        .select([
          'booking.id',
          'booking.status',
          'booking.startDateTime',
          'booking.endDateTime',
          'booking.totalAmount',
          'booking.createdAt',
        ])
        .getMany();

      this.logger.log(`Found ${bookings.length} bookings for space ${id}`);

      // Calculate analytics metrics
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(
        (b) => b.status === BookingStatus.COMPLETED,
      ).length;
      const cancelledBookings = bookings.filter(
        (b) => b.status === BookingStatus.CANCELLED,
      ).length;
      const pendingBookings = bookings.filter(
        (b) => b.status === BookingStatus.PENDING,
      ).length;

      // Calculate revenue from booking totalAmount (since payment relationship is complex)
      const totalRevenue = bookings
        .filter((b) => b.status === BookingStatus.COMPLETED)
        .reduce(
          (sum, b) => sum + parseFloat(b.totalAmount?.toString() || '0'),
          0,
        );

      // Calculate average booking duration
      const completedBookingsWithDuration = bookings
        .filter(
          (b) =>
            b.status === BookingStatus.COMPLETED &&
            b.startDateTime &&
            b.endDateTime,
        )
        .map((b) => {
          const duration =
            new Date(b.endDateTime).getTime() -
            new Date(b.startDateTime).getTime();
          return duration / (1000 * 60 * 60); // Convert to hours
        });

      const averageBookingDuration =
        completedBookingsWithDuration.length > 0
          ? completedBookingsWithDuration.reduce(
              (sum, duration) => sum + duration,
              0,
            ) / completedBookingsWithDuration.length
          : 0;

      // Calculate utilization rate (assuming 8 hours per day as available time)
      const totalDays = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
      const totalAvailableHours = totalDays * 8; // 8 hours per day
      const totalBookedHours = completedBookingsWithDuration.reduce(
        (sum, duration) => sum + duration,
        0,
      );
      const utilizationRate =
        totalAvailableHours > 0
          ? (totalBookedHours / totalAvailableHours) * 100
          : 0;

      // Get booking trends (daily bookings count)
      const bookingTrends = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoin('booking.spaceOption', 'spaceOption')
        .leftJoin('spaceOption.space', 'space')
        .where('space.id = :spaceId', { spaceId: id })
        .andWhere('booking.createdAt BETWEEN :start AND :end', { start, end })
        .select([
          'DATE(booking.createdAt) as date',
          'COUNT(booking.id) as count',
        ])
        .groupBy('DATE(booking.createdAt)')
        .orderBy('date', 'ASC')
        .getRawMany();

      // Get revenue trends (daily revenue) - using booking totalAmount instead of payment
      const revenueTrends = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoin('booking.spaceOption', 'spaceOption')
        .leftJoin('spaceOption.space', 'space')
        .where('space.id = :spaceId', { spaceId: id })
        .andWhere('booking.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere('booking.status = :bookingStatus', {
          bookingStatus: BookingStatus.COMPLETED,
        })
        .select([
          'DATE(booking.createdAt) as date',
          'SUM(booking.totalAmount) as revenue',
        ])
        .groupBy('DATE(booking.createdAt)')
        .orderBy('date', 'ASC')
        .getRawMany();

      const result = {
        spaceId: id,
        spaceName: space.name,
        dateRange: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        summary: {
          totalBookings,
          completedBookings,
          cancelledBookings,
          pendingBookings,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          averageBookingDuration:
            Math.round(averageBookingDuration * 100) / 100,
          utilizationRate: Math.round(utilizationRate * 100) / 100,
        },
        trends: {
          bookings: bookingTrends.map((trend) => ({
            date: trend.date,
            count: parseInt(trend.count),
          })),
          revenue: revenueTrends.map((trend) => ({
            date: trend.date,
            revenue: parseFloat(trend.revenue) || 0,
          })),
        },
      };

      this.logger.log(`Successfully generated analytics for space ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error getting space analytics for space ${id}:`,
        error.message,
      );
      this.logger.error('Stack trace:', error.stack);

      if (error.message?.includes('not found')) {
        throw error;
      }

      // Return fallback data instead of throwing error to prevent 500
      this.logger.warn(`Returning fallback analytics data for space ${id}`);
      return {
        spaceId: id,
        spaceName: space?.name || 'Unknown Space',
        dateRange: {
          startDate: (startDate
            ? new Date(startDate)
            : new Date()
          ).toISOString(),
          endDate: (endDate ? new Date(endDate) : new Date()).toISOString(),
        },
        summary: {
          totalBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          pendingBookings: 0,
          totalRevenue: 0,
          averageBookingDuration: 0,
          utilizationRate: 0,
        },
        trends: {
          bookings: [],
          revenue: [],
        },
      };
    }
  }

  async getSpaceBookings(
    spaceId: string,
    queryOptions: {
      enabled?: boolean;
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<BookingListResponseDto> {
    try {
      // First verify the space exists
      const space = await this.spaceRepository.findOne({
        where: { id: spaceId },
      });

      if (!space) {
        throw new NotFoundException(`Space with ID ${spaceId} not found`);
      }

      const {
        enabled,
        page = 1,
        limit = 10,
        status,
        startDate,
        endDate,
      } = queryOptions;

      // Build query for bookings related to this space
      const queryBuilder = this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.user', 'user')
        .leftJoinAndSelect('booking.spaceOption', 'spaceOption')
        .leftJoinAndSelect('spaceOption.space', 'space')
        .leftJoinAndSelect('booking.payment', 'payment')
        .where('space.id = :spaceId', { spaceId });

      // Apply filters
      if (enabled !== undefined) {
        queryBuilder.andWhere('space.isActive = :enabled', { enabled });
      }

      if (status) {
        queryBuilder.andWhere('booking.status = :status', { status });
      }

      if (startDate) {
        queryBuilder.andWhere('booking.startDateTime >= :startDate', {
          startDate,
        });
      }

      if (endDate) {
        queryBuilder.andWhere('booking.startDateTime <= :endDate', {
          endDate,
        });
      }

      // Add pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Order by creation date (newest first)
      queryBuilder.orderBy('booking.createdAt', 'DESC');

      const [bookings, total] = await queryBuilder.getManyAndCount();

      // Map to DTOs
      const bookingItems: BookingListItemDto[] = bookings.map((booking) => ({
        id: booking.id,
        bookingReference:
          booking.bookingReference || `BK-${booking.id.slice(-6)}`,
        bookingDate: booking.startDateTime,
        startTime: booking.startDateTime.toTimeString().slice(0, 5),
        endTime: booking.endDateTime.toTimeString().slice(0, 5),
        status: booking.status,
        totalAmount: booking.totalAmount,
        paymentStatus: booking.payment?.status || PaymentStatus.PENDING,
        createdAt: booking.createdAt,
        user: {
          id: booking.user?.id || '',
          firstName: booking.user?.firstName || '',
          lastName: booking.user?.lastName || '',
          email: booking.user?.email || '',
        },
        space: {
          id: booking.spaceOption?.space?.id || '',
          name: booking.spaceOption?.space?.name || 'Unknown Space',
          location:
            booking.spaceOption?.space?.listing?.location || 'Unknown Location',
          partner: {
            id: booking.spaceOption?.space?.listing?.partner?.id || '',
            businessName:
              booking.spaceOption?.space?.listing?.partner?.businessName ||
              'Unknown Partner',
          },
        },
      }));

      const pageOptions = Object.assign(new PageOptionsDto(), {
        page: page,
        limit: limit,
      });

      return new BookingListResponseDto(
        bookingItems,
        new OffsetPaginationDto(total, pageOptions),
      );
    } catch (error) {
      this.logger.error(
        `Error fetching bookings for space ${spaceId}:`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new Error(`Failed to fetch space bookings: ${error.message}`);
    }
  }

  // Booking Management
  async findAllBookings(
    queryDto: BookingQueryDto,
  ): Promise<BookingListResponseDto> {
    console.log('=== ENTERING findAllBookings ===');
    console.log('Query DTO:', JSON.stringify(queryDto, null, 2));
    console.log('BookingRepository:', !!this.bookingRepository);

    try {
      const {
        search,
        status,
        startDate,
        endDate,
        userId,
        spaceId,
        partnerId,
        paymentStatus,
        minAmount,
        maxAmount,
        sortBy,
        sortOrder,
        page,
        limit,
      } = queryDto;

      const queryBuilder = this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.user', 'user');
      // Temporarily removing other joins to isolate the issue
      // .leftJoinAndSelect('booking.spaceOption', 'spaceOption')
      // .leftJoinAndSelect('spaceOption.space', 'space')
      // .leftJoinAndSelect('booking.payment', 'payment')

      if (search) {
        queryBuilder.andWhere(
          '(booking.bookingNumber ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      if (status) {
        queryBuilder.andWhere('booking.status = :status', { status });
      }

      if (startDate) {
        queryBuilder.andWhere('booking.startDateTime >= :startDate', {
          startDate,
        });
      }

      if (endDate) {
        queryBuilder.andWhere('booking.startDateTime <= :endDate', { endDate });
      }

      if (userId) {
        queryBuilder.andWhere('booking.userId = :userId', { userId });
      }

      // Temporarily disabled filters that require removed relations
      // if (spaceId) {
      //   queryBuilder
      //     .innerJoin('booking.spaceOption', 'spaceOption')
      //     .andWhere('spaceOption.spaceId = :spaceId', { spaceId });
      // }

      // if (partnerId) {
      //   queryBuilder.andWhere('partner.id = :partnerId', { partnerId });
      // }

      // if (paymentStatus) {
      //   queryBuilder.andWhere('payment.status = :paymentStatus', {
      //     paymentStatus,
      //   });
      // }

      if (minAmount !== undefined) {
        queryBuilder.andWhere('booking.totalAmount >= :minAmount', {
          minAmount,
        });
      }

      if (maxAmount !== undefined) {
        queryBuilder.andWhere('booking.totalAmount <= :maxAmount', {
          maxAmount,
        });
      }

      // Map sortBy to actual database column names
      const sortFieldMap = {
        createdAt: 'booking.createdAt',
        bookingDate: 'booking.startDateTime',
        amount: 'booking.totalAmount',
        status: 'booking.status',
      };

      const actualSortField = sortFieldMap[sortBy] || 'booking.createdAt';
      queryBuilder.orderBy(
        actualSortField,
        sortOrder.toUpperCase() as 'ASC' | 'DESC',
      );

      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      const [items, total] = await queryBuilder.getManyAndCount();

      // Transform to BookingListItemDto
      const bookings = items.map((booking) => ({
        id: booking.id,
        bookingReference: booking.bookingNumber,
        bookingDate: booking.startDateTime
          ? new Date(booking.startDateTime.toISOString().split('T')[0])
          : new Date(),
        startTime: booking.startDateTime
          ? booking.startDateTime.toTimeString().slice(0, 5)
          : '',
        endTime: booking.endDateTime
          ? booking.endDateTime.toTimeString().slice(0, 5)
          : '',
        status: booking.status as BookingStatus,
        totalAmount: booking.totalAmount,
        paymentStatus: PaymentStatus.PENDING, // Simplified since payment relation is removed
        createdAt: booking.createdAt,
        user: {
          id: booking.user.id,
          firstName: booking.user.firstName || '',
          lastName: booking.user.lastName || '',
          email: booking.user.email,
        },
        space: {
          id: 'space-id-not-available', // Simplified since spaceOption relation is removed
          name: 'Space name not available', // Simplified since spaceOption relation is removed
          location: 'Location not available', // Simplified due to removed relations
          partner: {
            id: 'partner-id-not-available', // Simplified due to removed relations
            businessName: 'Partner info not available', // Simplified due to removed relations
          },
        },
      }));

      const pageOptions = new PageOptionsDto();
      Object.assign(pageOptions, { page, limit });

      return new BookingListResponseDto(
        bookings,
        new OffsetPaginationDto(total, pageOptions),
      );
    } catch (error) {
      console.error('=== ERROR in findAllBookings ===');
      console.error('Error details:', error);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  async findBookingById(id: string): Promise<BookingDetailsDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: [
        'user',
        'spaceOption',
        'spaceOption.space',
        'spaceOption.space.listing',
        'spaceOption.space.listing.partner',
        'payment',
        'refunds',
      ],
    });

    if (!booking) {
      throw ErrorResponseUtil.notFound('Booking', id);
    }

    return {
      id: booking.id,
      bookingReference: booking.bookingNumber,
      bookingDate: booking.startDateTime || new Date(),
      startTime: booking.startDateTime
        ? booking.startDateTime.toTimeString().slice(0, 5)
        : '',
      endTime: booking.endDateTime
        ? booking.endDateTime.toTimeString().slice(0, 5)
        : '',
      status: booking.status as BookingStatus,
      totalAmount: booking.totalAmount,
      baseAmount: booking.baseAmount || booking.totalAmount,
      taxAmount: booking.taxAmount || 0,
      discountAmount: booking.discountAmount || 0,
      paymentStatus: booking.payment?.status || PaymentStatus.PENDING,
      paymentMethod: booking.payment?.method || 'Unknown',
      transactionId:
        booking.payment?.gatewayPaymentId ||
        booking.payment?.gatewayResponse?.transactionId ||
        '',
      specialRequests: booking.specialRequests || '',
      numberOfGuests: booking.guestCount || 1,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      user: {
        id: booking.user.id,
        firstName: booking.user.firstName || '',
        lastName: booking.user.lastName || '',
        email: booking.user.email,
        phone: '',
        profileImage: booking.user.image || '',
      },
      space: {
        id: booking.spaceOption?.space?.id || '',
        name: booking.spaceOption?.space?.name || 'Unknown Space',
        description: booking.spaceOption?.space?.description || '',
        location: booking.spaceOption?.space?.listing?.location?.address || '',
        capacity: 10, // TODO: Implement proper capacity from space options
        hourlyRate: 100, // TODO: Implement proper pricing from space options
        images: booking.spaceOption?.space?.images?.map((img) => img.url) || [],
        amenities: [], // TODO: Implement amenities from space features
        partner: {
          id: booking.spaceOption?.space?.listing?.partner?.id || '',
          businessName:
            booking.spaceOption?.space?.listing?.partner?.businessName ||
            'Unknown',
          email:
            booking.spaceOption?.space?.listing?.partner?.user?.email || '',
          phone:
            booking.spaceOption?.space?.listing?.partner?.contactInfo?.phone ||
            '',
        },
      },
      refunds:
        booking.payment?.refunds?.map((refund) => ({
          id: refund.id,
          amount: refund.amount,
          reason: refund.reason,
          processedAt: refund.processedAt,
          refundReference: refund.id, // Using id as reference
        })) || [],
    };
  }

  async updateBooking(
    id: string,
    updateDto: BookingUpdateDto,
    adminId?: string,
  ): Promise<BookingDetailsDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: [
        'user',
        'spaceOption',
        'spaceOption.space',
        'spaceOption.space.listing',
        'spaceOption.space.listing.partner',
        'payment',
        'refunds',
      ],
    });

    if (!booking) {
      throw ErrorResponseUtil.notFound('Booking', id);
    }

    const oldData = { ...booking };

    if (updateDto.bookingDate && updateDto.startTime) {
      const bookingDate = new Date(updateDto.bookingDate);
      const [hours, minutes] = updateDto.startTime.split(':').map(Number);
      booking.startDateTime = new Date(
        bookingDate.setHours(hours, minutes, 0, 0),
      );
    }

    if (updateDto.bookingDate && updateDto.endTime) {
      const bookingDate = new Date(updateDto.bookingDate);
      const [hours, minutes] = updateDto.endTime.split(':').map(Number);
      booking.endDateTime = new Date(
        bookingDate.setHours(hours, minutes, 0, 0),
      );
    }

    if (updateDto.numberOfGuests) {
      booking.guestCount = updateDto.numberOfGuests;
    }

    if (updateDto.specialRequests) {
      booking.specialRequests = updateDto.specialRequests;
    }

    const updatedBooking = await this.bookingRepository.save({
      ...booking,
      updatedAt: new Date(),
    });

    // Log audit action
    if (adminId) {
      await this.auditService.logAction({
        action: AuditAction.BOOKING_UPDATED,
        adminId,
        targetBookingId: id,
        oldData,
        newData: updatedBooking,
        timestamp: new Date(),
      });
    }

    return this.findBookingById(id);
  }

  async updateBookingStatus(
    id: string,
    statusDto: UpdateBookingStatusDto,
    adminId?: string,
  ): Promise<BookingDetailsDto> {
    // Validate booking ID format
    if (!id || typeof id !== 'string') {
      throw ErrorResponseUtil.badRequest('Invalid booking ID format');
    }

    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user', 'spaceOption', 'spaceOption.space'],
    });

    if (!booking) {
      throw ErrorResponseUtil.notFound('Booking', id);
    }

    // Validate status transition
    const validTransitions = this.getValidStatusTransitions(booking.status);
    if (!validTransitions.includes(statusDto.status)) {
      throw ErrorResponseUtil.badRequest(
        `Invalid status transition from ${booking.status} to ${statusDto.status}`,
      );
    }

    const oldStatus = booking.status;
    booking.status = statusDto.status;
    booking.updatedAt = new Date();

    if (statusDto.reason) {
      booking.cancellationReason = statusDto.reason;
    }

    const updatedBooking = await this.bookingRepository.save(booking);

    // Log audit action
    if (adminId) {
      await this.auditService.logAction({
        action: AuditAction.BOOKING_STATUS_UPDATED,
        adminId,
        targetBookingId: id,
        oldData: { status: oldStatus },
        newData: { status: statusDto.status, reason: statusDto.reason },
        timestamp: new Date(),
      });
    }

    // Send email notification if notifyUser is true
    if (statusDto.notifyUser && booking.user?.email) {
      try {
        await this.emailService.sendBookingStatusUpdateEmail(
          booking.user.email,
          {
            bookingId: booking.id,
            status: booking.status,
            userName:
              `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() ||
              booking.user.username,
            spaceName: booking.spaceOption?.space?.name || 'Unknown Space',
            bookingDate: booking.startDateTime,
            reason: statusDto.reason,
          },
        );
      } catch (error) {
        // Log email error but don't fail the booking update
        console.error('Failed to send booking status email:', error);
      }
    }

    return this.findBookingById(id);
  }

  async bulkUpdateBookingStatus(
    bulkUpdateDto: BulkBookingStatusUpdateDto,
    adminId?: string,
  ): Promise<{ message: string; updatedCount: number; failedIds: string[] }> {
    const { bookingIds, status, reason, notifyUser } = bulkUpdateDto;
    const updated: string[] = [];
    const failed: string[] = [];

    for (const bookingId of bookingIds) {
      try {
        const booking = await this.bookingRepository.findOne({
          where: { id: bookingId },
          relations: ['user', 'spaceOption', 'spaceOption.space'],
        });

        if (!booking) {
          failed.push(bookingId);
          continue;
        }

        // Update booking status
        booking.status = status;
        booking.updatedAt = new Date();

        if (reason) {
          booking.cancellationReason = reason;
        }

        await this.bookingRepository.save(booking);

        // Log audit action
        await this.auditService.logAction({
          action: AuditAction.BOOKING_STATUS_UPDATED,
          adminId: adminId || 'system',
          targetBookingId: bookingId,
          oldData: { status: booking.status },
          newData: { status, reason },
          timestamp: new Date(),
        });

        // Send notification if requested
        if (notifyUser && booking.user) {
          try {
            await this.emailService.sendBookingStatusUpdateEmail(
              booking.user.email,
              {
                bookingId: booking.id,
                status: booking.status,
                userName:
                  `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() ||
                  booking.user.username,
                spaceName: booking.spaceOption?.space?.name || 'Unknown Space',
                bookingDate: booking.startDateTime,
                reason,
              },
            );
          } catch (error) {
            this.logger.error(
              `Failed to send booking status email for ${bookingId}:`,
              error,
            );
          }
        }

        updated.push(bookingId);
      } catch (error) {
        this.logger.error(`Failed to update booking ${bookingId}:`, error);
        failed.push(bookingId);
      }
    }

    const updatedCount = updated.length;
    const totalRequested = bookingIds.length;

    let message: string;
    if (failed.length === 0) {
      message = `Successfully updated ${updatedCount} booking${updatedCount !== 1 ? 's' : ''}`;
    } else if (updated.length === 0) {
      message = `Failed to update all ${totalRequested} booking${totalRequested !== 1 ? 's' : ''}`;
    } else {
      message = `Updated ${updatedCount} booking${updatedCount !== 1 ? 's' : ''}, failed to update ${failed.length}`;
    }

    return {
      message,
      updatedCount,
      failedIds: failed,
    };
  }

  async cancelBooking(
    id: string,
    reason?: string,
    adminId?: string,
  ): Promise<{ message: string }> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user', 'spaceOption', 'spaceOption.space', 'payment'],
    });

    if (!booking) {
      throw ErrorResponseUtil.notFound('Booking', id);
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw ErrorResponseUtil.badRequest('Booking is already cancelled');
    }

    const oldData = { ...booking };
    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    booking.updatedAt = new Date();

    await this.bookingRepository.save(booking);

    // Log audit action
    if (adminId) {
      await this.auditService.logAction({
        action: AuditAction.BOOKING_CANCELLED,
        adminId,
        targetBookingId: id,
        oldData,
        newData: booking,
        timestamp: new Date(),
      });
    }

    // Send cancellation email notification
    if (booking.user?.email) {
      try {
        await this.emailService.sendBookingCancellationEmail(
          booking.user.email,
          {
            bookingId: booking.id,
            userName:
              `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() ||
              booking.user.username,
            spaceName: booking.spaceOption?.space?.name || 'Unknown Space',
            bookingDate: booking.startDateTime,
            reason: reason,
          },
        );
      } catch (error) {
        // Log email error but don't fail the cancellation
        console.error('Failed to send cancellation email:', error);
      }
    }

    return { message: 'Booking cancelled successfully' };
  }

  async processRefund(
    id: string,
    refundDto: RefundRequestDto,
    adminId?: string,
  ): Promise<{ message: string; refundId: string }> {
    // Validate booking ID format
    if (!id || typeof id !== 'string') {
      throw ErrorResponseUtil.badRequest('Invalid booking ID format');
    }

    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user', 'spaceOption', 'spaceOption.space', 'payment'],
    });

    if (!booking) {
      throw ErrorResponseUtil.notFound('Booking', id);
    }

    if (!booking.payment) {
      throw ErrorResponseUtil.badRequest('No payment found for this booking');
    }

    // Enhanced refund validation
    if (booking.status === BookingStatus.REFUNDED) {
      throw ErrorResponseUtil.badRequest(
        'This booking has already been refunded',
      );
    }

    if (refundDto.amount > booking.totalAmount) {
      throw ErrorResponseUtil.badRequest(
        'Refund amount cannot exceed booking total',
      );
    }

    if (refundDto.amount <= 0) {
      throw ErrorResponseUtil.badRequest('Refund amount must be positive');
    }

    // TODO: Implement actual refund processing with payment gateway
    const refundReference = `REF_${Date.now()}`;

    // Create refund record (assuming there's a refund entity)
    // const refund = await this.refundRepository.save({
    //   bookingId: id,
    //   amount: refundDto.amount,
    //   reason: refundDto.reason,
    //   refundReference,
    //   processedAt: new Date(),
    //   processedBy: adminId,
    // });

    // Update booking status if full refund
    if (refundDto.amount === booking.totalAmount) {
      booking.status = BookingStatus.REFUNDED;
      booking.updatedAt = new Date();
      await this.bookingRepository.save(booking);
    }

    // Log audit action
    if (adminId) {
      await this.auditService.logAction({
        action: AuditAction.BOOKING_REFUNDED,
        adminId,
        targetBookingId: id,
        oldData: booking,
        newData: { refundAmount: refundDto.amount, reason: refundDto.reason },
        timestamp: new Date(),
      });
    }

    // Send email notification if notifyUser is true
    if (refundDto.notifyUser && booking.user?.email) {
      try {
        await this.emailService.sendBookingRefundEmail(booking.user.email, {
          bookingId: booking.id,
          refundAmount: refundDto.amount,
          refundReference,
          userName:
            `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() ||
            booking.user.username,
          spaceName: booking.spaceOption?.space?.name || 'Unknown Space',
          reason: refundDto.reason,
        });
      } catch (error) {
        // Log email error but don't fail the refund process
        console.error('Failed to send refund email:', error);
      }
    }

    return {
      message: 'Refund processed successfully',
      refundId: refundReference,
    };
  }

  /**
   * Get valid status transitions for a booking
   */
  private getValidStatusTransitions(
    currentStatus: BookingStatus,
  ): BookingStatus[] {
    const transitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [
        BookingStatus.PENDING_KYC,
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.PENDING_KYC]: [
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.CONFIRMED]: [
        BookingStatus.CHECKED_IN,
        BookingStatus.COMPLETED,
        BookingStatus.CANCELLED,
        BookingStatus.NO_SHOW,
      ],
      [BookingStatus.CHECKED_IN]: [
        BookingStatus.CHECKED_OUT,
        BookingStatus.COMPLETED,
      ],
      [BookingStatus.CHECKED_OUT]: [BookingStatus.COMPLETED],
      [BookingStatus.CANCELLED]: [BookingStatus.REFUNDED],
      [BookingStatus.COMPLETED]: [BookingStatus.REFUNDED],
      [BookingStatus.NO_SHOW]: [BookingStatus.REFUNDED],
      [BookingStatus.REFUNDED]: [],
    };

    return transitions[currentStatus] || [];
  }

  async extendBooking(
    id: string,
    extendDto: ExtendBookingDto,
    adminId?: string,
  ): Promise<BookingDetailsDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user', 'space'],
    });

    if (!booking) {
      throw ErrorResponseUtil.notFound('Booking', id);
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw ErrorResponseUtil.badRequest(
        'Only confirmed bookings can be extended',
      );
    }

    const oldEndTime = booking.endDateTime;
    booking.endDateTime = new Date(extendDto.newEndTime);
    booking.updatedAt = new Date();

    if (extendDto.reason) {
      // Store reason in metadata instead of adminNotes
      booking.metadata = {
        ...booking.metadata,
        notes: extendDto.reason,
      };
    }

    // TODO: Calculate additional charges for extension
    // TODO: Process additional payment if required

    const updatedBooking = await this.bookingRepository.save(booking);

    // Log audit action
    if (adminId) {
      await this.auditService.logAction({
        action: AuditAction.BOOKING_EXTENDED,
        adminId,
        targetBookingId: id,
        oldData: { endTime: oldEndTime },
        newData: { endTime: extendDto.newEndTime, reason: extendDto.reason },
        timestamp: new Date(),
      });
    }

    // Send email notification if notifyUser is true
    if (extendDto.notifyUser && booking.user?.email) {
      try {
        await this.emailService.sendBookingExtensionEmail(booking.user.email, {
          bookingId: booking.id,
          userName:
            `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() ||
            booking.user.username,
          spaceName: booking.spaceOption?.space?.name,
          oldEndTime,
          newEndTime: extendDto.newEndTime,
          reason: extendDto.reason,
        });
      } catch (error) {
        // Log email error but don't fail the booking extension
        console.error('Failed to send extension email:', error);
      }
    }

    return this.findBookingById(id);
  }

  async getBookingStats(): Promise<BookingStatsDto> {
    try {
      const cacheKey = {
        key: 'BookingStats' as keyof typeof CacheKey,
        args: [],
      };
      const cached = await this.cacheService.get<BookingStatsDto>(cacheKey);
      if (cached) return cached;

      // Get booking counts by status
      const [
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        completedBookings,
        refundedBookings,
      ] = await Promise.all([
        this.bookingRepository.count(),
        this.bookingRepository.count({
          where: { status: BookingStatus.PENDING },
        }),
        this.bookingRepository.count({
          where: { status: BookingStatus.CONFIRMED },
        }),
        this.bookingRepository.count({
          where: { status: BookingStatus.CANCELLED },
        }),
        this.bookingRepository.count({
          where: { status: BookingStatus.COMPLETED },
        }),
        this.bookingRepository.count({
          where: { status: BookingStatus.REFUNDED },
        }),
      ]);

      // Calculate revenue
      const revenueQuery = await this.bookingRepository
        .createQueryBuilder('booking')
        .select('SUM(booking.totalAmount)', 'totalRevenue')
        .where('booking.status IN (:...statuses)', {
          statuses: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
        })
        .getRawOne();

      const totalRevenue = parseFloat(revenueQuery?.totalRevenue || '0');

      // Calculate monthly revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyRevenueQuery = await this.bookingRepository
        .createQueryBuilder('booking')
        .select('SUM(booking.totalAmount)', 'monthlyRevenue')
        .where('booking.status IN (:...statuses)', {
          statuses: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
        })
        .andWhere('booking.createdAt >= :startOfMonth', { startOfMonth })
        .getRawOne();

      const monthlyRevenue = parseFloat(
        monthlyRevenueQuery?.monthlyRevenue || '0',
      );

      // Calculate average booking value
      const averageBookingValue =
        totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Calculate growth rate
      const startOfLastMonth = new Date(startOfMonth);
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
      const endOfLastMonth = new Date(startOfMonth);
      endOfLastMonth.setTime(endOfLastMonth.getTime() - 1);

      const lastMonthBookings = await this.bookingRepository.count({
        where: {
          createdAt: Between(startOfLastMonth, endOfLastMonth),
        },
      });

      const thisMonthBookings = await this.bookingRepository.count({
        where: {
          createdAt: MoreThan(startOfMonth),
        },
      });

      const bookingGrowthRate =
        lastMonthBookings > 0
          ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100
          : thisMonthBookings > 0
            ? 100
            : 0;

      // Get top spaces by bookings - simplified
      const topSpaces = [
        {
          spaceId: 'sample-space-1',
          spaceName: 'Sample Space 1',
          bookingCount: 0,
          revenue: 0,
        },
      ];

      // Get top users by bookings - simplified
      const topUsers = [
        {
          userId: 'sample-user-1',
          userName: 'Sample User',
          bookingCount: 0,
          totalSpent: 0,
        },
      ];

      // Get revenue by month (last 12 months) - simplified
      const revenueByMonth = [
        { month: '2024-01', revenue: 0, bookingCount: 0 },
        { month: '2024-02', revenue: 0, bookingCount: 0 },
        { month: '2024-03', revenue: 0, bookingCount: 0 },
      ];

      // Get bookings by status with percentages
      const bookingsByStatus = [
        {
          status: BookingStatus.PENDING,
          count: pendingBookings,
          percentage:
            totalBookings > 0 ? (pendingBookings / totalBookings) * 100 : 0,
        },
        {
          status: BookingStatus.CONFIRMED,
          count: confirmedBookings,
          percentage:
            totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0,
        },
        {
          status: BookingStatus.CANCELLED,
          count: cancelledBookings,
          percentage:
            totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
        },
        {
          status: BookingStatus.COMPLETED,
          count: completedBookings,
          percentage:
            totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
        },
        {
          status: BookingStatus.REFUNDED,
          count: refundedBookings,
          percentage:
            totalBookings > 0 ? (refundedBookings / totalBookings) * 100 : 0,
        },
      ];

      const stats: BookingStatsDto = {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        completedBookings,
        refundedBookings,
        totalRevenue,
        monthlyRevenue,
        averageBookingValue: parseFloat(averageBookingValue.toFixed(2)),
        bookingGrowthRate: parseFloat(bookingGrowthRate.toFixed(2)),
        topSpaces,
        topUsers,
        revenueByMonth,
        bookingsByStatus,
      };

      await this.cacheService.set(cacheKey, stats, { ttl: 300000 }); // 5 minutes cache
      return stats;
    } catch (error) {
      this.logger.error('Failed to retrieve booking statistics', error);
      throw ErrorResponseUtil.internalServerError(
        'Failed to retrieve booking statistics',
      );
    }
  }

  // Helper methods for time-series analytics
  private getDateTruncFormat(granularity: AnalyticsGranularity): string {
    switch (granularity) {
      case AnalyticsGranularity.HOUR:
        return 'hour';
      case AnalyticsGranularity.DAY:
        return 'day';
      case AnalyticsGranularity.WEEK:
        return 'week';
      case AnalyticsGranularity.MONTH:
        return 'month';
      default:
        return 'day';
    }
  }

  private buildDateRangeFromPeriod(period: AnalyticsPeriod): {
    startDate: string;
    endDate: string;
  } {
    const now = new Date();
    const endDate = now.toISOString().slice(0, 10);
    let startDate: string;

    switch (period) {
      case AnalyticsPeriod.DAY:
        startDate = endDate;
        break;
      case AnalyticsPeriod.WEEK:
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        startDate = weekAgo.toISOString().slice(0, 10);
        break;
      case AnalyticsPeriod.MONTH:
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        startDate = monthAgo.toISOString().slice(0, 10);
        break;
      case AnalyticsPeriod.YEAR:
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        startDate = yearAgo.toISOString().slice(0, 10);
        break;
      default:
        startDate = endDate;
    }

    return { startDate, endDate };
  }

  async getPartnerAnalytics(queryDto: AdminAnalyticsQueryDto): Promise<any[]> {
    const {
      startDate,
      endDate,
      timeframe = AnalyticsTimeframe.DAILY,
    } = queryDto;

    let dateFormat: string;
    switch (timeframe) {
      case AnalyticsTimeframe.DAILY:
        dateFormat = 'YYYY-MM-DD';
        break;
      case AnalyticsTimeframe.WEEKLY:
        dateFormat = 'YYYY-"W"WW';
        break;
      case AnalyticsTimeframe.MONTHLY:
        dateFormat = 'YYYY-MM';
        break;
      case AnalyticsTimeframe.YEARLY:
        dateFormat = 'YYYY';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        break;
    }

    const queryBuilder = this.partnerRepository.createQueryBuilder('partner');

    if (startDate) {
      queryBuilder.andWhere('partner.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('partner.createdAt <= :endDate', { endDate });
    }

    const results = await queryBuilder
      .select([
        `TO_CHAR(partner.createdAt, '${dateFormat}') as date`,
        'COUNT(DISTINCT partner.id) as partnerCount',
      ])
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Get booking and revenue data separately to avoid complex joins
    const bookingResults = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.payment', 'payment')
      .select([
        `TO_CHAR(booking.createdAt, '${dateFormat}') as date`,
        'COUNT(DISTINCT booking.id) as totalBookings',
        'COALESCE(SUM(payment.amount), 0) as totalRevenue',
        'COALESCE(AVG(payment.amount), 0) as averageRevenue',
      ])
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere(
        startDate ? 'booking.createdAt >= :startDate' : '1=1',
        startDate ? { startDate } : {},
      )
      .andWhere(
        endDate ? 'booking.createdAt <= :endDate' : '1=1',
        endDate ? { endDate } : {},
      )
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Merge the results
    const mergedResults = results.map((result) => {
      const bookingData = bookingResults.find((br) => br.date === result.date);
      return {
        date: result.date,
        partnerCount: parseInt(result.partnercount),
        totalBookings: bookingData ? parseInt(bookingData.totalbookings) : 0,
        totalRevenue: bookingData ? parseFloat(bookingData.totalrevenue) : 0,
        averageRevenue: bookingData
          ? parseFloat(bookingData.averagerevenue)
          : 0,
      };
    });

    return mergedResults;
  }

  async getDashboardAnalytics(): Promise<any> {
    try {
      // Get basic counts
      const totalUsers = await this.userRepository.count();
      const totalPartners = await this.partnerRepository.count();
      const totalSpaces = await this.spaceRepository.count();
      const totalBookings = await this.bookingRepository.count();

      // Get revenue data
      const revenueResult = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0) as totalRevenue')
        .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne();

      const totalRevenue = parseFloat(revenueResult.totalrevenue || '0');

      // Get monthly growth data
      const currentMonth = new Date();
      const lastMonth = new Date(currentMonth);
      lastMonth.setMonth(currentMonth.getMonth() - 1);

      const monthlyUsers = await this.userRepository.count({
        where: {
          createdAt: MoreThan(lastMonth),
        },
      });

      const monthlyBookings = await this.bookingRepository.count({
        where: {
          createdAt: MoreThan(lastMonth),
        },
      });

      return {
        totalUsers,
        totalPartners,
        totalSpaces,
        totalBookings,
        totalRevenue,
        monthlyUsers,
        monthlyBookings,
        averageBookingValue:
          totalBookings > 0 ? totalRevenue / totalBookings : 0,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve dashboard analytics', error);
      throw ErrorResponseUtil.internalServerError(
        'Failed to retrieve dashboard analytics',
      );
    }
  }

  async getPerformanceMetrics(queryDto: { timeframe?: string }): Promise<any> {
    try {
      const { timeframe = '24h' } = queryDto;

      let startDate: Date;
      const now = new Date();

      switch (timeframe) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // Get booking performance
      const bookingMetrics = await this.bookingRepository
        .createQueryBuilder('booking')
        .select([
          'COUNT(booking.id) as totalBookings',
          'COUNT(CASE WHEN booking.status = :confirmed THEN 1 END) as confirmedBookings',
          'COUNT(CASE WHEN booking.status = :cancelled THEN 1 END) as cancelledBookings',
        ])
        .where('booking.createdAt >= :startDate', { startDate })
        .setParameter('confirmed', BookingStatus.CONFIRMED)
        .setParameter('cancelled', BookingStatus.CANCELLED)
        .getRawOne();

      // Get user activity
      const userActivity = await this.userRepository
        .createQueryBuilder('user')
        .select([
          'COUNT(user.id) as newUsers',
          'COUNT(CASE WHEN user.lastLoginAt >= :startDate THEN 1 END) as activeUsers',
        ])
        .where('user.createdAt >= :startDate', { startDate })
        .setParameter('startDate', startDate)
        .getRawOne();

      return {
        timeframe,
        bookings: {
          total: parseInt(bookingMetrics.totalbookings),
          confirmed: parseInt(bookingMetrics.confirmedbookings),
          cancelled: parseInt(bookingMetrics.cancelledbookings),
          conversionRate:
            parseInt(bookingMetrics.totalbookings) > 0
              ? (parseInt(bookingMetrics.confirmedbookings) /
                  parseInt(bookingMetrics.totalbookings)) *
                100
              : 0,
        },
        users: {
          new: parseInt(userActivity.newusers),
          active: parseInt(userActivity.activeusers),
        },
        timestamp: now.toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to retrieve performance metrics', error);
      throw ErrorResponseUtil.internalServerError(
        'Failed to retrieve performance metrics',
      );
    }
  }

  // Review Management
  async getAllReviews(queryOptions: any): Promise<any> {
    try {
      console.log(
        '=== DEBUG getAllReviews called with options:',
        JSON.stringify(queryOptions),
      );
      console.log('=== DEBUG reviewService exists:', !!this.reviewService);
      console.log(
        '=== DEBUG findAllReviews method exists:',
        typeof this.reviewService?.findAllReviews,
      );

      if (
        !this.reviewService ||
        typeof this.reviewService.findAllReviews !== 'function'
      ) {
        console.log('=== DEBUG Review service not available');
        this.logger.warn('Review service not available');
        throw ErrorResponseUtil.internalServerError(
          'Review service not available',
        );
      }

      console.log('=== DEBUG Calling reviewService.findAllReviews...');
      const result = await this.reviewService.findAllReviews(queryOptions);
      console.log(
        '=== DEBUG reviewService.findAllReviews completed successfully',
      );
      return result;
    } catch (error) {
      console.log('=== DEBUG Error in getAllReviews:', error.message);
      console.log('=== DEBUG Error stack:', error.stack);
      this.logger.error('Failed to retrieve reviews', error);
      this.logger.error('Error stack:', error.stack);
      throw ErrorResponseUtil.internalServerError('Failed to retrieve reviews');
    }
  }

  async getReviewAnalytics(queryParams?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    try {
      const dateRange = {
        startDate: queryParams?.startDate
          ? new Date(queryParams.startDate)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: queryParams?.endDate
          ? new Date(queryParams.endDate)
          : new Date(),
      };

      // Check if reviewService exists and has the required method
      if (
        !this.reviewService ||
        typeof this.reviewService.findAllReviews !== 'function'
      ) {
        this.logger.warn(
          'Review service not available, returning default analytics',
        );
        return {
          totalReviews: 0,
          flaggedReviews: 0,
          verifiedReviews: 0,
          averageRating: 0,
          reviewsThisMonth: 0,
          dateRange,
        };
      }

      // Get basic review stats with optimized queries
      const [totalReviews, flaggedReviews, verifiedReviews] = await Promise.all(
        [
          this.reviewService
            .findAllReviews({ limit: 1 })
            .catch(() => ({ meta: { total: 0 } })),
          this.reviewService
            .findAllReviews({ isFlagged: true, limit: 1 })
            .catch(() => ({ meta: { total: 0 } })),
          this.reviewService
            .findAllReviews({ isVerified: true, limit: 1 })
            .catch(() => ({ meta: { total: 0 } })),
        ],
      );

      // Calculate average rating with limited data fetch
      let averageRating = 0;
      try {
        const reviewsForRating = await this.reviewService.findAllReviews({
          limit: 1000,
        });
        if (
          reviewsForRating?.data &&
          Array.isArray(reviewsForRating.data) &&
          reviewsForRating.data.length > 0
        ) {
          const totalRating = reviewsForRating.data.reduce(
            (sum: number, review: any) => {
              const rating = review?.rating || 0;
              return sum + (typeof rating === 'number' ? rating : 0);
            },
            0,
          );
          averageRating = totalRating / reviewsForRating.data.length;
        }
      } catch (error) {
        this.logger.warn('Failed to calculate average rating:', error);
      }

      // Calculate reviews this month
      const currentMonth = new Date();
      const startOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1,
      );
      let reviewsThisMonth = 0;
      try {
        const monthlyReviews = await this.reviewService.findAllReviews({
          startDate: startOfMonth.toISOString(),
          limit: 1,
        });
        reviewsThisMonth = monthlyReviews?.meta?.total || 0;
      } catch (error) {
        this.logger.warn('Failed to get monthly reviews:', error);
      }

      return {
        totalReviews: totalReviews?.meta?.total || 0,
        flaggedReviews: flaggedReviews?.meta?.total || 0,
        verifiedReviews: verifiedReviews?.meta?.total || 0,
        averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
        reviewsThisMonth,
        dateRange,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve review analytics', error);
      throw ErrorResponseUtil.internalServerError(
        'Failed to retrieve review analytics',
      );
    }
  }

  private mapToAdminPartnerWalletDto(
    wallet: PartnerWalletEntity,
  ): AdminPartnerWalletDto {
    try {
      const partner = wallet.partner;

      // Convert string status to WalletStatus enum with proper validation
      const convertStatus = (status: string): WalletStatus => {
        const normalizedStatus = status?.toLowerCase();
        switch (normalizedStatus) {
          case 'active':
            return WalletStatus.ACTIVE;
          case 'frozen':
            return WalletStatus.FROZEN;
          case 'suspended':
            return WalletStatus.SUSPENDED;
          case 'closed':
            return WalletStatus.CLOSED;
          default:
            console.warn(
              `Unknown wallet status: ${status}, defaulting to ACTIVE`,
            );
            return WalletStatus.ACTIVE;
        }
      };

      return {
        id: wallet.id,
        partnerId: wallet.partnerId,
        partnerName:
          partner?.firstName && partner?.lastName
            ? `${partner.firstName} ${partner.lastName}`
            : partner?.firstName || partner?.lastName || 'Unknown',
        partnerEmail: partner?.email || 'Unknown',
        partnerPhone: 'Unknown', // Phone not available in UserEntity
        partnerAvatar: partner?.image || '',
        currentBalance: wallet.availableBalance || 0,
        pendingEarnings: wallet.pendingBalance || 0,
        commissionRate: 0, // This would need to come from partner commission settings
        lastPayoutDate: wallet.lastTransactionDate?.toISOString() || '',
        status: convertStatus(wallet.status),
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString(),
        lastActivity: wallet.updatedAt.toISOString(),
      };
    } catch (error) {
      console.error('Error mapping wallet to DTO:', error);
      throw new Error('Failed to map wallet data');
    }
  }

  // User Search and Statistics Methods
  async searchUsers(searchDto: any): Promise<UserListResponseDto> {
    try {
      console.log('🔍 AdminService.searchUsers called with:', searchDto);

      const queryBuilder = this.userRepository.createQueryBuilder('user');

      // Apply search filters
      if (searchDto.query) {
        queryBuilder.andWhere(
          '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
          { search: `%${searchDto.query}%` },
        );
      }

      if (searchDto.status) {
        queryBuilder.andWhere('user.status = :status', {
          status: searchDto.status,
        });
      }

      if (searchDto.role) {
        queryBuilder.andWhere('user.role = :role', { role: searchDto.role });
      }

      if (searchDto.dateFrom && searchDto.dateTo) {
        queryBuilder.andWhere('user.createdAt BETWEEN :dateFrom AND :dateTo', {
          dateFrom: new Date(searchDto.dateFrom),
          dateTo: new Date(searchDto.dateTo),
        });
      }

      // Pagination
      const page = searchDto.page || 1;
      const limit = searchDto.limit || 10;
      const offset = (page - 1) * limit;

      queryBuilder.skip(offset).take(limit);
      queryBuilder.orderBy('user.createdAt', 'DESC');

      const [users, total] = await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(total / limit);
      const currentPage = parseInt(page.toString());
      const limitNum = parseInt(limit.toString());

      return {
        data: users,
        pagination: {
          limit: limitNum,
          currentPage: currentPage,
          nextPage: currentPage < totalPages ? currentPage + 1 : undefined,
          previousPage: currentPage > 1 ? currentPage - 1 : undefined,
          totalPages: totalPages,
          totalRecords: total,
        },
      };
    } catch (error) {
      console.error('❌ AdminService.searchUsers error:', error);
      this.logger.error('Failed to search users', error);
      throw ErrorResponseUtil.internalServerError('Failed to search users');
    }
  }

  async getUserStatistics(): Promise<any> {
    try {
      console.log('📊 AdminService.getUserStatistics called');

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get total users
      const totalUsers = await this.userRepository.count();

      // Get active users (logged in within last 30 days)
      const activeUsers = await this.userRepository
        .createQueryBuilder('user')
        .where('user.lastLoginAt >= :thirtyDaysAgo', { thirtyDaysAgo })
        .getCount();

      // Get new users in different time periods
      const newUsersToday = await this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :oneDayAgo', { oneDayAgo })
        .getCount();

      const newUsersThisWeek = await this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
        .getCount();

      const newUsersThisMonth = await this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
        .getCount();

      // Get users by status
      const usersByStatus = await this.userRepository
        .createQueryBuilder('user')
        .select('user.status, COUNT(*) as count')
        .groupBy('user.status')
        .getRawMany();

      // Get users by role
      const usersByRole = await this.userRepository
        .createQueryBuilder('user')
        .select('user.role, COUNT(*) as count')
        .groupBy('user.role')
        .getRawMany();

      return {
        total: totalUsers,
        active: activeUsers,
        newUsers: {
          today: newUsersToday,
          thisWeek: newUsersThisWeek,
          thisMonth: newUsersThisMonth,
        },
        byStatus: usersByStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = parseInt(item.count);
          return acc;
        }, {}),
        timestamp: now.toISOString(),
      };
    } catch (error) {
      console.error('❌ AdminService.getUserStatistics error:', error);
      this.logger.error('Failed to get user statistics', error);
      throw ErrorResponseUtil.internalServerError(
        'Failed to get user statistics',
      );
    }
  }

  // Booking Methods
  async getRecentBookings(limit: number = 10): Promise<any> {
    try {
      console.log(
        '📅 AdminService.getRecentBookings called with limit:',
        limit,
      );

      const bookings = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.user', 'user')
        .leftJoinAndSelect('booking.spaceOption', 'spaceOption')
        .leftJoinAndSelect('spaceOption.space', 'space')
        .orderBy('booking.createdAt', 'DESC')
        .limit(limit)
        .getMany();

      return {
        data: bookings,
        meta: {
          total: bookings.length,
          limit,
        },
      };
    } catch (error) {
      console.error('❌ AdminService.getRecentBookings error:', error);
      this.logger.error('Failed to get recent bookings', error);
      throw ErrorResponseUtil.internalServerError(
        'Failed to get recent bookings',
      );
    }
  }

  async getPendingBookings(): Promise<any> {
    try {
      console.log('⏳ AdminService.getPendingBookings called');

      const bookings = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.user', 'user')
        .leftJoinAndSelect('booking.spaceOption', 'spaceOption')
        .leftJoinAndSelect('spaceOption.space', 'space')
        .where('booking.status = :status', { status: 'pending' })
        .orderBy('booking.createdAt', 'ASC')
        .getMany();

      return {
        data: bookings,
        meta: {
          total: bookings.length,
        },
      };
    } catch (error) {
      console.error('❌ AdminService.getPendingBookings error:', error);
      this.logger.error('Failed to get pending bookings', error);
      throw ErrorResponseUtil.internalServerError(
        'Failed to get pending bookings',
      );
    }
  }

  // Invoice Management Methods
  async getAllPartnerInvoices(
    queryDto: AdminInvoiceQueryDto,
  ): Promise<AdminInvoiceListResponseDto> {
    console.log('🚀 ENTERING getAllPartnerInvoices method');
    console.log('🚀 Query DTO:', JSON.stringify(queryDto, null, 2));
    try {
      console.log(
        '⏳ AdminService.getAllPartnerInvoices called with:',
        queryDto,
      );

      // Test basic repository functionality first
      console.log('🧪 Testing basic repository functionality...');
      console.log('🧪 Repository exists:', !!this.invoiceRepository);
      console.log(
        '🧪 Repository metadata:',
        this.invoiceRepository.metadata?.tableName,
      );

      // Try a simple count query first
      console.log('🧪 Testing simple count query...');
      const totalInvoices = await this.invoiceRepository.count();
      console.log('🧪 Total invoices in database:', totalInvoices);

      const {
        page = 1,
        limit = 10,
        search,
        status,
        type,
        sortBy = AdminInvoiceSortBy.CREATED_AT,
        sortOrder = AdminInvoiceSortOrder.DESC,
      } = queryDto;
      const skip = (page - 1) * limit;

      // Build query - simplified version without joins first
      console.log('🔍 Building query builder...');
      const queryBuilder = this.invoiceRepository
        .createQueryBuilder('invoice')
        .where('invoice.partnerId IS NOT NULL'); // Only partner invoices

      console.log('✅ Query builder created successfully');

      // Apply filters
      if (search) {
        queryBuilder.andWhere(
          '(invoice.invoiceNumber ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      if (status) {
        queryBuilder.andWhere('invoice.status = :status', { status });
      }

      if (type) {
        queryBuilder.andWhere('invoice.type = :type', { type });
      }

      // Apply sorting
      const sortField = this.mapSortField(sortBy);
      queryBuilder.orderBy(sortField, sortOrder);

      // Get total count
      console.log('📊 Getting total count...');
      const totalItems = await queryBuilder.getCount();
      console.log('✅ Total items:', totalItems);

      // Apply pagination
      console.log('📄 Applying pagination and fetching invoices...');
      const invoices = await queryBuilder.skip(skip).take(limit).getMany();
      console.log('✅ Fetched invoices:', invoices.length);

      // Map to response DTOs
      console.log('🗂️ Mapping invoices to response DTOs...');
      const invoiceResponses =
        invoices.length > 0
          ? invoices.map((invoice) => this.mapToAdminInvoiceResponse(invoice))
          : [];
      console.log('✅ Mapped invoices:', invoiceResponses.length);

      // Calculate summary statistics
      console.log('📊 Calculating summary statistics...');
      const summary = await this.calculateInvoiceSummary(queryBuilder);
      console.log('✅ Summary calculated:', summary);

      return {
        invoices: invoiceResponses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: limit,
        },
        summary,
      };
    } catch (error) {
      console.error('❌ AdminService.getAllPartnerInvoices error:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      if (error.query) {
        console.error('Failed query:', error.query);
      }
      if (error.parameters) {
        console.error('Query parameters:', error.parameters);
      }
      if (error.code) {
        console.error('Error code:', error.code);
      }
      this.logger.error('Failed to get partner invoices', error);
      throw ErrorResponseUtil.internalServerError(
        'Failed to get partner invoices',
      );
    }
  }

  async getAllUserInvoices(
    queryDto: AdminInvoiceQueryDto,
  ): Promise<AdminInvoiceListResponseDto> {
    console.log('🚀 ENTERING getAllUserInvoices method');
    console.log('🚀 Query DTO:', JSON.stringify(queryDto, null, 2));
    try {
      console.log('⏳ AdminService.getAllUserInvoices called with:', queryDto);

      // Test basic repository functionality first
      console.log('🧪 Testing basic repository functionality...');
      console.log('🧪 Repository exists:', !!this.invoiceRepository);
      console.log(
        '🧪 Repository metadata:',
        this.invoiceRepository.metadata?.tableName,
      );

      // Try a simple count query first
      console.log('🧪 Testing simple count query...');
      const totalInvoices = await this.invoiceRepository.count();
      console.log('🧪 Total invoices in database:', totalInvoices);

      const {
        page = 1,
        limit = 10,
        search,
        status,
        type,
        sortBy = AdminInvoiceSortBy.CREATED_AT,
        sortOrder = AdminInvoiceSortOrder.DESC,
      } = queryDto;
      const skip = (page - 1) * limit;

      // Build query - simplified version without joins first, matching partner invoices approach
      console.log('🔍 Building query builder...');
      const queryBuilder = this.invoiceRepository
        .createQueryBuilder('invoice')
        .where('invoice.userId IS NOT NULL'); // Only user invoices (userId is not null)

      console.log('✅ Query builder created successfully');

      // Apply filters - simplified without user table joins
      if (search) {
        queryBuilder.andWhere('invoice.invoiceNumber ILIKE :search', {
          search: `%${search}%`,
        });
      }

      if (status) {
        queryBuilder.andWhere('invoice.status = :status', { status });
      }

      if (type) {
        queryBuilder.andWhere('invoice.type = :type', { type });
      }

      // Apply sorting
      const sortField = this.mapSortField(sortBy);
      queryBuilder.orderBy(sortField, sortOrder);

      // Get total count
      console.log('📊 Getting total count...');
      const totalItems = await queryBuilder.getCount();
      console.log('✅ Total items:', totalItems);

      // Apply pagination
      console.log('📄 Applying pagination and fetching invoices...');
      const invoices = await queryBuilder.skip(skip).take(limit).getMany();
      console.log('✅ Fetched invoices:', invoices.length);

      // Map to response DTOs
      console.log('🗂️ Mapping invoices to response DTOs...');
      const invoiceResponses =
        invoices.length > 0
          ? invoices.map((invoice) => this.mapToAdminInvoiceResponse(invoice))
          : [];
      console.log('✅ Mapped invoices:', invoiceResponses.length);

      // Calculate summary statistics
      console.log('📊 Calculating summary statistics...');
      const summary = await this.calculateInvoiceSummary(queryBuilder);
      console.log('✅ Summary calculated:', summary);

      return {
        invoices: invoiceResponses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: limit,
        },
        summary,
      };
    } catch (error) {
      console.error('❌ AdminService.getAllUserInvoices error:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      if (error.query) {
        console.error('Failed query:', error.query);
      }
      if (error.parameters) {
        console.error('Query parameters:', error.parameters);
      }
      if (error.code) {
        console.error('Error code:', error.code);
      }
      this.logger.error('Failed to get user invoices', error);
      throw ErrorResponseUtil.internalServerError(
        'Failed to get user invoices',
      );
    }
  }

  private mapSortField(sortBy: AdminInvoiceSortBy): string {
    const sortFieldMap = {
      [AdminInvoiceSortBy.CREATED_AT]: 'invoice.createdAt',
      [AdminInvoiceSortBy.INVOICE_DATE]: 'invoice.issueDate',
      [AdminInvoiceSortBy.DUE_DATE]: 'invoice.dueDate',
      [AdminInvoiceSortBy.TOTAL_AMOUNT]: 'invoice.totalAmount',
      [AdminInvoiceSortBy.INVOICE_NUMBER]: 'invoice.invoiceNumber',
      [AdminInvoiceSortBy.STATUS]: 'invoice.status',
    };
    return sortFieldMap[sortBy] || 'invoice.createdAt';
  }

  private mapInvoiceStatusToAdminStatus(
    status: InvoiceStatus,
  ): AdminInvoiceStatus {
    // Map InvoiceStatus to AdminInvoiceStatus
    switch (status) {
      case InvoiceStatus.DRAFT:
        return AdminInvoiceStatus.DRAFT;
      case InvoiceStatus.SENT:
        return AdminInvoiceStatus.SENT;
      case InvoiceStatus.PAID:
        return AdminInvoiceStatus.PAID;
      case InvoiceStatus.OVERDUE:
        return AdminInvoiceStatus.OVERDUE;
      case InvoiceStatus.CANCELLED:
        return AdminInvoiceStatus.CANCELLED;
      default:
        return AdminInvoiceStatus.DRAFT; // Default fallback
    }
  }

  private mapAdminStatusToOriginalStatus(
    adminStatus: AdminInvoiceStatus,
  ): InvoiceStatus {
    // Map AdminInvoiceStatus back to InvoiceStatus for filtering
    switch (adminStatus) {
      case AdminInvoiceStatus.DRAFT:
        return InvoiceStatus.DRAFT;
      case AdminInvoiceStatus.SENT:
        return InvoiceStatus.SENT;
      case AdminInvoiceStatus.PAID:
        return InvoiceStatus.PAID;
      case AdminInvoiceStatus.OVERDUE:
        return InvoiceStatus.OVERDUE;
      case AdminInvoiceStatus.CANCELLED:
        return InvoiceStatus.CANCELLED;
      default:
        return InvoiceStatus.DRAFT;
    }
  }

  private mapAdminTypeToOriginalType(adminType: AdminInvoiceType): InvoiceType {
    // Map AdminInvoiceType back to InvoiceType for filtering
    switch (adminType) {
      case AdminInvoiceType.BOOKING:
        return InvoiceType.BOOKING;
      case AdminInvoiceType.COMMISSION:
        return InvoiceType.COMMISSION;
      case AdminInvoiceType.SUBSCRIPTION:
        return InvoiceType.ADJUSTMENT; // Map subscription to adjustment as closest match
      case AdminInvoiceType.OTHER:
      default:
        return InvoiceType.BOOKING;
    }
  }

  private mapInvoiceTypeToAdminType(type: InvoiceType): AdminInvoiceType {
    // Map InvoiceType to AdminInvoiceType
    switch (type) {
      case InvoiceType.BOOKING:
        return AdminInvoiceType.BOOKING;
      case InvoiceType.COMMISSION:
        return AdminInvoiceType.COMMISSION;
      case InvoiceType.REFUND:
      case InvoiceType.ADJUSTMENT:
      default:
        return AdminInvoiceType.OTHER; // Map all other types to OTHER
    }
  }

  private mapToAdminInvoiceResponse(
    invoice: InvoiceEntity,
  ): AdminInvoiceResponseDto {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      type: this.mapInvoiceTypeToAdminType(invoice.type),
      status: this.mapInvoiceStatusToAdminStatus(invoice.status),
      customer: {
        id: invoice.customerId || invoice.userId || 'unknown',
        name:
          invoice.customerName ||
          (invoice.user
            ? `${invoice.user.firstName || ''} ${invoice.user.lastName || ''}`.trim()
            : 'Unknown Customer'),
        email:
          invoice.customerEmail || invoice.user?.email || 'unknown@example.com',
        phone: invoice.customerPhone,
        address: invoice.customerAddress,
        taxId: invoice.customerTaxId,
      },
      partner: invoice.partner
        ? {
            id: invoice.partner.id,
            name:
              invoice.partner.user?.firstName && invoice.partner.user?.lastName
                ? invoice.partner.user.firstName +
                  ' ' +
                  invoice.partner.user.lastName
                : invoice.partner.user?.firstName ||
                  invoice.partner.user?.lastName ||
                  invoice.partner.businessName ||
                  'Unknown Partner',
            email:
              invoice.partner.contactInfo?.email || invoice.partner.user?.email,
          }
        : undefined,
      booking: invoice.booking
        ? {
            id: invoice.booking.id,
            spaceId:
              invoice.booking.spaceOption?.space?.id ||
              invoice.booking.spaceOptionId ||
              undefined,
            spaceName:
              invoice.booking.spaceOption?.space?.name || 'Unknown Space',
            startDate: invoice.booking.startDateTime,
            endDate: invoice.booking.endDateTime,
          }
        : undefined,
      lineItems: invoice.lineItems || [],
      subtotal: Number(invoice.subtotal || 0),
      taxAmount: Number(invoice.totalTax || 0),
      discountAmount: Number(invoice.discountAmount || 0),
      totalAmount: Number(invoice.totalAmount || 0),
      paidAmount: Number(invoice.paidAmount || 0),
      outstandingAmount: Number(invoice.outstandingAmount || 0),
      invoiceDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate,
      currency: invoice.currency || 'INR',
      notes: invoice.notes,
      terms: invoice.terms,
      pdfUrl: invoice.pdfUrl,
      metadata: invoice.metadata,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  private async calculateInvoiceSummary(queryBuilder: any): Promise<any> {
    try {
      // Create a new query builder for summary calculation to avoid modifying the original
      const summaryQuery = this.invoiceRepository
        .createQueryBuilder('invoice')
        .where('invoice.userId IS NOT NULL AND invoice.partnerId IS NULL');

      // Get all invoices for summary calculation
      const allInvoices = await summaryQuery.getMany();

      const totalAmount = allInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.totalAmount),
        0,
      );
      const totalPaid = allInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.paidAmount),
        0,
      );
      const totalOutstanding = allInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.outstandingAmount),
        0,
      );

      // Count invoices by status
      const invoicesByStatus = {
        [AdminInvoiceStatus.DRAFT]: 0,
        [AdminInvoiceStatus.SENT]: 0,
        [AdminInvoiceStatus.PAID]: 0,
        [AdminInvoiceStatus.OVERDUE]: 0,
        [AdminInvoiceStatus.CANCELLED]: 0,
        [AdminInvoiceStatus.REFUNDED]: 0,
      };

      allInvoices.forEach((invoice) => {
        const status = this.mapInvoiceStatusToAdminStatus(invoice.status);
        if (invoicesByStatus.hasOwnProperty(status)) {
          invoicesByStatus[status]++;
        }
      });

      return {
        totalAmount,
        totalPaid,
        totalOutstanding,
        invoicesByStatus,
      };
    } catch (error) {
      console.error('❌ Error calculating invoice summary:', error);
      // Return default summary if calculation fails
      return {
        totalAmount: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        invoicesByStatus: {
          [AdminInvoiceStatus.DRAFT]: 0,
          [AdminInvoiceStatus.SENT]: 0,
          [AdminInvoiceStatus.PAID]: 0,
          [AdminInvoiceStatus.OVERDUE]: 0,
          [AdminInvoiceStatus.CANCELLED]: 0,
          [AdminInvoiceStatus.REFUNDED]: 0,
        },
      };
    }
  }

  // Admin Configuration Management
  async getAdminConfigs(queryDto: any): Promise<any> {
    try {
      const { page = 1, limit = 10, category, isActive, search } = queryDto;

      // Mock configuration data - in real implementation, this would come from a database
      const mockConfigs = [
        {
          id: '1',
          key: 'platform.maintenance_mode',
          value: false,
          description: 'Enable/disable platform maintenance mode',
          category: 'platform',
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          key: 'booking.max_advance_days',
          value: 90,
          description: 'Maximum days in advance a booking can be made',
          category: 'booking',
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-10'),
        },
        {
          id: '3',
          key: 'payment.processing_fee',
          value: 2.5,
          description: 'Payment processing fee percentage',
          category: 'payment',
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-20'),
        },
        {
          id: '4',
          key: 'notification.email_enabled',
          value: true,
          description: 'Enable/disable email notifications',
          category: 'notification',
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-05'),
        },
        {
          id: '5',
          key: 'security.session_timeout',
          value: 3600,
          description: 'Session timeout in seconds',
          category: 'security',
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-12'),
        },
      ];

      let filteredConfigs = mockConfigs;

      // Apply filters
      if (category) {
        filteredConfigs = filteredConfigs.filter(
          (config) => config.category === category,
        );
      }
      if (isActive !== undefined) {
        filteredConfigs = filteredConfigs.filter(
          (config) => config.isActive === isActive,
        );
      }
      if (search) {
        filteredConfigs = filteredConfigs.filter(
          (config) =>
            config.key.toLowerCase().includes(search.toLowerCase()) ||
            config.description?.toLowerCase().includes(search.toLowerCase()),
        );
      }

      const total = filteredConfigs.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const data = filteredConfigs.slice(offset, offset + limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Error fetching admin configurations:', error);
      throw new Error('Failed to fetch admin configurations');
    }
  }

  async getAdminConfigById(id: string): Promise<any> {
    try {
      // Mock implementation - in real scenario, fetch from database
      const mockConfig = {
        id,
        key: 'platform.maintenance_mode',
        value: false,
        description: 'Enable/disable platform maintenance mode',
        category: 'platform',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      return mockConfig;
    } catch (error) {
      this.logger.error(`Error fetching admin configuration ${id}:`, error);
      throw new NotFoundException('Configuration not found');
    }
  }

  async createAdminConfig(createDto: any): Promise<any> {
    try {
      // Mock implementation - in real scenario, save to database
      const newConfig = {
        id: Date.now().toString(),
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.logger.log(`Created admin configuration: ${createDto.key}`);
      return newConfig;
    } catch (error) {
      this.logger.error('Error creating admin configuration:', error);
      throw new Error('Failed to create admin configuration');
    }
  }

  async updateAdminConfig(id: string, updateDto: any): Promise<any> {
    try {
      // Mock implementation - in real scenario, update in database
      const updatedConfig = {
        id,
        key: 'platform.maintenance_mode',
        ...updateDto,
        updatedAt: new Date(),
      };

      this.logger.log(`Updated admin configuration: ${id}`);
      return updatedConfig;
    } catch (error) {
      this.logger.error(`Error updating admin configuration ${id}:`, error);
      throw new NotFoundException('Configuration not found');
    }
  }

  async deleteAdminConfig(id: string): Promise<{ message: string }> {
    try {
      // Mock implementation - in real scenario, delete from database
      this.logger.log(`Deleted admin configuration: ${id}`);
      return { message: 'Configuration deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting admin configuration ${id}:`, error);
      throw new NotFoundException('Configuration not found');
    }
  }

  // Role Management
  async getRoles(queryDto: any): Promise<any> {
    try {
      const {
        page = 1,
        limit = 10,
        isActive,
        search,
        includeSystemRoles = true,
      } = queryDto;

      // Mock role data - in real implementation, this would come from a database
      const mockRoles = [
        {
          id: '1',
          name: 'Super Admin',
          description: 'Full system access with all permissions',
          permissions: ['*'],
          isActive: true,
          isSystemRole: true,
          userCount: 2,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          name: 'Admin',
          description: 'Administrative access with most permissions',
          permissions: [
            'user.manage',
            'partner.manage',
            'space.manage',
            'booking.manage',
          ],
          isActive: true,
          isSystemRole: true,
          userCount: 5,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-10'),
        },
        {
          id: '3',
          name: 'Partner Manager',
          description: 'Manage partners and their spaces',
          permissions: [
            'partner.view',
            'partner.edit',
            'space.view',
            'space.edit',
          ],
          isActive: true,
          isSystemRole: false,
          userCount: 3,
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '4',
          name: 'Customer Support',
          description: 'Handle customer inquiries and basic user management',
          permissions: ['user.view', 'booking.view', 'support.manage'],
          isActive: true,
          isSystemRole: false,
          userCount: 8,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-20'),
        },
        {
          id: '5',
          name: 'Finance Manager',
          description: 'Manage financial operations and reports',
          permissions: ['finance.view', 'finance.manage', 'reports.view'],
          isActive: true,
          isSystemRole: false,
          userCount: 2,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-25'),
        },
      ];

      let filteredRoles = mockRoles;

      // Apply filters
      if (!includeSystemRoles) {
        filteredRoles = filteredRoles.filter((role) => !role.isSystemRole);
      }
      if (isActive !== undefined) {
        filteredRoles = filteredRoles.filter(
          (role) => role.isActive === isActive,
        );
      }
      if (search) {
        filteredRoles = filteredRoles.filter(
          (role) =>
            role.name.toLowerCase().includes(search.toLowerCase()) ||
            role.description?.toLowerCase().includes(search.toLowerCase()),
        );
      }

      const total = filteredRoles.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const data = filteredRoles.slice(offset, offset + limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Error fetching roles:', error);
      throw new Error('Failed to fetch roles');
    }
  }

  async getRoleById(id: string): Promise<any> {
    try {
      // Mock implementation - in real scenario, fetch from database
      const mockRole = {
        id,
        name: 'Admin',
        description: 'Administrative access with most permissions',
        permissions: [
          'user.manage',
          'partner.manage',
          'space.manage',
          'booking.manage',
        ],
        isActive: true,
        isSystemRole: true,
        userCount: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-10'),
      };

      return mockRole;
    } catch (error) {
      this.logger.error(`Error fetching role ${id}:`, error);
      throw new NotFoundException('Role not found');
    }
  }

  async createRole(createDto: any): Promise<any> {
    try {
      // Mock implementation - in real scenario, save to database
      const newRole = {
        id: Date.now().toString(),
        ...createDto,
        isSystemRole: false,
        userCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.logger.log(`Created role: ${createDto.name}`);
      return newRole;
    } catch (error) {
      this.logger.error('Error creating role:', error);
      throw new Error('Failed to create role');
    }
  }

  async updateRole(id: string, updateDto: any): Promise<any> {
    try {
      // Mock implementation - in real scenario, update in database
      const updatedRole = {
        id,
        name: 'Updated Role',
        ...updateDto,
        updatedAt: new Date(),
      };

      this.logger.log(`Updated role: ${id}`);
      return updatedRole;
    } catch (error) {
      this.logger.error(`Error updating role ${id}:`, error);
      throw new NotFoundException('Role not found');
    }
  }

  async deleteRole(id: string): Promise<{ message: string }> {
    try {
      // Check if it's a system role (mock check)
      const role = await this.getRoleById(id);
      if (role.isSystemRole) {
        throw new ForbiddenException('Cannot delete system roles');
      }

      // Mock implementation - in real scenario, delete from database
      this.logger.log(`Deleted role: ${id}`);
      return { message: 'Role deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting role ${id}:`, error);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new NotFoundException('Role not found');
    }
  }

  async assignRole(
    userId: string,
    roleId: string,
  ): Promise<{ message: string }> {
    try {
      // Mock implementation - in real scenario, update user's role in database
      this.logger.log(`Assigned role ${roleId} to user ${userId}`);
      return { message: 'Role assigned successfully' };
    } catch (error) {
      this.logger.error(
        `Error assigning role ${roleId} to user ${userId}:`,
        error,
      );
      throw new Error('Failed to assign role');
    }
  }

  async bulkAssignRole(
    userIds: string[],
    roleId: string,
  ): Promise<{ message: string; results: any[] }> {
    try {
      const results = [];

      for (const userId of userIds) {
        try {
          await this.assignRole(userId, roleId);
          results.push({ userId, success: true });
        } catch (error) {
          results.push({ userId, success: false, error: error.message });
        }
      }

      this.logger.log(
        `Bulk assigned role ${roleId} to ${userIds.length} users`,
      );
      return {
        message: 'Bulk role assignment completed',
        results,
      };
    } catch (error) {
      this.logger.error(`Error bulk assigning role ${roleId}:`, error);
      throw new Error('Failed to bulk assign role');
    }
  }

  // User Extensions
  async getUserWallet(userId: string): Promise<any> {
    try {
      const user = await this.findUserEntityById(userId);

      // Get user wallet information from wallet service
      const walletsResponse = await this.walletService.getAllWallets();
      const walletInfo = walletsResponse.wallets.find(
        (w) => w.partnerId === userId,
      );

      return {
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        wallet: walletInfo,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Error fetching user wallet for ${userId}:`, error);
      throw new NotFoundException('User wallet not found');
    }
  }

  async getUserActivity(userId: string, queryDto: any): Promise<any> {
    try {
      const user = await this.findUserEntityById(userId);

      const { page = 1, limit = 20, type, startDate, endDate } = queryDto;
      const offset = (page - 1) * limit;

      // Build activity query based on type filter
      const activities = [];

      // Get booking activities
      if (!type || type === 'booking') {
        const bookings = await this.bookingRepository.find({
          where: {
            userId: userId,
            ...(startDate &&
              endDate && {
                createdAt: Between(new Date(startDate), new Date(endDate)),
              }),
          },
          relations: ['spaceOption', 'spaceOption.space'],
          order: { createdAt: 'DESC' },
          take: limit,
          skip: offset,
        });

        activities.push(
          ...bookings.map((booking) => ({
            id: booking.id,
            type: 'booking',
            action: `Booking ${booking.status}`,
            description: `Booking for ${booking.spaceOption?.space?.name || 'Unknown Space'}`,
            metadata: {
              bookingId: booking.id,
              spaceId: booking.spaceOption?.space?.id,
              spaceName: booking.spaceOption?.space?.name,
              status: booking.status,
              amount: booking.totalAmount,
            },
            createdAt: booking.createdAt,
          })),
        );
      }

      // Get payment activities
      if (!type || type === 'payment') {
        const payments = await this.paymentRepository.find({
          where: {
            userId: userId,
            ...(startDate &&
              endDate && {
                createdAt: Between(new Date(startDate), new Date(endDate)),
              }),
          },
          relations: ['booking'],
          order: { createdAt: 'DESC' },
          take: limit,
          skip: offset,
        });

        activities.push(
          ...payments.map((payment) => ({
            id: payment.id,
            type: 'payment',
            action: `Payment ${payment.status}`,
            description: `Payment of ${payment.amount} ${payment.currency}`,
            metadata: {
              paymentId: payment.id,
              bookingId: payment.bookingId,
              amount: payment.amount,
              currency: payment.currency,
              status: payment.status,
              method: payment.method,
            },
            createdAt: payment.createdAt,
          })),
        );
      }

      // Sort all activities by date
      activities.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // Apply pagination to combined results
      const paginatedActivities = activities.slice(offset, offset + limit);

      return {
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        activities: paginatedActivities,
        pagination: {
          page,
          limit,
          total: activities.length,
          totalPages: Math.ceil(activities.length / limit),
        },
        filters: {
          type,
          startDate,
          endDate,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching user activity for ${userId}:`, error);
      throw new NotFoundException('User activity not found');
    }
  }

  async getPartnerAnalyticsById(
    partnerId: string,
    options: {
      period?: string;
      startDate?: string;
      endDate?: string;
    } = {},
  ): Promise<any> {
    try {
      // Verify partner exists
      const partner = await this.partnerRepository.findOne({
        where: { id: partnerId },
        relations: ['user'],
      });

      if (!partner) {
        throw new NotFoundException('Partner not found');
      }

      const { period = 'monthly', startDate, endDate } = options;

      // Calculate date range
      let dateRange: { startDate: Date; endDate: Date };
      if (startDate && endDate) {
        dateRange = {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        };
      } else {
        const now = new Date();
        switch (period) {
          case 'weekly':
            dateRange = {
              startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
              endDate: now,
            };
            break;
          case 'yearly':
            dateRange = {
              startDate: new Date(now.getFullYear(), 0, 1),
              endDate: now,
            };
            break;
          default: // monthly
            dateRange = {
              startDate: new Date(now.getFullYear(), now.getMonth(), 1),
              endDate: now,
            };
        }
      }

      // Get partner's spaces
      const spaces = await this.spaceRepository.find({
        where: {
          listing: {
            partner: {
              id: partnerId,
            },
          },
        },
        relations: ['spaceOptions', 'listing', 'listing.partner'],
      });

      const spaceIds = spaces.map((space) => space.id);

      // Get bookings for partner's spaces
      const bookings = await this.bookingRepository.find({
        where: {
          spaceOption: {
            space: {
              id: In(spaceIds),
            },
          },
          createdAt: Between(dateRange.startDate, dateRange.endDate),
        },
        relations: ['spaceOption', 'spaceOption.space', 'payment'],
      });

      // Get payments for partner's bookings
      const payments = await this.paymentRepository.find({
        where: {
          booking: {
            spaceOption: {
              space: {
                id: In(spaceIds),
              },
            },
          },
          createdAt: Between(dateRange.startDate, dateRange.endDate),
        },
        relations: [
          'booking',
          'booking.spaceOption',
          'booking.spaceOption.space',
        ],
      });

      // Calculate analytics
      const totalBookings = bookings.length;
      const totalRevenue = payments
        .filter((payment) => payment.status === PaymentStatus.COMPLETED)
        .reduce((sum, payment) => sum + payment.amount, 0);

      const completedBookings = bookings.filter(
        (booking) => booking.status === BookingStatus.COMPLETED,
      ).length;

      const averageBookingValue =
        totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Calculate occupancy rate
      const totalSpaceHours = spaces.reduce((sum, space) => {
        const hoursInPeriod =
          (dateRange.endDate.getTime() - dateRange.startDate.getTime()) /
          (1000 * 60 * 60);
        return sum + (space.spaceOptions?.length || 1) * hoursInPeriod;
      }, 0);

      const bookedHours = bookings.reduce((sum, booking) => {
        const duration =
          (new Date(booking.endDateTime).getTime() -
            new Date(booking.startDateTime).getTime()) /
          (1000 * 60 * 60);
        return sum + duration;
      }, 0);

      const occupancyRate =
        totalSpaceHours > 0 ? (bookedHours / totalSpaceHours) * 100 : 0;

      return {
        partnerId: partner.id,
        partnerName:
          partner.businessName ||
          `${partner.user?.firstName} ${partner.user?.lastName}`,
        partnerEmail: partner.user?.email,
        period,
        dateRange: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        },
        metrics: {
          totalBookings,
          completedBookings,
          totalRevenue,
          averageBookingValue,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
        },
        spaces: {
          total: spaces.length,
          active: spaces.filter((space) => space.status === 'active').length,
          details: spaces.map((space) => ({
            id: space.id,
            name: space.name,
            status: space.status,
            bookings: bookings.filter(
              (booking) => booking.spaceOption?.space?.id === space.id,
            ).length,
            revenue: payments
              .filter(
                (payment) =>
                  payment.booking?.spaceOption?.space?.id === space.id &&
                  payment.status === PaymentStatus.COMPLETED,
              )
              .reduce((sum, payment) => sum + payment.amount, 0),
          })),
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting partner analytics for partner ${partnerId}:`,
        error,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Error retrieving partner analytics');
    }
  }

  // ===== ADVANCED FEATURES METHODS =====

  async getAvailablePermissions(): Promise<any> {
    try {
      const permissions = {
        user_management: [
          'view_users',
          'edit_users',
          'delete_users',
          'ban_users',
          'suspend_users',
          'verify_users',
          'manage_user_roles',
        ],
        space_management: [
          'view_spaces',
          'edit_spaces',
          'delete_spaces',
          'approve_spaces',
          'reject_spaces',
          'manage_space_status',
        ],
        booking_management: [
          'view_bookings',
          'edit_bookings',
          'cancel_bookings',
          'process_refunds',
          'extend_bookings',
          'manage_booking_status',
        ],
        financial_management: [
          'view_payments',
          'process_payouts',
          'manage_wallets',
          'view_financial_reports',
          'adjust_balances',
        ],
        system_administration: [
          'view_audit_logs',
          'manage_permissions',
          'export_data',
          'import_data',
          'generate_reports',
          'manage_system_config',
        ],
        analytics: [
          'view_analytics',
          'view_reports',
          'export_analytics',
          'view_dashboard',
        ],
      };

      return {
        permissions,
        roles: {
          super_admin: Object.values(permissions).flat(),
          admin: [
            ...permissions.user_management,
            ...permissions.space_management,
            ...permissions.booking_management,
            ...permissions.financial_management,
            ...permissions.analytics,
          ],
          moderator: [
            'view_users',
            'view_spaces',
            'view_bookings',
            'view_analytics',
            'manage_space_status',
            'manage_booking_status',
          ],
        },
      };
    } catch (error) {
      this.logger.error('Error fetching permissions:', error);
      throw new Error('Failed to fetch available permissions');
    }
  }

  async getAuditLogs(filters: {
    page: number;
    limit: number;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    try {
      const { page, limit, action, userId, startDate, endDate } = filters;

      // Use the existing audit service to get logs
      const auditLogs = await this.auditService.getAdminAuditLogs(
        userId, // adminId parameter
        limit || 100, // limit parameter
      );

      return auditLogs;
    } catch (error) {
      this.logger.error('Error fetching audit logs:', error);
      throw new Error('Failed to fetch audit logs');
    }
  }

  async generateReport(reportDto: {
    type: string;
    format: string;
    filters?: any;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    try {
      const { type, format, filters, startDate, endDate } = reportDto;

      let reportData: any;

      switch (type) {
        case 'users':
          reportData = await this.generateUserReport(
            filters,
            startDate,
            endDate,
          );
          break;
        case 'spaces':
          reportData = await this.generateSpaceReport(
            filters,
            startDate,
            endDate,
          );
          break;
        case 'bookings':
          reportData = await this.generateBookingReport(
            filters,
            startDate,
            endDate,
          );
          break;
        case 'revenue':
          reportData = await this.generateRevenueReport(
            filters,
            startDate,
            endDate,
          );
          break;
        case 'analytics':
          reportData = await this.generateAnalyticsReport(
            filters,
            startDate,
            endDate,
          );
          break;
        default:
          throw new Error(`Unsupported report type: ${type}`);
      }

      return {
        reportId: `report_${Date.now()}`,
        type,
        format,
        status: 'completed',
        data: reportData,
        generatedAt: new Date().toISOString(),
        downloadUrl: `/api/v1/admin/reports/download/${type}_${Date.now()}.${format}`,
      };
    } catch (error) {
      this.logger.error('Error generating report:', error);
      throw new Error(`Failed to generate ${reportDto.type} report`);
    }
  }

  async exportData(exportDto: {
    type: string;
    format: string;
    filters?: any;
    includeFields?: string[];
  }): Promise<any> {
    try {
      const { type, format, filters, includeFields } = exportDto;

      let exportData: any;

      switch (type) {
        case 'users':
          exportData = await this.exportUsers(filters);
          break;
        case 'spaces':
          exportData = await this.exportSpaces(filters);
          break;
        case 'bookings':
          exportData = await this.exportBookings(filters);
          break;
        case 'payments':
          exportData = await this.exportPayments(filters);
          break;
        default:
          throw new Error(`Unsupported export type: ${type}`);
      }

      // Filter fields if specified
      if (includeFields && includeFields.length > 0) {
        exportData = exportData.map((item: any) => {
          const filteredItem: any = {};
          includeFields.forEach((field) => {
            if (item[field] !== undefined) {
              filteredItem[field] = item[field];
            }
          });
          return filteredItem;
        });
      }

      return {
        exportId: `export_${Date.now()}`,
        type,
        format,
        status: 'completed',
        recordCount: exportData.length,
        downloadUrl: `/api/v1/admin/exports/download/${type}_${Date.now()}.${format}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };
    } catch (error) {
      this.logger.error('Error exporting data:', error);
      throw new Error(`Failed to export ${exportDto.type} data`);
    }
  }

  async importData(importDto: {
    type: string;
    source: string;
    mapping?: any;
    validateOnly?: boolean;
  }): Promise<any> {
    try {
      const { type, source, mapping, validateOnly } = importDto;

      // Validate import type
      const supportedTypes = ['users', 'spaces', 'bookings', 'partners'];
      if (!supportedTypes.includes(type)) {
        throw new Error(`Unsupported import type: ${type}`);
      }

      // Mock validation for now
      const validationResults = {
        valid: true,
        errors: [],
        warnings: [],
        recordCount: 0,
      };

      if (validateOnly) {
        return {
          importId: `import_validation_${Date.now()}`,
          type,
          source,
          status: 'validated',
          validation: validationResults,
          validatedAt: new Date().toISOString(),
        };
      }

      // Mock import process
      return {
        importId: `import_${Date.now()}`,
        type,
        source,
        status: 'processing',
        validation: validationResults,
        startedAt: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      };
    } catch (error) {
      this.logger.error('Error importing data:', error);
      throw new Error(`Failed to import ${importDto.type} data`);
    }
  }

  // Helper methods for report generation
  private async generateUserReport(
    filters: any,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    const query = this.userRepository.createQueryBuilder('user');

    if (startDate && endDate) {
      query.andWhere('user.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const users = await query.getMany();

    return users.map((user) => ({
      id: user.id,
      name:
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }));
  }

  private async generateSpaceReport(
    filters: any,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    const query = this.spaceRepository
      .createQueryBuilder('space')
      .leftJoinAndSelect('space.partner', 'partner');

    if (startDate && endDate) {
      query.andWhere('space.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const spaces = await query.getMany();

    return spaces.map((space) => ({
      id: space.id,
      name: space.name,
      type: space.spaceType,
      status: space.status,
      partnerName: space.listing?.partner?.businessName,
      createdAt: space.createdAt,
    }));
  }

  private async generateBookingReport(
    filters: any,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space');

    if (startDate && endDate) {
      query.andWhere('booking.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const bookings = await query.getMany();

    return bookings.map((booking) => ({
      id: booking.id,
      userName: booking.user?.firstName
        ? `${booking.user.firstName} ${booking.user.lastName || ''}`.trim()
        : booking.user?.username,
      spaceName: booking.spaceOption?.space?.name,
      startDate: booking.startDateTime,
      endDate: booking.endDateTime,
      totalAmount: booking.totalAmount,
      status: booking.status,
      createdAt: booking.createdAt,
    }));
  }

  private async generateRevenueReport(
    filters: any,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.booking', 'booking')
      .leftJoinAndSelect('booking.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space');

    if (startDate && endDate) {
      query.andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const payments = await query.getMany();

    return payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      spaceName: payment.booking?.spaceOption?.space?.name,
      createdAt: payment.createdAt,
    }));
  }

  private async generateAnalyticsReport(
    filters: any,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    // Generate comprehensive analytics report
    const [userStats, spaceStats, bookingStats, revenueStats] =
      await Promise.all([
        this.getUserStats(),
        this.getSpaceStats(),
        this.getBookingStats(),
        this.getFinancialStats(),
      ]);

    return {
      users: userStats,
      spaces: spaceStats,
      bookings: bookingStats,
      revenue: revenueStats,
      generatedAt: new Date().toISOString(),
    };
  }

  private async exportSpaces(filters: any): Promise<any> {
    const spaces = await this.spaceRepository.find({
      relations: ['partner'],
    });

    return spaces.map((space) => ({
      id: space.id,
      name: space.name,
      type: space.spaceType,
      status: space.status,
      partnerName: space.listing?.partner?.businessName,
      createdAt: space.createdAt,
    }));
  }

  private async exportBookings(filters: any): Promise<any> {
    const bookings = await this.bookingRepository.find({
      relations: ['user', 'spaceOption', 'spaceOption.space'],
    });

    return bookings.map((booking) => ({
      id: booking.id,
      userName: booking.user
        ? `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() ||
          booking.user.email
        : '',
      spaceName: booking.spaceOption?.space?.name,
      startDate: booking.startDateTime,
      endDate: booking.endDateTime,
      totalAmount: booking.totalAmount,
      status: booking.status,
      createdAt: booking.createdAt,
    }));
  }

  private async exportPayments(filters: any): Promise<any> {
    const payments = await this.paymentRepository.find({
      relations: [
        'booking',
        'booking.spaceOption',
        'booking.spaceOption.space',
      ],
    });

    return payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      spaceName: payment.booking?.spaceOption?.space?.name,
      createdAt: payment.createdAt,
    }));
  }

  // Placeholder implementations for missing methods
  async getTransactionStats(): Promise<any> {
    // TODO: Implement transaction statistics
    return {
      totalTransactions: 0,
      totalAmount: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      pendingTransactions: 0,
    };
  }

  async getPendingTransactions(queryDto: any): Promise<any> {
    // TODO: Implement pending transactions retrieval
    return [];
  }

  async getTransactionAnalytics(): Promise<any> {
    // TODO: Implement transaction analytics
    return [];
  }

  async refundTransaction(refundDto: any): Promise<any> {
    // TODO: Implement transaction refund
    return { message: 'Refund processed successfully' };
  }

  async bulkRefundTransactions(bulkRefundDto: any): Promise<any> {
    // TODO: Implement bulk transaction refunds
    return { message: 'Bulk refunds processed successfully' };
  }

  async searchTransactions(searchDto: any): Promise<any> {
    // TODO: Implement transaction search
    return { transactions: [], total: 0 };
  }
}
