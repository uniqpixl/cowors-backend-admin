import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AccountEntity } from '../src/auth/entities/account.entity';
import { SessionEntity } from '../src/auth/entities/session.entity';
import { UserEntity } from '../src/auth/entities/user.entity';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<UserEntity>;
  let sessionRepository: Repository<SessionEntity>;
  let accountRepository: Repository<AccountEntity>;

  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
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
    sessionRepository = moduleFixture.get<Repository<SessionEntity>>(
      getRepositoryToken(SessionEntity),
    );
    accountRepository = moduleFixture.get<Repository<AccountEntity>>(
      getRepositoryToken(AccountEntity),
    );

    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    await sessionRepository.delete({});
    await accountRepository.delete({});
    await userRepository.delete({ email: testUser.email });
    await app.close();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('name', testUser.name);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('session');
    });

    it('should not register user with existing email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);
    });

    it('should not register user with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should not register user with weak password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'test2@example.com',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('session');
      expect(response.headers).toHaveProperty('set-cookie');
    });

    it('should not login with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);
    });

    it('should not login with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Session Management', () => {
    let sessionCookie: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      sessionCookie = response.headers['set-cookie'][0];
    });

    it('should get current session with valid cookie', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/session')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('session');
    });

    it('should not get session without cookie', async () => {
      await request(app.getHttpServer()).get('/api/auth/session').expect(401);
    });

    it('should logout successfully', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', sessionCookie)
        .expect(200);

      // Verify session is invalidated
      await request(app.getHttpServer())
        .get('/api/auth/session')
        .set('Cookie', sessionCookie)
        .expect(401);
    });
  });

  describe('Password Reset', () => {
    it('should initiate password reset for existing user', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);
    });

    it('should not reveal if email does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);
    });

    it('should not reset password with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!',
        })
        .expect(400);
    });
  });
});
