import { Module, forwardRef } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventStoreEntity } from '../../../database/entities/event-store.entity';
import { EventBusService } from '../event-bus.service';
import { EventStoreController } from './event-store.controller';
import { EventStoreService } from './event-store.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventStoreEntity]), EventEmitterModule],
  providers: [EventStoreService, EventBusService],
  controllers: [EventStoreController],
  exports: [EventStoreService, EventBusService],
})
export class EventStoreModule {}
