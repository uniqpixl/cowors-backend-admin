import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

export interface SmsOptions {
  to: string;
  message?: string;
  template?: string;
  data?: Record<string, any>;
  from?: string;
}

export interface SmsTemplate {
  id: string;
  content: string;
  variables: string[];
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio;
  private isConfigured = false;
  private templates = new Map<string, SmsTemplate>();

  constructor(private configService: ConfigService) {
    this.initializeTwilio();
    this.loadTemplates();
  }

  private initializeTwilio(): void {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      this.logger.warn(
        'Twilio credentials not provided. SMS service will be disabled.',
      );
      return;
    }

    try {
      this.twilioClient = new Twilio(accountSid, authToken);
      this.isConfigured = true;
      this.logger.log('Twilio SMS service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Twilio:', error);
    }
  }

  private loadTemplates(): void {
    // Define SMS templates
    const templates: SmsTemplate[] = [
      {
        id: 'booking-confirmation',
        content:
          'Hi {{name}}, your booking for {{spaceName}} on {{date}} at {{time}} has been confirmed. Booking ID: {{bookingId}}. Thank you for choosing Cowors!',
        variables: ['name', 'spaceName', 'date', 'time', 'bookingId'],
      },
      {
        id: 'booking-cancellation',
        content:
          'Hi {{name}}, your booking {{bookingId}} for {{spaceName}} has been cancelled. Refund will be processed within 3-5 business days.',
        variables: ['name', 'bookingId', 'spaceName'],
      },
      {
        id: 'payment-confirmation',
        content:
          'Payment of ₹{{amount}} received successfully. Transaction ID: {{transactionId}}. Thank you for your payment!',
        variables: ['amount', 'transactionId'],
      },
      {
        id: 'otp-verification',
        content:
          'Your Cowors verification code is {{otp}}. This code will expire in {{expiryMinutes}} minutes. Do not share this code with anyone.',
        variables: ['otp', 'expiryMinutes'],
      },
      {
        id: 'booking-reminder',
        content:
          'Reminder: Your booking at {{spaceName}} is scheduled for {{date}} at {{time}}. Address: {{address}}. See you soon!',
        variables: ['spaceName', 'date', 'time', 'address'],
      },
      {
        id: 'wallet-credit',
        content:
          'Your Cowors wallet has been credited with ₹{{amount}}. Current balance: ₹{{balance}}. Transaction ID: {{transactionId}}.',
        variables: ['amount', 'balance', 'transactionId'],
      },
      {
        id: 'partner-approval',
        content:
          'Congratulations! Your partner application has been approved. You can now start listing your spaces on Cowors.',
        variables: [],
      },
      {
        id: 'space-booking-alert',
        content:
          'New booking received for {{spaceName}} on {{date}} at {{time}}. Customer: {{customerName}}. Booking ID: {{bookingId}}.',
        variables: ['spaceName', 'date', 'time', 'customerName', 'bookingId'],
      },
    ];

    templates.forEach((template) => {
      this.templates.set(template.id, template);
    });

    this.logger.log(`Loaded ${templates.length} SMS templates`);
  }

  async sendSms(options: SmsOptions): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn('SMS service not configured. Skipping SMS send.');
      return;
    }

    try {
      let message = options.message;

      // Process template if provided
      if (options.template) {
        message = this.processTemplate(options.template, options.data || {});
      }

      const result = await this.twilioClient.messages.create({
        body: message,
        from:
          options.from || this.configService.get<string>('TWILIO_PHONE_NUMBER'),
        to: this.formatPhoneNumber(options.to),
      });

      this.logger.log(
        `SMS sent successfully to ${options.to}. Message SID: ${result.sid}`,
      );
    } catch (error) {
      this.logger.error('Failed to send SMS:', error);
      throw new Error(`SMS sending failed: ${error.message}`);
    }
  }

  private processTemplate(
    templateId: string,
    data: Record<string, any>,
  ): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`SMS template not found: ${templateId}`);
    }

    let message = template.content;

    // Replace template variables
    template.variables.forEach((variable) => {
      const value = data[variable] || '';
      message = message.replace(
        new RegExp(`{{${variable}}}`, 'g'),
        value.toString(),
      );
    });

    // Remove any remaining unreplaced variables
    message = message.replace(/{{[^}]+}}/g, '');

    return message;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }

    // Add + prefix
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  // Predefined SMS methods
  async sendOtpSms(
    to: string,
    otp: string,
    expiryMinutes: number = 10,
  ): Promise<void> {
    await this.sendSms({
      to,
      message: '',
      template: 'otp-verification',
      data: { otp, expiryMinutes },
    });
  }

  async sendBookingConfirmationSms(
    to: string,
    bookingData: any,
  ): Promise<void> {
    await this.sendSms({
      to,
      message: '',
      template: 'booking-confirmation',
      data: bookingData,
    });
  }

  async sendBookingCancellationSms(
    to: string,
    bookingData: any,
  ): Promise<void> {
    await this.sendSms({
      to,
      message: '',
      template: 'booking-cancellation',
      data: bookingData,
    });
  }

  async sendPaymentConfirmationSms(
    to: string,
    paymentData: any,
  ): Promise<void> {
    await this.sendSms({
      to,
      message: '',
      template: 'payment-confirmation',
      data: paymentData,
    });
  }

  async sendBookingReminderSms(to: string, bookingData: any): Promise<void> {
    await this.sendSms({
      to,
      message: '',
      template: 'booking-reminder',
      data: bookingData,
    });
  }

  async sendWalletCreditSms(to: string, walletData: any): Promise<void> {
    await this.sendSms({
      to,
      message: '',
      template: 'wallet-credit',
      data: walletData,
    });
  }

  async sendPartnerApprovalSms(to: string): Promise<void> {
    await this.sendSms({
      to,
      message: '',
      template: 'partner-approval',
      data: {},
    });
  }

  async sendSpaceBookingAlertSms(to: string, bookingData: any): Promise<void> {
    await this.sendSms({
      to,
      message: '',
      template: 'space-booking-alert',
      data: bookingData,
    });
  }

  async sendBulkSms(recipients: string[], smsData: any): Promise<void> {
    const promises = recipients.map((recipient) =>
      this.sendSms({
        to: recipient,
        message: smsData.message,
        template: smsData.template,
        data: smsData.data,
      }),
    );

    const results = await Promise.allSettled(promises);
    const failed = results.filter(
      (result) => result.status === 'rejected',
    ).length;
    const succeeded = results.length - failed;

    this.logger.log(
      `Bulk SMS completed: ${succeeded} succeeded, ${failed} failed`,
    );
  }

  // Utility methods
  async verifyPhoneNumber(phoneNumber: string): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      const lookup = await this.twilioClient.lookups.v1
        .phoneNumbers(this.formatPhoneNumber(phoneNumber))
        .fetch();
      return !!lookup.phoneNumber;
    } catch (error) {
      this.logger.error('Phone number verification failed:', error);
      return false;
    }
  }

  getTemplateList(): SmsTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(templateId: string): SmsTemplate | undefined {
    return this.templates.get(templateId);
  }

  addTemplate(template: SmsTemplate): void {
    this.templates.set(template.id, template);
    this.logger.log(`Added SMS template: ${template.id}`);
  }

  removeTemplate(templateId: string): boolean {
    const deleted = this.templates.delete(templateId);
    if (deleted) {
      this.logger.log(`Removed SMS template: ${templateId}`);
    }
    return deleted;
  }

  async getAccountBalance(): Promise<any> {
    if (!this.isConfigured) {
      return null;
    }

    try {
      const account = await this.twilioClient.api.accounts.list({ limit: 1 });
      return account[0];
    } catch (error) {
      this.logger.error('Failed to get account balance:', error);
      return null;
    }
  }

  async getSmsHistory(limit: number = 20): Promise<any[]> {
    if (!this.isConfigured) {
      return [];
    }

    try {
      const messages = await this.twilioClient.messages.list({ limit });
      return messages.map((msg) => ({
        sid: msg.sid,
        to: msg.to,
        from: msg.from,
        body: msg.body,
        status: msg.status,
        dateCreated: msg.dateCreated,
        dateSent: msg.dateSent,
        errorCode: msg.errorCode,
        errorMessage: msg.errorMessage,
      }));
    } catch (error) {
      this.logger.error('Failed to get SMS history:', error);
      return [];
    }
  }
}
