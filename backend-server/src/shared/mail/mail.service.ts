import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { MailSubject, MailTemplate } from './mail.constant';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmailVerificationMail({
    email,
    url,
  }: {
    email: string;
    url: string;
  }) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your Email',
      template: MailTemplate.EmailVerification,
      context: {
        email: email,
        url,
      },
    });
  }

  async sendAuthMagicLinkMail({ email, url }: { email: string; url: string }) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Magic Link',
      template: MailTemplate.SignInMagicLink,
      context: {
        email: email,
        url,
      },
    });
  }

  async sendResetPasswordMail({ email, url }: { email: string; url: string }) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Password',
      template: MailTemplate.ResetPassword,
      context: {
        email: email,
        url,
      },
    });
  }

  async sendWelcomeMail({
    email,
    firstName,
    dashboardUrl,
  }: {
    email: string;
    firstName: string;
    dashboardUrl: string;
  }) {
    await this.mailerService.sendMail({
      to: email,
      subject: MailSubject.Welcome,
      template: MailTemplate.Welcome,
      context: {
        firstName,
        email,
        dashboardUrl,
      },
    });
  }

  async sendBookingConfirmationMail({
    email,
    customerName,
    bookingId,
    spaceName,
    spaceAddress,
    checkInDate,
    checkOutDate,
    totalAmount,
    originalAmount,
    discountAmount,
    couponCode,
    paymentMethod,
    bookingUrl,
  }: {
    email: string;
    customerName: string;
    bookingId: string;
    spaceName: string;
    spaceAddress: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: string;
    originalAmount?: string;
    discountAmount?: string;
    couponCode?: string;
    paymentMethod: string;
    bookingUrl: string;
  }) {
    await this.mailerService.sendMail({
      to: email,
      subject: MailSubject.BookingConfirmation.replace(
        '{{spaceName}}',
        spaceName,
      ),
      template: MailTemplate.BookingConfirmation,
      context: {
        customerName,
        bookingId,
        spaceName,
        spaceAddress,
        checkInDate,
        checkOutDate,
        totalAmount,
        originalAmount,
        discountAmount,
        couponCode,
        paymentMethod,
        bookingUrl,
      },
    });
  }

  async sendBookingCancellationMail({
    email,
    customerName,
    bookingId,
    spaceName,
    checkInDate,
    checkOutDate,
    refundAmount,
    refundMethod,
    cancellationReason,
    searchUrl,
  }: {
    email: string;
    customerName: string;
    bookingId: string;
    spaceName: string;
    checkInDate: string;
    checkOutDate: string;
    refundAmount: string;
    refundMethod: string;
    cancellationReason?: string;
    searchUrl: string;
  }) {
    await this.mailerService.sendMail({
      to: email,
      subject: MailSubject.BookingCancellation.replace(
        '{{spaceName}}',
        spaceName,
      ),
      template: MailTemplate.BookingCancellation,
      context: {
        customerName,
        bookingId,
        spaceName,
        checkInDate,
        checkOutDate,
        refundAmount,
        refundMethod,
        cancellationReason,
        searchUrl,
      },
    });
  }

  async sendPaymentConfirmationMail({
    email,
    customerName,
    transactionId,
    bookingId,
    spaceName,
    amount,
    paymentMethod,
    transactionDate,
    invoiceUrl,
    bookingUrl,
  }: {
    email: string;
    customerName: string;
    transactionId: string;
    bookingId: string;
    spaceName: string;
    amount: string;
    paymentMethod: string;
    transactionDate: string;
    invoiceUrl: string;
    bookingUrl: string;
  }) {
    await this.mailerService.sendMail({
      to: email,
      subject: MailSubject.PaymentConfirmation.replace(
        '{{spaceName}}',
        spaceName,
      ),
      template: MailTemplate.PaymentConfirmation,
      context: {
        customerName,
        transactionId,
        bookingId,
        spaceName,
        amount,
        paymentMethod,
        transactionDate,
        invoiceUrl,
        bookingUrl,
      },
    });
  }

  async sendKycVerificationMail({
    email,
    firstName,
    status,
    verificationUrl,
    rejectionReason,
    documentsRequired,
    supportUrl,
  }: {
    email: string;
    firstName: string;
    status: 'approved' | 'rejected' | 'pending' | 'required';
    verificationUrl?: string;
    rejectionReason?: string;
    documentsRequired?: string[];
    supportUrl: string;
  }) {
    await this.mailerService.sendMail({
      to: email,
      subject: MailSubject.KycVerification,
      template: MailTemplate.KycVerification,
      context: {
        firstName,
        status,
        verificationUrl,
        rejectionReason,
        documentsRequired,
        supportUrl,
      },
    });
  }

  async sendPartnerApprovalMail({
    email,
    partnerName,
    businessName,
    status,
    dashboardUrl,
    rejectionReason,
    nextSteps,
    supportUrl,
  }: {
    email: string;
    partnerName: string;
    businessName: string;
    status: 'approved' | 'rejected' | 'pending' | 'under_review';
    dashboardUrl?: string;
    rejectionReason?: string;
    nextSteps?: string[];
    supportUrl: string;
  }) {
    await this.mailerService.sendMail({
      to: email,
      subject: MailSubject.PartnerApproval.replace(
        '{{businessName}}',
        businessName,
      ),
      template: MailTemplate.PartnerApproval,
      context: {
        partnerName,
        businessName,
        status,
        dashboardUrl,
        rejectionReason,
        nextSteps,
        supportUrl,
      },
    });
  }
}
