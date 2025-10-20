import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { BookingEntity } from '../src/api/booking/entities/booking.entity';
import { BookingStatus } from '../src/api/booking/enums/booking-status.enum';
import { PartnerEntity } from '../src/api/partner/entities/partner.entity';
import { PaymentEntity } from '../src/api/payment/entities/payment.entity';
import { RefundEntity } from '../src/api/payment/entities/refund.entity';
import { PaymentMethod } from '../src/api/payment/enums/payment-method.enum';
import { PaymentStatus } from '../src/api/payment/enums/payment-status.enum';
import { RefundStatus } from '../src/api/payment/enums/refund-status.enum';
import { SpaceType } from '../src/api/space/enums/space-type.enum';
import { AppModule } from '../src/app.module';
import { UserEntity } from '../src/auth/entities/user.entity';
import { SpaceEntity } from '../src/database/entities/space.entity';

describe('Payment (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<UserEntity>;
  let spaceRepository: Repository<SpaceEntity>;
  let bookingRepository: Repository<BookingEntity>;
  let paymentRepository: Repository<PaymentEntity>;
  let refundRepository: Repository<RefundEntity>;
  let partnerRepository: Repository<PartnerEntity>;

  let testUser: UserEntity;
  let testPartner: PartnerEntity;
  let testSpace: SpaceEntity;
  let testBooking: BookingEntity;
  let sessionCookie: string;

  const userData = {
    email: 'paymentuser@example.com',
    password: 'TestPassword123!',
    name: 'Payment Test User',
  };

  const partnerUserData = {
    email: 'paymentpartner@example.com',
    password: 'PartnerPassword123!',
    name: 'Payment Partner User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');

    userRepository = moduleFixture.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    spaceRepository = moduleFixture.get<Repository<SpaceEntity>>(
      getRepositoryToken(SpaceEntity),
    );
    bookingRepository = moduleFixture.get<Repository<BookingEntity>>(
      getRepositoryToken(BookingEntity),
    );
    paymentRepository = moduleFixture.get<Repository<PaymentEntity>>(
      getRepositoryToken(PaymentEntity),
    );
    refundRepository = moduleFixture.get<Repository<RefundEntity>>(
      getRepositoryToken(RefundEntity),
    );
    partnerRepository = moduleFixture.get<Repository<PartnerEntity>>(
      getRepositoryToken(PartnerEntity),
    );

    await app.init();

    // Create test user
    const userResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(userData);
    testUser = userResponse.body.user;
    sessionCookie = userResponse.headers['set-cookie'][0];

    // Create partner user
    const partnerUserResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(partnerUserData);
    const partnerUser = partnerUserResponse.body.user;

    // Create test partner
    testPartner = await partnerRepository.save({
      id: 'payment-test-partner-id',
      userId: partnerUser.id,
      businessName: 'Payment Test Business',
      contactEmail: partnerUserData.email,
      contactPhone: '+1234567890',
      isActive: true,
      isVerified: true,
    });

    // Create test space
    testSpace = await spaceRepository.save({
      id: 'payment-test-space-id',
      partnerId: testPartner.id,
      name: 'Payment Test Meeting Room',
      description: 'A test meeting room for payments',
      type: SpaceType.MEETING_ROOM,
      capacity: 10,
      pricePerHour: 100,
      isActive: true,
      amenities: ['WiFi', 'Projector'],
      location: {
        address: '123 Payment St',
        city: 'Payment City',
        state: 'Payment State',
        zipCode: '12345',
        country: 'Payment Country',
      },
    });

    // Create test booking
    testBooking = await bookingRepository.save({
      id: 'payment-test-booking-id',
      userId: testUser.id,
      spaceId: testSpace.id,
      startDateTime: new Date('2024-12-30T10:00:00Z'),
      endDateTime: new Date('2024-12-30T12:00:00Z'),
      guestCount: 5,
      totalAmount: 200,
      status: BookingStatus.PENDING,
      notes: 'Payment test booking',
    });
  });

  afterAll(async () => {
    // Clean up test data
    await refundRepository.delete({});
    await paymentRepository.delete({});
    await bookingRepository.delete({ id: testBooking.id });
    await spaceRepository.delete({ id: testSpace.id });
    await partnerRepository.delete({ id: testPartner.id });
    await userRepository.delete({ email: userData.email });
    await userRepository.delete({ email: partnerUserData.email });
    await app.close();
  });

  describe('Payment Creation', () => {
    it('should create a payment successfully', async () => {
      const paymentData = {
        bookingId: testBooking.id,
        amount: 200,
        method: PaymentMethod.STRIPE,
        currency: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post('/api/payment')
        .set('Cookie', sessionCookie)
        .send(paymentData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('bookingId', testBooking.id);
      expect(response.body).toHaveProperty('userId', testUser.id);
      expect(response.body).toHaveProperty('amount', 200);
      expect(response.body).toHaveProperty('method', PaymentMethod.STRIPE);
      expect(response.body).toHaveProperty('status', PaymentStatus.PENDING);
      expect(response.body).toHaveProperty('currency', 'USD');
    });

    it('should not create payment for non-existent booking', async () => {
      const paymentData = {
        bookingId: 'non-existent-booking-id',
        amount: 200,
        method: PaymentMethod.STRIPE,
        currency: 'USD',
      };

      await request(app.getHttpServer())
        .post('/api/payment')
        .set('Cookie', sessionCookie)
        .send(paymentData)
        .expect(404);
    });

    it('should not create payment with invalid amount', async () => {
      const paymentData = {
        bookingId: testBooking.id,
        amount: -100, // Invalid negative amount
        method: PaymentMethod.STRIPE,
        currency: 'USD',
      };

      await request(app.getHttpServer())
        .post('/api/payment')
        .set('Cookie', sessionCookie)
        .send(paymentData)
        .expect(400);
    });

    it('should not create payment without authentication', async () => {
      const paymentData = {
        bookingId: testBooking.id,
        amount: 200,
        method: PaymentMethod.STRIPE,
        currency: 'USD',
      };

      await request(app.getHttpServer())
        .post('/api/payment')
        .send(paymentData)
        .expect(401);
    });
  });

  describe('Payment Processing', () => {
    let testPayment: any;

    beforeAll(async () => {
      const paymentData = {
        bookingId: testBooking.id,
        amount: 200,
        method: PaymentMethod.STRIPE,
        currency: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post('/api/payment')
        .set('Cookie', sessionCookie)
        .send(paymentData);
      testPayment = response.body;
    });

    it('should process payment successfully', async () => {
      const processData = {
        paymentIntentId: 'pi_test_payment_intent',
        paymentMethodId: 'pm_test_payment_method',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/payment/${testPayment.id}/process`)
        .set('Cookie', sessionCookie)
        .send(processData)
        .expect(200);

      expect(response.body).toHaveProperty('status', PaymentStatus.PROCESSING);
      expect(response.body).toHaveProperty(
        'stripePaymentIntentId',
        processData.paymentIntentId,
      );
    });

    it('should get payment by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/payment/${testPayment.id}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('id', testPayment.id);
      expect(response.body).toHaveProperty('booking');
      expect(response.body).toHaveProperty('user');
    });

    it('should get user payments', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/payment/user/${testUser.id}`)
        .set('Cookie', sessionCookie)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should not allow unauthorized user to access payment', async () => {
      // Create another user
      const anotherUserData = {
        email: 'anotherpaymentuser@example.com',
        password: 'AnotherPassword123!',
        name: 'Another Payment User',
      };

      const anotherUserResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(anotherUserData);
      const anotherUserCookie = anotherUserResponse.headers['set-cookie'][0];

      await request(app.getHttpServer())
        .get(`/api/payment/${testPayment.id}`)
        .set('Cookie', anotherUserCookie)
        .expect(403);

      // Clean up
      await userRepository.delete({ email: anotherUserData.email });
    });
  });

  describe('Payment Refunds', () => {
    let testPaymentForRefund: any;

    beforeAll(async () => {
      // Create a successful payment for refund testing
      const paymentData = {
        bookingId: testBooking.id,
        amount: 200,
        method: PaymentMethod.STRIPE,
        currency: 'USD',
      };

      const paymentResponse = await request(app.getHttpServer())
        .post('/api/payment')
        .set('Cookie', sessionCookie)
        .send(paymentData);
      testPaymentForRefund = paymentResponse.body;

      // Mark payment as successful
      await paymentRepository.update(
        { id: testPaymentForRefund.id },
        { status: PaymentStatus.COMPLETED },
      );
    });

    it('should create a refund successfully', async () => {
      const refundData = {
        paymentId: testPaymentForRefund.id,
        amount: 100, // Partial refund
        reason: 'Customer requested partial refund',
      };

      const response = await request(app.getHttpServer())
        .post('/api/payment/refund')
        .set('Cookie', sessionCookie)
        .send(refundData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty(
        'paymentId',
        testPaymentForRefund.id,
      );
      expect(response.body).toHaveProperty('amount', 100);
      expect(response.body).toHaveProperty('status', RefundStatus.PENDING);
      expect(response.body).toHaveProperty('reason', refundData.reason);
    });

    it('should not create refund for non-existent payment', async () => {
      const refundData = {
        paymentId: 'non-existent-payment-id',
        amount: 100,
        reason: 'Test refund',
      };

      await request(app.getHttpServer())
        .post('/api/payment/refund')
        .set('Cookie', sessionCookie)
        .send(refundData)
        .expect(404);
    });

    it('should not create refund with amount exceeding payment', async () => {
      const refundData = {
        paymentId: testPaymentForRefund.id,
        amount: 300, // Exceeds payment amount of 200
        reason: 'Invalid refund amount',
      };

      await request(app.getHttpServer())
        .post('/api/payment/refund')
        .set('Cookie', sessionCookie)
        .send(refundData)
        .expect(400);
    });

    it('should get refunds by user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/payment/refund/user/${testUser.id}`)
        .set('Cookie', sessionCookie)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Payment Webhooks', () => {
    it('should handle Stripe webhook for successful payment', async () => {
      const webhookPayload = {
        id: 'evt_test_webhook',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_payment_intent',
            status: 'succeeded',
            amount: 20000, // $200.00 in cents
            currency: 'usd',
          },
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/payment/webhook/stripe')
        .set('stripe-signature', 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body).toHaveProperty('received', true);
    });

    it('should handle Stripe webhook for failed payment', async () => {
      const webhookPayload = {
        id: 'evt_test_webhook_failed',
        object: 'event',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_payment_intent_failed',
            status: 'requires_payment_method',
            amount: 20000,
            currency: 'usd',
            last_payment_error: {
              message: 'Your card was declined.',
            },
          },
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/payment/webhook/stripe')
        .set('stripe-signature', 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body).toHaveProperty('received', true);
    });

    it('should handle Razorpay webhook for successful payment', async () => {
      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_razorpay_payment',
              status: 'captured',
              amount: 20000, // $200.00 in paise
              currency: 'INR',
            },
          },
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/payment/webhook/razorpay')
        .set('x-razorpay-signature', 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body).toHaveProperty('received', true);
    });
  });

  describe('Payment Statistics', () => {
    it('should get payment statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/payment/stats')
        .set('Cookie', sessionCookie)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        })
        .expect(200);

      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('totalPayments');
      expect(response.body).toHaveProperty('totalRefunds');
      expect(response.body).toHaveProperty('successRate');
      expect(typeof response.body.totalRevenue).toBe('number');
      expect(typeof response.body.totalPayments).toBe('number');
      expect(typeof response.body.totalRefunds).toBe('number');
      expect(typeof response.body.successRate).toBe('number');
    });

    it('should require authentication for payment statistics', async () => {
      await request(app.getHttpServer())
        .get('/api/payment/stats')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        })
        .expect(401);
    });
  });
});
