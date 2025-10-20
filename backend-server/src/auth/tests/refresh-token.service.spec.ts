import { UserEntity } from '@/auth/entities/user.entity';
import { RefreshTokenEntity } from '@/database/entities/refresh-token.entity';
import { CacheService } from '@/shared/cache/cache.service';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokenService } from '../services/refresh-token.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let refreshTokenRepository: Repository<RefreshTokenEntity>;
  let userRepository: Repository<UserEntity>;
  let cacheService: CacheService;
  let configService: ConfigService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
  };

  const mockRefreshToken = {
    id: 'token-123',
    userId: 'user-123',
    token: 'refresh-token-123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    sessionToken: 'session-123',
    isRevoked: false,
    tokenFamily: 'family-123',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
            manager: {
              transaction: jest.fn(),
            },
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'auth') {
                return {
                  authSecret: 'test-secret',
                  refreshTokenTTL: 7 * 24 * 60 * 60, // 7 days in seconds
                  accessTokenTTL: 60 * 60, // 1 hour in seconds
                  basicAuth: {
                    username: 'test',
                    password: 'test',
                  },
                  oAuth: {
                    github: {},
                  },
                };
              }
              return {};
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    refreshTokenRepository = module.get<Repository<RefreshTokenEntity>>(
      getRepositoryToken(RefreshTokenEntity),
    );
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    cacheService = module.get<CacheService>(CacheService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRefreshToken', () => {
    it('should generate a new refresh token', async () => {
      const tokenData = {
        userId: 'user-123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        sessionToken: 'session-123',
      };

      jest
        .spyOn(refreshTokenRepository, 'create')
        .mockReturnValue(mockRefreshToken as any);
      jest
        .spyOn(refreshTokenRepository, 'save')
        .mockResolvedValue(mockRefreshToken as any);
      jest.spyOn(cacheService, 'set').mockResolvedValue({ key: 'test-key' });

      const result = await service.generateRefreshToken(tokenData);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(refreshTokenRepository.create).toHaveBeenCalled();
      expect(refreshTokenRepository.save).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate a valid refresh token', async () => {
      jest
        .spyOn(refreshTokenRepository, 'findOne')
        .mockResolvedValue(mockRefreshToken as any);
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const result = await service.validateRefreshToken('refresh-token-123');

      expect(result).toEqual(mockRefreshToken);
      expect(refreshTokenRepository.findOne).toHaveBeenCalledWith({
        where: { token: 'refresh-token-123', isRevoked: false },
        relations: ['user'],
      });
    });

    it('should return null for invalid token', async () => {
      jest.spyOn(refreshTokenRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const result = await service.validateRefreshToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      jest
        .spyOn(refreshTokenRepository, 'findOne')
        .mockResolvedValue(expiredToken as any);
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const result = await service.validateRefreshToken('expired-token');

      expect(result).toBeNull();
    });
  });

  describe('rotateRefreshToken', () => {
    it('should rotate a refresh token successfully', async () => {
      const mockManager = {
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        save: jest.fn().mockResolvedValue({}),
      };

      jest
        .spyOn(service, 'validateRefreshToken')
        .mockResolvedValue(mockRefreshToken as any);
      jest.spyOn(refreshTokenRepository, 'create').mockReturnValue({} as any);
      jest
        .spyOn(refreshTokenRepository.manager, 'transaction')
        .mockImplementation(async (callback: any) => callback(mockManager));
      jest.spyOn(cacheService, 'delete').mockResolvedValue({ key: 'test-key' });
      jest.spyOn(cacheService, 'set').mockResolvedValue({ key: 'test-key' });

      const result = await service.rotateRefreshToken(
        'refresh-token-123',
        'new-session-123',
        '127.0.0.1',
        'test-agent',
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(mockManager.update).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalled();
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke a refresh token', async () => {
      jest
        .spyOn(refreshTokenRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(cacheService, 'delete').mockResolvedValue({ key: 'test-key' });

      await service.revokeRefreshToken('refresh-token-123');

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { token: 'refresh-token-123' },
        {
          isRevoked: true,
          revokedAt: expect.any(Date),
        },
      );
      expect(cacheService.delete).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup expired tokens', async () => {
      const expiredTokens = [mockRefreshToken];

      jest
        .spyOn(refreshTokenRepository, 'find')
        .mockResolvedValue(expiredTokens as any);
      jest
        .spyOn(refreshTokenRepository, 'remove')
        .mockResolvedValue(expiredTokens as any);
      jest.spyOn(cacheService, 'delete').mockResolvedValue({ key: 'test-key' });

      await service.cleanupExpiredTokens();

      expect(refreshTokenRepository.find).toHaveBeenCalled();
      expect(refreshTokenRepository.remove).toHaveBeenCalledWith(expiredTokens);
    });
  });
});
