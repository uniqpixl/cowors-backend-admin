import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { CouponEntity } from '@/database/entities/coupon.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { RolesGuard } from '@/guards/roles.guard';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CouponEntity,
      BookingEntity,
      PartnerEntity,
      UserEntity,
    ]),
  ],
  controllers: [CouponController],
  providers: [CouponService, RolesGuard],
  exports: [CouponService],
})
export class CouponModule {}
