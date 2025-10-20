import { AuthGuard } from '@/auth/auth.guard';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ParseCoworsIdPipe } from '@/common/pipes/parse-cowors-id.pipe';
import {
  KycProvider,
  KycStatus,
  KycVerificationType,
  UserType,
} from '@/database/entities/kyc-verification.entity';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import { CashfreeWebhookDto } from '@/modules/kyc-verification/dto/cashfree-vrs.dto';
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
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  InitiateKycVerificationDto,
  KycStatusResponseDto,
  KycVerificationResponseDto,
  KycWebhookDto,
} from './dto/kyc-verification.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import {
  CursorPaginatedUserDto,
  OffsetPaginatedUserDto,
  QueryUsersCursorDto,
  QueryUsersOffsetDto,
  UserDto,
} from './dto/user.dto';
import { KycVerificationService } from './kyc-verification.service';
import { UserService } from './user.service';

@ApiTags('user')
@Controller({
  path: 'user',
  version: '1',
})
@UseGuards(AuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly kycVerificationService: KycVerificationService,
  ) {}

  @ApiAuth({
    summary: 'Get current user',
    type: UserDto,
  })
  @Get('whoami')
  async getCurrentUser(
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<UserDto> {
    return await this.userService.findOneUser(user.id);
  }

  @ApiAuth({
    summary: 'Get current user profile',
    type: UserDto,
  })
  @Get('profile')
  async getUserProfile(
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<UserDto> {
    return await this.userService.findOneUser(user.id);
  }

  @ApiAuth({
    summary: 'Get user dashboard stats',
  })
  @Get('dashboard/stats')
  async getUserDashboardStats(
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<any> {
    return await this.userService.getUserDashboardStats(user.id);
  }

  @Get('/all')
  @ApiAuth({
    type: OffsetPaginatedUserDto,
    summary: 'List users.',
    isPaginated: true,
  })
  async findAllUsers(
    @Query() dto: QueryUsersOffsetDto,
  ): Promise<OffsetPaginatedDto<UserDto>> {
    return await this.userService.findAllUsers(dto);
  }

  @Get('/all/cursor')
  @ApiAuth({
    type: CursorPaginatedUserDto,
    summary: 'List users via cursor.',
    isPaginated: true,
    paginationType: 'cursor',
  })
  async findAllUsersCursor(
    @Query() dto: QueryUsersCursorDto,
  ): Promise<CursorPaginatedDto<UserDto>> {
    return await this.userService.findAllUsersCursor(dto);
  }

  @Get(':id')
  @ApiAuth({ summary: 'Find user by id', type: UserDto })
  @ApiParam({ name: 'id', type: 'string' })
  async findUser(@Param('id', ParseCoworsIdPipe) id: string): Promise<UserDto> {
    return await this.userService.findOneUser(id);
  }

  @Delete(':id')
  @ApiAuth({
    summary: 'Delete a user',
    errorResponses: [400, 401, 403, 404, 500],
  })
  @ApiParam({ name: 'id', type: 'String' })
  deleteUser(@Param('id', ParseCoworsIdPipe) id: string) {
    return this.userService.deleteUser(id);
  }

  @ApiAuth({
    summary: "Update user's profile",
    type: UserDto,
  })
  @Patch('profile')
  updateUserProfile(
    @Body() dto: UpdateUserProfileDto,
    @CurrentUserSession() userSession: CurrentUserSession,
  ) {
    return this.userService.updateUserProfile(userSession.user.id, dto, {
      headers: userSession.headers,
    });
  }

  // KYC Verification Endpoints
  @Post('verification/initiate')
  @ApiOperation({ summary: 'Initiate KYC verification process' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'KYC verification initiated successfully',
    type: KycVerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Verification already in progress or invalid request',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or booking not found',
  })
  async initiateVerification(
    @Body() dto: InitiateKycVerificationDto,
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<KycVerificationResponseDto> {
    return this.kycVerificationService.initiateVerification(user.id, dto);
  }

  @Get('verification/status')
  @ApiOperation({ summary: 'Get current KYC verification status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KYC verification status retrieved successfully',
    type: KycStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No verification found for user',
  })
  async getVerificationStatus(
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<KycStatusResponseDto> {
    return this.kycVerificationService.getVerificationStatus(user.id);
  }

  @Post('verification/webhook')
  @ApiOperation({ summary: 'Handle KYC provider webhook' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Verification session not found',
  })
  async handleVerificationWebhook(
    @Body() dto: KycWebhookDto,
  ): Promise<{ success: boolean }> {
    return this.kycVerificationService.handleWebhook(dto);
  }

  @Get('verification/history')
  @ApiOperation({ summary: 'Get user verification history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification history retrieved successfully',
  })
  async getVerificationHistory(
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ) {
    return this.kycVerificationService.getUserVerifications(user.id);
  }

  // User KYC Flows - Aadhaar Verification
  @Post('kyc/aadhaar/initiate')
  @ApiOperation({ summary: 'Initiate Aadhaar verification for user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Aadhaar verification initiated successfully',
    type: KycVerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid Aadhaar number or verification already in progress',
  })
  async initiateAadhaarVerification(
    @Body() body: { aadhaarNumber: string; name: string; bookingId?: string },
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<KycVerificationResponseDto> {
    const dto: InitiateKycVerificationDto = {
      provider: KycProvider.CASHFREE,
      verificationType: KycVerificationType.AADHAAR_VERIFICATION,
      userType: UserType.USER,
      bookingId: body.bookingId,
      verificationData: {
        aadhaarNumber: body.aadhaarNumber,
        nameToMatch: body.name,
      },
    };
    return this.kycVerificationService.initiateVerification(user.id, dto);
  }

  @Get('kyc/aadhaar/status/:verificationId')
  @ApiOperation({ summary: 'Get Aadhaar verification status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Aadhaar verification status retrieved successfully',
    type: KycStatusResponseDto,
  })
  @ApiParam({ name: 'verificationId', type: 'string' })
  async getAadhaarVerificationStatus(
    @Param('verificationId') verificationId: string,
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<KycStatusResponseDto> {
    return this.kycVerificationService.getVerificationById(verificationId);
  }

  // User KYC Flows - PAN Verification
  @Post('kyc/pan/initiate')
  @ApiOperation({ summary: 'Initiate PAN verification for user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'PAN verification initiated successfully',
    type: KycVerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid PAN number or verification already in progress',
  })
  async initiatePanVerification(
    @Body()
    body: {
      panNumber: string;
      name: string;
      dateOfBirth: string;
      bookingId?: string;
    },
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<KycVerificationResponseDto> {
    const dto: InitiateKycVerificationDto = {
      provider: KycProvider.CASHFREE,
      verificationType: KycVerificationType.PAN_VERIFICATION,
      userType: UserType.USER,
      bookingId: body.bookingId,
      verificationData: {
        panNumber: body.panNumber,
        nameToMatch: body.name,
      },
    };
    return this.kycVerificationService.initiateVerification(user.id, dto);
  }

  @Get('kyc/pan/status/:verificationId')
  @ApiOperation({ summary: 'Get PAN verification status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PAN verification status retrieved successfully',
    type: KycStatusResponseDto,
  })
  @ApiParam({ name: 'verificationId', type: 'string' })
  async getPanVerificationStatus(
    @Param('verificationId') verificationId: string,
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<KycStatusResponseDto> {
    return this.kycVerificationService.getVerificationById(verificationId);
  }

  // Cashfree Webhook Handler
  @Post('kyc/cashfree/webhook')
  @ApiOperation({
    summary: 'Handle Cashfree VRS webhook for verification status updates',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Verification not found for Cashfree form ID',
  })
  async handleCashfreeWebhook(
    @Body() dto: CashfreeWebhookDto,
  ): Promise<{ success: boolean }> {
    return this.kycVerificationService.handleCashfreeWebhook(dto);
  }

  // Get User KYC Summary
  @Get('kyc/summary')
  @ApiOperation({ summary: 'Get user KYC verification summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User KYC summary retrieved successfully',
  })
  async getUserKycSummary(
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ) {
    const verifications =
      await this.kycVerificationService.getUserVerifications(user.id);

    // Group verifications by type
    const summary = {
      aadhaarVerification: verifications.find(
        (v) => v.verificationType === KycVerificationType.AADHAAR_VERIFICATION,
      ),
      panVerification: verifications.find(
        (v) => v.verificationType === KycVerificationType.PAN_VERIFICATION,
      ),
      overallStatus: 'PENDING',
      completedVerifications: verifications.filter(
        (v) => v.status === KycStatus.APPROVED,
      ).length,
      totalVerifications: verifications.length,
    };

    // Determine overall status
    if (
      summary.aadhaarVerification?.status === KycStatus.APPROVED &&
      summary.panVerification?.status === KycStatus.APPROVED
    ) {
      summary.overallStatus = 'COMPLETED';
    } else if (verifications.some((v) => v.status === KycStatus.IN_PROGRESS)) {
      summary.overallStatus = 'IN_PROGRESS';
    } else if (verifications.some((v) => v.status === KycStatus.REJECTED)) {
      summary.overallStatus = 'REJECTED';
    }

    return summary;
  }
}
