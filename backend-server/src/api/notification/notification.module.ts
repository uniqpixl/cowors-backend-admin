import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { IdGeneratorService } from '../../utils/id-generator.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

import { NotificationGateway } from './notification.gateway';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { WebSocketService } from './services/websocket.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailService,
    SmsService,
    WebSocketService,
    NotificationGateway,
    IdGeneratorService,
  ],
  exports: [
    NotificationService,
    EmailService,
    SmsService,
    WebSocketService,
    NotificationGateway,
  ],
})
export class NotificationModule {}
