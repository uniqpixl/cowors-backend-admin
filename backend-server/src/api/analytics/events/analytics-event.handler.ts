import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import {
  BookingAnalyticsEvent,
  KYCAnalyticsEvent,
  PartnerAnalyticsEvent,
  PaymentAnalyticsEvent,
  RevenueAnalyticsEvent,
  SpaceUtilizationAnalyticsEvent,
  UserActivityAnalyticsEvent,
} from '@/common/events/domain-events/analytics.events';

import {
  BookingCancelledEvent,
  BookingCompletedEvent,
  BookingConfirmedEvent,
  BookingCreatedEvent,
} from '@/common/events/domain-events/booking.events';

import {
  PaymentCompletedEvent,
  PaymentFailedEvent,
  PaymentInitiatedEvent,
} from '@/common/events/domain-events/payment.events';

import {
  CommissionCalculatedEvent,
  CommissionPayoutCompletedEvent,
} from '@/common/events/domain-events/commission.events';

@Injectable()
export class AnalyticsEventHandler {
  private readonly logger = new Logger(AnalyticsEventHandler.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  // Booking Analytics Events
  @OnEvent('booking.created')
  async handleBookingCreated(event: BookingCreatedEvent) {
    this.logger.log(
      `Recording booking analytics for created booking: ${event.bookingId}`,
    );

    try {
      const analyticsEvent = new BookingAnalyticsEvent(
        event.bookingId,
        event.userId,
        event.partnerId,
        event.spaceId,
        event.totalAmount,
        this.calculateDuration(event.startDate, event.endDate),
        'STANDARD', // Default booking type
        event.status,
        'CREATED',
        {
          startDate: event.startDate,
          endDate: event.endDate,
          createdAt: event.occurredAt,
        },
      );

      this.eventEmitter.emit('analytics.booking', analyticsEvent);

      // Record user activity
      const userActivityEvent = new UserActivityAnalyticsEvent(
        event.userId,
        'BOOKING_CREATED',
        'booking',
        event.bookingId,
        undefined, // sessionId would come from request context
        undefined, // userAgent would come from request context
        undefined, // ipAddress would come from request context
        {
          spaceId: event.spaceId,
          partnerId: event.partnerId,
          amount: event.totalAmount,
        },
      );

      this.eventEmitter.emit('analytics.user_activity', userActivityEvent);
    } catch (error) {
      this.logger.error(
        `Failed to record booking created analytics: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('booking.confirmed')
  async handleBookingConfirmed(event: BookingConfirmedEvent) {
    this.logger.log(
      `Recording booking analytics for confirmed booking: ${event.bookingId}`,
    );

    try {
      const analyticsEvent = new BookingAnalyticsEvent(
        event.bookingId,
        event.userId,
        event.partnerId,
        '', // spaceId not available in this event
        event.totalAmount,
        0, // duration not available in this event
        'STANDARD',
        'CONFIRMED',
        'CONFIRMED',
        {
          confirmedAt: event.confirmedAt,
        },
      );

      this.eventEmitter.emit('analytics.booking', analyticsEvent);
    } catch (error) {
      this.logger.error(
        `Failed to record booking confirmed analytics: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('booking.completed')
  async handleBookingCompleted(event: BookingCompletedEvent) {
    this.logger.log(
      `Recording booking analytics for completed booking: ${event.bookingId}`,
    );

    try {
      const analyticsEvent = new BookingAnalyticsEvent(
        event.bookingId,
        event.userId,
        event.partnerId,
        event.spaceId,
        event.totalAmount,
        event.duration,
        'STANDARD',
        'COMPLETED',
        'COMPLETED',
        {
          completedAt: event.completedAt,
        },
      );

      this.eventEmitter.emit('analytics.booking', analyticsEvent);

      // Record revenue analytics
      const revenueEvent = new RevenueAnalyticsEvent(
        event.bookingId,
        event.partnerId,
        event.totalAmount,
        event.totalAmount * 0.1, // Assuming 10% commission
        event.totalAmount * 0.9, // Net amount to partner
        'BOOKING_COMPLETION',
        event.completedAt,
        {
          spaceId: event.spaceId,
          duration: event.duration,
        },
      );

      this.eventEmitter.emit('analytics.revenue', revenueEvent);
    } catch (error) {
      this.logger.error(
        `Failed to record booking completed analytics: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('booking.cancelled')
  async handleBookingCancelled(event: BookingCancelledEvent) {
    this.logger.log(
      `Recording booking analytics for cancelled booking: ${event.bookingId}`,
    );

    try {
      const analyticsEvent = new BookingAnalyticsEvent(
        event.bookingId,
        event.userId,
        event.partnerId,
        '', // spaceId not available in this event
        event.refundAmount || 0,
        0, // duration not available
        'STANDARD',
        'CANCELLED',
        'CANCELLED',
        {
          cancelledBy: event.cancelledBy,
          cancellationReason: event.cancellationReason,
          refundAmount: event.refundAmount,
          cancellationFee: event.cancellationFee,
        },
      );

      this.eventEmitter.emit('analytics.booking', analyticsEvent);
    } catch (error) {
      this.logger.error(
        `Failed to record booking cancelled analytics: ${error.message}`,
        error,
      );
    }
  }

  // Payment Analytics Events
  @OnEvent('payment.initiated')
  async handlePaymentInitiated(event: PaymentInitiatedEvent) {
    this.logger.log(
      `Recording payment analytics for initiated payment: ${event.paymentId}`,
    );

    try {
      const analyticsEvent = new PaymentAnalyticsEvent(
        event.paymentId,
        event.userId,
        event.bookingId,
        event.amount,
        event.currency,
        event.gateway,
        'INITIATED',
        'INITIATED',
        undefined, // processingTime not available yet
        {
          kycRequired: event.kycRequired,
        },
      );

      this.eventEmitter.emit('analytics.payment', analyticsEvent);
    } catch (error) {
      this.logger.error(
        `Failed to record payment initiated analytics: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    this.logger.log(
      `Recording payment analytics for completed payment: ${event.paymentId}`,
    );

    try {
      const analyticsEvent = new PaymentAnalyticsEvent(
        event.paymentId,
        event.userId,
        event.bookingId,
        event.amount,
        event.currency,
        event.gateway,
        'COMPLETED',
        'COMPLETED',
        undefined, // processingTime would need to be calculated
        {
          kycCompleted: event.kycCompleted,
          bookingStatus: event.bookingStatus,
        },
      );

      this.eventEmitter.emit('analytics.payment', analyticsEvent);
    } catch (error) {
      this.logger.error(
        `Failed to record payment completed analytics: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('payment.failed')
  async handlePaymentFailed(event: PaymentFailedEvent) {
    this.logger.log(
      `Recording payment analytics for failed payment: ${event.paymentId}`,
    );

    try {
      const analyticsEvent = new PaymentAnalyticsEvent(
        event.paymentId,
        event.userId,
        event.bookingId,
        event.amount,
        event.currency,
        event.gateway,
        'FAILED',
        'FAILED',
        undefined, // processingTime would need to be calculated
        {
          failureReason: event.failureReason,
          errorCode: event.errorCode,
        },
      );

      this.eventEmitter.emit('analytics.payment', analyticsEvent);
    } catch (error) {
      this.logger.error(
        `Failed to record payment failed analytics: ${error.message}`,
        error,
      );
    }
  }

  // Commission Analytics Events
  @OnEvent('commission.calculated')
  async handleCommissionCalculated(event: CommissionCalculatedEvent) {
    this.logger.log(
      `Recording commission analytics for calculation: ${event.calculationId}`,
    );

    try {
      const revenueEvent = new RevenueAnalyticsEvent(
        event.calculationId,
        event.partnerId,
        event.transactionAmount,
        event.commissionAmount,
        event.transactionAmount - event.commissionAmount,
        'COMMISSION_CALCULATION',
        new Date(),
        {
          bookingId: event.bookingId,
          commissionRate: event.commissionRate,
          ruleId: event.ruleId,
        },
      );

      this.eventEmitter.emit('analytics.revenue', revenueEvent);
    } catch (error) {
      this.logger.error(
        `Failed to record commission calculated analytics: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('commission.payout.completed')
  async handleCommissionPayoutCompleted(event: CommissionPayoutCompletedEvent) {
    this.logger.log(`Recording commission payout analytics: ${event.payoutId}`);

    try {
      const partnerAnalyticsEvent = new PartnerAnalyticsEvent(
        event.partnerId,
        'PAYOUT_COMPLETED',
        event.totalAmount,
        'daily',
        event.completedAt,
        {
          payoutId: event.payoutId,
          paymentReference: event.paymentReference,
          processedBy: event.processedBy,
        },
      );

      this.eventEmitter.emit('analytics.partner', partnerAnalyticsEvent);
    } catch (error) {
      this.logger.error(
        `Failed to record commission payout analytics: ${error.message}`,
        error,
      );
    }
  }

  // Analytics Event Processors
  @OnEvent('analytics.booking')
  async processBookingAnalytics(event: BookingAnalyticsEvent) {
    this.logger.debug(
      `Processing booking analytics: ${event.bookingId} - ${event.eventAction}`,
    );
    // Here you would typically store the analytics data in a time-series database
    // or send it to an analytics service like Google Analytics, Mixpanel, etc.
  }

  @OnEvent('analytics.payment')
  async processPaymentAnalytics(event: PaymentAnalyticsEvent) {
    this.logger.debug(
      `Processing payment analytics: ${event.paymentId} - ${event.eventAction}`,
    );
    // Store payment analytics data
  }

  @OnEvent('analytics.user_activity')
  async processUserActivityAnalytics(event: UserActivityAnalyticsEvent) {
    this.logger.debug(
      `Processing user activity analytics: ${event.userId} - ${event.activityType}`,
    );
    // Store user activity data for behavior analysis
  }

  @OnEvent('analytics.partner')
  async processPartnerAnalytics(event: PartnerAnalyticsEvent) {
    this.logger.debug(
      `Processing partner analytics: ${event.partnerId} - ${event.metricType}`,
    );
    // Store partner performance metrics
  }

  @OnEvent('analytics.revenue')
  async processRevenueAnalytics(event: RevenueAnalyticsEvent) {
    this.logger.debug(
      `Processing revenue analytics: ${event.transactionId} - ${event.transactionType}`,
    );
    // Store revenue data for financial reporting
  }

  @OnEvent('analytics.space_utilization')
  async processSpaceUtilizationAnalytics(
    event: SpaceUtilizationAnalyticsEvent,
  ) {
    this.logger.debug(
      `Processing space utilization analytics: ${event.spaceId}`,
    );
    // Store space utilization metrics
  }

  @OnEvent('analytics.kyc')
  async processKYCAnalytics(event: KYCAnalyticsEvent) {
    this.logger.debug(
      `Processing KYC analytics: ${event.kycId} - ${event.eventAction}`,
    );
    // Store KYC process metrics
  }

  private calculateDuration(startDate: Date, endDate: Date): number {
    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60)); // Duration in minutes
  }
}
