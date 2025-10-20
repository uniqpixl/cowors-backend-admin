import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { RolesGuard } from '@/guards/roles.guard';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';
import { DisputeEntity } from './entities/dispute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DisputeEntity, UserEntity, BookingEntity]),
  ],
  controllers: [DisputeController],
  providers: [DisputeService, RolesGuard],
  exports: [DisputeService],
})
export class DisputeModule {}
