import { Role as UserRole } from '@/api/user/user.enum';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import {
  CurrencyExchangeDto,
  WalletMultiCurrencyService,
} from '../services/wallet-multi-currency.service';

@ApiTags('Wallet Multi-Currency')
@Controller('wallet/multi-currency')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WalletMultiCurrencyController {
  constructor(
    private readonly walletMultiCurrencyService: WalletMultiCurrencyService,
  ) {}

  @Post(':partnerId/enable')
  @Roles(UserRole.Admin, UserRole.Partner)
  @ApiOperation({ summary: 'Enable multi-currency support for a wallet' })
  @ApiResponse({
    status: 201,
    description: 'Multi-currency support enabled successfully',
  })
  @ApiResponse({ status: 404, description: 'Primary wallet not found' })
  @HttpCode(HttpStatus.CREATED)
  async enableMultiCurrency(
    @Param('partnerId') partnerId: string,
    @Body() body: { currencies: string[]; baseCurrency: string },
    @Request() req: any,
  ) {
    const wallets = await this.walletMultiCurrencyService.enableMultiCurrency(
      partnerId,
      body.currencies,
      body.baseCurrency,
      req.user.id,
    );

    return {
      success: true,
      message: 'Multi-currency support enabled successfully',
      data: {
        partnerId,
        baseCurrency: body.baseCurrency,
        supportedCurrencies: body.currencies,
        wallets: wallets.map((wallet) => ({
          id: wallet.id,
          currency: wallet.currency,
          balance: wallet.balance,
          availableBalance: wallet.availableBalance,
          pendingBalance: wallet.pendingBalance,
          status: wallet.status,
        })),
      },
    };
  }

  @Post(':partnerId/exchange')
  @Roles(UserRole.Admin, UserRole.Partner)
  @ApiOperation({ summary: 'Exchange currency between wallets' })
  @ApiResponse({
    status: 200,
    description: 'Currency exchange completed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient balance or invalid exchange rate',
  })
  @ApiResponse({
    status: 404,
    description: 'Source or destination wallet not found',
  })
  async exchangeCurrency(
    @Param('partnerId') partnerId: string,
    @Body() exchangeDto: CurrencyExchangeDto,
    @Request() req: any,
  ) {
    const result = await this.walletMultiCurrencyService.exchangeCurrency(
      partnerId,
      exchangeDto,
      req.user.id,
    );

    return {
      success: true,
      message: 'Currency exchange completed successfully',
      data: {
        fromCurrency: exchangeDto.fromCurrency,
        toCurrency: exchangeDto.toCurrency,
        originalAmount: exchangeDto.amount,
        convertedAmount: exchangeDto.amount * exchangeDto.exchangeRate,
        exchangeRate: exchangeDto.exchangeRate,
        debitTransaction: {
          id: result.debitTransaction.transactionId,
          amount: result.debitTransaction.amount,
          currency: result.debitTransaction.currency,
          balanceAfter: result.debitTransaction.balanceAfter,
        },
        creditTransaction: {
          id: result.creditTransaction.transactionId,
          amount: result.creditTransaction.amount,
          currency: result.creditTransaction.currency,
          balanceAfter: result.creditTransaction.balanceAfter,
        },
      },
    };
  }

  @Get(':partnerId/wallets')
  @Roles(UserRole.Admin, UserRole.Partner)
  @ApiOperation({
    summary: 'Get all wallets for a partner (multi-currency view)',
  })
  @ApiResponse({
    status: 200,
    description: 'Multi-currency wallets retrieved successfully',
  })
  async getMultiCurrencyWallets(@Param('partnerId') partnerId: string) {
    const wallets =
      await this.walletMultiCurrencyService.getMultiCurrencyWallets(partnerId);

    return {
      success: true,
      message: 'Multi-currency wallets retrieved successfully',
      data: {
        partnerId,
        wallets: wallets.map((wallet) => ({
          id: wallet.id,
          currency: wallet.currency,
          balance: wallet.balance,
          availableBalance: wallet.availableBalance,
          pendingBalance: wallet.pendingBalance,
          status: wallet.status,
          minBalanceThreshold: wallet.minBalanceThreshold,
          maxBalanceLimit: wallet.maxBalanceLimit,
          autoPayoutEnabled: wallet.autoPayoutEnabled,
          autoPayoutThreshold: wallet.autoPayoutThreshold,
          lastTransactionAt: wallet.lastTransactionAt,
          isMultiCurrency: wallet.metadata?.isMultiCurrency || false,
          baseCurrency: wallet.metadata?.baseCurrency,
        })),
        totalWallets: wallets.length,
        supportedCurrencies: [...new Set(wallets.map((w) => w.currency))],
      },
    };
  }

  @Get(':partnerId/balance/:currency')
  @Roles(UserRole.Admin, UserRole.Partner)
  @ApiOperation({ summary: 'Get wallet balance in specific currency' })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet for specified currency not found',
  })
  async getWalletBalance(
    @Param('partnerId') partnerId: string,
    @Param('currency') currency: string,
  ) {
    const wallet = await this.walletMultiCurrencyService.getWalletBalance(
      partnerId,
      currency,
    );

    return {
      success: true,
      message: 'Wallet balance retrieved successfully',
      data: {
        partnerId,
        currency,
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        pendingBalance: wallet.pendingBalance,
        status: wallet.status,
        lastTransactionAt: wallet.lastTransactionAt,
      },
    };
  }

  @Post(':partnerId/consolidated-balance')
  @Roles(UserRole.Admin, UserRole.Partner)
  @ApiOperation({ summary: 'Get consolidated balance in base currency' })
  @ApiResponse({
    status: 200,
    description: 'Consolidated balance calculated successfully',
  })
  async getConsolidatedBalance(
    @Param('partnerId') partnerId: string,
    @Body()
    body: { baseCurrency: string; exchangeRates: Record<string, number> },
  ) {
    const consolidatedBalance =
      await this.walletMultiCurrencyService.getConsolidatedBalance(
        partnerId,
        body.baseCurrency,
        body.exchangeRates,
      );

    return {
      success: true,
      message: 'Consolidated balance calculated successfully',
      data: consolidatedBalance,
    };
  }

  @Post(':partnerId/auto-convert')
  @Roles(UserRole.Admin, UserRole.Partner)
  @ApiOperation({ summary: 'Auto-convert currency based on thresholds' })
  @ApiResponse({
    status: 200,
    description: 'Auto-conversion completed or not needed',
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient balance for conversion',
  })
  async autoConvertCurrency(
    @Param('partnerId') partnerId: string,
    @Body()
    body: {
      fromCurrency: string;
      toCurrency: string;
      threshold: number;
      exchangeRate: number;
    },
    @Request() req: any,
  ) {
    await this.walletMultiCurrencyService.autoConvertCurrency(
      partnerId,
      body.fromCurrency,
      body.toCurrency,
      body.threshold,
      body.exchangeRate,
      req.user.id,
    );

    return {
      success: true,
      message: 'Auto-conversion process completed',
      data: {
        fromCurrency: body.fromCurrency,
        toCurrency: body.toCurrency,
        threshold: body.threshold,
        exchangeRate: body.exchangeRate,
      },
    };
  }

  @Get(':partnerId/exchange-history')
  @Roles(UserRole.Admin, UserRole.Partner)
  @ApiOperation({ summary: 'Get exchange history for a partner' })
  @ApiResponse({
    status: 200,
    description: 'Exchange history retrieved successfully',
  })
  async getExchangeHistory(
    @Param('partnerId') partnerId: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    const result = await this.walletMultiCurrencyService.getExchangeHistory(
      partnerId,
      parseInt(limit),
      parseInt(offset),
    );

    return {
      success: true,
      message: 'Exchange history retrieved successfully',
      data: {
        transactions: result.transactions.map((transaction) => ({
          id: transaction.transactionId,
          type: transaction.type,
          amount: transaction.amount,
          currency: transaction.currency,
          balanceAfter: transaction.balanceAfter,
          status: transaction.status,
          description: transaction.description,
          referenceId: transaction.referenceId,
          createdAt: transaction.createdAt,
          processedAt: transaction.processedAt,
          exchangeRate: (transaction.metadata as any)?.exchangeRate,
          fromCurrency: (transaction.metadata as any)?.fromCurrency,
          toCurrency: (transaction.metadata as any)?.toCurrency,
          originalAmount: (transaction.metadata as any)?.originalAmount,
          convertedAmount: (transaction.metadata as any)?.convertedAmount,
        })),
        pagination: {
          total: result.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: result.total > parseInt(offset) + parseInt(limit),
        },
      },
    };
  }
}
