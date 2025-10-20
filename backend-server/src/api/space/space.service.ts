import { UserSession } from '@/auth/auth.type';
import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { BookingStatus } from '@/common/enums/booking.enum';
import { PartnerStatus } from '@/common/enums/partner.enum';
import { BookingModel, SpaceStatus } from '@/common/enums/space.enum';
import { Uuid } from '@/common/types/common.type';
import {
  ErrorCodes,
  ErrorResponseUtil,
} from '@/common/utils/error-response.util';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildPaginator } from 'typeorm-cursor-pagination';
import { SearchSpaceDto } from './dto/search-space.dto';
import { LaunchStatus } from '@/database/entities/city.entity';
import {
  CreateSpaceDto,
  QuerySpacesCursorDto,
  QuerySpacesOffsetDto,
  UpdateSpaceDto,
} from './space.dto';

@Injectable()
export class SpaceService {
  constructor(
    @InjectRepository(SpaceEntity)
    private readonly spaceRepository: Repository<SpaceEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
  ) {}

  async getPartnerByUserId(userId: Uuid): Promise<PartnerEntity> {
    const partner = await this.partnerRepository.findOne({ where: { userId } });
    if (!partner) {
      throw ErrorResponseUtil.notFound('Partner', userId);
    }
    return partner;
  }

  async createSpace(
    partnerId: string,
    createSpaceDto: CreateSpaceDto,
  ): Promise<SpaceEntity> {
    const partner = await this.partnerRepository.findOne({
      where: { id: partnerId },
    });
    if (!partner) {
      throw ErrorResponseUtil.notFound('Partner', partnerId);
    }

    const space = this.spaceRepository.create({
      listing_id: partner.id, // This should be the listing ID, not partner ID
      name: createSpaceDto.name,
      description: createSpaceDto.description,
      spaceType: createSpaceDto.spaceType,
      totalCapacity: createSpaceDto.capacity,
      commonAmenities: createSpaceDto.amenities,
      space_specific_location: {
        floor: createSpaceDto.location?.floor,
        access_instructions: createSpaceDto.location?.area,
      },
      operatingHours: createSpaceDto.availabilityRules?.operatingHours || {},
      spacePolicies: {
        cancellationPolicy:
          createSpaceDto.availabilityRules?.cancellationPolicy,
        advanceBookingDays:
          createSpaceDto.availabilityRules?.advanceBookingDays,
      },
      metadata: createSpaceDto.metadata || {},
      images: createSpaceDto.images || [],
      status: SpaceStatus.DRAFT,
    });

    return this.spaceRepository.save(space);
  }

  async getSpaceCount(): Promise<number> {
    try {
      console.log('Getting space count from database...');
      const count = await this.spaceRepository.count();
      console.log('Space count retrieved:', count);
      return count;
    } catch (error) {
      console.error('Error getting space count:', error);
      throw error;
    }
  }

  async findAllSpaces(
    queryDto: QuerySpacesOffsetDto,
    user?: UserSession,
  ): Promise<OffsetPaginatedDto<SpaceEntity>> {
    try {
      console.log('Starting findAllSpaces with queryDto:', queryDto);
      // Simplified query without complex joins for debugging
      const queryBuilder = this.spaceRepository
        .createQueryBuilder('space')
        .where('space.status = :status', { status: SpaceStatus.ACTIVE });

      console.log('Query builder created successfully');

      // Apply filters (simplified for debugging)
      if (queryDto.spaceType) {
        queryBuilder.andWhere('space.spaceType = :spaceType', {
          spaceType: queryDto.spaceType,
        });
      }

      // Temporarily disabled price and location filters as these fields don't exist in SpaceEntity
      // TODO: Implement proper price filtering through SpaceOptionEntity
      // TODO: Implement proper location filtering through PartnerListingEntity

      if (queryDto.amenities && queryDto.amenities.length > 0) {
        queryBuilder.andWhere('space.commonAmenities @> :amenities', {
          amenities: JSON.stringify(queryDto.amenities),
        });
      }

      // Apply search
      if (queryDto.q) {
        queryBuilder.andWhere(
          '(space.name ILIKE :search OR space.description ILIKE :search)',
          { search: `%${queryDto.q}%` },
        );
      }

      // Apply sorting
      queryBuilder.orderBy('space.createdAt', 'DESC');

      console.log(
        'Executing query with offset:',
        queryDto.offset,
        'limit:',
        queryDto.limit,
      );
      const [data, total] = await queryBuilder
        .skip(queryDto.offset)
        .take(queryDto.limit)
        .getManyAndCount();

      console.log(
        'Query executed successfully. Found',
        total,
        'total records, returning',
        data.length,
        'records',
      );
      const pagination = new OffsetPaginationDto(total, queryDto);

      return new OffsetPaginatedDto(data, pagination);
    } catch (error) {
      console.error('Error in findAllSpaces:', error);
      throw error;
    }
  }

  async findAllSpacesCursor(
    queryDto: QuerySpacesCursorDto,
  ): Promise<CursorPaginatedDto<SpaceEntity>> {
    // Simplified query without complex joins for debugging
    const queryBuilder = this.spaceRepository
      .createQueryBuilder('space')
      .where('space.status = :status', { status: SpaceStatus.ACTIVE });

    // Apply filters (similar to offset pagination)
    if (queryDto.spaceType) {
      queryBuilder.andWhere('space.spaceType = :spaceType', {
        spaceType: queryDto.spaceType,
      });
    }

    if (queryDto.q) {
      queryBuilder.andWhere(
        '(space.name ILIKE :search OR space.description ILIKE :search)',
        { search: `%${queryDto.q}%` },
      );
    }

    const paginator = buildPaginator({
      entity: SpaceEntity,
      paginationKeys: ['id'],
      query: {
        limit: queryDto.limit || 10,
        order: 'ASC',
      },
    });

    const result = await paginator.paginate(queryBuilder);

    const pagination = {
      limit: queryDto.limit,
      afterCursor: result.cursor.afterCursor || '',
      beforeCursor: result.cursor.beforeCursor || '',
      totalRecords: result.data.length,
    } as CursorPaginationDto;

    return new CursorPaginatedDto(result.data, pagination);
  }

  async findOneSpace(id: Uuid): Promise<SpaceEntity> {
    const space = await this.spaceRepository.findOne({
      where: { id },
      relations: ['listing', 'listing.partner', 'listing.location'],
    });

    if (!space) {
      throw ErrorResponseUtil.notFound('Space', id);
    }

    return space;
  }

  async findSpacesByUserId(
    userId: Uuid,
    queryDto: QuerySpacesOffsetDto,
    user: UserSession,
  ): Promise<OffsetPaginatedDto<SpaceEntity>> {
    const partner = await this.partnerRepository.findOne({
      where: { userId },
    });

    if (!partner) {
      throw ErrorResponseUtil.notFound('Partner', userId);
    }

    const [data, total] = await this.spaceRepository
      .createQueryBuilder('space')
      .leftJoinAndSelect('space.listing', 'listing')
      .leftJoinAndSelect('listing.partner', 'partner')
      .leftJoinAndSelect('listing.location', 'location')
      .where('listing.partner.id = :partnerId', { partnerId: partner.id })
      .skip(queryDto.offset)
      .take(queryDto.limit)
      .getManyAndCount();

    const pagination = new OffsetPaginationDto(total, queryDto);
    return new OffsetPaginatedDto(data, pagination);
  }

  async updateSpace(
    id: Uuid,
    updateSpaceDto: UpdateSpaceDto,
    user: UserSession,
  ): Promise<SpaceEntity> {
    const space = await this.findOneSpace(id);

    // Check if user owns this space
    const partner = await this.partnerRepository.findOne({
      where: { userId: user.user.id },
    });

    if (!partner || space.listing?.partner?.id !== partner.id) {
      throw ErrorResponseUtil.forbidden(
        'You can only update your own spaces',
        ErrorCodes.FORBIDDEN,
      );
    }

    Object.assign(space, updateSpaceDto);
    return this.spaceRepository.save(space);
  }

  async deleteSpace(id: Uuid, user: UserSession): Promise<void> {
    const space = await this.findOneSpace(id);

    // Check if user owns this space
    const partner = await this.partnerRepository.findOne({
      where: { userId: user.user.id },
    });

    if (!partner || space.listing?.partner?.id !== partner.id) {
      throw ErrorResponseUtil.forbidden(
        'You can only delete your own spaces',
        ErrorCodes.FORBIDDEN,
      );
    }

    // Check if space has active bookings
    const activeBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoin('booking.spaceOption', 'spaceOption')
      .where('spaceOption.spaceId = :spaceId', { spaceId: id })
      .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .getCount();

    if (activeBookings > 0) {
      throw ErrorResponseUtil.conflict(
        'Cannot delete space with active bookings',
        ErrorCodes.RESOURCE_CONFLICT,
      );
    }

    await this.spaceRepository.remove(space);
  }

  async checkAvailability(
    spaceId: Uuid,
    date: Date,
    startTime?: string,
    endTime?: string,
  ): Promise<{
    available: boolean;
    conflictingBookingIds?: string[];
    availableSlots?: string[];
  }> {
    const space = await this.findOneSpace(spaceId);

    if (space.status !== SpaceStatus.ACTIVE) {
      return { available: false };
    }

    // If no time specified, check general availability for the day
    if (!startTime || !endTime) {
      const dayBookings = await this.bookingRepository
        .createQueryBuilder('booking')
        .innerJoin('booking.spaceOption', 'spaceOption')
        .where('spaceOption.spaceId = :spaceId', { spaceId })
        .andWhere('booking.status = :status', {
          status: BookingStatus.CONFIRMED,
        })
        .getMany();

      const conflictingBookings = dayBookings.filter((booking) => {
        const bookingDate = new Date(booking.startDateTime).toDateString();
        return bookingDate === date.toDateString();
      });

      return {
        available: conflictingBookings.length === 0,
        conflictingBookingIds: conflictingBookings.map((booking) => booking.id),
      };
    }

    // Check specific time slot
    const requestedStart = new Date(`${date.toDateString()} ${startTime}`);
    const requestedEnd = new Date(`${date.toDateString()} ${endTime}`);

    const conflictingBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoin('booking.spaceOption', 'spaceOption')
      .where('spaceOption.spaceId = :spaceId', { spaceId })
      .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .andWhere(
        '(booking.startDateTime < :endTime AND booking.endDateTime > :startTime)',
        {
          startTime: requestedStart,
          endTime: requestedEnd,
        },
      )
      .getMany();

    return {
      available: conflictingBookings.length === 0,
      conflictingBookingIds: conflictingBookings.map((booking) => booking.id),
    };
  }

  async updateSpaceStatus(
    spaceId: Uuid,
    status: SpaceStatus,
    user: UserSession,
  ): Promise<SpaceEntity> {
    const space = await this.findOneSpace(spaceId);

    // Check if user owns this space
    const partner = await this.partnerRepository.findOne({
      where: { userId: user.user.id },
    });

    if (!partner || space.listing?.partner?.id !== partner.id) {
      throw ErrorResponseUtil.forbidden(
        'You can only update your own spaces',
        ErrorCodes.FORBIDDEN,
      );
    }

    space.status = status;
    return this.spaceRepository.save(space);
  }

  async searchSpaces(
    searchDto: SearchSpaceDto,
  ): Promise<OffsetPaginatedDto<SpaceEntity>> {
    const queryBuilder = this.spaceRepository
      .createQueryBuilder('space')
      .leftJoinAndSelect('space.listing', 'listing')
      .leftJoinAndSelect('listing.partner', 'partner')
      .leftJoinAndSelect('listing.location', 'location')
      .leftJoinAndSelect('location.city', 'city')
      .where('space.status = :status', {
        status: searchDto.status || SpaceStatus.ACTIVE,
      })
      .andWhere('listing.is_active = :listingActive', { listingActive: true })
      .andWhere('listing.approval_status = :approvalStatus', {
        approvalStatus: 'approved',
      });

    // Only show spaces in ACTIVE cities
    queryBuilder.andWhere('city.launch_status = :activeStatus', {
      activeStatus: LaunchStatus.ACTIVE,
    });

    // Text search
    if (searchDto.query) {
      queryBuilder.andWhere(
        '(space.name ILIKE :search OR space.description ILIKE :search)',
        { search: `%${searchDto.query}%` },
      );
    }

    // Location filters (canonical via PartnerLocationEntity -> CityEntity)
    if (searchDto.cityId) {
      queryBuilder.andWhere('city.id = :cityId', { cityId: searchDto.cityId });
    }

    if (searchDto.city) {
      queryBuilder.andWhere('city.name ILIKE :city', {
        city: `%${searchDto.city}%`,
      });
    }

    if (searchDto.state) {
      queryBuilder.andWhere('city.state ILIKE :state', {
        state: `%${searchDto.state}%`,
      });
    }

    // Country is not modeled in CityEntity; keep legacy JSON filter for backward compatibility
    if (searchDto.country) {
      queryBuilder.andWhere('space.location->>"country" ILIKE :country', {
        country: `%${searchDto.country}%`,
      });
    }

    // Proximity search (use canonical PartnerLocation coordinates)
    if (searchDto.latitude && searchDto.longitude && searchDto.radius) {
      queryBuilder.andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(CAST(location.latitude AS DOUBLE PRECISION)))
            * cos(radians(CAST(location.longitude AS DOUBLE PRECISION)) - radians(:lng))
            + sin(radians(:lat)) * sin(radians(CAST(location.latitude AS DOUBLE PRECISION)))
          )
        ) <= :radius`,
        {
          lat: searchDto.latitude,
          lng: searchDto.longitude,
          radius: searchDto.radius,
        },
      );
    }

    // Space type filters
    if (searchDto.spaceTypes && searchDto.spaceTypes.length > 0) {
      queryBuilder.andWhere('space.spaceType IN (:...spaceTypes)', {
        spaceTypes: searchDto.spaceTypes,
      });
    }

    // Booking status filters
    if (searchDto.bookingStatuses && searchDto.bookingStatuses.length > 0) {
      queryBuilder.andWhere('space.bookingStatus IN (:...bookingStatuses)', {
        bookingStatuses: searchDto.bookingStatuses,
      });
    }

    // Capacity filters
    if (searchDto.minCapacity) {
      queryBuilder.andWhere('space.capacity >= :minCapacity', {
        minCapacity: searchDto.minCapacity,
      });
    }

    if (searchDto.maxCapacity) {
      queryBuilder.andWhere('space.capacity <= :maxCapacity', {
        maxCapacity: searchDto.maxCapacity,
      });
    }

    // Price filters
    if (searchDto.minPrice !== undefined) {
      queryBuilder.andWhere(
        'CAST(space.pricing->>"hourly" AS FLOAT) >= :minPrice',
        {
          minPrice: searchDto.minPrice,
        },
      );
    }

    if (searchDto.maxPrice !== undefined) {
      queryBuilder.andWhere(
        'CAST(space.pricing->>"hourly" AS FLOAT) <= :maxPrice',
        {
          maxPrice: searchDto.maxPrice,
        },
      );
    }

    // Amenities filter
    if (searchDto.amenities && searchDto.amenities.length > 0) {
      for (const amenity of searchDto.amenities) {
        queryBuilder.andWhere('space.amenities @> :amenity', {
          amenity: JSON.stringify([amenity]),
        });
      }
    }

    // Rating filter
    if (searchDto.minRating) {
      queryBuilder.andWhere('space.rating >= :minRating', {
        minRating: searchDto.minRating,
      });
    }

    // Instant booking filter
    if (searchDto.instantBooking !== undefined) {
      queryBuilder.andWhere(
        'space.availabilityRules->>"instantBooking" = :instantBooking',
        {
          instantBooking: searchDto.instantBooking.toString(),
        },
      );
    }

    // Availability filters
    if (searchDto.checkInDate && searchDto.checkOutDate) {
      const subQuery = this.bookingRepository
        .createQueryBuilder('booking')
        .innerJoin('booking.spaceOption', 'spaceOption')
        .select('spaceOption.spaceId')
        .where('booking.status = :bookingStatus', {
          bookingStatus: BookingStatus.CONFIRMED,
        })
        .andWhere(
          '(booking.startDateTime < :checkOut AND booking.endDateTime > :checkIn)',
          {
            checkIn: searchDto.checkInDate,
            checkOut: searchDto.checkOutDate,
          },
        );

      queryBuilder.andWhere(`space.id NOT IN (${subQuery.getQuery()})`);
      queryBuilder.setParameters(subQuery.getParameters());
    }

    // Sorting
    switch (searchDto.sortBy) {
      case 'name':
        queryBuilder.orderBy('space.name', searchDto.sortOrder);
        break;
      case 'rating':
        queryBuilder.orderBy('space.rating', searchDto.sortOrder);
        break;
      case 'price':
        queryBuilder.orderBy(
          'CAST(space.pricing->>"hourly" AS FLOAT)',
          searchDto.sortOrder,
        );
        break;
      case 'distance':
        if (searchDto.latitude && searchDto.longitude) {
          queryBuilder.orderBy(
            `(
              6371 * acos(
                cos(radians(${searchDto.latitude})) * cos(radians(CAST(space.location->>'latitude' AS FLOAT)))
                * cos(radians(CAST(space.location->>'longitude' AS FLOAT)) - radians(${searchDto.longitude}))
                + sin(radians(${searchDto.latitude})) * sin(radians(CAST(space.location->>'latitude' AS FLOAT)))
              )
            )`,
            searchDto.sortOrder,
          );
        } else {
          queryBuilder.orderBy('space.createdAt', 'DESC');
        }
        break;
      default:
        queryBuilder.orderBy('space.createdAt', searchDto.sortOrder);
    }

    // Pagination
    const offset = (searchDto.page - 1) * searchDto.limit;
    const [data, total] = await queryBuilder
      .skip(offset)
      .take(searchDto.limit)
      .getManyAndCount();

    const pagination = new OffsetPaginationDto(total, {
      offset,
      limit: searchDto.limit,
    });

    return new OffsetPaginatedDto(data, pagination);
  }
}
