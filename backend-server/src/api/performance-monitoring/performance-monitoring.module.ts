import { NotificationModule } from '@/api/notification/notification.module';
import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceMonitoringController } from './performance-monitoring.controller';
import { PerformanceMonitoringService } from './performance-monitoring.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity, BookingEntity, UserEntity]),
    ScheduleModule.forRoot(),
    NotificationModule,
  ],
  controllers: [PerformanceMonitoringController],
  providers: [PerformanceMonitoringService],
  exports: [PerformanceMonitoringService],
})
export class PerformanceMonitoringModule {}
