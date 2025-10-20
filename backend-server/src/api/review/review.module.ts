import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdGeneratorService } from '../../utils/id-generator.service';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

import { UserEntity } from '../../auth/entities/user.entity';
import { BookingEntity } from '../../database/entities/booking.entity';
import { PartnerEntity } from '../../database/entities/partner.entity';
import { ReviewEntity } from '../../database/entities/review.entity';
import { SpaceEntity } from '../../database/entities/space.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReviewEntity,
      UserEntity,
      SpaceEntity,
      PartnerEntity,
      BookingEntity,
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService, IdGeneratorService],
  exports: [ReviewService],
})
export class ReviewModule {}
