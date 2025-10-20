import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  html?: string;
  text?: string;
  data?: Record<string, any>;
  attachments?: any[];
  from?: string;
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
  delay?: number;
  retryAttempts?: number;
}

export interface BulkEmailJob {
  recipients: string[];
  emailOptions: Omit<EmailOptions, 'to'>;
  batchSize?: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templatesCache = new Map<string, handlebars.TemplateDelegate>();
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const emailConfig = {
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    };

    // Skip email setup if credentials are not provided
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      this.logger.warn(
        'SMTP credentials not provided. Email service will be disabled.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport(emailConfig);

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP connection failed:', error);
      } else {
        this.logger.log('SMTP connection established successfully');
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const retryAttempts = options.retryAttempts || this.maxRetries;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        await this.sendEmailInternal(options);
        return; // Success, exit retry loop
      } catch (error) {
        this.logger.error(
          `Email sending attempt ${attempt}/${retryAttempts} failed:`,
          error.message,
        );

        if (attempt === retryAttempts) {
          // Final attempt failed
          this.logger.error(
            `All ${retryAttempts} email sending attempts failed for: ${options.to}`,
          );
          throw new Error(
            `Email sending failed after ${retryAttempts} attempts: ${error.message}`,
          );
        }

        // Wait before retry
        await this.delay(this.retryDelay * attempt);
      }
    }
  }

  private async sendEmailInternal(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured. Skipping email send.');
      return;
    }

    let html = options.html;
    let text = options.text;

    // Process template if provided
    if (options.template) {
      const templateResult = await this.processTemplate(
        options.template,
        options.data || {},
      );
      html = templateResult.html;
      text = templateResult.text;
    }

    const mailOptions = {
      from:
        options.from ||
        this.configService.get<string>(
          'MAIL_DEFAULT_EMAIL',
          'noreply@cowors.com',
        ),
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html,
      text,
      attachments: options.attachments,
      replyTo: options.replyTo,
      priority: options.priority || 'normal',
    };

    const result = await this.transporter.sendMail(mailOptions);
    this.logger.log(
      `Email sent successfully to ${mailOptions.to}. Message ID: ${result.messageId}`,
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async processTemplate(
    templateName: string,
    data: Record<string, any>,
  ): Promise<{ html: string; text: string }> {
    try {
      // Check cache first
      let template = this.templatesCache.get(templateName);

      if (!template) {
        // Load template from file
        const templatePath = path.join(
          process.cwd(),
          'src/api/notification/templates',
          `${templateName}.hbs`,
        );

        if (!fs.existsSync(templatePath)) {
          throw new Error(`Template file not found: ${templatePath}`);
        }

        const templateContent = fs.readFileSync(templatePath, 'utf8');
        template = handlebars.compile(templateContent);
        this.templatesCache.set(templateName, template);
      }

      const html = template(data);
      const text = this.htmlToText(html);

      return { html, text };
    } catch (error) {
      this.logger.error(
        `Template processing failed for ${templateName}:`,
        error,
      );
      throw new Error(`Template processing failed: ${error.message}`);
    }
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  // Predefined email templates
  async sendWelcomeEmail(to: string, userData: any): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to Cowors!',
      template: 'welcome',
      data: userData,
    });
  }

  async sendBookingConfirmationEmail(
    to: string,
    bookingData: any,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Booking Confirmation - Cowors',
      template: 'booking-confirmation',
      data: bookingData,
    });
  }

  async sendBookingCancellationEmail(
    to: string,
    bookingData: any,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Booking Cancellation - Cowors',
      template: 'booking-cancellation',
      data: bookingData,
    });
  }

  async sendBookingStatusUpdateEmail(
    to: string,
    bookingData: any,
  ): Promise<void> {
    const statusSubjects = {
      pending: 'Booking Pending Review - Cowors',
      confirmed: 'Booking Confirmed - Cowors',
      cancelled: 'Booking Cancelled - Cowors',
      completed: 'Booking Completed - Cowors',
      refunded: 'Booking Refunded - Cowors',
    };

    await this.sendEmail({
      to,
      subject:
        statusSubjects[bookingData.status] || 'Booking Status Update - Cowors',
      template: 'booking-status-update',
      data: bookingData,
    });
  }

  async sendBookingRefundEmail(to: string, refundData: any): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Refund Processed - Cowors',
      template: 'booking-refund',
      data: refundData,
    });
  }

  async sendBookingExtensionEmail(
    to: string,
    extensionData: any,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Booking Extended - Cowors',
      template: 'booking-extension',
      data: extensionData,
    });
  }

  async sendBookingReminderEmail(to: string, reminderData: any): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Booking Reminder - Cowors',
      template: 'booking-reminder',
      data: reminderData,
    });
  }

  async sendPaymentConfirmationEmail(
    to: string,
    paymentData: any,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Payment Confirmation - Cowors',
      template: 'payment-confirmation',
      data: paymentData,
    });
  }

  async sendPasswordResetEmail(to: string, resetData: any): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Password Reset - Cowors',
      template: 'password-reset',
      data: resetData,
    });
  }

  async sendPartnerApplicationEmail(
    to: string,
    applicationData: any,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Partner Application Status - Cowors',
      template: 'partner-application',
      data: applicationData,
    });
  }

  async sendSystemMaintenanceEmail(
    to: string[],
    maintenanceData: any,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Scheduled Maintenance - Cowors',
      template: 'system-maintenance',
      data: maintenanceData,
    });
  }

  async sendInvoiceEmail(to: string, invoiceData: any): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Invoice ${invoiceData.invoiceNumber} - Cowors`,
      template: 'invoice',
      data: invoiceData,
      attachments: invoiceData.attachments,
    });
  }

  async sendReminderEmail(to: string, reminderData: any): Promise<void> {
    await this.sendEmail({
      to,
      subject: reminderData.subject || 'Reminder - Cowors',
      template: 'reminder',
      data: reminderData,
    });
  }

  async sendBulkEmail(recipients: string[], emailData: any): Promise<void> {
    // Send directly with controlled concurrency
    const batchSize = 10;
    const results = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map((recipient) =>
        this.sendEmail({
          to: recipient,
          subject: emailData.subject,
          template: emailData.template,
          data: emailData.data,
          retryAttempts: 2, // Reduced retries for bulk emails
        }).catch((error) => {
          this.logger.error(
            `Failed to send bulk email to ${recipient}:`,
            error.message,
          );
          return { recipient, error: error.message };
        }),
      );

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to avoid overwhelming the SMTP server
      if (i + batchSize < recipients.length) {
        await this.delay(1000);
      }
    }

    const failures = results.filter(
      (result) =>
        result.status === 'rejected' ||
        (result.status === 'fulfilled' && result.value?.error),
    );

    if (failures.length > 0) {
      this.logger.warn(
        `Bulk email completed with ${failures.length} failures out of ${recipients.length} emails`,
      );
    } else {
      this.logger.log(
        `Bulk email sent successfully to ${recipients.length} recipients`,
      );
    }
  }

  // Utility methods
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('SMTP verification failed:', error);
      return false;
    }
  }

  getTemplateList(): string[] {
    const templatesDir = path.join(
      process.cwd(),
      'src/api/notification/templates',
    );

    if (!fs.existsSync(templatesDir)) {
      return [];
    }

    return fs
      .readdirSync(templatesDir)
      .filter((file) => file.endsWith('.hbs'))
      .map((file) => file.replace('.hbs', ''));
  }

  clearTemplateCache(): void {
    this.templatesCache.clear();
    this.logger.log('Template cache cleared');
  }
}
