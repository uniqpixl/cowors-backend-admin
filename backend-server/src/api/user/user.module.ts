import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { KycVerificationEntity } from '@/database/entities/kyc-verification.entity';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashfreeModule } from '../cashfree/cashfree.module';
import { KycVerificationService } from './kyc-verification.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      BookingEntity,
      KycVerificationEntity,
    ]),
    CashfreeModule,
  ],
  controllers: [UserController],
  providers: [UserService, KycVerificationService, IdGeneratorService],
  exports: [UserService, KycVerificationService],
})
export class UserModule {}
