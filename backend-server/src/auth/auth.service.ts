import { GlobalConfig } from '@/config/config.type';
import { Queue } from '@/constants/job.constant';
import { CacheService } from '@/shared/cache/cache.service';
import { CacheParam } from '@/shared/cache/cache.type';
import { EmailQueue } from '@/worker/queues/email/email.type';
import { InjectQueue } from '@nestjs/bullmq';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { IdGeneratorService } from '../utils/id-generator.service';
import { AccountEntity } from './entities/account.entity';
import { UserEntity } from './entities/user.entity';

/**
 * AuthService handles authentication-related tasks for the application.
 */
@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService<GlobalConfig>,
    @InjectQueue(Queue.Email)
    private readonly emailQueue: EmailQueue,
    private readonly cacheService: CacheService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    private readonly idGeneratorService: IdGeneratorService,
  ) {}
  private readonly logger = new Logger(AuthService.name);

  async sendSigninMagicLink({ email, url }: { email: string; url: string }) {
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Rate limited to 1 email per 30 seconds
    const cacheKey: CacheParam = {
      key: 'SignInMagicLinkMailLastSentAt',
      args: [user.id],
    };
    const remainingTtl = await this.cacheService.getTtl(cacheKey);
    if (!(remainingTtl == null) && remainingTtl !== 0) {
      throw new HttpException(
        `Too many requests. Please wait ${Math.floor(remainingTtl / 1000)} seconds before sending again.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.emailQueue.add('signin-magic-link', {
      email,
      url,
    });

    await this.cacheService.set(cacheKey, +new Date(), { ttl: 30_000 });
  }

  async verifyEmail({ url, userId }: { url: string; userId: string }) {
    // Rate limited to 1 email per 30 seconds
    const cacheKey: CacheParam = {
      key: 'EmailVerificationMailLastSentAt',
      args: [userId],
    };
    const remainingTtl = await this.cacheService.getTtl(cacheKey);
    if (!(remainingTtl == null) && remainingTtl !== 0) {
      throw new HttpException(
        `Too many requests. Please wait ${Math.floor(remainingTtl / 1000)} seconds before sending again.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.emailQueue.add('email-verification', {
      url,
      userId,
    });

    await this.cacheService.set(cacheKey, +new Date(), { ttl: 30_000 });
  }

  async resetPassword({ url, userId }: { url: string; userId: string }) {
    // Rate limited to 1 email per 30 seconds
    const cacheKey: CacheParam = {
      key: 'ResetPasswordMailLastSentAt',
      args: [userId],
    };
    const remainingTtl = await this.cacheService.getTtl(cacheKey);
    if (!(remainingTtl == null) && remainingTtl !== 0) {
      throw new HttpException(
        `Too many requests. Please wait ${Math.floor(remainingTtl / 1000)} seconds before sending again.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await this.emailQueue.add('reset-password', {
      url,
      userId,
    });
    await this.cacheService.set(cacheKey, +new Date(), { ttl: 30_000 });
  }

  /**
   * Creates a basic auth username:password header that you can pass for API that is protected behind `basicAuthMiddleware`
   */
  createBasicAuthHeaders() {
    const username = this.configService.getOrThrow('auth.basicAuth.username', {
      infer: true,
    });
    const password = this.configService.getOrThrow('auth.basicAuth.password', {
      infer: true,
    });
    const base64Credential = Buffer.from(`${username}:${password}`).toString(
      'base64',
    );
    return {
      Authorization: `Basic ${base64Credential}`,
    };
  }

  /**
   * Validates a JWT token and returns the payload
   * Supports both backend-generated tokens and NextAuth tokens
   */
  async validateToken(token: string): Promise<any> {
    try {
      // Handle mock token for development
      const nodeEnv = this.configService.get('app.nodeEnv', { infer: true });
      this.logger.debug(`validateToken: env=${nodeEnv}`);
      if (
        (nodeEnv === 'development' || nodeEnv === 'local') &&
        token === 'mock-jwt-token-for-development'
      ) {
        this.logger.debug('validateToken: using mock dev token');
        return {
          sub: 'mock-admin-id',
          email: 'admin@test.com',
          role: 'SuperAdmin',
          firstName: 'Admin',
          lastName: 'User',
        };
      }

      const secret = this.configService.getOrThrow('auth.authSecret', {
        infer: true,
      });
      const payload = verify(token, secret);
      this.logger.debug('validateToken: token verified');

      // Handle NextAuth token format
      if (
        payload &&
        typeof payload === 'object' &&
        'email' in payload &&
        !('sub' in payload)
      ) {
        this.logger.debug('validateToken: converting NextAuth format');
        // Convert NextAuth format to our expected format
        return {
          sub: payload.email, // Use email as identifier for NextAuth tokens
          email: payload.email,
          role: payload.role || 'user',
          ...payload,
        };
      }

      this.logger.debug('validateToken: returning payload');
      return payload;
    } catch (error) {
      this.logger.error(`validateToken error: ${error.message}`);
      throw new Error('Invalid token');
    }
  }

  /**
   * Signs in a user with email and password
   */
  async signIn(
    email: string,
    password: string,
  ): Promise<{
    success: boolean;
    message?: string;
    token?: string;
    user?: any;
  }> {
    try {
      // Development fallback: allow known admin credentials without DB
      const nodeEnv = this.configService.get('app.nodeEnv', { infer: true });
      if (
        (nodeEnv === 'development' || nodeEnv === 'local') &&
        password === 'admin123' &&
        ['admin@cowors.com', 'admin@admin.com', 'admin@test.com'].includes(
          email,
        )
      ) {
        const secret = this.configService.getOrThrow('auth.authSecret', {
          infer: true,
        });
        const token = sign(
          {
            sub: 'dev-admin-id',
            email,
            role: 'Admin',
          },
          secret,
          { expiresIn: '24h' },
        );

        return {
          success: true,
          token,
          user: {
            id: 'dev-admin-id',
            email,
            firstName: 'Admin',
            lastName: 'User',
            role: 'Admin',
          },
        };
      }

      // Find user by email
      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      let isPasswordValid = false;

      // Check if user has password set directly in user table
      if (user.password) {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } else {
        // Check account table for credentials
        const account = await this.accountRepository.findOne({
          where: {
            userId: user.id,
            providerId: 'credential',
          },
        });

        if (!account || !account.password) {
          return { success: false, message: 'Password not set for this user' };
        }

        isPasswordValid = await bcrypt.compare(password, account.password);
      }

      if (!isPasswordValid) {
        return { success: false, message: 'Invalid password' };
      }

      // Generate JWT token
      const secret = this.configService.getOrThrow('auth.authSecret', {
        infer: true,
      });

      const token = sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
        },
        secret,
        { expiresIn: '24h' },
      );

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(
        `signIn error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { success: false, message: 'Internal server error' };
    }
  }

  /**
   * Validates a session token
   */
  async validateSession(
    token: string,
  ): Promise<{ valid: boolean; user?: UserEntity }> {
    try {
      this.logger.debug('validateSession: start');
      const payload = await this.validateToken(token);
      if (!payload) {
        this.logger.debug('validateSession: no payload');
        return { valid: false };
      }

      this.logger.debug('validateSession: payload ok');
      let user: UserEntity | null = null;

      // Dev-mode fallback: if token represents our dev admin, synthesize a user
      const nodeEnv = this.configService.get('app.nodeEnv', { infer: true });
      if (
        (nodeEnv === 'development' || nodeEnv === 'local') &&
        payload.email &&
        ['admin@cowors.com', 'admin@test.com', 'admin@admin.com'].includes(
          payload.email,
        ) &&
        payload.sub === 'dev-admin-id'
      ) {
        this.logger.debug('validateSession: using dev admin synthetic user');
        user = {
          id: 'dev-admin-id',
          email: payload.email,
          role: 'Admin' as any,
          username: 'dev-admin',
          displayUsername: 'dev-admin',
          isEmailVerified: true,
          status: 'active' as any,
          twoFactorEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as UserEntity;
        return { valid: true, user };
      }

      // Check if payload.sub contains an email (NextAuth format)
      if (payload.sub && payload.sub.includes('@')) {
        this.logger.debug(`validateSession: lookup by email: ${payload.sub}`);
        // NextAuth token - find user by email
        user = await this.userRepository.findOne({
          where: { email: payload.sub },
        });
      } else {
        this.logger.debug(`validateSession: lookup by id: ${payload.sub}`);
        // Backend token - find user by ID (could be UUID or Cowors ID)
        if (this.idGeneratorService.isValidCoworsId(payload.sub)) {
          // Cowors ID format - look up by id
          user = await this.userRepository.findOne({
            where: { id: payload.sub },
          });
        } else {
          // UUID format - look up by id
          user = await this.userRepository.findOne({
            where: { id: payload.sub },
          });
        }
      }

      if (!user) {
        this.logger.debug('validateSession: user not found');
        return { valid: false };
      }

      this.logger.debug(`validateSession: user found id=${user.id}`);
      return { valid: true, user };
    } catch (error) {
      this.logger.error(
        `validateSession error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { valid: false };
    }
  }
}
