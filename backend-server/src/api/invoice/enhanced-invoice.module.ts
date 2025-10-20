import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '@/auth/entities/user.entity';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { EnhancedInvoiceController } from './enhanced-invoice.controller';
import { EnhancedInvoiceService } from './enhanced-invoice.service';
import {
  EnhancedInvoiceEntity,
  InvoiceAuditTrailEntity,
  InvoiceExportEntity,
  InvoicePaymentEntity,
  InvoiceReminderEntity,
  InvoiceSettingsEntity,
  InvoiceTemplateEntity,
  RecurringInvoiceEntity,
} from './entities/enhanced-invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EnhancedInvoiceEntity,
      InvoicePaymentEntity,
      InvoiceTemplateEntity,
      RecurringInvoiceEntity,
      InvoiceReminderEntity,
      InvoiceAuditTrailEntity,
      InvoiceExportEntity,
      InvoiceSettingsEntity,
      UserEntity,
    ]),
  ],
  controllers: [EnhancedInvoiceController],
  providers: [EnhancedInvoiceService, IdGeneratorService],
  exports: [EnhancedInvoiceService],
})
export class EnhancedInvoiceModule {}
