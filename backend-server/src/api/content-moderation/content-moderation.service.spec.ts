import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentModerationService } from './content-moderation.service';
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

describe('ContentModerationService', () => {
  let service: ContentModerationService;
  let repository: Repository<ContentModerationEntity>;

  const mockModerationRecord: ContentModerationEntity = {
    id: '1',
    contentType: ContentType.REVIEW,
    contentId: 'review-1',
    content: 'This is a great place to work!',
    authorId: 'user-1',
    status: ModerationStatus.APPROVED,
    action: ModerationAction.AUTO_APPROVED,
    moderatorId: null,
    moderationReason: null,
    flaggedKeywords: [],
    toxicityScore: 0.1,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ContentModerationEntity;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentModerationService,
        {
          provide: getRepositoryToken(ContentModerationEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ContentModerationService>(ContentModerationService);
    repository = module.get<Repository<ContentModerationEntity>>(
      getRepositoryToken(ContentModerationEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('moderateContent', () => {
    it('should auto-approve clean content', async () => {
      const cleanContent =
        'This is a wonderful coworking space with great amenities.';

      mockRepository.create.mockReturnValue({
        ...mockModerationRecord,
        content: cleanContent,
        status: ModerationStatus.APPROVED,
        action: ModerationAction.AUTO_APPROVED,
      });
      mockRepository.save.mockResolvedValue({
        ...mockModerationRecord,
        content: cleanContent,
        status: ModerationStatus.APPROVED,
        action: ModerationAction.AUTO_APPROVED,
      });

      const result = await service.moderateContent(
        ContentType.REVIEW,
        'review-1',
        cleanContent,
        'user-1',
      );

      expect(result.status).toBe(ModerationStatus.APPROVED);
      expect(result.action).toBe(ModerationAction.AUTO_APPROVED);
      expect(result.flaggedKeywords).toHaveLength(0);
    });

    it('should auto-reject content with banned keywords', async () => {
      const offensiveContent = 'This place is spam and terrible.';

      mockRepository.create.mockReturnValue({
        ...mockModerationRecord,
        content: offensiveContent,
        status: ModerationStatus.REJECTED,
        action: ModerationAction.AUTO_REJECTED,
        flaggedKeywords: ['spam'],
      });
      mockRepository.save.mockResolvedValue({
        ...mockModerationRecord,
        content: offensiveContent,
        status: ModerationStatus.REJECTED,
        action: ModerationAction.AUTO_REJECTED,
        flaggedKeywords: ['spam'],
      });

      const result = await service.moderateContent(
        ContentType.REVIEW,
        'review-1',
        offensiveContent,
        'user-1',
      );

      expect(result.status).toBe(ModerationStatus.REJECTED);
      expect(result.action).toBe(ModerationAction.AUTO_REJECTED);
      expect(result.flaggedKeywords).toContain('spam');
    });

    it('should flag content for manual review when suspicious patterns detected', async () => {
      const suspiciousContent =
        'Contact me at john@email.com for special deals!!!';

      mockRepository.create.mockReturnValue({
        ...mockModerationRecord,
        content: suspiciousContent,
        status: ModerationStatus.PENDING,
        action: ModerationAction.MANUAL_REVIEW,
        flaggedKeywords: [],
      });
      mockRepository.save.mockResolvedValue({
        ...mockModerationRecord,
        content: suspiciousContent,
        status: ModerationStatus.PENDING,
        action: ModerationAction.MANUAL_REVIEW,
        flaggedKeywords: [],
      });

      const result = await service.moderateContent(
        ContentType.REVIEW,
        'review-1',
        suspiciousContent,
        'user-1',
      );

      expect(result.status).toBe(ModerationStatus.PENDING);
      expect(result.action).toBe(ModerationAction.MANUAL_REVIEW);
    });

    it('should flag very long content for manual review', async () => {
      const longContent = 'a'.repeat(1001); // Over 1000 characters

      mockRepository.create.mockReturnValue({
        ...mockModerationRecord,
        content: longContent,
        status: ModerationStatus.PENDING,
        action: ModerationAction.MANUAL_REVIEW,
      });
      mockRepository.save.mockResolvedValue({
        ...mockModerationRecord,
        content: longContent,
        status: ModerationStatus.PENDING,
        action: ModerationAction.MANUAL_REVIEW,
      });

      const result = await service.moderateContent(
        ContentType.REVIEW,
        'review-1',
        longContent,
        'user-1',
      );

      expect(result.status).toBe(ModerationStatus.PENDING);
      expect(result.action).toBe(ModerationAction.MANUAL_REVIEW);
    });
  });

  describe('analyzeContent', () => {
    it('should detect banned keywords', () => {
      const content = 'This is spam content with scam elements';
      const analysis = service['analyzeContent'](content);

      expect(analysis.action).toBe(ModerationAction.AUTO_REJECTED);
      expect(analysis.flaggedKeywords).toContain('spam');
      expect(analysis.flaggedKeywords).toContain('scam');
    });

    it('should detect suspicious patterns', () => {
      const content = 'Contact me at test@email.com for deals!!!';
      const analysis = service['analyzeContent'](content);

      expect(analysis.action).toBe(ModerationAction.MANUAL_REVIEW);
      expect(analysis.toxicityScore).toBeGreaterThan(0);
    });

    it('should approve clean content', () => {
      const content =
        'This is a great coworking space with excellent facilities.';
      const analysis = service['analyzeContent'](content);

      expect(analysis.action).toBe(ModerationAction.AUTO_APPROVED);
      expect(analysis.flaggedKeywords).toHaveLength(0);
      expect(analysis.toxicityScore).toBeLessThan(0.3);
    });
  });

  describe('create', () => {
    it('should create a moderation record manually', async () => {
      const createDto: CreateModerationDto = {
        contentType: ContentType.REVIEW,
        contentId: 'review-1',
        content: 'Test content',
        authorId: 'user-1',
        action: ModerationAction.MANUAL_REVIEW,
      };

      mockRepository.create.mockReturnValue(mockModerationRecord);
      mockRepository.save.mockResolvedValue(mockModerationRecord);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        status: ModerationStatus.PENDING,
      });
      expect(result).toEqual(mockModerationRecord);
    });
  });

  describe('findAll', () => {
    it('should return paginated moderation records', async () => {
      const queryDto: ModerationQueryDto = {
        page: 1,
        limit: 10,
        status: ModerationStatus.PENDING,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([[mockModerationRecord], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(queryDto);

      expect(result.data).toEqual([mockModerationRecord]);
      expect(result.pagination.totalRecords).toBe(1);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return a moderation record by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockModerationRecord);

      const result = await service.findOne('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockModerationRecord);
    });

    it('should throw NotFoundException when record not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update moderation status', async () => {
      const updateDto: UpdateModerationDto = {
        status: ModerationStatus.APPROVED,
        moderatorId: 'moderator-1',
        moderationReason: 'Content is appropriate',
      };

      mockRepository.findOne.mockResolvedValue(mockModerationRecord);
      mockRepository.save.mockResolvedValue({
        ...mockModerationRecord,
        ...updateDto,
        reviewedAt: expect.any(Date),
      });

      const result = await service.update('1', updateDto);

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockModerationRecord,
        ...updateDto,
        reviewedAt: expect.any(Date),
      });
      expect(result.status).toBe(ModerationStatus.APPROVED);
    });

    it('should throw BadRequestException when trying to update already processed record', async () => {
      const processedRecord = {
        ...mockModerationRecord,
        status: ModerationStatus.APPROVED,
        reviewedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(processedRecord);

      await expect(
        service.update('1', { status: ModerationStatus.REJECTED }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPendingReviews', () => {
    it('should return pending moderation items', async () => {
      const pendingRecords = [mockModerationRecord];
      mockRepository.find.mockResolvedValue(pendingRecords);

      const result = await service.getPendingReviews(10);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: ModerationStatus.PENDING },
        order: { createdAt: 'ASC' },
        take: 10,
      });
      expect(result).toEqual(pendingRecords);
    });
  });

  describe('getStats', () => {
    it('should return moderation statistics', async () => {
      mockRepository.count.mockImplementation(({ where }) => {
        if (!where) return Promise.resolve(100);
        if (where.status === ModerationStatus.PENDING)
          return Promise.resolve(10);
        if (where.status === ModerationStatus.APPROVED)
          return Promise.resolve(70);
        if (where.status === ModerationStatus.REJECTED)
          return Promise.resolve(15);
        if (where.status === ModerationStatus.FLAGGED)
          return Promise.resolve(5);
        if (where.action === ModerationAction.AUTO_APPROVED)
          return Promise.resolve(60);
        if (where.action === ModerationAction.AUTO_REJECTED)
          return Promise.resolve(10);
        if (where.action === ModerationAction.MANUAL_REVIEW)
          return Promise.resolve(30);
        return Promise.resolve(0);
      });

      const result = await service.getStats();

      expect(result.total).toBe(100);
      expect(result.pending).toBe(10);
      expect(result.approved).toBe(70);
      expect(result.rejected).toBe(15);
      expect(result.flagged).toBe(5);
      expect(result.autoApproved).toBe(60);
      expect(result.autoRejected).toBe(10);
      expect(result.manualReview).toBe(30);
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple records', async () => {
      const ids = ['1', '2', '3'];
      const status = ModerationStatus.APPROVED;
      const moderatorId = 'moderator-1';
      const reason = 'Bulk approval';

      mockRepository.update.mockResolvedValue({ affected: 3 });

      await service.bulkUpdate(ids, status, moderatorId, reason);

      expect(mockRepository.update).toHaveBeenCalledWith(ids, {
        status,
        moderatorId,
        moderationReason: reason,
        reviewedAt: expect.any(Date),
      });
    });
  });

  describe('remove', () => {
    it('should remove a moderation record', async () => {
      mockRepository.findOne.mockResolvedValue(mockModerationRecord);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when record not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
