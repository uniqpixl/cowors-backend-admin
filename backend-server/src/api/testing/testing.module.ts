import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingController } from './testing.controller';
import { TestingService } from './testing.service';

@Module({
  imports: [
    EventEmitterModule,
    TypeOrmModule.forFeature([
      BookingEntity,
      PaymentEntity,
      UserEntity,
      PartnerEntity,
      SpaceEntity,
      WalletTransactionEntity,
    ]),
  ],
  controllers: [TestingController],
  providers: [TestingService],
  exports: [TestingService],
})
export class TestingModule {}
