import { UserEntity } from '@/auth/entities/user.entity';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { PartnerStatus, VerificationStatus } from '@/common/enums/partner.enum';
import { SpaceStatus } from '@/common/enums/space.enum';
import { ErrorResponseUtil } from '@/common/utils/error-response.util';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PartnerListingEntity } from '@/database/entities/partner-listing.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { paginate } from '@/utils/pagination/offset-pagination';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThanOrEqual, Repository } from 'typeorm';
import {
  BulkPartnerStatusUpdateDto,
  PartnerApprovalDto,
  PartnerBookingDto,
  PartnerDetailsDto,
  PartnerListItemDto,
  PartnerListResponseDto,
  PartnerQueryDto,
  PartnerRevenueAnalyticsDto,
  PartnerSpaceDto,
  PartnerStatsDto,
  UpdatePartnerDto,
  UpdatePartnerStatusDto,
} from './dto/partner-management.dto';

@Injectable()
export class AdminPartnerService {
  private readonly logger = new Logger(AdminPartnerService.name);

  constructor(
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SpaceEntity)
    private readonly spaceRepository: Repository<SpaceEntity>,
    @InjectRepository(PartnerListingEntity)
    private readonly partnerListingRepository: Repository<PartnerListingEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
  ) {}

  async findAllPartners(
    query: PartnerQueryDto,
  ): Promise<PartnerListResponseDto> {
    try {
      this.logger.log('Starting findAllPartners - simplified version');

      // Simple query without any filters for testing
      const partners = await this.partnerRepository.find({
        take: 10,
        order: { createdAt: 'DESC' },
      });

      this.logger.log(`Found ${partners.length} partners`);

      const response = {
        data: partners.map((partner) => ({
          id: partner.id,
          name: partner.businessName,
          email: '',
          companyName: partner.businessName,
          phone: '',
          status: partner.status,
          verificationStatus: partner.verificationStatus,
          city: '',
          area: '',
          spacesCount: 0,
          totalRevenue: 0,
          createdAt: partner.createdAt,
          lastActive: partner.updatedAt,
        })),
        total: partners.length,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      return response;
    } catch (error) {
      this.logger.error('Error in findAllPartners:', error);
      throw error;
    }
  }

  async findPartnerById(id: string): Promise<PartnerDetailsDto> {
    const partner = await this.partnerRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!partner) {
      throw ErrorResponseUtil.notFound('Partner', id);
    }

    return {
      id: partner.id,
      name: partner.businessName,
      email: partner.user?.email || '',
      companyName: partner.businessName,
      phone: '', // TODO: Add phone to PartnerEntity or get from user profile
      status: partner.status,
      verificationStatus: partner.verificationStatus,
      address: 'N/A', // TODO: Fix location access
      city: 'N/A', // TODO: Fix location access
      area: '', // TODO: Add area information
      postalCode: '', // TODO: Add postal code to PartnerLocationEntity
      businessLicense: '', // TODO: Add business license to PartnerEntity
      taxId: '', // TODO: Add tax ID to PartnerEntity
      businessDetails: partner.businessDetails || {},
      bankDetails: {}, // TODO: Add bank details when available
      kycDocuments: [], // TODO: Add KYC documents when available
      spacesCount: 0, // TODO: Calculate spaces count
      activeSpacesCount: 0, // TODO: Calculate active spaces count
      totalBookings: 0, // TODO: Calculate total bookings
      totalRevenue: 0, // TODO: Calculate total revenue
      monthlyRevenue: 0, // TODO: Calculate monthly revenue
      averageRating: 0, // TODO: Calculate average rating
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
      lastActive: partner.updatedAt,
    };
  }

  // Helper method to get partner entity (for internal use)
  private async getPartnerEntity(id: string): Promise<PartnerEntity> {
    const partner = await this.partnerRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!partner) {
      throw ErrorResponseUtil.notFound('Partner', id);
    }

    return partner;
  }

  async getPartnerStats(): Promise<PartnerStatsDto> {
    const [total, pending, active, suspended, rejected, verified] =
      await Promise.all([
        this.partnerRepository.count(),
        this.partnerRepository.count({
          where: { verificationStatus: VerificationStatus.PENDING },
        }),
        this.partnerRepository.count({
          where: { status: PartnerStatus.ACTIVE },
        }),
        this.partnerRepository.count({
          where: { status: PartnerStatus.SUSPENDED },
        }),
        this.partnerRepository.count({
          where: { verificationStatus: VerificationStatus.REJECTED },
        }),
        this.partnerRepository.count({
          where: { verificationStatus: VerificationStatus.VERIFIED },
        }),
      ]);

    // Get city distribution from partner locations
    const cityStats = await this.partnerRepository
      .createQueryBuilder('partner')
      .leftJoin('partner.locations', 'location')
      .leftJoin('location.city', 'city')
      .select('city.name', 'city')
      .addSelect('COUNT(DISTINCT partner.id)', 'count')
      .where('location.is_active = :isActive', { isActive: true })
      .andWhere('city.name IS NOT NULL')
      .groupBy('city.name')
      .getRawMany();

    const byLocation = cityStats.reduce(
      (acc, stat) => {
        acc[stat.city] = parseInt(stat.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calculate new partners this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await this.partnerRepository.count({
      where: {
        createdAt: MoreThanOrEqual(startOfMonth),
      },
    });

    // Calculate total revenue from all bookings (simplified)
    // TODO: Implement proper partner-specific revenue calculation when listing relationships are established
    const revenueResult = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.totalAmount)', 'totalRevenue')
      .where('booking.createdAt >= :startOfMonth', { startOfMonth })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ['confirmed', 'completed'],
      })
      .getRawOne();

    const revenueThisMonth = parseFloat(revenueResult?.totalRevenue || '0');

    // Calculate inactive partners (partners with INACTIVE status)
    const inactivePartners = await this.partnerRepository.count({
      where: { status: PartnerStatus.INACTIVE },
    });

    // Calculate pending verification partners
    const pendingVerificationPartners = await this.partnerRepository.count({
      where: { verificationStatus: VerificationStatus.PENDING },
    });

    // Calculate growth rate (compare with last month)
    const startOfLastMonth = new Date();
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    startOfLastMonth.setDate(1);
    startOfLastMonth.setHours(0, 0, 0, 0);

    const newLastMonth = await this.partnerRepository.count({
      where: {
        createdAt: Between(startOfLastMonth, startOfMonth),
      },
    });

    const growthRate =
      newLastMonth > 0
        ? ((newThisMonth - newLastMonth) / newLastMonth) * 100
        : 0;

    return {
      totalPartners: total,
      activePartners: active,
      inactivePartners,
      pendingPartners: pending,
      suspendedPartners: suspended,
      verifiedPartners: verified,
      pendingVerificationPartners,
      rejectedPartners: rejected,
      newPartnersThisMonth: newThisMonth,
      growthRate,
      averageRevenuePerPartner: total > 0 ? revenueThisMonth / total : 0,
      totalPartnerRevenue: revenueThisMonth,
      topPartners: [], // TODO: Get top performing partners
      // TODO: Add byStatus, byVerificationStatus, byLocation, and growth metrics
      // when they are added to PartnerStatsDto
    };
  }

  async updatePartner(
    id: string,
    updateData: UpdatePartnerDto,
  ): Promise<PartnerDetailsDto> {
    const partner = await this.getPartnerEntity(id);

    // Update basic information
    if (updateData.businessName) {
      partner.businessName = updateData.businessName;
    }

    if (updateData.businessDetails) {
      partner.businessDetails = {
        ...partner.businessDetails,
        ...updateData.businessDetails,
      };
    }

    // TODO: Update partner location through PartnerLocationEntity
    // if (updateData.address) {
    //   partner.address = {
    //     ...partner.address,
    //     ...updateData.address,
    //   };
    // }

    // Update user information if provided
    if (updateData.contactPerson || updateData.phone) {
      const user = partner.user;
      if (updateData.contactPerson) {
        const [firstName, ...lastNameParts] =
          updateData.contactPerson.split(' ');
        user.firstName = firstName;
        user.lastName = lastNameParts.join(' ');
      }
      if (updateData.phone) {
        // Note: UserEntity doesn't have phone field, skipping phone update
      }
      await this.userRepository.save(user);
    }

    const savedPartner = await this.partnerRepository.save(partner);
    return this.findPartnerById(savedPartner.id);
  }

  async updatePartnerStatus(
    id: string,
    updateData: UpdatePartnerStatusDto,
  ): Promise<PartnerDetailsDto> {
    const partner = await this.getPartnerEntity(id);

    partner.status = updateData.status as PartnerStatus;

    // Add admin notes to business details
    if (updateData.reason) {
      partner.businessDetails = {
        ...partner.businessDetails,
        adminNotes: updateData.reason,
      };
    }

    await this.partnerRepository.save(partner);
    return this.findPartnerById(partner.id);
  }

  async bulkUpdatePartnerStatus(
    bulkStatusDto: BulkPartnerStatusUpdateDto,
  ): Promise<{ message: string; updatedCount: number; failedIds: string[] }> {
    const { partnerIds, status, reason } = bulkStatusDto;
    const updatedPartners: string[] = [];
    const failedIds: string[] = [];

    for (const partnerId of partnerIds) {
      try {
        const partner = await this.partnerRepository.findOne({
          where: { id: partnerId },
        });

        if (!partner) {
          failedIds.push(partnerId);
          continue;
        }

        partner.status = status as PartnerStatus;

        // Add admin notes to business details
        if (reason) {
          partner.businessDetails = {
            ...partner.businessDetails,
            adminNotes: reason,
          };
        }

        await this.partnerRepository.save(partner);
        updatedPartners.push(partnerId);
      } catch (error) {
        this.logger.error(`Failed to update partner ${partnerId}:`, error);
        failedIds.push(partnerId);
      }
    }

    return {
      message: `Bulk partner status update completed. ${updatedPartners.length} partners updated successfully.`,
      updatedCount: updatedPartners.length,
      failedIds,
    };
  }

  async approvePartner(
    id: string,
    approvalData: PartnerApprovalDto,
  ): Promise<PartnerDetailsDto> {
    const partner = await this.getPartnerEntity(id);

    partner.verificationStatus = VerificationStatus.VERIFIED;
    partner.status = PartnerStatus.ACTIVE;

    // Add approval notes
    if (approvalData.notes) {
      partner.businessDetails = {
        ...partner.businessDetails,
        adminNotes: approvalData.notes,
      };
    }

    // TODO: Send approval email
    // TODO: Add to audit log

    await this.partnerRepository.save(partner);
    return this.findPartnerById(partner.id);
  }

  async rejectPartner(
    id: string,
    rejectionData: PartnerApprovalDto,
  ): Promise<PartnerDetailsDto> {
    const partner = await this.getPartnerEntity(id);

    partner.verificationStatus = VerificationStatus.REJECTED;
    partner.status = PartnerStatus.INACTIVE;

    // Add rejection reason to business details
    partner.businessDetails = {
      ...partner.businessDetails,
      rejectionReason: rejectionData.reason || 'No reason provided',
      adminNotes: rejectionData.notes,
    };

    // TODO: Send rejection email
    // TODO: Add to audit log

    await this.partnerRepository.save(partner);
    return this.findPartnerById(partner.id);
  }

  async getPartnerSpaces(id: string): Promise<PartnerSpaceDto[]> {
    const partner = await this.getPartnerEntity(id);

    const spaces = await this.spaceRepository
      .createQueryBuilder('space')
      .leftJoinAndSelect('space.bookings', 'booking')
      .leftJoinAndSelect('space.listing', 'listing')
      .leftJoinAndSelect('listing.location', 'location')
      .where('space.partnerId = :partnerId', { partnerId: id })
      .getMany();

    return spaces.map((space) => ({
      id: space.id,
      name: space.name,
      type: space.spaceType,
      status: space.status,
      capacity: space.totalCapacity || 0,
      pricePerHour: 0, // TODO: Get pricing from space options
      location: space.space_specific_location
        ? `${space.space_specific_location.building || ''}, ${space.space_specific_location.floor || ''}`
        : space.listing?.location?.address || 'N/A',
      totalBookings: space.totalBookings || 0,
      totalRevenue: 0, // TODO: Calculate revenue from bookings
      // space.bookings?.reduce(
      // (sum, booking) => sum + (booking.totalAmount || 0),
      // 0,
      // ) || 0,
      averageRating: 0, // TODO: Calculate from reviews when available
      createdAt: space.createdAt,
      updatedAt: space.updatedAt,
    }));
  }

  async getPartnerBookings(id: string): Promise<PartnerBookingDto[]> {
    const partner = await this.getPartnerEntity(id);

    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('space.listing', 'listing')
      .leftJoinAndSelect('listing.partner', 'partner')
      .leftJoinAndSelect('booking.user', 'user')
      .where('partner.id = :partnerId', { partnerId: id })
      .orderBy('booking.createdAt', 'DESC')
      .getMany();

    return bookings.map((booking) => ({
      id: booking.id,
      spaceName: booking.spaceOption?.space?.name || 'Unknown Space',
      customerName: booking.user
        ? `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() ||
          booking.user.username
        : 'Unknown Customer',
      customerEmail: booking.user?.email || 'Unknown Email',
      startDate: booking.startDateTime,
      endDate: booking.endDateTime,
      duration: booking.duration || 0,
      totalAmount: booking.totalAmount || 0,
      status: booking.status,
      paymentStatus: booking.payment?.status || 'pending',
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));
  }

  async getPartnerRevenue(
    id: string,
    period: string = '30d',
  ): Promise<PartnerRevenueAnalyticsDto> {
    const partner = await this.getPartnerEntity(id);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get all bookings for this partner
    const allBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.spaceOption', 'spaceOption')
      .leftJoin('spaceOption.space', 'space')
      .leftJoin('space.listing', 'listing')
      .leftJoin('listing.partner', 'partner')
      .where('partner.id = :partnerId', { partnerId: id })
      .andWhere('booking.status = :status', { status: 'confirmed' })
      .getMany();

    // Calculate revenue metrics
    const totalRevenue = allBookings.reduce(
      (sum, booking) => sum + (booking.totalAmount || 0),
      0,
    );

    const thisMonthBookings = allBookings.filter(
      (b) => b.createdAt >= startOfMonth,
    );
    const thisMonthRevenue = thisMonthBookings.reduce(
      (sum, booking) => sum + (booking.totalAmount || 0),
      0,
    );

    const lastMonthBookings = allBookings.filter(
      (b) => b.createdAt >= startOfLastMonth && b.createdAt <= endOfLastMonth,
    );
    const lastMonthRevenue = lastMonthBookings.reduce(
      (sum, booking) => sum + (booking.totalAmount || 0),
      0,
    );

    const thisYearRevenue = allBookings
      .filter((b) => b.createdAt >= startOfYear)
      .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    // Calculate growth percentages
    const monthlyGrowth =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    // Generate monthly revenue data for the last 12 months
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthBookings = allBookings.filter(
        (b) => b.createdAt >= monthStart && b.createdAt <= monthEnd,
      );

      monthlyData.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        revenue: monthBookings.reduce(
          (sum, booking) => sum + (booking.totalAmount || 0),
          0,
        ),
        bookings: monthBookings.length,
      });
    }

    return {
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      thisYearRevenue,
      monthlyGrowth,
      totalBookings: allBookings.length,
      thisMonthBookings: thisMonthBookings.length,
      averageBookingValue:
        allBookings.length > 0 ? totalRevenue / allBookings.length : 0,
      monthlyData,
    };
  }

  async requestDocuments(id: string, documentTypes: string[], message: string) {
    const partner = await this.findPartnerById(id);

    // TODO: Implement document request logic
    // This would typically involve:
    // 1. Creating a document request record
    // 2. Sending notification to partner
    // 3. Updating partner status if needed

    return {
      message: `Document request sent to partner ${partner.companyName}`,
      requestedDocuments: documentTypes,
      partnerNotified: true,
    };
  }

  async getPartnerDocuments(id: string) {
    const partner = await this.findPartnerById(id);

    // TODO: Implement document retrieval
    // This would typically fetch from a documents table
    // For now, return mock structure

    return {
      partnerId: id,
      documents: [
        {
          id: 'doc-1',
          type: 'business_license',
          url: '/documents/business-license.pdf',
          status: 'pending',
          uploadedAt: new Date(),
        },
        {
          id: 'doc-2',
          type: 'tax_certificate',
          url: '/documents/tax-certificate.pdf',
          status: 'approved',
          uploadedAt: new Date(),
        },
      ],
    };
  }

  async reviewDocument(
    partnerId: string,
    documentId: string,
    status: 'approved' | 'rejected',
    notes?: string,
  ) {
    const partner = await this.findPartnerById(partnerId);

    // TODO: Implement document review logic
    // This would typically:
    // 1. Update document status in documents table
    // 2. Check if all required documents are approved
    // 3. Update partner verification status accordingly

    return {
      documentId,
      status,
      notes,
      reviewedAt: new Date(),
      partnerId,
    };
  }

  async updateSubscription(
    id: string,
    subscriptionData: any,
  ): Promise<PartnerEntity> {
    const partner = await this.getPartnerEntity(id);

    // TODO: Implement subscription logic
    // For now, store in business details
    partner.businessDetails = {
      ...partner.businessDetails,
      subscription: subscriptionData,
    };

    return this.partnerRepository.save(partner);
  }

  async suspendPartner(
    id: string,
    reason: string,
    duration?: number,
  ): Promise<PartnerEntity> {
    const partner = await this.getPartnerEntity(id);

    partner.status = PartnerStatus.SUSPENDED;

    const suspensionData: any = {
      reason,
      suspendedAt: new Date(),
    };

    if (duration) {
      const suspensionEnd = new Date();
      suspensionEnd.setDate(suspensionEnd.getDate() + duration);
      suspensionData.suspensionEnd = suspensionEnd;
    }

    partner.businessDetails = {
      ...partner.businessDetails,
      suspension: suspensionData,
    };

    return this.partnerRepository.save(partner);
  }

  async reactivatePartner(id: string, notes?: string): Promise<PartnerEntity> {
    const partner = await this.getPartnerEntity(id);

    partner.status = PartnerStatus.ACTIVE;

    partner.businessDetails = {
      ...partner.businessDetails,
      reactivatedAt: new Date(),
      reactivationNotes: notes,
      suspension: null, // Clear suspension data
    };

    return this.partnerRepository.save(partner);
  }

  async deletePartner(
    id: string,
  ): Promise<{ message: string; deletedAt: Date }> {
    const partner = await this.getPartnerEntity(id);

    // Soft delete
    partner.status = PartnerStatus.INACTIVE;
    partner.deletedAt = new Date();

    await this.partnerRepository.save(partner);

    return {
      message: `Partner ${partner.businessName} has been deleted`,
      deletedAt: partner.deletedAt,
    };
  }

  async exportPartners(filters: any) {
    // TODO: Implement export functionality
    // This would typically:
    // 1. Apply filters to get partner data
    // 2. Generate CSV/Excel file
    // 3. Upload to cloud storage
    // 4. Return download URL

    return {
      downloadUrl: '/exports/partners-export.csv',
      generatedAt: new Date(),
      recordCount: 0,
    };
  }

  async sendNotification(
    id: string,
    type: 'email' | 'sms' | 'push',
    subject: string,
    message: string,
  ) {
    const partner = await this.getPartnerEntity(id);

    // TODO: Implement notification sending
    // This would typically integrate with notification service

    return {
      message: `${type} notification sent to ${partner.businessName}`,
      sentAt: new Date(),
      type,
      subject,
    };
  }

  async bulkUpdateStatus(partnerIds: string[], status: string, notes?: string) {
    const partners = await this.partnerRepository.findByIds(partnerIds);

    const updatePromises = partners.map((partner) => {
      partner.status = status as PartnerStatus;
      if (notes) {
        partner.businessDetails = {
          ...partner.businessDetails,
          adminNotes: notes,
        };
      }
      return this.partnerRepository.save(partner);
    });

    try {
      await Promise.all(updatePromises);
      return {
        updated: partners.length,
        failed: [],
      };
    } catch (error) {
      return {
        updated: 0,
        failed: partnerIds,
        error: error.message,
      };
    }
  }

  async bulkSendNotification(
    partnerIds: string[],
    type: 'email' | 'sms' | 'push',
    subject: string,
    message: string,
  ) {
    const partners = await this.partnerRepository.findByIds(partnerIds);

    // TODO: Implement bulk notification sending
    // This would typically:
    // 1. Queue notifications for each partner
    // 2. Process them asynchronously
    // 3. Track success/failure rates

    return {
      sent: partners.length,
      failed: [],
      type,
      sentAt: new Date(),
    };
  }

  async getPendingPartners(): Promise<any> {
    const pendingPartners = await this.partnerRepository.find({
      where: {
        verificationStatus: VerificationStatus.PENDING,
      },
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      partners: pendingPartners.map((partner) => ({
        id: partner.id,
        businessName: partner.businessName,
        email: partner.user?.email,
        status: partner.status,
        verificationStatus: partner.verificationStatus,
        submittedAt: partner.createdAt,
        businessDetails: partner.businessDetails,
      })),
      total: pendingPartners.length,
    };
  }

  async getPartnerStatistics(): Promise<any> {
    const totalPartners = await this.partnerRepository.count();
    const activePartners = await this.partnerRepository.count({
      where: { status: PartnerStatus.ACTIVE },
    });
    const pendingPartners = await this.partnerRepository.count({
      where: { verificationStatus: VerificationStatus.PENDING },
    });
    const suspendedPartners = await this.partnerRepository.count({
      where: { status: PartnerStatus.SUSPENDED },
    });
    const verifiedPartners = await this.partnerRepository.count({
      where: { verificationStatus: VerificationStatus.VERIFIED },
    });

    // Get partners registered in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPartners = await this.partnerRepository.count({
      where: {
        createdAt: MoreThanOrEqual(thirtyDaysAgo),
      },
    });

    // Calculate total spaces and revenue
    const totalSpaces = await this.spaceRepository.count();
    const totalBookings = await this.bookingRepository.count();

    return {
      totalPartners,
      activePartners,
      pendingPartners,
      suspendedPartners,
      verifiedPartners,
      recentPartners,
      totalSpaces,
      totalBookings,
      verificationRate:
        totalPartners > 0 ? (verifiedPartners / totalPartners) * 100 : 0,
      activationRate:
        totalPartners > 0 ? (activePartners / totalPartners) * 100 : 0,
    };
  }
}
