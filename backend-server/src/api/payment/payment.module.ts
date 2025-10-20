import { UserEntity } from '@/auth/entities/user.entity';
import { FinancialEventSourcingModule } from '@/common/events/financial-event-sourcing';
import { BookingEntity } from '@/database/entities/booking.entity';
import { KycVerificationEntity } from '@/database/entities/kyc-verification.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { RefundEntity } from '@/database/entities/refund.entity';
import { WalletBalanceEntity } from '@/database/entities/wallet-balance.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashfreeModule } from '../cashfree/cashfree.module';
import { NotificationModule } from '../notification/notification.module';
import { KycVerificationService } from '../user/kyc-verification.service';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentEventHandler } from './events/payment-event.handler';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { WebhookValidationService } from './services/webhook-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentEntity,
      RefundEntity,
      WalletBalanceEntity,
      WalletTransactionEntity,
      BookingEntity,
      UserEntity,
      KycVerificationEntity,
    ]),
    EventEmitterModule,
    WalletModule,
    NotificationModule,
    CashfreeModule,
    FinancialEventSourcingModule,
  ],
  providers: [
    PaymentService,
    WebhookValidationService,
    IdGeneratorService,
    KycVerificationService,
    PaymentEventHandler,
  ],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
