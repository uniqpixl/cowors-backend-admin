import { Role } from '@/api/user/user.enum';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { CouponEntity } from '@/database/entities/coupon.entity';
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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import {
  CouponQueryDto,
  CouponUsageDto,
  ValidateCouponDto,
} from './dto/coupon-query.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@ApiTags('Coupons')
@Controller('coupons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Partner)
  @ApiOperation({ summary: 'Create a new coupon' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Coupon created successfully',
    type: CouponEntity,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Coupon code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid coupon data',
  })
  async create(
    @Body() createCouponDto: CreateCouponDto,
  ): Promise<CouponEntity> {
    return await this.couponService.create(createCouponDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Partner)
  @ApiOperation({ summary: 'Get all coupons with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupons retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'scope', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'partnerId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async findAll(
    @Query() query: CouponQueryDto,
  ): Promise<OffsetPaginatedDto<CouponEntity>> {
    return await this.couponService.findAll(query);
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate a coupon code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon validation result',
  })
  @ApiQuery({ name: 'code', required: true, type: String })
  @ApiQuery({ name: 'orderAmount', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'partnerId', required: false, type: String })
  async validateCoupon(@Query() validateDto: ValidateCouponDto): Promise<{
    valid: boolean;
    coupon?: CouponEntity;
    discountAmount?: number;
    message?: string;
  }> {
    return await this.couponService.validateCoupon(validateDto);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply a coupon to a booking' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon applied successfully',
    type: CouponEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid coupon or usage conditions not met',
  })
  async applyCoupon(@Body() usageDto: CouponUsageDto): Promise<CouponEntity> {
    return await this.couponService.applyCoupon(usageDto);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Partner)
  @ApiOperation({ summary: 'Get a coupon by ID' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon retrieved successfully',
    type: CouponEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Coupon not found',
  })
  async findOne(@Param('id') id: string): Promise<CouponEntity> {
    return await this.couponService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get a coupon by code' })
  @ApiParam({ name: 'code', description: 'Coupon code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon retrieved successfully',
    type: CouponEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Coupon not found',
  })
  async findByCode(@Param('code') code: string): Promise<CouponEntity> {
    return await this.couponService.findByCode(code);
  }

  @Get(':id/stats')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Partner)
  @ApiOperation({ summary: 'Get coupon usage statistics' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon statistics retrieved successfully',
  })
  async getCouponStats(@Param('id') id: string): Promise<{
    totalUsage: number;
    remainingUsage: number;
    userUsageBreakdown: Array<{ userId: string; usageCount: number }>;
    revenueImpact: number;
  }> {
    return await this.couponService.getCouponStats(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Partner)
  @ApiOperation({ summary: 'Update a coupon' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon updated successfully',
    type: CouponEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Coupon not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update data',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ): Promise<CouponEntity> {
    return await this.couponService.update(id, updateCouponDto);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Partner)
  @ApiOperation({ summary: 'Deactivate a coupon' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon deactivated successfully',
    type: CouponEntity,
  })
  async deactivateCoupon(@Param('id') id: string): Promise<CouponEntity> {
    return await this.couponService.deactivateCoupon(id);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Partner)
  @ApiOperation({ summary: 'Activate a coupon' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon activated successfully',
    type: CouponEntity,
  })
  async activateCoupon(@Param('id') id: string): Promise<CouponEntity> {
    return await this.couponService.activateCoupon(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a coupon' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Coupon deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Coupon not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.couponService.remove(id);
  }
}
