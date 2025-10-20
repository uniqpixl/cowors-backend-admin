import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';
import { PartnerAnalyticsController } from '../controllers/partner-analytics.controller';
import { PartnerAnalyticsService } from '../services/partner-analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      BookingEntity,
      SpaceEntity,
      WalletTransactionEntity,
    ]),
  ],
  controllers: [PartnerAnalyticsController],
  providers: [PartnerAnalyticsService],
  exports: [PartnerAnalyticsService],
})
export class PartnerAnalyticsModule {}
