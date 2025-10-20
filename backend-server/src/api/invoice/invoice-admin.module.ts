import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  InvoiceAuditTrailEntity,
  InvoiceEntity,
  InvoiceExportEntity,
  InvoicePaymentEntity,
  InvoiceRefundEntity,
  InvoiceReportEntity,
  InvoiceSettingsEntity,
} from './entities/invoice-admin.entity';
import { InvoiceAdminController } from './invoice-admin.controller';
import { InvoiceAdminService } from './invoice-admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Core invoice entities
      InvoiceEntity,
      InvoicePaymentEntity,
      InvoiceRefundEntity,

      // Audit and tracking entities
      InvoiceAuditTrailEntity,

      // Export and reporting entities
      InvoiceExportEntity,
      InvoiceReportEntity,

      // Settings entity
      InvoiceSettingsEntity,

      // Related entities
      UserEntity,
      BookingEntity,
      PartnerEntity,
    ]),
  ],
  controllers: [InvoiceAdminController],
  providers: [InvoiceAdminService, IdGeneratorService],
  exports: [InvoiceAdminService],
})
export class InvoiceAdminModule {}
