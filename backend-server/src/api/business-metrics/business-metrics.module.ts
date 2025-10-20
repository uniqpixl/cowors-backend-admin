import { NotificationModule } from '@/api/notification/notification.module';
import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { ReviewEntity } from '@/database/entities/review.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessMetricsController } from './business-metrics.controller';
import { BusinessMetricsService } from './business-metrics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookingEntity,
      PaymentEntity,
      UserEntity,
      PartnerEntity,
      SpaceEntity,
      ReviewEntity,
      WalletTransactionEntity,
    ]),
    ScheduleModule.forRoot(),
    NotificationModule,
  ],
  controllers: [BusinessMetricsController],
  providers: [BusinessMetricsService],
  exports: [BusinessMetricsService],
})
export class BusinessMetricsModule {}
