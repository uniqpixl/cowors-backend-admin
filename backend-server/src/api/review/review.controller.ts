import { AuthGuard } from '@/auth/auth.guard';
import { ReviewType } from '@/common/enums/review.enum';
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
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Review created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or user already reviewed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Space, partner, or booking not found',
  })
  async create(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    return this.reviewService.create(createReviewDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reviews retrieved successfully',
  })
  async findAll(@Query() queryDto: QueryReviewDto) {
    return this.reviewService.findAll(queryDto);
  }

  @Get('space/:spaceId')
  @ApiOperation({ summary: 'Get reviews for a specific space' })
  @ApiParam({ name: 'spaceId', description: 'Space ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space reviews retrieved successfully',
  })
  async findSpaceReviews(
    @Param('spaceId', ParseCoworsIdPipe) spaceId: string,
    @Query() queryDto: QueryReviewDto,
  ) {
    return this.reviewService.findAll({
      ...queryDto,
      spaceId,
      type: ReviewType.SPACE,
    });
  }

  @Get('partner/:partnerId')
  @ApiOperation({ summary: 'Get reviews for a specific partner' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner reviews retrieved successfully',
  })
  async findPartnerReviews(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @Query() queryDto: QueryReviewDto,
  ) {
    return this.reviewService.findAll({
      ...queryDto,
      partnerId,
      type: ReviewType.PARTNER,
    });
  }

  @Get('user/my-reviews')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reviews' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User reviews retrieved successfully',
  })
  async findMyReviews(@Request() req, @Query() queryDto: QueryReviewDto) {
    return this.reviewService.findAll({ ...queryDto, userId: req.user.id });
  }

  @Get('stats/space/:spaceId')
  @ApiOperation({ summary: 'Get rating statistics for a space' })
  @ApiParam({ name: 'spaceId', description: 'Space ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space rating statistics retrieved successfully',
  })
  async getSpaceStats(@Param('spaceId', ParseCoworsIdPipe) spaceId: string) {
    return this.reviewService.getAverageRating(ReviewType.SPACE, spaceId);
  }

  @Get('stats/partner/:partnerId')
  @ApiOperation({ summary: 'Get rating statistics for a partner' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner rating statistics retrieved successfully',
  })
  async getPartnerStats(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
  ) {
    return this.reviewService.getAverageRating(ReviewType.PARTNER, partnerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found',
  })
  async findOne(@Param('id', ParseCoworsIdPipe) id: string) {
    return this.reviewService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot update other users reviews',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found',
  })
  async update(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req,
  ) {
    return this.reviewService.update(id, updateReviewDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Review deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot delete other users reviews',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found',
  })
  async remove(@Param('id', ParseCoworsIdPipe) id: string, @Request() req) {
    await this.reviewService.remove(id, req.user.id);
    return { message: 'Review deleted successfully' };
  }

  @Patch(':id/hide')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hide a review (Admin only)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review hidden successfully',
  })
  async hideReview(@Param('id', ParseCoworsIdPipe) id: string) {
    return this.reviewService.hideReview(id);
  }

  @Patch(':id/verify')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a review (Admin only)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review verified successfully',
  })
  async verifyReview(@Param('id', ParseCoworsIdPipe) id: string) {
    return this.reviewService.verifyReview(id);
  }

  @Patch(':id/respond')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Respond to a review (Partner/Admin only)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Response added successfully',
  })
  async respondToReview(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateReviewDto: { response: string },
    @Request() req,
  ) {
    return this.reviewService.update(id, updateReviewDto, req.user.id, true);
  }
}
