import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { InvoiceEntity } from '@/database/entities/invoice.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvoiceEntity,
      BookingEntity,
      UserEntity,
      PartnerEntity,
    ]),
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService, IdGeneratorService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
