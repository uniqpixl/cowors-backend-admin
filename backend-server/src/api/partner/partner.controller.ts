import { AuthGuard } from '@/auth/auth.guard';
import { Uuid } from '@/common/types/common.type';
import {
  KycProvider,
  KycStatus,
  KycVerificationType,
  UserType,
} from '@/database/entities/kyc-verification.entity';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import {
  InitiateKycVerificationDto,
  KycStatusResponseDto,
  KycVerificationResponseDto,
} from '../user/dto/kyc-verification.dto';
import { KycVerificationService } from '../user/kyc-verification.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import {
  CursorPaginatedPartnerDto,
  OffsetPaginatedPartnerDto,
  PartnerDto,
  QueryPartnersCursorDto,
  QueryPartnersOffsetDto,
} from './dto/partner.dto';
import {
  UpdatePartnerDto,
  UpdatePartnerVerificationDto,
} from './dto/update-partner.dto';
import { PartnerService } from './partner.service';

@ApiTags('Partners')
@Controller({ path: 'partner', version: '1' })
export class PartnerController {
  constructor(
    private readonly partnerService: PartnerService,
    private readonly kycVerificationService: KycVerificationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({ summary: 'Create a new partner profile' })
  @ApiResponse({
    status: 201,
    description: 'Partner created successfully',
    type: PartnerDto,
  })
  async createPartner(
    @Body() createPartnerDto: CreatePartnerDto,
    @CurrentUserSession() user: CurrentUserSession,
  ) {
    return this.partnerService.createPartner(createPartnerDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all partners with offset pagination (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Partners retrieved successfully',
    type: OffsetPaginatedPartnerDto,
  })
  async findAllPartners(@Query() queryDto: QueryPartnersOffsetDto) {
    return this.partnerService.findAllPartners(queryDto);
  }

  @Get('cursor')
  @ApiOperation({ summary: 'Get all partners with cursor pagination (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Partners retrieved successfully',
    type: CursorPaginatedPartnerDto,
  })
  async findAllPartnersCursor(@Query() queryDto: QueryPartnersCursorDto) {
    return this.partnerService.findAllPartnersCursor(queryDto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({ summary: 'Get current user partner profile' })
  @ApiResponse({
    status: 200,
    description: 'Partner profile retrieved successfully',
    type: PartnerDto,
  })
  async getCurrentUserPartner(
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ) {
    return this.partnerService.findPartnerByUserId(user.id as Uuid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get partner by ID (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Partner retrieved successfully',
    type: PartnerDto,
  })
  async findPartner(@Param('id', ParseCoworsIdPipe) id: string) {
    return this.partnerService.findOnePartner(id as Uuid);
  }

  @Get('by-type/:typeId')
  @ApiOperation({ summary: 'Get partners by type (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Partners retrieved successfully',
    type: [PartnerDto],
  })
  async findPartnersByType(@Param('typeId', ParseCoworsIdPipe) typeId: string) {
    return this.partnerService.findPartnersByType(typeId as Uuid);
  }

  @Get('by-category/:categoryId')
  @ApiOperation({ summary: 'Get partners by category (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Partners retrieved successfully',
    type: [PartnerDto],
  })
  async findPartnersByCategory(
    @Param('categoryId', ParseCoworsIdPipe) categoryId: string,
  ) {
    return this.partnerService.findPartnersByCategory(categoryId as Uuid);
  }

  @Get('by-subcategory/:subcategoryId')
  @ApiOperation({ summary: 'Get partners by subcategory (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Partners retrieved successfully',
    type: [PartnerDto],
  })
  async findPartnersBySubcategory(
    @Param('subcategoryId', ParseCoworsIdPipe) subcategoryId: string,
  ) {
    return this.partnerService.findPartnersBySubcategory(subcategoryId as Uuid);
  }

  @Get(':id/with-categories')
  @ApiOperation({ summary: 'Get partner with category details (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Partner with categories retrieved successfully',
    type: PartnerDto,
  })
  async getPartnerWithCategories(@Param('id', ParseCoworsIdPipe) id: string) {
    return this.partnerService.getPartnerWithCategories(id as Uuid);
  }

  @Get(':id/stats')
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({ summary: 'Get partner statistics' })
  @ApiResponse({
    status: 200,
    description: 'Partner stats retrieved successfully',
  })
  async getPartnerStats(@Param('id', ParseCoworsIdPipe) id: string) {
    return this.partnerService.getPartnerStats(id as Uuid);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({ summary: 'Update partner profile' })
  @ApiResponse({
    status: 200,
    description: 'Partner updated successfully',
    type: PartnerDto,
  })
  async updatePartner(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updatePartnerDto: UpdatePartnerDto,
    @CurrentUserSession() user: CurrentUserSession,
  ) {
    return this.partnerService.updatePartner(
      id as Uuid,
      updatePartnerDto,
      user,
    );
  }
  @Patch(':id/verification')
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({ summary: 'Update partner verification status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Partner verification updated successfully',
    type: PartnerDto,
  })
  async updatePartnerVerification(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateVerificationDto: UpdatePartnerVerificationDto,
  ) {
    return this.partnerService.updatePartnerVerification(
      id as Uuid,
      updateVerificationDto,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({ summary: 'Delete partner profile' })
  @ApiResponse({
    status: 200,
    description: 'Partner deleted successfully',
    type: PartnerDto,
  })
  async deletePartner(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: CurrentUserSession,
  ) {
    return this.partnerService.deletePartner(id as Uuid, user);
  }

  // Partner KYC Flows - Business Details Verification
  @Post('kyc/business-details/initiate')
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({
    summary: 'Initiate business details verification for partner',
  })
  @ApiResponse({
    status: 201,
    description: 'Business details verification initiated successfully',
    type: KycVerificationResponseDto,
  })
  async initiateBusinessDetailsVerification(
    @Body()
    body: {
      businessName: string;
      businessType: string;
      registrationNumber: string;
      address: string;
      partnerId: string;
    },
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<KycVerificationResponseDto> {
    const dto: InitiateKycVerificationDto = {
      provider: KycProvider.CASHFREE,
      verificationType: KycVerificationType.BUSINESS_DETAILS,
      userType: UserType.PARTNER,
      partnerId: body.partnerId,
      verificationData: {
        businessName: body.businessName,
        businessType: body.businessType,
        registrationNumber: body.registrationNumber,
        address: body.address,
      },
    };
    return this.kycVerificationService.initiateVerification(user.id, dto);
  }

  // Partner KYC Flows - Bank Account Verification
  @Post('kyc/bank-account/initiate')
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({ summary: 'Initiate bank account verification for partner' })
  @ApiResponse({
    status: 201,
    description: 'Bank account verification initiated successfully',
    type: KycVerificationResponseDto,
  })
  async initiateBankAccountVerification(
    @Body()
    body: {
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      partnerId: string;
    },
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<KycVerificationResponseDto> {
    const dto: InitiateKycVerificationDto = {
      provider: KycProvider.CASHFREE,
      verificationType: KycVerificationType.BANK_ACCOUNT,
      userType: UserType.PARTNER,
      partnerId: body.partnerId,
      verificationData: {
        accountNumber: body.accountNumber,
        ifscCode: body.ifscCode,
        accountHolderName: body.accountHolderName,
      },
    };
    return this.kycVerificationService.initiateVerification(user.id, dto);
  }

  // Partner KYC Flows - GSTIN Verification
  @Post('kyc/gstin/initiate')
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({ summary: 'Initiate GSTIN verification for partner' })
  @ApiResponse({
    status: 201,
    description: 'GSTIN verification initiated successfully',
    type: KycVerificationResponseDto,
  })
  async initiateGstinVerification(
    @Body()
    body: {
      gstinNumber: string;
      businessName: string;
      partnerId: string;
    },
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<KycVerificationResponseDto> {
    const dto: InitiateKycVerificationDto = {
      provider: KycProvider.CASHFREE,
      verificationType: KycVerificationType.GSTIN_VERIFICATION,
      userType: UserType.PARTNER,
      partnerId: body.partnerId,
      verificationData: {
        gstinNumber: body.gstinNumber,
        businessName: body.businessName,
      },
    };
    return this.kycVerificationService.initiateVerification(user.id, dto);
  }

  // Partner KYC Flows - Business PAN Verification
  @Post('kyc/business-pan/initiate')
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({ summary: 'Initiate business PAN verification for partner' })
  @ApiResponse({
    status: 201,
    description: 'Business PAN verification initiated successfully',
    type: KycVerificationResponseDto,
  })
  async initiateBusinessPanVerification(
    @Body()
    body: {
      panNumber: string;
      businessName: string;
      partnerId: string;
    },
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<KycVerificationResponseDto> {
    const dto: InitiateKycVerificationDto = {
      provider: KycProvider.CASHFREE,
      verificationType: KycVerificationType.BUSINESS_PAN,
      userType: UserType.PARTNER,
      partnerId: body.partnerId,
      verificationData: {
        panNumber: body.panNumber,
        businessName: body.businessName,
      },
    };
    return this.kycVerificationService.initiateVerification(user.id, dto);
  }

  // Partner KYC Flows - Director Aadhaar Verification
  @Post('kyc/director-aadhaar/initiate')
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({
    summary: 'Initiate director Aadhaar verification for partner',
  })
  @ApiResponse({
    status: 201,
    description: 'Director Aadhaar verification initiated successfully',
    type: KycVerificationResponseDto,
  })
  async initiateDirectorAadhaarVerification(
    @Body()
    body: {
      aadhaarNumber: string;
      directorName: string;
      partnerId: string;
    },
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ): Promise<KycVerificationResponseDto> {
    const dto: InitiateKycVerificationDto = {
      provider: KycProvider.CASHFREE,
      verificationType: KycVerificationType.DIRECTOR_AADHAAR,
      userType: UserType.PARTNER,
      partnerId: body.partnerId,
      verificationData: {
        aadhaarNumber: body.aadhaarNumber,
        directorName: body.directorName,
      },
    };
    return this.kycVerificationService.initiateVerification(user.id, dto);
  }

  // Get Partner KYC Status
  @Get('kyc/status/:partnerId')
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({ summary: 'Get partner KYC verification status' })
  @ApiResponse({
    status: 200,
    description: 'Partner KYC status retrieved successfully',
  })
  async getPartnerKycStatus(
    @Param('partnerId') partnerId: string,
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ) {
    // Get all partner verifications
    const verifications =
      await this.kycVerificationService.getUserVerifications(user.id);
    const partnerVerifications = verifications.filter(
      (v) => v.partnerId === partnerId,
    );

    // Group verifications by type
    const summary = {
      businessDetailsVerification: partnerVerifications.find(
        (v) => v.verificationType === KycVerificationType.BUSINESS_DETAILS,
      ),
      bankAccountVerification: partnerVerifications.find(
        (v) => v.verificationType === KycVerificationType.BANK_ACCOUNT,
      ),
      gstinVerification: partnerVerifications.find(
        (v) => v.verificationType === KycVerificationType.GSTIN_VERIFICATION,
      ),
      businessPanVerification: partnerVerifications.find(
        (v) => v.verificationType === KycVerificationType.BUSINESS_PAN,
      ),
      directorAadhaarVerification: partnerVerifications.find(
        (v) => v.verificationType === KycVerificationType.DIRECTOR_AADHAAR,
      ),
      overallStatus: 'PENDING',
      completedVerifications: partnerVerifications.filter(
        (v) => v.status === KycStatus.APPROVED,
      ).length,
      totalVerifications: partnerVerifications.length,
    };

    // Determine overall status
    const requiredVerifications = [
      KycVerificationType.BUSINESS_DETAILS,
      KycVerificationType.BANK_ACCOUNT,
      KycVerificationType.GSTIN_VERIFICATION,
    ];
    const completedRequired = requiredVerifications.filter((type) =>
      partnerVerifications.find(
        (v) => v.verificationType === type && v.status === KycStatus.APPROVED,
      ),
    ).length;

    if (completedRequired === requiredVerifications.length) {
      summary.overallStatus = 'COMPLETED';
    } else if (
      partnerVerifications.some((v) => v.status === KycStatus.IN_PROGRESS)
    ) {
      summary.overallStatus = 'IN_PROGRESS';
    } else if (
      partnerVerifications.some((v) => v.status === KycStatus.REJECTED)
    ) {
      summary.overallStatus = 'REJECTED';
    }

    return summary;
  }

  // Get Partner KYC History
  @Get('kyc/history/:partnerId')
  @UseGuards(AuthGuard)
  @ApiAuth()
  @ApiOperation({ summary: 'Get partner KYC verification history' })
  @ApiResponse({
    status: 200,
    description: 'Partner KYC history retrieved successfully',
  })
  async getPartnerKycHistory(
    @Param('partnerId') partnerId: string,
    @CurrentUserSession('user') user: CurrentUserSession['user'],
  ) {
    const verifications =
      await this.kycVerificationService.getUserVerifications(user.id);
    return verifications.filter((v) => v.partnerId === partnerId);
  }
}
