import { UserEntity } from '@/auth/entities/user.entity';
import { GlobalConfig } from '@/config/config.type';
import { RefreshTokenEntity } from '@/database/entities/refresh-token.entity';
import { CacheService } from '@/shared/cache/cache.service';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

export interface RefreshTokenPayload {
  userId: string;
  sessionToken: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);
  private readonly refreshTokenTTL: number;
  private readonly accessTokenTTL: number;

  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService<GlobalConfig>,
  ) {
    const authConfig = this.configService.getOrThrow('auth', { infer: true });
    // Default: 7 days for refresh token, 1 hour for access token
    this.refreshTokenTTL = authConfig.refreshTokenTTL || 7 * 24 * 60 * 60; // 7 days in seconds
    this.accessTokenTTL = authConfig.accessTokenTTL || 60 * 60; // 1 hour in seconds
  }

  /**
   * Generate a new refresh token for a user session
   */
  async generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    const token = this.generateSecureToken();
    const tokenFamily = uuid();
    const expiresAt = new Date(Date.now() + this.refreshTokenTTL * 1000);

    const refreshToken = this.refreshTokenRepository.create({
      userId: payload.userId,
      token,
      sessionToken: payload.sessionToken,
      expiresAt,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      tokenFamily,
      isRevoked: false,
    });

    await this.refreshTokenRepository.save(refreshToken);

    // Cache the token for faster lookup
    await this.cacheService.set(
      { key: 'RefreshToken', args: [token] },
      {
        userId: payload.userId,
        sessionToken: payload.sessionToken,
        tokenFamily,
        expiresAt: expiresAt.toISOString(),
      },
      { ttl: this.refreshTokenTTL * 1000 },
    );

    this.logger.log(`Generated refresh token for user ${payload.userId}`);
    return token;
  }

  /**
   * Rotate refresh token - generate new token and revoke old one
   */
  async rotateRefreshToken(
    oldToken: string,
    newSessionToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    // Validate the old token first
    const oldRefreshToken = await this.validateRefreshToken(oldToken);
    if (!oldRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check for token reuse (security breach detection)
    if (oldRefreshToken.isRevoked) {
      this.logger.warn(
        `Token reuse detected for user ${oldRefreshToken.userId}. Revoking entire token family.`,
      );
      await this.revokeTokenFamily(oldRefreshToken.tokenFamily);
      throw new UnauthorizedException(
        'Token reuse detected. Please sign in again.',
      );
    }

    // Generate new token with same family
    const newToken = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + this.refreshTokenTTL * 1000);

    // Create new refresh token
    const newRefreshToken = this.refreshTokenRepository.create({
      userId: oldRefreshToken.userId,
      token: newToken,
      sessionToken: newSessionToken,
      expiresAt,
      ipAddress: ipAddress || oldRefreshToken.ipAddress,
      userAgent: userAgent || oldRefreshToken.userAgent,
      tokenFamily: oldRefreshToken.tokenFamily,
      isRevoked: false,
    });

    // Save new token and revoke old one in a transaction
    await this.refreshTokenRepository.manager.transaction(async (manager) => {
      // Revoke old token
      await manager.update(
        RefreshTokenEntity,
        { id: oldRefreshToken.id },
        {
          isRevoked: true,
          revokedAt: new Date(),
          replacedByToken: newToken,
        },
      );

      // Save new token
      await manager.save(RefreshTokenEntity, newRefreshToken);
    });

    // Update cache
    await this.cacheService.delete({ key: 'RefreshToken', args: [oldToken] });
    await this.cacheService.set(
      { key: 'RefreshToken', args: [newToken] },
      {
        userId: oldRefreshToken.userId,
        sessionToken: newSessionToken,
        tokenFamily: oldRefreshToken.tokenFamily,
        expiresAt: expiresAt.toISOString(),
      },
      { ttl: this.refreshTokenTTL * 1000 },
    );

    this.logger.log(`Rotated refresh token for user ${oldRefreshToken.userId}`);
    return newToken;
  }

  /**
   * Validate refresh token and return token data
   */
  async validateRefreshToken(
    token: string,
  ): Promise<RefreshTokenEntity | null> {
    try {
      // Try cache first
      const cachedToken = await this.cacheService.get({
        key: 'RefreshToken',
        args: [token],
      });

      if (cachedToken) {
        // Verify token is not expired
        if (new Date((cachedToken as any).expiresAt) < new Date()) {
          await this.cacheService.delete({
            key: 'RefreshToken',
            args: [token],
          });
          return null;
        }

        // Get full token data from database for validation
        const refreshToken = await this.refreshTokenRepository.findOne({
          where: { token, isRevoked: false },
          relations: ['user'],
        });

        return refreshToken;
      }

      // Fallback to database
      const refreshToken = await this.refreshTokenRepository.findOne({
        where: { token, isRevoked: false },
        relations: ['user'],
      });

      if (!refreshToken || refreshToken.expiresAt < new Date()) {
        return null;
      }

      return refreshToken;
    } catch (error) {
      this.logger.error(`Error validating refresh token: ${error.message}`);
      return null;
    }
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { token },
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
    );

    await this.cacheService.delete({ key: 'RefreshToken', args: [token] });
    this.logger.log(`Revoked refresh token: ${token.substring(0, 10)}...`);
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    const tokens = await this.refreshTokenRepository.find({
      where: { userId, isRevoked: false },
    });

    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
    );

    // Remove from cache
    for (const token of tokens) {
      await this.cacheService.delete({
        key: 'RefreshToken',
        args: [token.token],
      });
    }

    this.logger.log(`Revoked all refresh tokens for user ${userId}`);
  }

  /**
   * Revoke entire token family (used when token reuse is detected)
   */
  async revokeTokenFamily(tokenFamily: string): Promise<void> {
    const tokens = await this.refreshTokenRepository.find({
      where: { tokenFamily, isRevoked: false },
    });

    await this.refreshTokenRepository.update(
      { tokenFamily, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
    );

    // Remove from cache
    for (const token of tokens) {
      await this.cacheService.delete({
        key: 'RefreshToken',
        args: [token.token],
      });
    }

    this.logger.warn(
      `Revoked token family ${tokenFamily} due to security breach`,
    );
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  async cleanupExpiredTokens(): Promise<void> {
    const expiredTokens = await this.refreshTokenRepository.find({
      where: {
        expiresAt: new Date(),
      },
    });

    if (expiredTokens.length > 0) {
      await this.refreshTokenRepository.remove(expiredTokens);

      // Remove from cache
      for (const token of expiredTokens) {
        await this.cacheService.delete({
          key: 'RefreshToken',
          args: [token.token],
        });
      }

      this.logger.log(
        `Cleaned up ${expiredTokens.length} expired refresh tokens`,
      );
    }
  }

  /**
   * Get refresh token statistics for a user
   */
  async getUserTokenStats(userId: string): Promise<{
    activeTokens: number;
    totalTokens: number;
    lastUsed: Date | null;
  }> {
    const [activeTokens, totalTokens, lastToken] = await Promise.all([
      this.refreshTokenRepository.count({
        where: { userId, isRevoked: false, expiresAt: new Date() },
      }),
      this.refreshTokenRepository.count({ where: { userId } }),
      this.refreshTokenRepository.findOne({
        where: { userId },
        order: { updatedAt: 'DESC' },
      }),
    ]);

    return {
      activeTokens,
      totalTokens,
      lastUsed: lastToken?.updatedAt || null,
    };
  }

  /**
   * Generate a cryptographically secure token
   */
  private generateSecureToken(): string {
    return randomBytes(32).toString('base64url');
  }
}
