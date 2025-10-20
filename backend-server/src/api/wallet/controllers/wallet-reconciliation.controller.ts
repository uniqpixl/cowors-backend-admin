import { Role as UserRole } from '@/api/user/user.enum';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
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
import { WalletReconciliationService } from '../services/wallet-reconciliation.service';

@ApiTags('Wallet Reconciliation')
@Controller('wallet/reconciliation')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WalletReconciliationController {
  constructor(
    private readonly walletReconciliationService: WalletReconciliationService,
  ) {}

  @Post('run-all')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Run reconciliation for all wallets (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation completed successfully',
  })
  @HttpCode(HttpStatus.OK)
  async reconcileAllWallets() {
    const summary =
      await this.walletReconciliationService.reconcileAllWallets();

    return {
      success: true,
      message: 'Wallet reconciliation completed successfully',
      data: summary,
    };
  }

  @Post(':partnerId/:currency/reconcile')
  @Roles(UserRole.Admin, UserRole.Partner)
  @ApiOperation({ summary: 'Force reconciliation for a specific wallet' })
  @ApiResponse({
    status: 200,
    description: 'Wallet reconciliation completed successfully',
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async reconcileWallet(
    @Param('partnerId') partnerId: string,
    @Param('currency') currency: string,
    @Request() req: any,
  ) {
    const report = await this.walletReconciliationService.forceReconciliation(
      partnerId,
      currency,
      req.user.id,
    );

    return {
      success: true,
      message: 'Wallet reconciliation completed successfully',
      data: {
        walletId: report.walletId,
        partnerId: report.partnerId,
        currency: report.currency,
        status: report.status,
        expectedBalance: report.expectedBalance,
        actualBalance: report.actualBalance,
        discrepancy: report.discrepancy,
        discrepancyPercentage: report.discrepancyPercentage,
        transactionCount: report.transactionCount,
        issueCount: report.issues.length,
        issues: report.issues.map((issue) => ({
          type: issue.type,
          severity: issue.severity,
          description: issue.description,
          transactionId: issue.transactionId,
          paymentId: issue.paymentId,
          refundId: issue.refundId,
          expectedAmount: issue.expectedAmount,
          actualAmount: issue.actualAmount,
        })),
        lastReconciliation: report.lastReconciliation,
      },
    };
  }

  @Get('stats')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get reconciliation statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation statistics retrieved successfully',
  })
  async getReconciliationStats() {
    const stats =
      await this.walletReconciliationService.getReconciliationStats();

    return {
      success: true,
      message: 'Reconciliation statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('history')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get reconciliation history (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation history retrieved successfully',
  })
  async getReconciliationHistory(
    @Query('partnerId') partnerId?: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    const result =
      await this.walletReconciliationService.getReconciliationHistory(
        partnerId,
        parseInt(limit),
        parseInt(offset),
      );

    return {
      success: true,
      message: 'Reconciliation history retrieved successfully',
      data: {
        reports: result.reports,
        pagination: {
          total: result.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: result.total > parseInt(offset) + parseInt(limit),
        },
      },
    };
  }

  @Get(':partnerId/reports')
  @Roles(UserRole.Admin, UserRole.Partner)
  @ApiOperation({
    summary: 'Get reconciliation reports for a specific partner',
  })
  @ApiResponse({
    status: 200,
    description: 'Partner reconciliation reports retrieved successfully',
  })
  async getPartnerReconciliationReports(
    @Param('partnerId') partnerId: string,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
  ) {
    const result =
      await this.walletReconciliationService.getReconciliationHistory(
        partnerId,
        parseInt(limit),
        parseInt(offset),
      );

    return {
      success: true,
      message: 'Partner reconciliation reports retrieved successfully',
      data: {
        partnerId,
        reports: result.reports,
        pagination: {
          total: result.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: result.total > parseInt(offset) + parseInt(limit),
        },
      },
    };
  }

  @Get('issues/summary')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get summary of reconciliation issues (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation issues summary retrieved successfully',
  })
  async getReconciliationIssuesSummary() {
    const stats =
      await this.walletReconciliationService.getReconciliationStats();
    const history =
      await this.walletReconciliationService.getReconciliationHistory(
        undefined,
        100,
        0,
      );

    // Aggregate issues from recent reconciliation reports
    const recentReports = history.reports.slice(0, 10); // Last 10 reconciliation runs
    const issuesSummary = {
      totalIssues: 0,
      criticalIssues: 0,
      highSeverityIssues: 0,
      mediumSeverityIssues: 0,
      lowSeverityIssues: 0,
      issueTypes: {
        MISSING_TRANSACTION: 0,
        DUPLICATE_TRANSACTION: 0,
        AMOUNT_MISMATCH: 0,
        STATUS_MISMATCH: 0,
      },
      walletsWithIssues: new Set(),
    };

    for (const report of recentReports) {
      if (report.summary && report.summary.reports) {
        for (const walletReport of report.summary.reports) {
          if (walletReport.issues && walletReport.issues.length > 0) {
            issuesSummary.walletsWithIssues.add(walletReport.walletId);

            for (const issue of walletReport.issues) {
              issuesSummary.totalIssues++;

              switch (issue.severity) {
                case 'CRITICAL':
                  issuesSummary.criticalIssues++;
                  break;
                case 'HIGH':
                  issuesSummary.highSeverityIssues++;
                  break;
                case 'MEDIUM':
                  issuesSummary.mediumSeverityIssues++;
                  break;
                case 'LOW':
                  issuesSummary.lowSeverityIssues++;
                  break;
              }

              if (issuesSummary.issueTypes[issue.type] !== undefined) {
                issuesSummary.issueTypes[issue.type]++;
              }
            }
          }
        }
      }
    }

    return {
      success: true,
      message: 'Reconciliation issues summary retrieved successfully',
      data: {
        ...issuesSummary,
        walletsWithIssues: issuesSummary.walletsWithIssues.size,
        lastReconciliationRun: stats.lastReconciliationRun,
        totalWallets: stats.totalWallets,
        healthScore:
          stats.totalWallets > 0
            ? (
                ((stats.totalWallets - issuesSummary.walletsWithIssues.size) /
                  stats.totalWallets) *
                100
              ).toFixed(2)
            : 100,
      },
    };
  }
}
