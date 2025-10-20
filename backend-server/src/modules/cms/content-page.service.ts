import {
  ContentPageEntity,
  ContentPageStatus,
} from '@/database/entities/content-page.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, In, Like, Repository } from 'typeorm';
import { CreateContentPageDto } from './dto/create-content-page.dto';
import { UpdateContentPageDto } from './dto/update-content-page.dto';

export interface ContentPageFilters {
  status?: ContentPageStatus;
  search?: string;
  isFeatured?: boolean;
  createdBy?: string;
  template?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ContentPageListResponse {
  pages: ContentPageEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ContentPageService {
  constructor(
    @InjectRepository(ContentPageEntity)
    private readonly contentPageRepository: Repository<ContentPageEntity>,
  ) {}

  async create(
    createContentPageDto: CreateContentPageDto,
    createdBy: string,
  ): Promise<ContentPageEntity> {
    // Check if slug already exists
    const existingPage = await this.contentPageRepository.findOne({
      where: { slug: createContentPageDto.slug },
    });

    if (existingPage) {
      throw new ConflictException('A page with this slug already exists');
    }

    // Auto-generate slug if not provided
    if (!createContentPageDto.slug && createContentPageDto.title) {
      createContentPageDto.slug = this.generateSlug(createContentPageDto.title);
    }

    // Set published date if status is published and no date provided
    if (
      createContentPageDto.status === ContentPageStatus.PUBLISHED &&
      !createContentPageDto.publishedAt
    ) {
      createContentPageDto.publishedAt = new Date().toISOString();
    }

    const contentPage = this.contentPageRepository.create({
      ...createContentPageDto,
      createdBy,
      publishedAt: createContentPageDto.publishedAt
        ? new Date(createContentPageDto.publishedAt)
        : null,
    });

    return await this.contentPageRepository.save(contentPage);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: ContentPageFilters = {},
  ): Promise<ContentPageListResponse> {
    const queryBuilder = this.contentPageRepository
      .createQueryBuilder('page')
      .leftJoinAndSelect('page.creator', 'creator');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('page.status = :status', {
        status: filters.status,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(page.title ILIKE :search OR page.content ILIKE :search OR page.metaDescription ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.isFeatured !== undefined) {
      queryBuilder.andWhere('page.isFeatured = :isFeatured', {
        isFeatured: filters.isFeatured,
      });
    }

    if (filters.createdBy) {
      queryBuilder.andWhere('page.createdBy = :createdBy', {
        createdBy: filters.createdBy,
      });
    }

    if (filters.template) {
      queryBuilder.andWhere('page.template = :template', {
        template: filters.template,
      });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('page.createdAt >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('page.createdAt <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const pages = await queryBuilder
      .orderBy('page.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      pages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ContentPageEntity> {
    const contentPage = await this.contentPageRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!contentPage) {
      throw new NotFoundException('Content page not found');
    }

    return contentPage;
  }

  async findBySlug(slug: string): Promise<ContentPageEntity> {
    const contentPage = await this.contentPageRepository.findOne({
      where: { slug, status: ContentPageStatus.PUBLISHED },
      relations: ['creator'],
    });

    if (!contentPage) {
      throw new NotFoundException('Content page not found');
    }

    // Increment view count
    await this.contentPageRepository.increment(
      { id: contentPage.id },
      'viewCount',
      1,
    );

    return contentPage;
  }

  async update(
    id: string,
    updateContentPageDto: UpdateContentPageDto,
  ): Promise<ContentPageEntity> {
    const contentPage = await this.findOne(id);

    // Check slug uniqueness if being updated
    if (
      updateContentPageDto.slug &&
      updateContentPageDto.slug !== contentPage.slug
    ) {
      const existingPage = await this.contentPageRepository.findOne({
        where: { slug: updateContentPageDto.slug },
      });

      if (existingPage) {
        throw new ConflictException('A page with this slug already exists');
      }
    }

    // Set published date if status is being changed to published
    if (
      updateContentPageDto.status === ContentPageStatus.PUBLISHED &&
      contentPage.status !== ContentPageStatus.PUBLISHED &&
      !updateContentPageDto.publishedAt
    ) {
      updateContentPageDto.publishedAt = new Date().toISOString();
    }

    // Clear published date if status is being changed from published
    if (
      updateContentPageDto.status &&
      updateContentPageDto.status !== ContentPageStatus.PUBLISHED &&
      contentPage.status === ContentPageStatus.PUBLISHED
    ) {
      updateContentPageDto.publishedAt = null;
    }

    Object.assign(contentPage, {
      ...updateContentPageDto,
      publishedAt: updateContentPageDto.publishedAt
        ? new Date(updateContentPageDto.publishedAt)
        : contentPage.publishedAt,
    });

    return await this.contentPageRepository.save(contentPage);
  }

  async remove(id: string): Promise<void> {
    const contentPage = await this.findOne(id);
    await this.contentPageRepository.remove(contentPage);
  }

  async publish(id: string): Promise<ContentPageEntity> {
    const contentPage = await this.findOne(id);

    contentPage.status = ContentPageStatus.PUBLISHED;
    contentPage.publishedAt = new Date();

    return await this.contentPageRepository.save(contentPage);
  }

  async unpublish(id: string): Promise<ContentPageEntity> {
    const contentPage = await this.findOne(id);

    contentPage.status = ContentPageStatus.DRAFT;
    contentPage.publishedAt = null;

    return await this.contentPageRepository.save(contentPage);
  }

  async duplicate(id: string, createdBy: string): Promise<ContentPageEntity> {
    const originalPage = await this.findOne(id);

    const duplicatedPage = this.contentPageRepository.create({
      ...originalPage,
      id: undefined,
      title: `${originalPage.title} (Copy)`,
      slug: `${originalPage.slug}-copy-${Date.now()}`,
      status: ContentPageStatus.DRAFT,
      publishedAt: null,
      viewCount: 0,
      createdBy,
      createdAt: undefined,
      updatedAt: undefined,
    });

    return await this.contentPageRepository.save(duplicatedPage);
  }

  async getPublishedPages(): Promise<ContentPageEntity[]> {
    return await this.contentPageRepository.find({
      where: { status: ContentPageStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
      relations: ['creator'],
    });
  }

  async getFeaturedPages(): Promise<ContentPageEntity[]> {
    return await this.contentPageRepository.find({
      where: {
        status: ContentPageStatus.PUBLISHED,
        isFeatured: true,
      },
      order: { publishedAt: 'DESC' },
      relations: ['creator'],
    });
  }

  async getPagesByTemplate(template: string): Promise<ContentPageEntity[]> {
    return await this.contentPageRepository.find({
      where: {
        template,
        status: ContentPageStatus.PUBLISHED,
      },
      order: { publishedAt: 'DESC' },
      relations: ['creator'],
    });
  }

  async getPageStats() {
    const [total, published, draft, archived] = await Promise.all([
      this.contentPageRepository.count(),
      this.contentPageRepository.count({
        where: { status: ContentPageStatus.PUBLISHED },
      }),
      this.contentPageRepository.count({
        where: { status: ContentPageStatus.DRAFT },
      }),
      this.contentPageRepository.count({
        where: { status: ContentPageStatus.ARCHIVED },
      }),
    ]);

    const totalViews = await this.contentPageRepository
      .createQueryBuilder('page')
      .select('SUM(page.viewCount)', 'totalViews')
      .getRawOne();

    return {
      total,
      published,
      draft,
      archived,
      totalViews: parseInt(totalViews.totalViews) || 0,
    };
  }

  async findFeatured(): Promise<ContentPageEntity[]> {
    return this.getFeaturedPages();
  }

  async findPublished(
    page: number = 1,
    limit: number = 10,
  ): Promise<ContentPageListResponse> {
    return this.findAll(page, limit, { status: ContentPageStatus.PUBLISHED });
  }

  async getTemplates(): Promise<string[]> {
    const templates = await this.contentPageRepository
      .createQueryBuilder('page')
      .select('DISTINCT page.template', 'template')
      .where('page.template IS NOT NULL')
      .getRawMany();

    return templates.map((t) => t.template).filter(Boolean);
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
