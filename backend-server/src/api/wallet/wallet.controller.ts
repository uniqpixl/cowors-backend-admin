import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateWalletDto,
  GetWalletTransactionsDto,
  UpdateWalletDto,
  WalletResponseDto,
  WalletStatsDto,
  WalletSummaryDto,
  WalletTransactionDto,
} from './dto/wallet.dto';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Create a new wallet for partner' })
  @ApiResponse({
    status: 201,
    description: 'Wallet created successfully',
    type: WalletResponseDto,
  })
  async createWallet(
    @Body() createWalletDto: CreateWalletDto,
    @CurrentUserSession() user: any,
  ): Promise<WalletResponseDto> {
    return this.walletService.createWallet(createWalletDto);
  }

  @Get('partner/:partnerId')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get wallet details for a partner' })
  @ApiResponse({
    status: 200,
    description: 'Wallet details retrieved successfully',
    type: WalletResponseDto,
  })
  async getPartnerWallet(
    @Param('partnerId') partnerId: string,
    @CurrentUserSession() user: any,
  ): Promise<WalletResponseDto> {
    return this.walletService.getPartnerWallet(partnerId, user);
  }

  @Get('stats/:partnerId')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get wallet statistics for a partner' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Wallet statistics retrieved successfully',
    type: WalletStatsDto,
  })
  async getWalletStats(
    @Param('partnerId') partnerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUserSession() user?: any,
  ): Promise<WalletStatsDto> {
    return this.walletService.getPartnerWalletStats(
      partnerId,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      user,
    );
  }

  @Get('summary/:partnerId')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get wallet summary for a partner' })
  @ApiResponse({
    status: 200,
    description: 'Wallet summary retrieved successfully',
    type: WalletSummaryDto,
  })
  async getWalletSummary(
    @Param('partnerId') partnerId: string,
    @CurrentUserSession() user: any,
  ): Promise<WalletSummaryDto> {
    return this.walletService.getWalletSummary(partnerId, user);
  }

  @Get('transactions/:partnerId')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get wallet transactions for a partner' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Wallet transactions retrieved successfully',
  })
  async getWalletTransactions(
    @Param('partnerId') partnerId: string,
    @Query() query: GetWalletTransactionsDto,
    @CurrentUserSession() user: any,
  ) {
    return this.walletService.getWalletTransactions(partnerId, query, user);
  }

  @Post('credit/:partnerId')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Credit amount to partner wallet' })
  @ApiResponse({
    status: 200,
    description: 'Amount credited successfully',
    type: WalletTransactionDto,
  })
  async creditWallet(
    @Param('partnerId') partnerId: string,
    @Body() transactionDto: WalletTransactionDto,
    @CurrentUserSession() user: any,
  ) {
    return this.walletService.creditWallet(partnerId, transactionDto, user.id);
  }

  @Post('debit/:partnerId')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Debit amount from partner wallet' })
  @ApiResponse({
    status: 200,
    description: 'Amount debited successfully',
    type: WalletTransactionDto,
  })
  async debitWallet(
    @Param('partnerId') partnerId: string,
    @Body() transactionDto: WalletTransactionDto,
    @CurrentUserSession() user: any,
  ) {
    return this.walletService.debitWallet(partnerId, transactionDto, user.id);
  }

  @Post('freeze/:partnerId')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Freeze partner wallet' })
  @ApiResponse({
    status: 200,
    description: 'Wallet frozen successfully',
  })
  async freezeWallet(
    @Param('partnerId') partnerId: string,
    @Body() body: { reason: string },
    @CurrentUserSession() user: any,
  ) {
    return this.walletService.freezeWallet(partnerId, body.reason, user.id);
  }

  @Post('unfreeze/:partnerId')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Unfreeze partner wallet' })
  @ApiResponse({
    status: 200,
    description: 'Wallet unfrozen successfully',
  })
  async unfreezeWallet(
    @Param('partnerId') partnerId: string,
    @Body() body: { reason: string },
    @CurrentUserSession() user: any,
  ) {
    return this.walletService.unfreezeWallet(partnerId, body.reason, user.id);
  }

  @Patch(':walletId')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Update wallet settings' })
  @ApiResponse({
    status: 200,
    description: 'Wallet updated successfully',
    type: WalletResponseDto,
  })
  async updateWallet(
    @Param('walletId') walletId: string,
    @Body() updateWalletDto: UpdateWalletDto,
    @CurrentUserSession() user: any,
  ): Promise<WalletResponseDto> {
    return this.walletService.updateWallet(walletId, updateWalletDto, user.id);
  }

  @Get('balance/:partnerId')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get current wallet balance' })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance retrieved successfully',
  })
  async getWalletBalance(
    @Param('partnerId') partnerId: string,
    @CurrentUserSession() user: any,
  ) {
    return this.walletService.getWalletBalance(partnerId, user);
  }

  @Get('pending-settlements/:partnerId')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get pending settlements for partner' })
  @ApiResponse({
    status: 200,
    description: 'Pending settlements retrieved successfully',
  })
  async getPendingSettlements(
    @Param('partnerId') partnerId: string,
    @CurrentUserSession() user: any,
  ) {
    return this.walletService.getPendingSettlements(partnerId, user);
  }

  @Post('request-payout/:partnerId')
  @Roles('partner')
  @ApiOperation({ summary: 'Request payout from wallet' })
  @ApiResponse({
    status: 200,
    description: 'Payout request submitted successfully',
  })
  async requestPayout(
    @Param('partnerId') partnerId: string,
    @Body() body: { amount: number; notes?: string },
    @CurrentUserSession() user: any,
  ) {
    return this.walletService.requestPayout(partnerId, body, user);
  }
}
