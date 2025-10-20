import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../decorators/roles.decorator';
import { RolesGuard } from '../../../guards/roles.guard';
import { Role as UserRole } from '../../user/user.enum';
import {
  EscrowHoldDto,
  EscrowReleaseDto,
  WalletEscrowService,
} from '../services/wallet-escrow.service';

@ApiTags('Wallet Escrow')
@Controller('wallet/escrow')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WalletEscrowController {
  constructor(private readonly walletEscrowService: WalletEscrowService) {}

  @Post(':partnerId/hold')
  @Roles(UserRole.Admin, UserRole.Partner)
  @ApiOperation({ summary: 'Create escrow hold on wallet funds' })
  @ApiResponse({ status: 201, description: 'Escrow hold created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Insufficient balance or invalid request',
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @HttpCode(HttpStatus.CREATED)
  async createEscrowHold(
    @Param('partnerId') partnerId: string,
    @Body() escrowDto: EscrowHoldDto,
    @Request() req: any,
  ) {
    const transaction = await this.walletEscrowService.createEscrowHold(
      partnerId,
      escrowDto,
      req.user.id,
    );

    return {
      success: true,
      message: 'Escrow hold created successfully',
      data: {
        holdId: transaction.transactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        description: transaction.description,
        referenceId: transaction.referenceId,
        referenceType: transaction.referenceType,
        createdAt: transaction.createdAt,
        expiresAt: (transaction.metadata as any)?.expiresAt,
      },
    };
  }

  @Put(':partnerId/hold/:holdId/release')
  @Roles(UserRole.Admin, UserRole.Partner)
  @ApiOperation({ summary: 'Release escrow hold and transfer funds' })
  @ApiResponse({
    status: 200,
    description: 'Escrow hold released successfully',
  })
  @ApiResponse({ status: 404, description: 'Escrow hold not found' })
  @ApiResponse({ status: 400, description: 'Invalid release amount' })
  async releaseEscrowHold(
    @Param('partnerId') partnerId: string,
    @Param('holdId') holdId: string,
    @Body() releaseDto: Omit<EscrowReleaseDto, 'holdId'>,
    @Request() req: any,
  ) {
    const transaction = await this.walletEscrowService.releaseEscrowHold(
      partnerId,
      { ...releaseDto, holdId },
      req.user.id,
    );

    return {
      success: true,
      message: 'Escrow hold released successfully',
      data: {
        releaseTransactionId: transaction.transactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        description: transaction.description,
        processedAt: transaction.processedAt,
        originalHoldId: (transaction.metadata as any)?.originalHoldId,
      },
    };
  }

  @Delete(':partnerId/hold/:holdId')
  @Roles(UserRole.Admin, UserRole.Partner)
  @ApiOperation({
    summary: 'Cancel escrow hold and return funds to available balance',
  })
  @ApiResponse({
    status: 200,
    description: 'Escrow hold cancelled successfully',
  })
  @ApiResponse({ status: 404, description: 'Escrow hold not found' })
  async cancelEscrowHold(
    @Param('partnerId') partnerId: string,
    @Param('holdId') holdId: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    const transaction = await this.walletEscrowService.cancelEscrowHold(
      partnerId,
      holdId,
      req.user.id,
      body.reason,
    );

    return {
      success: true,
      message: 'Escrow hold cancelled successfully',
      data: {
        cancelTransactionId: transaction.transactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        reason: body.reason,
        processedAt: transaction.processedAt,
        originalHoldId: (transaction.metadata as any)?.originalHoldId,
      },
    };
  }

  @Get(':partnerId/holds')
  @Roles(UserRole.Admin, UserRole.Partner)
  @ApiOperation({ summary: 'Get all active escrow holds for a wallet' })
  @ApiResponse({
    status: 200,
    description: 'Active escrow holds retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getActiveEscrowHolds(@Param('partnerId') partnerId: string) {
    const holds =
      await this.walletEscrowService.getActiveEscrowHolds(partnerId);

    return {
      success: true,
      message: 'Active escrow holds retrieved successfully',
      data: {
        holds: holds.map((hold) => ({
          holdId: hold.transactionId,
          amount: hold.amount,
          currency: hold.currency,
          status: hold.status,
          description: hold.description,
          referenceId: hold.referenceId,
          referenceType: hold.referenceType,
          createdAt: hold.createdAt,
          expiresAt: (hold.metadata as any)?.expiresAt,
          metadata: hold.metadata,
        })),
        totalAmount: holds.reduce((sum, hold) => sum + hold.amount, 0),
        count: holds.length,
      },
    };
  }

  @Get(':partnerId/hold/:holdId')
  @Roles(UserRole.Admin, UserRole.Partner)
  @ApiOperation({ summary: 'Get escrow hold by ID' })
  @ApiResponse({
    status: 200,
    description: 'Escrow hold retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Escrow hold not found' })
  async getEscrowHoldById(
    @Param('partnerId') partnerId: string,
    @Param('holdId') holdId: string,
  ) {
    const hold = await this.walletEscrowService.getEscrowHoldById(
      partnerId,
      holdId,
    );

    return {
      success: true,
      message: 'Escrow hold retrieved successfully',
      data: {
        holdId: hold.transactionId,
        amount: hold.amount,
        currency: hold.currency,
        status: hold.status,
        description: hold.description,
        referenceId: hold.referenceId,
        referenceType: hold.referenceType,
        createdAt: hold.createdAt,
        processedAt: hold.processedAt,
        expiresAt: (hold.metadata as any)?.expiresAt,
        metadata: hold.metadata,
      },
    };
  }

  @Post('expire-holds')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Manually trigger expiration of escrow holds (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Escrow hold expiration process completed',
  })
  @HttpCode(HttpStatus.OK)
  async expireEscrowHolds() {
    await this.walletEscrowService.expireEscrowHolds();

    return {
      success: true,
      message: 'Escrow hold expiration process completed',
    };
  }
}
