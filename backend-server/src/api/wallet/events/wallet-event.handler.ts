import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import {
  WalletBalanceUpdatedEvent,
  WalletLowBalanceAlertEvent,
  WalletTransactionCompletedEvent,
  WalletTransactionCreatedEvent,
  WalletTransactionFailedEvent,
  WalletWithdrawalCompletedEvent,
  WalletWithdrawalFailedEvent,
  WalletWithdrawalRequestedEvent,
} from '@/common/events/domain-events/wallet.events';

import { BookingCompletedEvent } from '@/common/events/domain-events/booking.events';

import {
  CommissionCalculatedEvent,
  CommissionPayoutCompletedEvent,
} from '@/common/events/domain-events/commission.events';

import { NotificationService } from '@/api/notification/notification.service';
import { NotificationType } from '@/common/enums/notification.enum';
import { NotificationCategory } from '@/database/entities/notification.entity';
import { WalletService } from '../wallet.service';

@Injectable()
export class WalletEventHandler {
  private readonly logger = new Logger(WalletEventHandler.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Handle booking completion for automatic wallet operations
  @OnEvent('booking.completed')
  async handleBookingCompleted(event: BookingCompletedEvent) {
    this.logger.log(
      `Processing wallet operations for completed booking: ${event.bookingId}`,
    );

    try {
      // This will be handled by commission calculation, but we can add additional wallet logic here
      // For example, updating partner wallet balance or creating transaction records

      // Emit analytics event for wallet activity
      this.eventEmitter.emit('analytics.wallet_activity', {
        bookingId: event.bookingId,
        partnerId: event.partnerId,
        amount: event.totalAmount,
        activityType: 'BOOKING_COMPLETION',
        timestamp: event.completedAt,
      });
    } catch (error) {
      this.logger.error(
        `Failed to process wallet operations for booking completion: ${error.message}`,
        error,
      );
    }
  }

  // Handle commission calculation for wallet updates
  @OnEvent('commission.calculated')
  async handleCommissionCalculated(event: CommissionCalculatedEvent) {
    this.logger.log(
      `Processing wallet update for commission calculation: ${event.calculationId}`,
    );

    try {
      // Update partner wallet with commission amount
      const partnerWallet = await this.walletService.getWalletByPartnerId(
        event.partnerId,
      );
      if (partnerWallet) {
        await this.walletService.creditWallet(
          event.partnerId,
          {
            amount: event.transactionAmount - event.commissionAmount, // Net amount after commission
            description: `Commission payment for booking ${event.bookingId}`,
            type: 'COMMISSION' as any,
            metadata: {
              calculationId: event.calculationId,
              bookingId: event.bookingId,
              commissionAmount: event.commissionAmount,
            },
          },
          'system',
        );

        // Emit wallet balance updated event
        const walletBalanceEvent = new WalletBalanceUpdatedEvent(
          partnerWallet.id,
          event.partnerId,
          partnerWallet.balance,
          partnerWallet.balance +
            (event.transactionAmount - event.commissionAmount),
          event.transactionAmount - event.commissionAmount,
          'CREDIT',
          event.calculationId,
          `Commission payment for booking ${event.bookingId}`,
          'USD',
        );

        this.eventEmitter.emit('wallet.balance.updated', walletBalanceEvent);
      }

      // Note: Platform wallet functionality would need to be implemented separately
      // as it's not currently available in the wallet service
    } catch (error) {
      this.logger.error(
        `Failed to process wallet update for commission: ${error.message}`,
        error,
      );
    }
  }

  // Handle wallet balance updates
  @OnEvent('wallet.balance.updated')
  async handleWalletBalanceUpdated(event: WalletBalanceUpdatedEvent) {
    this.logger.log(
      `Wallet balance updated: ${event.walletId} - ${event.transactionType} ${event.amount}`,
    );

    try {
      // Check for low balance alerts
      const lowBalanceThreshold = 100; // $100 threshold
      if (
        event.newBalance < lowBalanceThreshold &&
        event.transactionType === 'DEBIT'
      ) {
        const alertEvent = new WalletLowBalanceAlertEvent(
          event.walletId,
          event.userId,
          event.newBalance,
          lowBalanceThreshold,
          event.newBalance < 50 ? 'CRITICAL' : 'WARNING',
        );

        this.eventEmitter.emit('wallet.low_balance.alert', alertEvent);
      }

      // Send notification for significant balance changes
      if (event.amount >= 50) {
        // Notify for transactions >= $50
        const notification = await this.notificationService.createNotification({
          userId: event.userId,
          type: NotificationType.PAYMENT_SUCCESS,
          category: NotificationCategory.WALLET,
          title: `Wallet ${event.transactionType === 'CREDIT' ? 'Credit' : 'Debit'}`,
          message: `Your wallet has been ${event.transactionType === 'CREDIT' ? 'credited' : 'debited'} with $${event.amount}. New balance: $${event.newBalance}`,
          data: {
            variables: {
              transactionId: event.transactionId,
              amount: event.amount,
              transactionType: event.transactionType,
              newBalance: event.newBalance,
            },
          },
        });
        await this.notificationService.sendNotification(notification.id);
      }

      // Emit analytics event
      this.eventEmitter.emit('analytics.wallet_transaction', {
        walletId: event.walletId,
        userId: event.userId,
        amount: event.amount,
        transactionType: event.transactionType,
        newBalance: event.newBalance,
        description: event.description,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle wallet balance update: ${error.message}`,
        error,
      );
    }
  }

  // Handle wallet transaction creation
  @OnEvent('wallet.transaction.created')
  async handleWalletTransactionCreated(event: WalletTransactionCreatedEvent) {
    this.logger.log(
      `Wallet transaction created: ${event.transactionId} - ${event.status}`,
    );

    try {
      // Log transaction for audit trail
      this.logger.debug(
        `Transaction ${event.transactionId}: ${event.transactionType} ${event.amount} - ${event.description}`,
      );

      // If transaction is pending, you might want to set up monitoring or timeouts
      if (event.status === 'PENDING') {
        // Could implement timeout monitoring here
        this.logger.debug(
          `Transaction ${event.transactionId} is pending processing`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle wallet transaction creation: ${error.message}`,
        error,
      );
    }
  }

  // Handle wallet transaction completion
  @OnEvent('wallet.transaction.completed')
  async handleWalletTransactionCompleted(
    event: WalletTransactionCompletedEvent,
  ) {
    this.logger.log(`Wallet transaction completed: ${event.transactionId}`);

    try {
      // Send completion notification
      const notification = await this.notificationService.createNotification({
        userId: event.userId,
        type: NotificationType.PAYMENT_SUCCESS,
        category: NotificationCategory.WALLET,
        title: 'Transaction Completed',
        message: `Your ${event.transactionType.toLowerCase()} transaction of $${event.amount} has been completed successfully.`,
        data: {
          variables: {
            transactionId: event.transactionId,
            amount: event.amount,
            transactionType: event.transactionType,
            finalBalance: event.finalBalance,
            completedAt: event.completedAt,
          },
        },
      });
      await this.notificationService.sendNotification(notification.id);

      // Emit analytics event
      this.eventEmitter.emit('analytics.transaction_completed', {
        transactionId: event.transactionId,
        walletId: event.walletId,
        userId: event.userId,
        amount: event.amount,
        transactionType: event.transactionType,
        completedAt: event.completedAt,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle wallet transaction completion: ${error.message}`,
        error,
      );
    }
  }

  // Handle wallet transaction failures
  @OnEvent('wallet.transaction.failed')
  async handleWalletTransactionFailed(event: WalletTransactionFailedEvent) {
    this.logger.error(
      `Wallet transaction failed: ${event.transactionId} - ${event.failureReason}`,
    );

    try {
      // Send failure notification
      const notification = await this.notificationService.createNotification({
        userId: event.userId,
        type: NotificationType.PAYMENT_FAILED,
        category: NotificationCategory.WALLET,
        title: 'Transaction Failed',
        message: `Your ${event.transactionType.toLowerCase()} transaction of $${event.amount} has failed. Reason: ${event.failureReason}`,
        data: {
          variables: {
            transactionId: event.transactionId,
            amount: event.amount,
            transactionType: event.transactionType,
            failureReason: event.failureReason,
            errorCode: event.errorCode,
          },
        },
      });
      await this.notificationService.sendNotification(notification.id);

      // Log for investigation
      this.logger.error(
        `Transaction failure details: ${JSON.stringify({
          transactionId: event.transactionId,
          walletId: event.walletId,
          amount: event.amount,
          failureReason: event.failureReason,
          errorCode: event.errorCode,
        })}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle wallet transaction failure: ${error.message}`,
        error,
      );
    }
  }

  // Handle withdrawal requests
  @OnEvent('wallet.withdrawal.requested')
  async handleWalletWithdrawalRequested(event: WalletWithdrawalRequestedEvent) {
    this.logger.log(
      `Wallet withdrawal requested: ${event.withdrawalId} - $${event.amount}`,
    );

    try {
      // Send confirmation notification
      const notification = await this.notificationService.createNotification({
        userId: event.userId,
        type: NotificationType.SYSTEM_UPDATE,
        category: NotificationCategory.WALLET,
        title: 'Withdrawal Request Received',
        message: `Your withdrawal request of $${event.amount} has been received and is being processed.`,
        data: {
          variables: {
            withdrawalId: event.withdrawalId,
            amount: event.amount,
            withdrawalMethod: event.withdrawalMethod,
          },
        },
      });
      await this.notificationService.sendNotification(notification.id);

      // Emit analytics event
      this.eventEmitter.emit('analytics.withdrawal_requested', {
        withdrawalId: event.withdrawalId,
        walletId: event.walletId,
        userId: event.userId,
        amount: event.amount,
        withdrawalMethod: event.withdrawalMethod,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle wallet withdrawal request: ${error.message}`,
        error,
      );
    }
  }

  // Handle withdrawal completion
  @OnEvent('wallet.withdrawal.completed')
  async handleWalletWithdrawalCompleted(event: WalletWithdrawalCompletedEvent) {
    this.logger.log(`Wallet withdrawal completed: ${event.withdrawalId}`);

    try {
      // Send completion notification
      const notification = await this.notificationService.createNotification({
        userId: event.userId,
        type: NotificationType.PAYMENT_SUCCESS,
        category: NotificationCategory.WALLET,
        title: 'Withdrawal Completed',
        message: `Your withdrawal of $${event.amount} has been completed successfully. Reference: ${event.paymentReference}`,
        data: {
          variables: {
            withdrawalId: event.withdrawalId,
            amount: event.amount,
            paymentReference: event.paymentReference,
            completedAt: event.completedAt,
            processedBy: event.processedBy,
          },
        },
      });
      await this.notificationService.sendNotification(notification.id);
    } catch (error) {
      this.logger.error(
        `Failed to handle wallet withdrawal completion: ${error.message}`,
        error,
      );
    }
  }

  // Handle withdrawal failures
  @OnEvent('wallet.withdrawal.failed')
  async handleWalletWithdrawalFailed(event: WalletWithdrawalFailedEvent) {
    this.logger.error(
      `Wallet withdrawal failed: ${event.withdrawalId} - ${event.failureReason}`,
    );

    try {
      // Send failure notification
      const notification = await this.notificationService.createNotification({
        userId: event.userId,
        type: NotificationType.PAYMENT_FAILED,
        category: NotificationCategory.WALLET,
        title: 'Withdrawal Failed',
        message: `Your withdrawal of $${event.amount} has failed. Reason: ${event.failureReason}`,
        data: {
          variables: {
            withdrawalId: event.withdrawalId,
            amount: event.amount,
            failureReason: event.failureReason,
            errorCode: event.errorCode,
          },
        },
      });
      await this.notificationService.sendNotification(notification.id);
    } catch (error) {
      this.logger.error(
        `Failed to handle wallet withdrawal failure: ${error.message}`,
        error,
      );
    }
  }

  // Handle low balance alerts
  @OnEvent('wallet.low_balance.alert')
  async handleWalletLowBalanceAlert(event: WalletLowBalanceAlertEvent) {
    this.logger.warn(
      `Low balance alert: ${event.walletId} - $${event.currentBalance} (threshold: $${event.threshold})`,
    );

    try {
      // Send low balance notification
      const notification = await this.notificationService.createNotification({
        userId: event.userId,
        type: NotificationType.SYSTEM_UPDATE,
        category: NotificationCategory.WALLET,
        title: `${event.alertLevel === 'CRITICAL' ? 'Critical' : 'Warning'}: Low Wallet Balance`,
        message: `Your wallet balance is ${event.alertLevel === 'CRITICAL' ? 'critically' : ''} low: $${event.currentBalance}. Consider adding funds to continue using our services.`,
        data: {
          variables: {
            currentBalance: event.currentBalance,
            threshold: event.threshold,
            alertLevel: event.alertLevel,
          },
        },
      });

      await this.notificationService.sendNotification(notification.id);

      // Emit analytics event
      this.eventEmitter.emit('analytics.low_balance_alert', {
        walletId: event.walletId,
        userId: event.userId,
        currentBalance: event.currentBalance,
        threshold: event.threshold,
        alertLevel: event.alertLevel,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle low balance alert: ${error.message}`,
        error,
      );
    }
  }
}
