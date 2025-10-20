import {
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from '@/common/enums/notification.enum';
import {
  ErrorCodes,
  ErrorResponseUtil,
} from '@/common/utils/error-response.util';
import {
  NotificationCategory,
  NotificationEntity,
} from '@/database/entities/notification.entity';
import { EntityType, IdGeneratorService } from '@/utils/id-generator.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, LessThanOrEqual, Repository } from 'typeorm';
import {
  BulkNotificationDto,
  CreateNotificationDto,
  NotificationQueryDto,
  UpdateNotificationStatusDto,
} from './dto/notification.dto';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { WebSocketService } from './services/websocket.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
    private configService: ConfigService,
    private emailService: EmailService,
    private smsService: SmsService,
    private webSocketService: WebSocketService,
    private idGeneratorService: IdGeneratorService,
  ) {}

  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationEntity> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      notificationId: this.idGeneratorService.generateId(
        EntityType.NOTIFICATION,
      ),
      scheduledAt: createNotificationDto.scheduledAt
        ? new Date(createNotificationDto.scheduledAt)
        : null,
      expiresAt: createNotificationDto.expiresAt
        ? new Date(createNotificationDto.expiresAt)
        : null,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    // Send immediately if not scheduled
    if (!createNotificationDto.scheduledAt) {
      await this.sendNotification(savedNotification.id);
    }

    return savedNotification;
  }

  async createBulkNotifications(
    bulkNotificationDto: BulkNotificationDto,
  ): Promise<NotificationEntity[]> {
    const notifications = bulkNotificationDto.userIds.map((userId) => {
      return this.notificationRepository.create({
        userId,
        type: bulkNotificationDto.type,
        category: bulkNotificationDto.category,
        title: bulkNotificationDto.title,
        message: bulkNotificationDto.message,
        data: bulkNotificationDto.data,
        notificationId: this.idGeneratorService.generateId(
          EntityType.NOTIFICATION,
        ),
        priority: NotificationPriority.MEDIUM,
        scheduledAt: bulkNotificationDto.scheduledAt
          ? new Date(bulkNotificationDto.scheduledAt)
          : null,
      });
    });

    const savedNotifications =
      await this.notificationRepository.save(notifications);

    // Send immediately if not scheduled
    if (!bulkNotificationDto.scheduledAt) {
      await Promise.all(
        savedNotifications.map((notification) =>
          this.sendNotification(notification.id),
        ),
      );
    }

    return savedNotifications;
  }

  async sendNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
      relations: ['user'],
    });

    if (!notification) {
      throw ErrorResponseUtil.notFound('Notification', notificationId);
    }

    if (notification.status !== NotificationStatus.UNREAD) {
      throw ErrorResponseUtil.badRequest(
        'Notification already processed',
        ErrorCodes.INVALID_STATUS,
      );
    }

    // Check if notification has expired
    if (notification.expiresAt && new Date() > notification.expiresAt) {
      await this.updateNotificationStatus(notificationId, {
        status: NotificationStatus.ARCHIVED,
        failureReason: 'Notification expired',
      });
      return;
    }

    try {
      // Send based on notification type
      switch (notification.type) {
        case NotificationType.BOOKING_CONFIRMED:
        case NotificationType.BOOKING_CANCELLED:
        case NotificationType.BOOKING_REMINDER:
          await this.sendEmailNotification(notification);
          break;
        case NotificationType.PAYMENT_SUCCESS:
        case NotificationType.PAYMENT_FAILED:
        case NotificationType.REFUND_PROCESSED:
          await this.sendSmsNotification(notification);
          break;
        case NotificationType.SYSTEM_UPDATE:
        case NotificationType.PROMOTION:
          await this.sendPushNotification(notification);
          break;
        default:
          // In-app notifications are stored in database only
          break;
      }

      await this.updateNotificationStatus(notificationId, {
        status: NotificationStatus.READ,
      });

      // Update sent timestamp
      await this.notificationRepository.update(notificationId, {
        sentAt: new Date(),
      });
    } catch (error) {
      await this.updateNotificationStatus(notificationId, {
        status: NotificationStatus.ARCHIVED,
        failureReason: error.message,
      });

      // Retry logic
      if (notification.retryCount < notification.maxRetries) {
        await this.notificationRepository.update(notificationId, {
          retryCount: notification.retryCount + 1,
          status: NotificationStatus.UNREAD,
        });

        // Schedule retry (exponential backoff)
        const retryDelay = Math.pow(2, notification.retryCount) * 1000; // 1s, 2s, 4s, 8s...
        setTimeout(() => {
          this.sendNotification(notificationId);
        }, retryDelay);
      }
    }
  }

  private async sendEmailNotification(
    notification: NotificationEntity,
  ): Promise<void> {
    const emailConfig = notification.channels?.email;
    if (!emailConfig) {
      throw new Error('Email configuration not found');
    }

    await this.emailService.sendEmail({
      to: emailConfig.to,
      subject: emailConfig.subject,
      template: emailConfig.template,
      data: {
        title: notification.title,
        message: notification.message,
        ...notification.data?.variables,
      },
      attachments: emailConfig.attachments,
    });
  }

  private async sendSmsNotification(
    notification: NotificationEntity,
  ): Promise<void> {
    const smsConfig = notification.channels?.sms;
    if (!smsConfig) {
      throw new Error('SMS configuration not found');
    }

    await this.smsService.sendSms({
      to: smsConfig.to,
      message: notification.message,
      template: smsConfig.template,
      data: notification.data?.variables,
    });
  }

  private async sendPushNotification(
    notification: NotificationEntity,
  ): Promise<void> {
    const pushConfig = notification.channels?.push;
    if (!pushConfig?.deviceTokens?.length) {
      throw new Error('Push notification configuration not found');
    }

    // Implementation would depend on your push notification service (FCM, APNS, etc.)
    // For now, we'll just log it
    console.log('Sending push notification:', {
      tokens: pushConfig.deviceTokens,
      title: notification.title,
      message: notification.message,
      data: notification.data,
    });
  }

  private async sendInAppNotification(
    notification: NotificationEntity,
  ): Promise<void> {
    // Send real-time notification via WebSocket
    await this.webSocketService.sendToUser(notification.userId, {
      type: 'notification',
      data: {
        id: notification.notificationId,
        title: notification.title,
        message: notification.message,
        category: notification.category,
        priority: notification.priority,
        data: notification.data,
        createdAt: notification.createdAt,
      },
    });
  }

  async updateNotificationStatus(
    notificationId: string,
    updateDto: UpdateNotificationStatusDto,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw ErrorResponseUtil.notFound('Notification', notificationId);
    }

    const updateData: Partial<NotificationEntity> = {
      status: updateDto.status,
    };

    if (updateDto.failureReason) {
      updateData.failureReason = updateDto.failureReason;
    }

    if (updateDto.status === NotificationStatus.READ) {
      updateData.deliveredAt = new Date();
    }

    if (updateDto.status === NotificationStatus.READ) {
      updateData.readAt = new Date();
    }

    await this.notificationRepository.update(notificationId, updateData);

    return this.notificationRepository.findOne({
      where: { id: notificationId },
    });
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId, userId },
    });

    if (!notification) {
      throw ErrorResponseUtil.notFound('Notification', notificationId);
    }

    await this.notificationRepository.update(notification.id, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });

    return this.notificationRepository.findOne({
      where: { id: notification.id },
    });
  }

  async getUserNotifications(
    userId: string,
    queryDto: NotificationQueryDto,
  ): Promise<{ notifications: NotificationEntity[]; total: number }> {
    const {
      type,
      category,
      status,
      priority,
      page = 1,
      limit = 20,
      includeRead = true,
    } = queryDto;

    const where: FindOptionsWhere<NotificationEntity> = {
      userId,
    };

    if (type) where.type = type;
    if (category) where.category = category;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (!includeRead) {
      where.status = In([NotificationStatus.UNREAD, NotificationStatus.READ]);
    }

    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

    return { notifications, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        userId,
        status: In([NotificationStatus.READ, NotificationStatus.UNREAD]),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationRepository.update(
      {
        userId,
        status: In([NotificationStatus.UNREAD, NotificationStatus.READ]),
      },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    );
    return result.affected || 0;
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<boolean> {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId, userId },
    });

    if (!notification) {
      throw ErrorResponseUtil.notFound('Notification', notificationId);
    }

    const result = await this.notificationRepository.softDelete(
      notification.id,
    );
    return result.affected > 0;
  }

  async clearAllNotifications(userId: string): Promise<number> {
    const result = await this.notificationRepository.softDelete({ userId });
    return result.affected || 0;
  }

  async sendAdminNotification(
    notificationData: CreateNotificationDto,
  ): Promise<NotificationEntity[]> {
    // For admin notifications, we might want to send to multiple users or all users
    // For now, we'll create a single notification
    const notification = await this.createNotification(notificationData);
    await this.sendNotification(notification.id);
    return [notification];
  }

  async processScheduledNotifications(): Promise<void> {
    const scheduledNotifications = await this.notificationRepository.find({
      where: {
        status: NotificationStatus.UNREAD,
        scheduledAt: LessThanOrEqual(new Date()),
      },
    });

    for (const notification of scheduledNotifications) {
      if (notification.scheduledAt && new Date() >= notification.scheduledAt) {
        await this.sendNotification(notification.id);
      }
    }
  }

  async broadcastNotification(
    notificationData: CreateNotificationDto,
  ): Promise<number> {
    // This method sends a notification to all users or a specific group
    // For now, we'll implement a simple version that creates individual notifications
    // In a real implementation, you might want to use a more efficient approach

    // For demonstration, let's assume we're broadcasting to all active users
    // You would need to implement user fetching logic based on your requirements

    const notification = await this.createNotification(notificationData);
    await this.sendNotification(notification.id);

    // Return the count of notifications sent (1 for now)
    return 1;
  }

  // Template-based notification methods
  async sendBookingConfirmation(
    userId: string,
    bookingData: any,
  ): Promise<void> {
    // Prepare message with discount information if applicable
    let message = `Your booking for ${bookingData.spaceName} has been confirmed.`;
    if (bookingData.discountAmount && bookingData.couponCode) {
      message += ` You saved ₹${bookingData.discountAmount} with coupon ${bookingData.couponCode}.`;
    }

    await this.createNotification({
      userId,
      type: NotificationType.SYSTEM_UPDATE,
      category: NotificationCategory.BOOKING,
      priority: NotificationPriority.HIGH,
      title: 'Booking Confirmed',
      message,
      referenceId: bookingData.bookingId,
      referenceType: 'booking',
      data: {
        templateId: 'booking-confirmation',
        variables: {
          ...bookingData,
          // Ensure discount fields are properly formatted
          originalAmount: bookingData.originalAmount
            ? `₹${bookingData.originalAmount}`
            : undefined,
          discountAmount: bookingData.discountAmount
            ? `₹${bookingData.discountAmount}`
            : undefined,
          totalAmount: `₹${bookingData.totalAmount}`,
        },
      },
      channels: {
        email: {
          to: bookingData.userEmail,
          subject: 'Booking Confirmation - Cowors',
          template: 'booking-confirmation',
        },
      },
    });
  }

  async sendPaymentConfirmation(
    userId: string,
    paymentData: any,
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.SYSTEM_UPDATE,
      category: NotificationCategory.PAYMENT,
      priority: NotificationPriority.HIGH,
      title: 'Payment Successful',
      message: `Your payment of ₹${paymentData.amount} has been processed successfully.`,
      referenceId: paymentData.paymentId,
      referenceType: 'payment',
      data: {
        templateId: 'payment-confirmation',
        variables: paymentData,
      },
      channels: {
        email: {
          to: paymentData.userEmail,
          subject: 'Payment Confirmation - Cowors',
          template: 'payment-confirmation',
        },
      },
    });
  }

  async sendPaymentInitiated(userId: string, paymentData: any): Promise<void> {
    const message = paymentData.kycRequired
      ? `Payment initiated for ₹${paymentData.amount}. KYC verification required to proceed.`
      : `Payment initiated for ₹${paymentData.amount}. Processing...`;

    await this.createNotification({
      userId,
      type: NotificationType.SYSTEM_UPDATE,
      category: NotificationCategory.PAYMENT,
      priority: paymentData.kycRequired
        ? NotificationPriority.HIGH
        : NotificationPriority.MEDIUM,
      title: paymentData.kycRequired
        ? 'KYC Required for Payment'
        : 'Payment Initiated',
      message,
      referenceId: paymentData.paymentId,
      referenceType: 'payment',
      data: {
        templateId: 'payment-initiated',
        variables: paymentData,
      },
      channels: {
        email: paymentData.kycRequired
          ? {
              to: paymentData.userEmail,
              subject: 'KYC Verification Required - Cowors',
              template: 'kyc-required',
            }
          : undefined,
      },
    });
  }

  async sendPaymentFailed(userId: string, paymentData: any): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.SYSTEM_UPDATE,
      category: NotificationCategory.PAYMENT,
      priority: NotificationPriority.HIGH,
      title: 'Payment Failed',
      message: `Your payment of ₹${paymentData.amount} could not be processed. ${paymentData.failureReason || 'Please try again.'}`,
      referenceId: paymentData.paymentId,
      referenceType: 'payment',
      data: {
        templateId: 'payment-failed',
        variables: paymentData,
      },
      channels: {
        email: {
          to: paymentData.userEmail,
          subject: 'Payment Failed - Cowors',
          template: 'payment-failed',
        },
      },
    });
  }

  async sendKycRequired(userId: string, kycData: any): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.SYSTEM_UPDATE,
      category: NotificationCategory.VERIFICATION,
      priority: NotificationPriority.HIGH,
      title: 'KYC Verification Required',
      message:
        'Please complete your KYC verification to proceed with your booking.',
      referenceId: kycData.bookingId,
      referenceType: 'kyc',
      data: {
        templateId: 'kyc-required',
        variables: kycData,
      },
      channels: {
        email: {
          to: kycData.userEmail,
          subject: 'KYC Verification Required - Cowors',
          template: 'kyc-required',
        },
      },
    });
  }

  async sendKycCompleted(userId: string, kycData: any): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.SYSTEM_UPDATE,
      category: NotificationCategory.VERIFICATION,
      priority: NotificationPriority.HIGH,
      title: 'KYC Verification Completed',
      message:
        'Your KYC verification has been completed successfully. Your payment will now be processed.',
      referenceId: kycData.bookingId,
      referenceType: 'kyc',
      data: {
        templateId: 'kyc-completed',
        variables: kycData,
      },
      channels: {
        email: {
          to: kycData.userEmail,
          subject: 'KYC Verification Completed - Cowors',
          template: 'kyc-completed',
        },
      },
    });
  }

  async getNotificationById(
    notificationId: string,
    userId: string,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId, userId },
    });

    if (!notification) {
      throw ErrorResponseUtil.notFound('Notification', notificationId);
    }

    return notification;
  }

  async sendWalletUpdate(userId: string, walletData: any): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.SYSTEM_UPDATE,
      category: NotificationCategory.WALLET,
      priority: NotificationPriority.MEDIUM,
      title: 'Wallet Updated',
      message: `Your wallet balance has been updated. New balance: ₹${walletData.balance}`,
      referenceId: walletData.transactionId,
      referenceType: 'wallet_transaction',
      data: {
        variables: walletData,
      },
    });
  }

  async getUserPreferences(userId: string): Promise<any> {
    // This would typically fetch user notification preferences from a preferences table
    // For now, return default preferences
    return {
      email: true,
      sms: false,
      push: true,
      inApp: true,
      categories: {
        booking: true,
        payment: true,
        wallet: true,
        marketing: false,
        system: true,
      },
    };
  }

  async subscribeToNotifications(
    userId: string,
    preferences?: any,
  ): Promise<any> {
    // This would typically return a subscription object for real-time notifications
    // For now, return a simple observable-like object
    return {
      userId,
      subscribed: true,
      preferences: preferences || (await this.getUserPreferences(userId)),
    };
  }

  async updateNotification(
    notificationId: string,
    updateData: any,
    userId: string,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId, userId },
    });

    if (!notification) {
      throw ErrorResponseUtil.notFound('Notification', notificationId);
    }

    await this.notificationRepository.update(notification.id, updateData);
    return this.notificationRepository.findOne({
      where: { id: notification.id },
    });
  }

  async markAsClicked(
    notificationId: string,
    userId: string,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId, userId },
    });

    if (!notification) {
      throw ErrorResponseUtil.notFound('Notification', notificationId);
    }

    // Update metadata with clicked information
    notification.metadata = {
      ...notification.metadata,
      analytics: {
        ...notification.metadata?.analytics,
        clicked: true,
        clickedAt: new Date(),
      },
    };

    return this.notificationRepository.save(notification);
  }

  async updateUserPreferences(
    userId: string,
    preferences: any,
  ): Promise<boolean> {
    // This would typically update user notification preferences in a preferences table
    // For now, just return true to indicate success
    // In a real implementation, you would save these preferences to the database
    return true;
  }

  async findAllNotifications(
    queryDto: any,
  ): Promise<{ data: NotificationEntity[]; total: number }> {
    const {
      userId,
      type,
      status,
      channel,
      unreadOnly,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = queryDto;

    const where: FindOptionsWhere<NotificationEntity> = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (unreadOnly) {
      where.status = In([NotificationStatus.UNREAD, NotificationStatus.READ]);
    }

    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

    return { data: notifications, total };
  }

  async findNotificationsByUserId(
    userId: string,
    queryDto: any,
  ): Promise<{ data: NotificationEntity[]; total: number }> {
    return this.findAllNotifications({ ...queryDto, userId });
  }

  async findOneNotification(
    notificationId: string,
    userId: string,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId, userId },
    });

    if (!notification) {
      throw ErrorResponseUtil.notFound('Notification', notificationId);
    }

    return notification;
  }

  async getNotificationStats(userId: string): Promise<any> {
    const total = await this.notificationRepository.count({
      where: { userId },
    });
    const unread = await this.getUnreadCount(userId);
    const read = total - unread;

    const typeStats = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('notification.userId = :userId', { userId })
      .groupBy('notification.type')
      .getRawMany();

    return {
      total,
      unread,
      read,
      byType: typeStats.reduce((acc, stat) => {
        acc[stat.type] = parseInt(stat.count);
        return acc;
      }, {}),
    };
  }
}
