import { JobsModule } from '@/api/jobs/jobs.module';
import { NotificationModule } from '@/api/notification/notification.module';
import { WalletModule } from '@/api/wallet/wallet.module';
import { UserEntity } from '@/auth/entities/user.entity';
import { EventRetryService } from '@/common/events/retry/event-retry.service';
import { BookingEntity } from '@/database/entities/booking.entity';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionTrackingController } from './commission-tracking.controller';
import { CommissionTrackingService } from './commission-tracking.service';
import { CommissionService } from './commission.service';
import { CommissionPayoutEntity } from './entities/commission-payout.entity';
import {
  CommissionAuditTrailEntity,
  CommissionCalculationEntity,
  CommissionExportEntity,
  CommissionReportEntity,
  CommissionRuleEntity,
  CommissionSettingsEntity,
  PartnerCommissionEntity,
} from './entities/commission-tracking.entity';
import { CommissionEventHandler } from './events/commission-event.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommissionRuleEntity,
      CommissionCalculationEntity,
      PartnerCommissionEntity,
      CommissionPayoutEntity,
      CommissionExportEntity,
      CommissionReportEntity,
      CommissionAuditTrailEntity,
      CommissionSettingsEntity,
      UserEntity,
      BookingEntity,
    ]),
    EventEmitterModule,
    WalletModule,
    NotificationModule,
    JobsModule,
  ],
  controllers: [CommissionTrackingController],
  providers: [
    CommissionTrackingService,
    CommissionService,
    CommissionEventHandler,
    EventRetryService,
  ],
  exports: [
    CommissionTrackingService,
    CommissionService,
    CommissionEventHandler,
    EventRetryService,
  ],
})
export class CommissionTrackingModule {}
