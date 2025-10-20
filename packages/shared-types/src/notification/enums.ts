/**
 * Notification-related enums and types  
 * Source of truth: backend-server/src/common/enums/notification.enum.ts
 */

/**
 * Notification types
 */
export enum NotificationType {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  SPACE_APPROVED = 'SPACE_APPROVED',
  SPACE_REJECTED = 'SPACE_REJECTED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  PROMOTION = 'PROMOTION',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
}

/**
 * Notification status
 */
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Notification channels
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Type guards
export const isValidNotificationType = (type: any): type is NotificationType => {
  return Object.values(NotificationType).includes(type);
};

export const isValidNotificationStatus = (status: any): status is NotificationStatus => {
  return Object.values(NotificationStatus).includes(status);
};

export const isValidNotificationChannel = (channel: any): channel is NotificationChannel => {
  return Object.values(NotificationChannel).includes(channel);
};