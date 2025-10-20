import { GlobalConfig } from '@/config/config.type';
import {
  AFTER_HOOK_KEY,
  AUTH_INSTANCE_KEY,
  BEFORE_HOOK_KEY,
  HOOK_KEY,
} from '@/constants/auth.constant';
import { Queue } from '@/constants/job.constant';
import { CacheModule } from '@/shared/cache/cache.module';
import { CacheService } from '@/shared/cache/cache.service';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import type {
  MiddlewareConsumer,
  NestModule,
  OnModuleInit,
} from '@nestjs/common';
import { Global, Inject, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DiscoveryModule,
  DiscoveryService,
  HttpAdapterHost,
  MetadataScanner,
} from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import type {
  FastifyInstance,
  FastifyReply as Reply,
  FastifyRequest as Request,
} from 'fastify';
import { IdGeneratorService } from '../utils/id-generator.service';
import { AuthService } from './auth.service';
import { AuthController } from './controllers/auth.controller';
import { AccountEntity } from './entities/account.entity';
import { UserEntity } from './entities/user.entity';
import { RefreshTokenModule } from './modules/refresh-token.module';

@Global()
@Module({
  imports: [
    DiscoveryModule,
    BullModule.registerQueue({
      name: Queue.Email,
    }),
    BullBoardModule.forFeature({
      name: Queue.Email,
      adapter: BullMQAdapter as any,
    }),
    TypeOrmModule.forFeature([UserEntity, AccountEntity]),
    RefreshTokenModule,
    CacheModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, IdGeneratorService],
  exports: [AuthService],
})
export class AuthModule implements NestModule, OnModuleInit {
  private logger = new Logger(this.constructor.name);

  constructor(
    @Inject(DiscoveryService)
    private discoveryService: DiscoveryService,
    @Inject(MetadataScanner)
    private metadataScanner: MetadataScanner,
    @Inject(HttpAdapterHost)
    private readonly adapter: HttpAdapterHost,
  ) {}

  onModuleInit() {
    // Module initialization
  }

  configure(_: MiddlewareConsumer) {
    // We're now using the AuthController for authentication
    this.logger.log('AuthModule initialized');
  }

  static forRootAsync() {
    return {
      global: true,
      module: AuthModule,
      imports: [
        DiscoveryModule,
        BullModule.registerQueue({
          name: Queue.Email,
        }),
        BullBoardModule.forFeature({
          name: Queue.Email,
          adapter: BullMQAdapter as any,
        }),
        TypeOrmModule.forFeature([UserEntity, AccountEntity]),
        RefreshTokenModule,
        CacheModule,
      ],
      controllers: [AuthController],
      providers: [AuthService, IdGeneratorService],
      exports: [AuthService],
    };
  }
}
