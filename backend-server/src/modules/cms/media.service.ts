import {
  MediaEntity,
  MediaStatus,
  MediaType,
} from '@/database/entities/media.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { Repository } from 'typeorm';
import { UpdateMediaDto, UploadMediaDto } from './dto/upload-media.dto';

export interface MediaFilters {
  type?: MediaType;
  status?: MediaStatus;
  folder?: string;
  search?: string;
  uploadedBy?: string;
  isPublic?: boolean;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface MediaListResponse {
  media: MediaEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class MediaService {
  private readonly uploadPath = process.env.UPLOAD_PATH || './uploads';
  private readonly baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  constructor(
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
  ) {}

  async uploadFile(
    file: UploadedFile,
    uploadMediaDto: UploadMediaDto,
    uploadedBy: string,
  ): Promise<MediaEntity> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const filename = `${crypto.randomUUID()}${fileExtension}`;
      const folder = uploadMediaDto.folder || 'general';
      const filePath = path.join(this.uploadPath, folder, filename);
      const relativePath = path.join(folder, filename);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Save file
      await fs.writeFile(filePath, file.buffer);

      // Generate checksum
      const checksum = crypto
        .createHash('sha256')
        .update(file.buffer)
        .digest('hex');

      // Determine media type
      const mediaType = this.getMediaType(file.mimetype);

      // Process metadata
      const metadata = await this.extractMetadata(file, mediaType);

      // Generate variants for images
      const variants =
        mediaType === MediaType.IMAGE
          ? await this.generateImageVariants(filePath, folder)
          : null;

      // Create media entity
      const media = this.mediaRepository.create({
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        type: mediaType,
        status: MediaStatus.READY,
        filePath: relativePath,
        url: `${this.baseUrl}/uploads/${relativePath}`,
        thumbnailUrl: variants?.thumbnail
          ? `${this.baseUrl}/uploads/${variants.thumbnail}`
          : null,
        checksum,
        metadata,
        variants,
        uploadedBy,
        ...uploadMediaDto,
      });

      return await this.mediaRepository.save(media);
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters: MediaFilters = {},
  ): Promise<MediaListResponse> {
    const queryBuilder = this.mediaRepository
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.uploader', 'uploader');

    // Apply filters
    if (filters.type) {
      queryBuilder.andWhere('media.type = :type', { type: filters.type });
    }

    if (filters.status) {
      queryBuilder.andWhere('media.status = :status', {
        status: filters.status,
      });
    }

    if (filters.folder) {
      queryBuilder.andWhere('media.folder = :folder', {
        folder: filters.folder,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(media.originalName ILIKE :search OR media.alt ILIKE :search OR media.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.uploadedBy) {
      queryBuilder.andWhere('media.uploadedBy = :uploadedBy', {
        uploadedBy: filters.uploadedBy,
      });
    }

    if (filters.isPublic !== undefined) {
      queryBuilder.andWhere('media.isPublic = :isPublic', {
        isPublic: filters.isPublic,
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere('media.tags && :tags', { tags: filters.tags });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('media.createdAt >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('media.createdAt <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const media = await queryBuilder
      .orderBy('media.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      media,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<MediaEntity> {
    const media = await this.mediaRepository.findOne({
      where: { id },
      relations: ['uploader'],
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Increment download count
    await this.mediaRepository.increment({ id }, 'downloadCount', 1);

    return media;
  }

  async update(
    id: string,
    updateMediaDto: UpdateMediaDto,
  ): Promise<MediaEntity> {
    const media = await this.findOne(id);

    Object.assign(media, updateMediaDto);

    return await this.mediaRepository.save(media);
  }

  async remove(id: string): Promise<void> {
    const media = await this.findOne(id);

    try {
      // Delete physical file
      const fullPath = path.join(this.uploadPath, media.filePath);
      await fs.unlink(fullPath);

      // Delete variants if they exist
      if (media.variants) {
        for (const variant of Object.values(media.variants)) {
          if (variant) {
            const variantPath = path.join(this.uploadPath, variant);
            try {
              await fs.unlink(variantPath);
            } catch (error) {
              // Ignore if variant file doesn't exist
            }
          }
        }
      }
    } catch (error) {
      // File might not exist, continue with database deletion
    }

    await this.mediaRepository.remove(media);
  }

  async getFolders(): Promise<string[]> {
    const result = await this.mediaRepository
      .createQueryBuilder('media')
      .select('DISTINCT media.folder', 'folder')
      .where('media.folder IS NOT NULL')
      .getRawMany();

    return result.map((r) => r.folder).filter(Boolean);
  }

  async getMediaStats() {
    const [total, images, videos, documents] = await Promise.all([
      this.mediaRepository.count(),
      this.mediaRepository.count({ where: { type: MediaType.IMAGE } }),
      this.mediaRepository.count({ where: { type: MediaType.VIDEO } }),
      this.mediaRepository.count({ where: { type: MediaType.DOCUMENT } }),
    ]);

    const totalSize = await this.mediaRepository
      .createQueryBuilder('media')
      .select('SUM(media.fileSize)', 'totalSize')
      .getRawOne();

    const totalDownloads = await this.mediaRepository
      .createQueryBuilder('media')
      .select('SUM(media.downloadCount)', 'totalDownloads')
      .getRawOne();

    return {
      total,
      images,
      videos,
      documents,
      totalSize: parseInt(totalSize.totalSize) || 0,
      totalDownloads: parseInt(totalDownloads.totalDownloads) || 0,
    };
  }

  private validateFile(file: UploadedFile): void {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mp3',
      'audio/wav',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
    ];

    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds maximum limit of 50MB');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }
  }

  private getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return MediaType.IMAGE;
    if (mimeType.startsWith('video/')) return MediaType.VIDEO;
    if (mimeType.startsWith('audio/')) return MediaType.AUDIO;
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text')
    ) {
      return MediaType.DOCUMENT;
    }
    if (mimeType.includes('zip') || mimeType.includes('archive')) {
      return MediaType.ARCHIVE;
    }
    return MediaType.OTHER;
  }

  private async extractMetadata(
    file: UploadedFile,
    mediaType: MediaType,
  ): Promise<any> {
    const metadata: any = {};

    if (mediaType === MediaType.IMAGE) {
      try {
        const imageInfo = await sharp(file.buffer).metadata();
        metadata.width = imageInfo.width;
        metadata.height = imageInfo.height;
        metadata.format = imageInfo.format;
        metadata.colorSpace = imageInfo.space;
      } catch (error) {
        // Ignore metadata extraction errors
      }
    }

    return metadata;
  }

  private async generateImageVariants(
    filePath: string,
    folder: string,
  ): Promise<any> {
    const variants: any = {};
    const filename = path.basename(filePath, path.extname(filePath));

    try {
      const image = sharp(filePath);

      // Generate thumbnail (150x150)
      const thumbnailPath = path.join(folder, `${filename}_thumb.webp`);
      const fullThumbnailPath = path.join(this.uploadPath, thumbnailPath);
      await image
        .resize(150, 150, { fit: 'cover' })
        .webp()
        .toFile(fullThumbnailPath);
      variants.thumbnail = thumbnailPath;

      // Generate small (300x300)
      const smallPath = path.join(folder, `${filename}_small.webp`);
      const fullSmallPath = path.join(this.uploadPath, smallPath);
      await image
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .webp()
        .toFile(fullSmallPath);
      variants.small = smallPath;

      // Generate medium (800x800)
      const mediumPath = path.join(folder, `${filename}_medium.webp`);
      const fullMediumPath = path.join(this.uploadPath, mediumPath);
      await image
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp()
        .toFile(fullMediumPath);
      variants.medium = mediumPath;
    } catch (error) {
      // Ignore variant generation errors
    }

    return variants;
  }
}
