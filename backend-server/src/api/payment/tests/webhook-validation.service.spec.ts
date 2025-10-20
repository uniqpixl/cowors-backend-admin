import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import { WebhookValidationService } from '../services/webhook-validation.service';

describe('WebhookValidationService', () => {
  let service: WebhookValidationService;
  let configService: jest.Mocked<ConfigService>;

  const mockStripeWebhookSecret = 'whsec_test_stripe_secret';
  const mockRazorpayWebhookSecret = 'test_razorpay_secret';
  const mockStripeSecretKey = 'sk_test_stripe_key';

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookValidationService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<WebhookValidationService>(WebhookValidationService);
    configService = module.get(ConfigService);

    // Setup config service mocks
    configService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'STRIPE_SECRET_KEY':
          return mockStripeSecretKey;
        case 'STRIPE_WEBHOOK_SECRET':
          return mockStripeWebhookSecret;
        case 'RAZORPAY_WEBHOOK_SECRET':
          return mockRazorpayWebhookSecret;
        default:
          return undefined;
      }
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateRazorpayWebhook', () => {
    beforeEach(() => {
      // Reset config service mocks before each test
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'STRIPE_SECRET_KEY':
            return mockStripeSecretKey;
          case 'STRIPE_WEBHOOK_SECRET':
            return mockStripeWebhookSecret;
          case 'RAZORPAY_WEBHOOK_SECRET':
            return mockRazorpayWebhookSecret;
          default:
            return undefined;
        }
      });
    });

    it('should validate correct Razorpay webhook signature', () => {
      // Create a new service instance with proper config
      const testService = new WebhookValidationService(configService);

      const payload = JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { id: 'pay_123' } },
      });
      const expectedSignature = crypto
        .createHmac('sha256', mockRazorpayWebhookSecret)
        .update(payload)
        .digest('hex');

      const result = testService.validateRazorpayWebhook(
        payload,
        expectedSignature,
      );

      expect(result).toEqual({
        event: 'payment.captured',
        payload: { payment: { id: 'pay_123' } },
      });
    });

    it('should throw UnauthorizedException for invalid Razorpay signature', () => {
      const payload = JSON.stringify({ event: 'payment.captured' });
      const invalidSignature = 'invalid_signature';

      expect(() => {
        service.validateRazorpayWebhook(payload, invalidSignature);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when Razorpay webhook secret is not configured', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'RAZORPAY_WEBHOOK_SECRET') return undefined;
        return mockStripeSecretKey;
      });

      // Recreate service with new config
      const newService = new WebhookValidationService(configService);
      const payload = JSON.stringify({ event: 'payment.captured' });
      const signature = 'any_signature';

      expect(() => {
        newService.validateRazorpayWebhook(payload, signature);
      }).toThrow(UnauthorizedException);
    });

    it('should handle Buffer payload for Razorpay webhook', () => {
      // Create a new service instance with proper config
      const testService = new WebhookValidationService(configService);

      const payloadString = JSON.stringify({ event: 'payment.captured' });
      const payloadBuffer = Buffer.from(payloadString, 'utf8');
      const expectedSignature = crypto
        .createHmac('sha256', mockRazorpayWebhookSecret)
        .update(payloadString)
        .digest('hex');

      const result = testService.validateRazorpayWebhook(
        payloadBuffer,
        expectedSignature,
      );

      expect(result).toEqual({ event: 'payment.captured' });
    });
  });

  describe('validateStripeWebhook', () => {
    it('should throw UnauthorizedException when Stripe webhook secret is not configured', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'STRIPE_WEBHOOK_SECRET') return undefined;
        return mockStripeSecretKey;
      });

      // Recreate service with new config
      const newService = new WebhookValidationService(configService);
      const payload = 'test_payload';
      const signature = 'test_signature';

      expect(() => {
        newService.validateStripeWebhook(payload, signature);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when Stripe is not configured', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'STRIPE_SECRET_KEY') return undefined;
        if (key === 'STRIPE_WEBHOOK_SECRET') return mockStripeWebhookSecret;
        return undefined;
      });

      // Recreate service with new config
      const newService = new WebhookValidationService(configService);
      const payload = 'test_payload';
      const signature = 'test_signature';

      expect(() => {
        newService.validateStripeWebhook(payload, signature);
      }).toThrow(UnauthorizedException);
    });
  });

  describe('validateWebhook', () => {
    beforeEach(() => {
      // Reset config service mocks before each test
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'STRIPE_SECRET_KEY':
            return mockStripeSecretKey;
          case 'STRIPE_WEBHOOK_SECRET':
            return mockStripeWebhookSecret;
          case 'RAZORPAY_WEBHOOK_SECRET':
            return mockRazorpayWebhookSecret;
          default:
            return undefined;
        }
      });
    });

    it('should call validateStripeWebhook for stripe provider', () => {
      const payload = 'test_payload';
      const signature = 'test_signature';
      const mockEvent = { id: 'evt_123', type: 'payment_intent.succeeded' };

      // Mock the validateStripeWebhook method
      jest.spyOn(service, 'validateStripeWebhook').mockReturnValue(mockEvent);

      const result = service.validateWebhook('stripe', payload, signature);

      expect(service.validateStripeWebhook).toHaveBeenCalledWith(
        payload,
        signature,
      );
      expect(result).toEqual(mockEvent);
    });

    it('should call validateRazorpayWebhook for razorpay provider', () => {
      // Create a new service instance with proper config
      const testService = new WebhookValidationService(configService);

      const payload = JSON.stringify({ event: 'payment.captured' });
      const expectedSignature = crypto
        .createHmac('sha256', mockRazorpayWebhookSecret)
        .update(payload)
        .digest('hex');

      const result = testService.validateWebhook(
        'razorpay',
        payload,
        expectedSignature,
      );

      expect(result).toEqual({ event: 'payment.captured' });
    });

    it('should throw UnauthorizedException for unsupported provider', () => {
      const payload = 'test_payload';
      const signature = 'test_signature';

      expect(() => {
        service.validateWebhook('unsupported' as any, payload, signature);
      }).toThrow(UnauthorizedException);
    });
  });

  describe('timingSafeEqual', () => {
    it('should return true for equal strings', () => {
      const a = 'test_string';
      const b = 'test_string';

      // Access private method for testing
      const result = (service as any).timingSafeEqual(a, b);

      expect(result).toBe(true);
    });

    it('should return false for different strings', () => {
      const a = 'test_string';
      const b = 'different_string';

      // Access private method for testing
      const result = (service as any).timingSafeEqual(a, b);

      expect(result).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      const a = 'short';
      const b = 'much_longer_string';

      // Access private method for testing
      const result = (service as any).timingSafeEqual(a, b);

      expect(result).toBe(false);
    });
  });
});
