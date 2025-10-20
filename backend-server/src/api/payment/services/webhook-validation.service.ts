import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Stripe from 'stripe';
import {
  ErrorCodes,
  ErrorResponseUtil,
} from '../../../common/utils/error-response.util';

@Injectable()
export class WebhookValidationService {
  private stripe: Stripe;
  private stripeWebhookSecret: string;
  private razorpayWebhookSecret: string;

  constructor(private configService: ConfigService) {
    // Initialize Stripe
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-08-27.basil',
      });
    }

    // Get webhook secrets
    this.stripeWebhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    this.razorpayWebhookSecret = this.configService.get<string>(
      'RAZORPAY_WEBHOOK_SECRET',
    );
  }

  /**
   * Validate Stripe webhook signature
   * @param payload Raw request body
   * @param signature Stripe signature header
   * @returns Parsed event object
   */
  validateStripeWebhook(payload: string | Buffer, signature: string): any {
    if (!this.stripeWebhookSecret) {
      throw ErrorResponseUtil.unauthorized(
        'Stripe webhook secret not configured',
        ErrorCodes.CONFIGURATION_ERROR,
      );
    }

    if (!this.stripe) {
      throw ErrorResponseUtil.unauthorized(
        'Stripe not configured',
        ErrorCodes.CONFIGURATION_ERROR,
      );
    }

    try {
      // Stripe's constructEvent method validates the signature and parses the event
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.stripeWebhookSecret,
      );
      return event;
    } catch (error) {
      throw ErrorResponseUtil.unauthorized(
        `Invalid Stripe webhook signature: ${error.message}`,
        ErrorCodes.INVALID_CREDENTIALS,
      );
    }
  }

  /**
   * Validate Razorpay webhook signature
   * @param payload Raw request body
   * @param signature Razorpay signature header
   * @returns Parsed event object
   */
  validateRazorpayWebhook(payload: string | Buffer, signature: string): any {
    if (!this.razorpayWebhookSecret) {
      throw ErrorResponseUtil.unauthorized(
        'Razorpay webhook secret not configured',
        ErrorCodes.CONFIGURATION_ERROR,
      );
    }

    try {
      // Convert payload to string if it's a Buffer
      const payloadString =
        typeof payload === 'string' ? payload : payload.toString('utf8');

      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', this.razorpayWebhookSecret)
        .update(payloadString)
        .digest('hex');

      // Compare signatures using timing-safe comparison
      if (!this.timingSafeEqual(signature, expectedSignature)) {
        throw ErrorResponseUtil.unauthorized(
          'Invalid Razorpay webhook signature',
          ErrorCodes.INVALID_CREDENTIALS,
        );
      }

      // Parse and return the event
      return JSON.parse(payloadString);
    } catch (error) {
      if (error.response && error.response.errorCode) {
        throw error;
      }
      throw ErrorResponseUtil.unauthorized(
        `Invalid Razorpay webhook: ${error.message}`,
        ErrorCodes.INVALID_CREDENTIALS,
      );
    }
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   * @param a First string
   * @param b Second string
   * @returns True if strings are equal
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Validate webhook signature based on the provider
   * @param provider Payment gateway provider
   * @param payload Raw request body
   * @param signature Signature header
   * @returns Parsed event object
   */
  validateWebhook(
    provider: 'stripe' | 'razorpay',
    payload: string | Buffer,
    signature: string,
  ): any {
    switch (provider) {
      case 'stripe':
        return this.validateStripeWebhook(payload, signature);
      case 'razorpay':
        return this.validateRazorpayWebhook(payload, signature);
      default:
        throw ErrorResponseUtil.unauthorized(
          `Unsupported webhook provider: ${provider}`,
          ErrorCodes.INVALID_INPUT,
        );
    }
  }
}
