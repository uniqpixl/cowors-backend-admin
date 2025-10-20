import { AuthGuard } from '@/auth/auth.guard';
import { UserEntity } from '@/auth/entities/user.entity';
import { ContentPageStatus } from '@/database/entities/content-page.entity';
import { MediaStatus, MediaType } from '@/database/entities/media.entity';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ContentPageFilters, ContentPageService } from './content-page.service';
import { CreateContentPageDto } from './dto/create-content-page.dto';
import { UpdateContentPageDto } from './dto/update-content-page.dto';
import { UpdateMediaDto, UploadMediaDto } from './dto/upload-media.dto';
import {
  UploadedFile as MediaFile,
  MediaFilters,
  MediaService,
} from './media.service';

@ApiTags('CMS')
@Controller('cms')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class CmsController {
  constructor(
    private readonly contentPageService: ContentPageService,
    private readonly mediaService: MediaService,
  ) {}

  // Content Pages Endpoints

  @Post('pages')
  @Roles('admin', 'content_manager')
  @ApiOperation({ summary: 'Create a new content page' })
  @ApiResponse({
    status: 201,
    description: 'Content page created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async createPage(
    @Body() createContentPageDto: CreateContentPageDto,
    @CurrentUserSession() user: UserEntity,
  ) {
    return await this.contentPageService.create(createContentPageDto, user.id);
  }

  @Get('pages')
  @Roles('admin', 'content_manager', 'content_viewer')
  @ApiOperation({
    summary: 'Get all content pages with pagination and filters',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ContentPageStatus,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in title and content',
  })
  @ApiQuery({
    name: 'template',
    required: false,
    type: String,
    description: 'Filter by template',
  })
  @ApiQuery({
    name: 'featured',
    required: false,
    type: Boolean,
    description: 'Filter featured pages',
  })
  @ApiQuery({
    name: 'createdBy',
    required: false,
    type: String,
    description: 'Filter by creator',
  })
  @ApiResponse({
    status: 200,
    description: 'Content pages retrieved successfully',
  })
  async findAllPages(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: ContentPageStatus,
    @Query('search') search?: string,
    @Query('template') template?: string,
    @Query('featured') featured?: boolean,
    @Query('createdBy') createdBy?: string,
  ) {
    const filters: ContentPageFilters = {
      status,
      search,
      template,
      isFeatured: featured,
      createdBy,
    };

    return await this.contentPageService.findAll(page, limit, filters);
  }

  @Get('pages/published')
  @ApiOperation({ summary: 'Get all published content pages' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Published pages retrieved successfully',
  })
  async findPublishedPages(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return await this.contentPageService.findPublished(page, limit);
  }

  @Get('pages/featured')
  @ApiOperation({ summary: 'Get all featured content pages' })
  @ApiResponse({
    status: 200,
    description: 'Featured pages retrieved successfully',
  })
  async findFeaturedPages() {
    return await this.contentPageService.findFeatured();
  }

  @Get('pages/templates')
  @Roles('admin', 'content_manager')
  @ApiOperation({ summary: 'Get available page templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getTemplates() {
    return await this.contentPageService.getTemplates();
  }

  @Get('pages/stats')
  @Roles('admin', 'content_manager')
  @ApiOperation({ summary: 'Get content pages statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getPageStats() {
    return await this.contentPageService.getPageStats();
  }

  @Get('pages/:id')
  @Roles('admin', 'content_manager', 'content_viewer')
  @ApiOperation({ summary: 'Get content page by ID' })
  @ApiResponse({
    status: 200,
    description: 'Content page retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Content page not found' })
  async findPageById(@Param('id') id: string) {
    return await this.contentPageService.findOne(id);
  }

  @Get('pages/slug/:slug')
  @ApiOperation({ summary: 'Get content page by slug' })
  @ApiResponse({
    status: 200,
    description: 'Content page retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Content page not found' })
  async findPageBySlug(@Param('slug') slug: string) {
    return await this.contentPageService.findBySlug(slug);
  }

  @Patch('pages/:id')
  @Roles('admin', 'content_manager')
  @ApiOperation({ summary: 'Update content page' })
  @ApiResponse({
    status: 200,
    description: 'Content page updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Content page not found' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async updatePage(
    @Param('id') id: string,
    @Body() updateContentPageDto: UpdateContentPageDto,
  ) {
    return await this.contentPageService.update(id, updateContentPageDto);
  }

  @Post('pages/:id/publish')
  @Roles('admin', 'content_manager')
  @ApiOperation({ summary: 'Publish content page' })
  @ApiResponse({
    status: 200,
    description: 'Content page published successfully',
  })
  @ApiResponse({ status: 404, description: 'Content page not found' })
  async publishPage(@Param('id') id: string) {
    return await this.contentPageService.publish(id);
  }

  @Post('pages/:id/unpublish')
  @Roles('admin', 'content_manager')
  @ApiOperation({ summary: 'Unpublish content page' })
  @ApiResponse({
    status: 200,
    description: 'Content page unpublished successfully',
  })
  @ApiResponse({ status: 404, description: 'Content page not found' })
  async unpublishPage(@Param('id') id: string) {
    return await this.contentPageService.unpublish(id);
  }

  @Post('pages/:id/duplicate')
  @Roles('admin', 'content_manager')
  @ApiOperation({ summary: 'Duplicate content page' })
  @ApiResponse({
    status: 201,
    description: 'Content page duplicated successfully',
  })
  @ApiResponse({ status: 404, description: 'Content page not found' })
  async duplicatePage(
    @Param('id') id: string,
    @CurrentUserSession() user: UserEntity,
  ) {
    return await this.contentPageService.duplicate(id, user.id);
  }

  @Delete('pages/:id')
  @Roles('admin', 'content_manager')
  @ApiOperation({ summary: 'Delete content page' })
  @ApiResponse({
    status: 200,
    description: 'Content page deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Content page not found' })
  async removePage(@Param('id') id: string) {
    await this.contentPageService.remove(id);
    return { message: 'Content page deleted successfully' };
  }

  // Media Management Endpoints

  @Post('media/upload')
  @Roles('admin', 'content_manager')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload media file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        alt: { type: 'string' },
        description: { type: 'string' },
        folder: { type: 'string' },
        isPublic: { type: 'boolean' },
        tags: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or upload failed' })
  async uploadMedia(
    @UploadedFile() file: MediaFile,
    @Body() uploadMediaDto: UploadMediaDto,
    @CurrentUserSession() user: UserEntity,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return await this.mediaService.uploadFile(file, uploadMediaDto, user.id);
  }

  @Get('media')
  @Roles('admin', 'content_manager', 'content_viewer')
  @ApiOperation({ summary: 'Get all media files with pagination and filters' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: MediaType,
    description: 'Filter by media type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: MediaStatus,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    type: String,
    description: 'Filter by folder',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in filename and description',
  })
  @ApiQuery({
    name: 'uploadedBy',
    required: false,
    type: String,
    description: 'Filter by uploader',
  })
  @ApiQuery({
    name: 'isPublic',
    required: false,
    type: Boolean,
    description: 'Filter by public status',
  })
  @ApiResponse({
    status: 200,
    description: 'Media files retrieved successfully',
  })
  async findAllMedia(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: MediaType,
    @Query('status') status?: MediaStatus,
    @Query('folder') folder?: string,
    @Query('search') search?: string,
    @Query('uploadedBy') uploadedBy?: string,
    @Query('isPublic') isPublic?: boolean,
  ) {
    const filters: MediaFilters = {
      type,
      status,
      folder,
      search,
      uploadedBy,
      isPublic,
    };

    return await this.mediaService.findAll(page, limit, filters);
  }

  @Get('media/folders')
  @Roles('admin', 'content_manager', 'content_viewer')
  @ApiOperation({ summary: 'Get all media folders' })
  @ApiResponse({ status: 200, description: 'Folders retrieved successfully' })
  async getMediaFolders() {
    return await this.mediaService.getFolders();
  }

  @Get('media/stats')
  @Roles('admin', 'content_manager')
  @ApiOperation({ summary: 'Get media statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getMediaStats() {
    return await this.mediaService.getMediaStats();
  }

  @Get('media/:id')
  @Roles('admin', 'content_manager', 'content_viewer')
  @ApiOperation({ summary: 'Get media file by ID' })
  @ApiResponse({
    status: 200,
    description: 'Media file retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Media file not found' })
  async findMediaById(@Param('id') id: string) {
    return await this.mediaService.findOne(id);
  }

  @Patch('media/:id')
  @Roles('admin', 'content_manager')
  @ApiOperation({ summary: 'Update media file metadata' })
  @ApiResponse({ status: 200, description: 'Media file updated successfully' })
  @ApiResponse({ status: 404, description: 'Media file not found' })
  async updateMedia(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ) {
    return await this.mediaService.update(id, updateMediaDto);
  }

  @Delete('media/:id')
  @Roles('admin', 'content_manager')
  @ApiOperation({ summary: 'Delete media file' })
  @ApiResponse({ status: 200, description: 'Media file deleted successfully' })
  @ApiResponse({ status: 404, description: 'Media file not found' })
  async removeMedia(@Param('id') id: string) {
    await this.mediaService.remove(id);
    return { message: 'Media file deleted successfully' };
  }
}
