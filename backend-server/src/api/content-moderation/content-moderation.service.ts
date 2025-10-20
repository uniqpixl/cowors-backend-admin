import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import {
  ErrorCodes,
  ErrorResponseUtil,
} from '@/common/utils/error-response.util';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, In, Like, Repository } from 'typeorm';
import { CreateModerationDto } from './dto/create-moderation.dto';
import {
  ModerationQueryDto,
  UpdateModerationDto,
} from './dto/update-moderation.dto';
import {
  ContentModerationEntity,
  ContentType,
  ModerationAction,
  ModerationStatus,
} from './entities/content-moderation.entity';

@Injectable()
export class ContentModerationService {
  // Predefined list of inappropriate keywords
  private readonly bannedKeywords = [
    'spam',
    'scam',
    'fraud',
    'fake',
    'illegal',
    'drugs',
    'violence',
    'hate',
    'harassment',
    'abuse',
    'threat',
    'discrimination',
    // Add more keywords as needed
  ];

  // Suspicious patterns that require manual review
  private readonly suspiciousPatterns = [
    /\b(?:contact|call|email|phone)\s+(?:me|us)\s+(?:at|on)\b/i,
    /\b(?:visit|check)\s+(?:my|our)\s+(?:website|site)\b/i,
    /\b(?:buy|sell|purchase)\s+(?:now|today|immediately)\b/i,
    /\$\d+|\d+\s*(?:dollars?|usd|€|£)/i,
  ];

  constructor(
    @InjectRepository(ContentModerationEntity)
    private readonly moderationRepository: Repository<ContentModerationEntity>,
  ) {}

  /**
   * Automatically moderate content using keyword filtering and pattern matching
   */
  async moderateContent(
    contentType: ContentType,
    contentId: string,
    content: string,
    authorId: string,
  ): Promise<ContentModerationEntity> {
    const analysis = this.analyzeContent(content);

    const createDto: CreateModerationDto = {
      contentType,
      contentId,
      content,
      authorId,
      action: analysis.action,
      moderationReason: analysis.reason,
      flaggedKeywords: analysis.flaggedKeywords,
      toxicityScore: analysis.toxicityScore,
      metadata: {
        autoModerated: true,
        analysisTimestamp: new Date().toISOString(),
      },
    };

    const moderation = this.moderationRepository.create({
      ...createDto,
      status:
        analysis.action === ModerationAction.AUTO_APPROVED
          ? ModerationStatus.APPROVED
          : analysis.action === ModerationAction.AUTO_REJECTED
            ? ModerationStatus.REJECTED
            : ModerationStatus.PENDING,
      moderatedAt:
        analysis.action !== ModerationAction.MANUAL_REVIEW
          ? new Date()
          : undefined,
    });

    return await this.moderationRepository.save(moderation);
  }

  /**
   * Analyze content for inappropriate material
   */
  private analyzeContent(content: string): {
    action: ModerationAction;
    reason?: string;
    flaggedKeywords?: string[];
    toxicityScore?: number;
  } {
    const lowerContent = content.toLowerCase();
    const flaggedKeywords: string[] = [];

    // Check for banned keywords
    for (const keyword of this.bannedKeywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        flaggedKeywords.push(keyword);
      }
    }

    // If banned keywords found, auto-reject
    if (flaggedKeywords.length > 0) {
      return {
        action: ModerationAction.AUTO_REJECTED,
        reason: `Content contains inappropriate keywords: ${flaggedKeywords.join(', ')}`,
        flaggedKeywords,
        toxicityScore: 0.8 + flaggedKeywords.length * 0.05,
      };
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        return {
          action: ModerationAction.MANUAL_REVIEW,
          reason:
            'Content contains suspicious patterns that require manual review',
          toxicityScore: 0.6,
        };
      }
    }

    // Check content length and quality
    if (content.length < 10) {
      return {
        action: ModerationAction.MANUAL_REVIEW,
        reason: 'Content too short, requires manual review',
        toxicityScore: 0.3,
      };
    }

    // Auto-approve clean content
    return {
      action: ModerationAction.AUTO_APPROVED,
      reason: 'Content passed automated moderation checks',
      toxicityScore: 0.1,
    };
  }

  /**
   * Create a moderation record manually
   */
  async create(
    createModerationDto: CreateModerationDto,
  ): Promise<ContentModerationEntity> {
    const moderation = this.moderationRepository.create(createModerationDto);
    return await this.moderationRepository.save(moderation);
  }

  /**
   * Get all moderation records with filtering and pagination
   */
  async findAll(
    query: ModerationQueryDto,
  ): Promise<OffsetPaginatedDto<ContentModerationEntity>> {
    const {
      page = 1,
      limit = 10,
      status,
      contentType,
      authorId,
      moderatorId,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    if (status) {
      whereConditions.status = status;
    }

    if (contentType) {
      whereConditions.contentType = contentType;
    }

    if (authorId) {
      whereConditions.authorId = authorId;
    }

    if (moderatorId) {
      whereConditions.moderatorId = moderatorId;
    }

    if (search) {
      whereConditions.content = Like(`%${search}%`);
    }

    const findOptions: FindManyOptions<ContentModerationEntity> = {
      where: whereConditions,
      relations: ['author', 'moderator'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    };

    const [items, total] =
      await this.moderationRepository.findAndCount(findOptions);

    const pageOptions = new PageOptionsDto();
    Object.assign(pageOptions, { page, limit });
    const pagination = new OffsetPaginationDto(total, pageOptions);

    return new OffsetPaginatedDto(items, pagination);
  }

  /**
   * Get a single moderation record
   */
  async findOne(id: string): Promise<ContentModerationEntity> {
    const moderation = await this.moderationRepository.findOne({
      where: { id },
      relations: ['author', 'moderator'],
    });

    if (!moderation) {
      throw ErrorResponseUtil.notFound('Moderation record', id);
    }

    return moderation;
  }

  /**
   * Update moderation status (manual review)
   */
  async update(
    id: string,
    updateModerationDto: UpdateModerationDto,
  ): Promise<ContentModerationEntity> {
    const moderation = await this.findOne(id);

    if (
      moderation.status !== ModerationStatus.PENDING &&
      updateModerationDto.status !== moderation.status
    ) {
      throw ErrorResponseUtil.badRequest(
        'Cannot update already processed moderation record',
        ErrorCodes.INVALID_STATUS,
      );
    }

    Object.assign(moderation, updateModerationDto);
    moderation.moderatedAt = new Date();

    return await this.moderationRepository.save(moderation);
  }

  /**
   * Get pending moderation items for manual review
   */
  async getPendingReviews(
    limit: number = 50,
  ): Promise<ContentModerationEntity[]> {
    return await this.moderationRepository.find({
      where: { status: ModerationStatus.PENDING },
      relations: ['author'],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Get moderation statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
    autoApproved: number;
    autoRejected: number;
    manualReview: number;
  }> {
    const [total, pending, approved, rejected, flagged] = await Promise.all([
      this.moderationRepository.count(),
      this.moderationRepository.count({
        where: { status: ModerationStatus.PENDING },
      }),
      this.moderationRepository.count({
        where: { status: ModerationStatus.APPROVED },
      }),
      this.moderationRepository.count({
        where: { status: ModerationStatus.REJECTED },
      }),
      this.moderationRepository.count({
        where: { status: ModerationStatus.FLAGGED },
      }),
    ]);

    const [autoApproved, autoRejected, manualReview] = await Promise.all([
      this.moderationRepository.count({
        where: { action: ModerationAction.AUTO_APPROVED },
      }),
      this.moderationRepository.count({
        where: { action: ModerationAction.AUTO_REJECTED },
      }),
      this.moderationRepository.count({
        where: { action: ModerationAction.MANUAL_REVIEW },
      }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      flagged,
      autoApproved,
      autoRejected,
      manualReview,
    };
  }

  /**
   * Bulk approve/reject moderation items
   */
  async bulkUpdate(
    ids: string[],
    status: ModerationStatus,
    moderatorId: string,
    reason?: string,
  ): Promise<void> {
    await this.moderationRepository.update(
      { id: In(ids), status: ModerationStatus.PENDING },
      {
        status,
        moderatorId,
        moderationReason: reason,
        moderatedAt: new Date(),
      },
    );
  }

  /**
   * Remove a moderation record
   */
  async remove(id: string): Promise<void> {
    const result = await this.moderationRepository.delete(id);
    if (result.affected === 0) {
      throw ErrorResponseUtil.notFound('Moderation record', id);
    }
  }
}
