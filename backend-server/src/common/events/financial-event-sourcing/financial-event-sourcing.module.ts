import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FinancialAggregateEntity } from './financial-aggregate.entity';
import { FinancialEventSourcingService } from './financial-event-sourcing.service';
import { FinancialEventEntity } from './financial-event.entity';
import { FinancialEventHandler } from './financial-event.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialEventEntity, FinancialAggregateEntity]),
    EventEmitterModule,
  ],
  providers: [FinancialEventSourcingService, FinancialEventHandler],
  exports: [FinancialEventSourcingService, TypeOrmModule],
})
export class FinancialEventSourcingModule {}
