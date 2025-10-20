import { UserEntity } from '@/auth/entities/user.entity';
import { RolesGuard } from '@/guards/roles.guard';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEntity } from './entities/analytics.entity';
import { AnalyticsEventHandler } from './events/analytics-event.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsEntity, UserEntity]),
    EventEmitterModule,
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    RolesGuard,
    IdGeneratorService,
    AnalyticsEventHandler,
  ],
  exports: [AnalyticsService, AnalyticsEventHandler],
})
export class AnalyticsModule {}
