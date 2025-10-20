import { ReviewType } from '@/common/enums/review.enum';
import {
  ErrorCodes,
  ErrorResponseUtil,
} from '@/common/utils/error-response.util';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BookingStatus } from '../../common/enums/booking.enum';
import { BookingEntity } from '../../database/entities/booking.entity';
import { PartnerEntity } from '../../database/entities/partner.entity';
import { ReviewEntity } from '../../database/entities/review.entity';
import { SpaceEntity } from '../../database/entities/space.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ReviewEntity)
    private reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(SpaceEntity)
    private spaceRepository: Repository<SpaceEntity>,
    @InjectRepository(PartnerEntity)
    private partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
  ) {}

  async create(
    createReviewDto: CreateReviewDto,
    userId: string,
  ): Promise<ReviewEntity> {
    const { type, spaceId, partnerId, bookingId, ...reviewData } =
      createReviewDto;

    // Validate required fields based on review type
    if (type === ReviewType.SPACE && !spaceId) {
      throw ErrorResponseUtil.badRequest(
        'Space ID is required for space reviews',
        ErrorCodes.INVALID_INPUT,
      );
    }
    if (type === ReviewType.PARTNER && !partnerId) {
      throw ErrorResponseUtil.badRequest(
        'Partner ID is required for partner reviews',
        ErrorCodes.INVALID_INPUT,
      );
    }

    // Check if space/partner exists
    if (spaceId) {
      const space = await this.spaceRepository.findOne({
        where: { id: spaceId },
      });
      if (!space) {
        throw ErrorResponseUtil.notFound('Space', spaceId);
      }
    }

    if (partnerId) {
      const partner = await this.partnerRepository.findOne({
        where: { id: partnerId },
      });
      if (!partner) {
        throw ErrorResponseUtil.notFound('Partner', partnerId);
      }
    }

    // Validate booking if provided
    if (bookingId) {
      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId, userId },
        relations: ['space'],
      });
      if (!booking) {
        throw ErrorResponseUtil.notFound('Booking', bookingId);
      }

      // Check if booking is completed
      if (booking.status !== BookingStatus.COMPLETED) {
        throw ErrorResponseUtil.badRequest(
          'Can only review completed bookings',
          ErrorCodes.INVALID_STATUS,
        );
      }

      // Ensure space/partner matches booking
      if (spaceId && booking.spaceOption?.spaceId !== spaceId) {
        throw ErrorResponseUtil.badRequest(
          'Space ID does not match booking',
          ErrorCodes.INVALID_INPUT,
        );
      }
    }

    // Check if user already reviewed this space/partner
    const existingReview = await this.reviewRepository.findOne({
      where: {
        userId,
        ...(spaceId && { spaceId }),
        ...(partnerId && { partnerId }),
      },
    });

    if (existingReview) {
      throw ErrorResponseUtil.badRequest(
        'You have already reviewed this space/partner',
        ErrorCodes.RESOURCE_CONFLICT,
      );
    }

    const review = this.reviewRepository.create({
      ...reviewData,
      type,
      userId,
      spaceId,
      partnerId,
      bookingId,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update rating and review count
    await this.updateRatingAndCount(type, spaceId, partnerId);

    return this.findOne(savedReview.id);
  }

  async findAll(queryDto: QueryReviewDto) {
    const {
      page = 1,
      limit = 10,
      type,
      spaceId,
      partnerId,
      userId,
      minRating,
      maxRating,
      isVerified,
      isFlagged,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.isHidden = :isHidden', { isHidden: false });

    if (type) {
      queryBuilder.andWhere('review.type = :type', { type });
    }

    if (spaceId) {
      queryBuilder.andWhere('review.spaceId = :spaceId', { spaceId });
    }

    if (partnerId) {
      queryBuilder.andWhere('review.partnerId = :partnerId', { partnerId });
    }

    if (userId) {
      queryBuilder.andWhere('review.userId = :userId', { userId });
    }

    if (minRating) {
      queryBuilder.andWhere('review.rating >= :minRating', { minRating });
    }

    if (maxRating) {
      queryBuilder.andWhere('review.rating <= :maxRating', { maxRating });
    }

    if (isVerified !== undefined) {
      queryBuilder.andWhere('review.isVerified = :isVerified', { isVerified });
    }

    if (isFlagged !== undefined) {
      queryBuilder.andWhere('review.isFlagged = :isFlagged', { isFlagged });
    }

    if (startDate) {
      queryBuilder.andWhere('review.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      queryBuilder.andWhere('review.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    queryBuilder
      .orderBy(`review.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ReviewEntity> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'space', 'partner', 'booking'],
    });

    if (!review) {
      throw ErrorResponseUtil.notFound('Review', id);
    }

    return review;
  }

  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    userId: string,
    isAdmin = false,
  ): Promise<ReviewEntity> {
    const review = await this.findOne(id);

    // Only allow user to update their own review or admin to update any
    if (!isAdmin && review.userId !== userId) {
      throw ErrorResponseUtil.forbidden(
        'You can only update your own reviews',
        ErrorCodes.FORBIDDEN,
      );
    }

    // Users can only update certain fields
    if (!isAdmin) {
      const { response, ...allowedFields } = updateReviewDto;
      Object.assign(review, allowedFields);
    } else {
      Object.assign(review, updateReviewDto);
      if (updateReviewDto.response) {
        review.responseDate = new Date();
      }
    }

    const updatedReview = await this.reviewRepository.save(review);

    // Update rating and count if rating changed
    if (updateReviewDto.rating) {
      await this.updateRatingAndCount(
        review.type,
        review.spaceId,
        review.partnerId,
      );
    }

    return this.findOne(updatedReview.id);
  }

  async remove(id: string, userId: string, isAdmin = false): Promise<void> {
    const review = await this.findOne(id);

    // Only allow user to delete their own review or admin to delete any
    if (!isAdmin && review.userId !== userId) {
      throw ErrorResponseUtil.forbidden(
        'You can only delete your own reviews',
        ErrorCodes.FORBIDDEN,
      );
    }

    await this.reviewRepository.remove(review);

    // Update rating and count after deletion
    await this.updateRatingAndCount(
      review.type,
      review.spaceId,
      review.partnerId,
    );
  }

  async getAverageRating(
    type: ReviewType,
    targetId: string,
  ): Promise<{ average: number; count: number }> {
    const whereCondition =
      type === ReviewType.SPACE
        ? { spaceId: targetId }
        : { partnerId: targetId };

    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(review.id)', 'count')
      .where(whereCondition)
      .andWhere('review.isHidden = :isHidden', { isHidden: false })
      .getRawOne();

    return {
      average: parseFloat(result.average) || 0,
      count: parseInt(result.count) || 0,
    };
  }

  async hideReview(id: string): Promise<ReviewEntity> {
    const review = await this.findOne(id);
    review.isHidden = true;
    return this.reviewRepository.save(review);
  }

  async verifyReview(id: string): Promise<ReviewEntity> {
    const review = await this.findOne(id);
    review.isVerified = true;
    return this.reviewRepository.save(review);
  }

  async createReview(
    createReviewDto: CreateReviewDto & { userId: string },
  ): Promise<ReviewEntity> {
    const { userId, reviewType, ...reviewData } = createReviewDto;
    // Map reviewType to type if provided
    if (reviewType && !reviewData.type) {
      reviewData.type = reviewType;
    }
    return this.create(reviewData, userId);
  }

  async updateReview(
    id: string,
    updateReviewDto: UpdateReviewDto,
    userId: string,
  ): Promise<ReviewEntity> {
    return this.update(id, updateReviewDto, userId);
  }

  async deleteReview(id: string, userId: string): Promise<void> {
    return this.remove(id, userId);
  }

  async flagReview(
    id: string,
    reason: string,
    userId: string,
  ): Promise<ReviewEntity> {
    const review = await this.findOne(id);
    review.isFlagged = true;
    review.flagReason = reason;
    review.flaggedBy = userId;
    review.flaggedAt = new Date();
    return this.reviewRepository.save(review);
  }

  async markReviewHelpful(id: string, userId: string): Promise<ReviewEntity> {
    const review = await this.findOne(id);
    review.helpfulCount = (review.helpfulCount || 0) + 1;
    return this.reviewRepository.save(review);
  }

  async canUserReview(
    userId: string,
    spaceId?: string,
    partnerId?: string,
  ): Promise<boolean> {
    // Check if user has a completed booking for this space
    if (spaceId) {
      const booking = await this.bookingRepository.findOne({
        where: {
          userId,
          status: BookingStatus.COMPLETED,
        },
        relations: ['spaceOption', 'spaceOption.space'],
      });
      if (!booking || booking.spaceOption?.space?.id !== spaceId) {
        return false;
      }
    }

    // Check if user already reviewed this space/partner
    const existingReview = await this.reviewRepository.findOne({
      where: {
        userId,
        ...(spaceId && { spaceId }),
        ...(partnerId && { partnerId }),
      },
    });

    return !existingReview;
  }

  async findReviewsByUserId(userId: string, queryDto: QueryReviewDto) {
    return this.findAll({ ...queryDto, userId });
  }

  async findOneReview(id: string): Promise<ReviewEntity> {
    return this.findOne(id);
  }

  async getSpaceReviewStats(spaceId: string) {
    const { average, count } = await this.getAverageRating(
      ReviewType.SPACE,
      spaceId,
    );

    const ratingDistribution = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.spaceId = :spaceId', { spaceId })
      .andWhere('review.isHidden = :isHidden', { isHidden: false })
      .groupBy('review.rating')
      .orderBy('review.rating', 'ASC')
      .getRawMany();

    return {
      averageRating: average,
      totalReviews: count,
      ratingDistribution,
    };
  }

  async getPartnerReviewStats(partnerId: string) {
    const { average, count } = await this.getAverageRating(
      ReviewType.PARTNER,
      partnerId,
    );

    const ratingDistribution = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.partnerId = :partnerId', { partnerId })
      .andWhere('review.isHidden = :isHidden', { isHidden: false })
      .groupBy('review.rating')
      .orderBy('review.rating', 'ASC')
      .getRawMany();

    return {
      averageRating: average,
      totalReviews: count,
      ratingDistribution,
    };
  }

  async findAllReviews(queryDto: any): Promise<any> {
    console.log(
      '=== DEBUG ReviewService.findAllReviews called with:',
      JSON.stringify(queryDto),
    );
    try {
      const result = await this.findAll(queryDto);
      console.log(
        '=== DEBUG ReviewService.findAllReviews completed successfully',
      );
      return result;
    } catch (error) {
      console.log(
        '=== DEBUG Error in ReviewService.findAllReviews:',
        error.message,
      );
      console.log('=== DEBUG Error stack:', error.stack);
      throw error;
    }
  }

  async findReviewsBySpaceId(spaceId: string, queryDto: QueryReviewDto) {
    return this.findAll({ ...queryDto, spaceId });
  }

  async findReviewsByPartnerId(partnerId: string, queryDto: QueryReviewDto) {
    return this.findAll({ ...queryDto, partnerId });
  }

  private async updateRatingAndCount(
    type: ReviewType,
    spaceId?: string,
    partnerId?: string,
  ): Promise<void> {
    if (type === ReviewType.SPACE && spaceId) {
      const { average, count } = await this.getAverageRating(
        ReviewType.SPACE,
        spaceId,
      );
      await this.spaceRepository.update(spaceId, {
        rating: Math.round(average * 100) / 100,
        reviewCount: count,
      });
    }

    if (type === ReviewType.PARTNER && partnerId) {
      const { average, count } = await this.getAverageRating(
        ReviewType.PARTNER,
        partnerId,
      );
      await this.partnerRepository.update(partnerId, {
        rating: Math.round(average * 100) / 100,
        reviewCount: count,
      });
    }
  }
}
