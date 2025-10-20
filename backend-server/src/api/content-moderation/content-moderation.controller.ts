import { Role } from '@/api/user/user.enum';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ContentModerationService } from './content-moderation.service';
import { CreateModerationDto } from './dto/create-moderation.dto';
import {
  ModerationQueryDto,
  UpdateModerationDto,
} from './dto/update-moderation.dto';
import {
  ContentModerationEntity,
  ModerationStatus,
} from './entities/content-moderation.entity';

@ApiTags('Content Moderation')
@Controller('content-moderation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContentModerationController {
  constructor(
    private readonly contentModerationService: ContentModerationService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a moderation record manually' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Moderation record created successfully',
    type: ContentModerationEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid moderation data',
  })
  async create(
    @Body() createModerationDto: CreateModerationDto,
  ): Promise<ContentModerationEntity> {
    return await this.contentModerationService.create(createModerationDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({
    summary: 'Get all moderation records with filtering and pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation records retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ModerationStatus })
  @ApiQuery({ name: 'contentType', required: false, type: String })
  @ApiQuery({ name: 'authorId', required: false, type: String })
  @ApiQuery({ name: 'moderatorId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query() query: ModerationQueryDto,
  ): Promise<OffsetPaginatedDto<ContentModerationEntity>> {
    return await this.contentModerationService.findAll(query);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Get pending moderation items for manual review' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending moderation items retrieved successfully',
    type: [ContentModerationEntity],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of items to return',
  })
  async getPendingReviews(
    @Query('limit') limit?: number,
  ): Promise<ContentModerationEntity[]> {
    return await this.contentModerationService.getPendingReviews(limit);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get moderation statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation statistics retrieved successfully',
  })
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
    return await this.contentModerationService.getStats();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Get a moderation record by ID' })
  @ApiParam({ name: 'id', description: 'Moderation record ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation record retrieved successfully',
    type: ContentModerationEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Moderation record not found',
  })
  async findOne(@Param('id') id: string): Promise<ContentModerationEntity> {
    return await this.contentModerationService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Update moderation status (manual review)' })
  @ApiParam({ name: 'id', description: 'Moderation record ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation record updated successfully',
    type: ContentModerationEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Moderation record not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update data or record already processed',
  })
  async update(
    @Param('id') id: string,
    @Body() updateModerationDto: UpdateModerationDto,
    @Request() req: any,
  ): Promise<ContentModerationEntity> {
    // Automatically set moderator ID from the authenticated user
    if (!updateModerationDto.moderatorId) {
      updateModerationDto.moderatorId = req.user.id;
    }

    return await this.contentModerationService.update(id, updateModerationDto);
  }

  @Post('bulk-update')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Bulk approve/reject moderation items' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of moderation record IDs',
        },
        status: {
          type: 'string',
          enum: Object.values(ModerationStatus),
          description: 'New status for all records',
        },
        reason: {
          type: 'string',
          description: 'Reason for the bulk action',
        },
      },
      required: ['ids', 'status'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk update completed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk update data',
  })
  async bulkUpdate(
    @Body() body: { ids: string[]; status: ModerationStatus; reason?: string },
    @Request() req: any,
  ): Promise<{ message: string }> {
    const { ids, status, reason } = body;
    await this.contentModerationService.bulkUpdate(
      ids,
      status,
      req.user.id,
      reason,
    );
    return { message: `Successfully updated ${ids.length} moderation records` };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a moderation record' })
  @ApiParam({ name: 'id', description: 'Moderation record ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Moderation record deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Moderation record not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.contentModerationService.remove(id);
  }
}
