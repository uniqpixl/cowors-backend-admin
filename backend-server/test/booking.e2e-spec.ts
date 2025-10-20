import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { BookingEntity } from '../src/api/booking/entities/booking.entity';
import { BookingStatus } from '../src/api/booking/enums/booking-status.enum';
import { PartnerEntity } from '../src/api/partner/entities/partner.entity';
import { SpaceType } from '../src/api/space/enums/space-type.enum';
import { AppModule } from '../src/app.module';
import { UserEntity } from '../src/auth/entities/user.entity';
import { SpaceEntity } from '../src/database/entities/space.entity';

describe('Booking (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<UserEntity>;
  let spaceRepository: Repository<SpaceEntity>;
  let bookingRepository: Repository<BookingEntity>;
  let partnerRepository: Repository<PartnerEntity>;

  let testUser: UserEntity;
  let testPartner: PartnerEntity;
  let testSpace: SpaceEntity;
  let sessionCookie: string;
  let partnerSessionCookie: string;

  const userData = {
    email: 'testuser@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
  };

  const partnerUserData = {
    email: 'partner@example.com',
    password: 'PartnerPassword123!',
    name: 'Partner User',
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
    partnerSessionCookie = partnerUserResponse.headers['set-cookie'][0];

    // Create test partner
    testPartner = await partnerRepository.save({
      id: 'test-partner-id',
      userId: partnerUser.id,
      businessName: 'Test Business',
      contactEmail: partnerUserData.email,
      contactPhone: '+1234567890',
      isActive: true,
      isVerified: true,
    });

    // Create test space
    testSpace = await spaceRepository.save({
      id: 'test-space-id',
      partnerId: testPartner.id,
      name: 'Test Meeting Room',
      description: 'A test meeting room',
      type: SpaceType.MEETING_ROOM,
      capacity: 10,
      pricePerHour: 50,
      isActive: true,
      amenities: ['WiFi', 'Projector'],
      location: {
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await bookingRepository.delete({});
    await spaceRepository.delete({ id: testSpace.id });
    await partnerRepository.delete({ id: testPartner.id });
    await userRepository.delete({ email: userData.email });
    await userRepository.delete({ email: partnerUserData.email });
    await app.close();
  });

  describe('Space Availability', () => {
    it('should check availability for a space', async () => {
      const checkAvailabilityDto = {
        spaceId: testSpace.id,
        startDateTime: '2024-12-25T10:00:00Z',
        endDateTime: '2024-12-25T12:00:00Z',
      };

      const response = await request(app.getHttpServer())
        .post('/api/booking/check-availability')
        .set('Cookie', sessionCookie)
        .send(checkAvailabilityDto)
        .expect(200);

      expect(response.body).toHaveProperty('available', true);
      expect(response.body).not.toHaveProperty('conflicts');
    });

    it('should return conflicts when space is not available', async () => {
      // First, create a booking
      const bookingData = {
        spaceId: testSpace.id,
        startDateTime: '2024-12-25T10:00:00Z',
        endDateTime: '2024-12-25T12:00:00Z',
        guestCount: 5,
        notes: 'Test booking',
      };

      await request(app.getHttpServer())
        .post('/api/booking')
        .set('Cookie', sessionCookie)
        .send(bookingData)
        .expect(201);

      // Now check availability for overlapping time
      const checkAvailabilityDto = {
        spaceId: testSpace.id,
        startDateTime: '2024-12-25T11:00:00Z',
        endDateTime: '2024-12-25T13:00:00Z',
      };

      const response = await request(app.getHttpServer())
        .post('/api/booking/check-availability')
        .set('Cookie', sessionCookie)
        .send(checkAvailabilityDto)
        .expect(200);

      expect(response.body).toHaveProperty('available', false);
      expect(response.body).toHaveProperty('conflicts');
      expect(response.body.conflicts).toHaveLength(1);
    });

    it('should require authentication for availability check', async () => {
      const checkAvailabilityDto = {
        spaceId: testSpace.id,
        startDateTime: '2024-12-25T14:00:00Z',
        endDateTime: '2024-12-25T16:00:00Z',
      };

      await request(app.getHttpServer())
        .post('/api/booking/check-availability')
        .send(checkAvailabilityDto)
        .expect(401);
    });
  });

  describe('Booking Creation', () => {
    it('should create a booking successfully', async () => {
      const bookingData = {
        spaceId: testSpace.id,
        startDateTime: '2024-12-26T10:00:00Z',
        endDateTime: '2024-12-26T12:00:00Z',
        guestCount: 5,
        notes: 'Test booking for e2e',
      };

      const response = await request(app.getHttpServer())
        .post('/api/booking')
        .set('Cookie', sessionCookie)
        .send(bookingData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('userId', testUser.id);
      expect(response.body).toHaveProperty('spaceId', testSpace.id);
      expect(response.body).toHaveProperty('status', BookingStatus.PENDING);
      expect(response.body).toHaveProperty('guestCount', 5);
      expect(response.body).toHaveProperty('totalAmount');
      expect(response.body.totalAmount).toBeGreaterThan(0);
    });

    it('should not create booking with invalid guest count', async () => {
      const bookingData = {
        spaceId: testSpace.id,
        startDateTime: '2024-12-27T10:00:00Z',
        endDateTime: '2024-12-27T12:00:00Z',
        guestCount: 15, // Exceeds capacity of 10
        notes: 'Invalid booking',
      };

      await request(app.getHttpServer())
        .post('/api/booking')
        .set('Cookie', sessionCookie)
        .send(bookingData)
        .expect(400);
    });

    it('should not create booking for past dates', async () => {
      const bookingData = {
        spaceId: testSpace.id,
        startDateTime: '2023-01-01T10:00:00Z',
        endDateTime: '2023-01-01T12:00:00Z',
        guestCount: 5,
        notes: 'Past date booking',
      };

      await request(app.getHttpServer())
        .post('/api/booking')
        .set('Cookie', sessionCookie)
        .send(bookingData)
        .expect(400);
    });

    it('should not create booking without authentication', async () => {
      const bookingData = {
        spaceId: testSpace.id,
        startDateTime: '2024-12-28T10:00:00Z',
        endDateTime: '2024-12-28T12:00:00Z',
        guestCount: 5,
        notes: 'Unauthorized booking',
      };

      await request(app.getHttpServer())
        .post('/api/booking')
        .send(bookingData)
        .expect(401);
    });
  });

  describe('Booking Management', () => {
    let testBooking: any;

    beforeAll(async () => {
      const bookingData = {
        spaceId: testSpace.id,
        startDateTime: '2024-12-29T10:00:00Z',
        endDateTime: '2024-12-29T12:00:00Z',
        guestCount: 5,
        notes: 'Booking for management tests',
      };

      const response = await request(app.getHttpServer())
        .post('/api/booking')
        .set('Cookie', sessionCookie)
        .send(bookingData);
      testBooking = response.body;
    });

    it('should get booking by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/booking/${testBooking.id}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('id', testBooking.id);
      expect(response.body).toHaveProperty('space');
      expect(response.body).toHaveProperty('user');
    });

    it('should update booking notes', async () => {
      const updateData = {
        notes: 'Updated notes for e2e test',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/booking/${testBooking.id}`)
        .set('Cookie', sessionCookie)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('notes', updateData.notes);
    });

    it('should confirm booking as partner', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/booking/${testBooking.id}/confirm`)
        .set('Cookie', partnerSessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('status', BookingStatus.CONFIRMED);
    });

    it('should complete booking as user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/booking/${testBooking.id}/complete`)
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('status', BookingStatus.COMPLETED);
    });

    it('should not allow unauthorized user to update booking', async () => {
      // Create another user
      const anotherUserData = {
        email: 'another@example.com',
        password: 'AnotherPassword123!',
        name: 'Another User',
      };

      const anotherUserResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(anotherUserData);
      const anotherUserCookie = anotherUserResponse.headers['set-cookie'][0];

      await request(app.getHttpServer())
        .patch(`/api/booking/${testBooking.id}`)
        .set('Cookie', anotherUserCookie)
        .send({ notes: 'Unauthorized update' })
        .expect(400);

      // Clean up
      await userRepository.delete({ email: anotherUserData.email });
    });
  });

  describe('Booking Queries', () => {
    it('should get user bookings', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/booking/user/${testUser.id}`)
        .set('Cookie', sessionCookie)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get partner bookings', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/booking/partner/${testPartner.id}`)
        .set('Cookie', partnerSessionCookie)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should not allow user to access other user bookings', async () => {
      // Create another user
      const anotherUserData = {
        email: 'another2@example.com',
        password: 'AnotherPassword123!',
        name: 'Another User 2',
      };

      const anotherUserResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(anotherUserData);
      const anotherUser = anotherUserResponse.body.user;
      const anotherUserCookie = anotherUserResponse.headers['set-cookie'][0];

      await request(app.getHttpServer())
        .get(`/api/booking/user/${testUser.id}`)
        .set('Cookie', anotherUserCookie)
        .query({ limit: 10, offset: 0 })
        .expect(400);

      // Clean up
      await userRepository.delete({ email: anotherUserData.email });
    });
  });
});
