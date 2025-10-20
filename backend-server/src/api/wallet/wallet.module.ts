import { NotificationModule } from '@/api/notification/notification.module';
import { UserEntity } from '@/auth/entities/user.entity';
import { FinancialEventSourcingModule } from '@/common/events/financial-event-sourcing';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from '../../database/entities/payment.entity';
import { RefundEntity } from '../../database/entities/refund.entity';
import { WalletTransactionEntity } from '../../database/entities/wallet-transaction.entity';
import { WalletEscrowController } from './controllers/wallet-escrow.controller';
import { WalletMultiCurrencyController } from './controllers/wallet-multi-currency.controller';
import { WalletReconciliationController } from './controllers/wallet-reconciliation.controller';
import { WalletEntity } from './entities/wallet.entity';
import { WalletEventHandler } from './events/wallet-event.handler';
import { WalletEscrowService } from './services/wallet-escrow.service';
import { WalletMultiCurrencyService } from './services/wallet-multi-currency.service';
import { WalletReconciliationService } from './services/wallet-reconciliation.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletEntity,
      WalletTransactionEntity,
      UserEntity,
      PaymentEntity,
      RefundEntity,
    ]),
    EventEmitterModule,
    NotificationModule,
    FinancialEventSourcingModule,
  ],
  controllers: [
    WalletController,
    WalletEscrowController,
    WalletMultiCurrencyController,
    WalletReconciliationController,
  ],
  providers: [
    WalletService,
    IdGeneratorService,
    WalletEventHandler,
    WalletEscrowService,
    WalletMultiCurrencyService,
    WalletReconciliationService,
  ],
  exports: [
    WalletService,
    WalletEventHandler,
    WalletEscrowService,
    WalletMultiCurrencyService,
    WalletReconciliationService,
  ],
})
export class WalletModule {}
