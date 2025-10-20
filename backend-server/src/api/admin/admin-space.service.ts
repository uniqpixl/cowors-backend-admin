import { SpaceStatus } from '@/common/enums/space.enum';
import { BookingEntity } from '@/database/entities/booking.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';

@Injectable()
export class AdminSpaceService {
  constructor(
    @InjectRepository(SpaceEntity)
    private readonly spaceRepository: Repository<SpaceEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
  ) {}

  async getPendingSpaces(): Promise<any> {
    try {
      // Use DRAFT status as pending since PENDING doesn't exist in enum
      const pendingSpaces = await this.spaceRepository.find({
        where: {
          status: SpaceStatus.DRAFT,
        },
        relations: ['listing', 'listing.partner', 'listing.partner.user'],
        order: {
          createdAt: 'DESC',
        },
      });

      return {
        spaces: pendingSpaces.map((space) => ({
          id: space.id,
          name: space.name,
          description: space.description,
          status: space.status,
          partnerName: space.listing?.partner?.businessName || 'Unknown',
          partnerEmail: space.listing?.partner?.user?.email || 'Unknown',
          location: space.listing?.location?.address || 'Unknown',
          submittedAt: space.createdAt,
          capacity: space.totalCapacity || 0,
          hourlyRate: 0, // Price is handled at space option level
        })),
        total: pendingSpaces.length,
      };
    } catch (error) {
      console.error('Error in getPendingSpaces:', error);
      return {
        spaces: [],
        total: 0,
      };
    }
  }

  async getSpaceStatistics(): Promise<any> {
    try {
      const totalSpaces = await this.spaceRepository.count();
      const activeSpaces = await this.spaceRepository.count({
        where: { status: SpaceStatus.ACTIVE },
      });
      const pendingSpaces = await this.spaceRepository.count({
        where: { status: SpaceStatus.DRAFT }, // Use DRAFT instead of PENDING
      });
      const suspendedSpaces = await this.spaceRepository.count({
        where: { status: SpaceStatus.SUSPENDED },
      });
      const inactiveSpaces = await this.spaceRepository.count({
        where: { status: SpaceStatus.INACTIVE },
      });

      // Get spaces created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSpaces = await this.spaceRepository.count({
        where: {
          createdAt: MoreThanOrEqual(thirtyDaysAgo),
        },
      });

      // Calculate total bookings for all spaces
      const totalBookings = await this.bookingRepository.count();

      // Calculate average occupancy rate
      const spacesWithBookings = await this.spaceRepository
        .createQueryBuilder('space')
        .leftJoin('space.spaceOptions', 'spaceOption')
        .leftJoin('spaceOption.bookings', 'booking')
        .select('COUNT(DISTINCT booking.id)', 'bookingCount')
        .addSelect('COUNT(DISTINCT space.id)', 'spaceCount')
        .getRawOne();

      const averageBookingsPerSpace =
        spacesWithBookings.spaceCount > 0
          ? spacesWithBookings.bookingCount / spacesWithBookings.spaceCount
          : 0;

      return {
        totalSpaces,
        activeSpaces,
        pendingSpaces,
        suspendedSpaces,
        inactiveSpaces,
        recentSpaces,
        totalBookings,
        averageBookingsPerSpace:
          Math.round(averageBookingsPerSpace * 100) / 100,
        activationRate:
          totalSpaces > 0 ? (activeSpaces / totalSpaces) * 100 : 0,
        utilizationRate:
          totalSpaces > 0 ? (averageBookingsPerSpace / totalSpaces) * 100 : 0,
        pendingApprovalRate:
          totalSpaces > 0 ? (pendingSpaces / totalSpaces) * 100 : 0,
      };
    } catch (error) {
      console.error('Error in getSpaceStatistics:', error);
      return {
        totalSpaces: 0,
        activeSpaces: 0,
        pendingSpaces: 0,
        suspendedSpaces: 0,
        inactiveSpaces: 0,
        recentSpaces: 0,
        totalBookings: 0,
        averageBookingsPerSpace: 0,
        activationRate: 0,
        utilizationRate: 0,
        pendingApprovalRate: 0,
      };
    }
  }
}
