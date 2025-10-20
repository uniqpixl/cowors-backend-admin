import { GlobalConfig } from '@/config/config.type';
import { Queue } from '@/constants/job.constant';
import { CacheService } from '@/shared/cache/cache.service';
import { EmailQueue } from '@/worker/queues/email/email.type';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { UserEntity } from './entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let configService: ConfigService<GlobalConfig>;
  let cacheService: CacheService;
  let emailQueue: EmailQueue;
  let userRepository: Repository<UserEntity>;

  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    getTtl: jest.fn(),
  };

  const mockEmailQueue = {
    add: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: getQueueToken(Queue.Email),
          useValue: mockEmailQueue,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService<GlobalConfig>>(ConfigService);
    cacheService = module.get<CacheService>(CacheService);
    emailQueue = module.get<EmailQueue>(getQueueToken(Queue.Email));
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBasicAuthHeaders', () => {
    it('should create basic auth headers with username and password', () => {
      mockConfigService.getOrThrow.mockImplementation((key: string) => {
        if (key.includes('username')) return 'testuser';
        if (key.includes('password')) return 'testpass';
        return null;
      });

      const expectedAuth = Buffer.from(`testuser:testpass`).toString('base64');

      const result = service.createBasicAuthHeaders();

      expect(result).toEqual({
        Authorization: `Basic ${expectedAuth}`,
      });
    });
  });

  describe('sendSigninMagicLink', () => {
    it('should send magic link email', async () => {
      const email = 'test@example.com';
      const url = 'http://example.com/magic-link';

      mockUserRepository.findOne.mockResolvedValue({ id: 'user-1' });
      mockCacheService.getTtl.mockResolvedValue(null);
      mockEmailQueue.add.mockResolvedValue({});
      mockCacheService.set.mockResolvedValue({});

      await service.sendSigninMagicLink({ email, url });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email },
        select: { id: true },
      });
      expect(mockEmailQueue.add).toHaveBeenCalledWith('signin-magic-link', {
        email,
        url,
      });
    });
  });

  describe('verifyEmail', () => {
    it('should send email verification', async () => {
      const userId = 'user-1';
      const url = 'http://example.com/verify';

      mockCacheService.getTtl.mockResolvedValue(null);
      mockEmailQueue.add.mockResolvedValue({});
      mockCacheService.set.mockResolvedValue({});

      await service.verifyEmail({ url, userId });

      expect(mockEmailQueue.add).toHaveBeenCalledWith('email-verification', {
        url,
        userId,
      });
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      const userId = 'user-1';
      const url = 'http://example.com/reset';

      mockCacheService.getTtl.mockResolvedValue(null);
      mockEmailQueue.add.mockResolvedValue({});
      mockCacheService.set.mockResolvedValue({});

      await service.resetPassword({ url, userId });

      expect(mockEmailQueue.add).toHaveBeenCalledWith('reset-password', {
        url,
        userId,
      });
    });
  });
});
