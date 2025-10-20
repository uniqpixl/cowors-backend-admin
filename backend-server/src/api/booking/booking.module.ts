import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponModule } from '../coupon/coupon.module';
import { DynamicPricingModule } from '../dynamic-pricing/dynamic-pricing.module';
import { JobsModule } from '../jobs/jobs.module';
import { NotificationModule } from '../notification/notification.module';
import { RefundPolicyModule } from '../refund-policy/refund-policy.module';
import { WalletModule } from '../wallet/wallet.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingEventHandler } from './events/booking-event.handler';

import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookingEntity,
      SpaceEntity,
      UserEntity,
      PartnerEntity,
      PaymentEntity,
      WalletTransactionEntity,
    ]),
    EventEmitterModule,
    CouponModule,
    JobsModule,
    NotificationModule,
    DynamicPricingModule,
    RefundPolicyModule,
    WalletModule,
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingEventHandler],
  exports: [BookingService],
})
export class BookingModule {}
