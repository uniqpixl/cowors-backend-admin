import { BookingModule } from '@/api/booking/booking.module';
import { NotificationModule } from '@/api/notification/notification.module';
import { PartnerModule } from '@/api/partner/partner.module';
import { PaymentModule } from '@/api/payment/payment.module';
import {
  PartnerWalletEntity,
  PayoutEntity,
  PayoutRequestEntity,
} from '@/api/payout/entities/payout.entity';
import { ReviewModule } from '@/api/review/review.module';
import { SpacePackageEntity } from '@/api/space/entities/space-inventory.entity';
import { FinancialTransactionModule } from '@/api/transaction/financial-transaction.module';
import { UserModule } from '@/api/user/user.module';
import { WalletModule } from '@/api/wallet/wallet.module';
import { UserEntity } from '@/auth/entities/user.entity';
import {
  FinancialConfigurationChangeEntity,
  FinancialConfigurationEntity,
  FinancialConfigurationVersionEntity,
} from '@/common/entities/financial-configuration.entity';
import { FinancialServicesModule } from '@/common/modules/financial-services.module';
import { DynamicFinancialConfigService } from '@/common/services/dynamic-financial-config.service';
import { BookingEntity } from '@/database/entities/booking.entity';
import { InvoiceEntity } from '@/database/entities/invoice.entity';
import { KycVerificationEntity } from '@/database/entities/kyc-verification.entity';
import { PartnerCategoryEntity } from '@/database/entities/partner-category.entity';
import { PartnerListingEntity } from '@/database/entities/partner-listing.entity';
import { PartnerOfferingEntity } from '@/database/entities/partner-offering.entity';
import { PartnerSubcategoryEntity } from '@/database/entities/partner-subcategory.entity';
import { PartnerTypeEntity } from '@/database/entities/partner-type.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { ReviewEntity } from '@/database/entities/review.entity';
import { SpaceOptionEntity } from '@/database/entities/space-option.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { WalletBalanceEntity } from '@/database/entities/wallet-balance.entity';
import { CacheModule } from '@/shared/cache/cache.module';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminBookingController } from './admin-booking.controller';

import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminKycController } from './admin-kyc.controller';
import { AdminPartnerCategoryController } from './admin-partner-category.controller';
import { AdminPartnerCategoryService } from './admin-partner-category.service';
import { AdminPartnerSimpleService } from './admin-partner-simple.service';
import { AdminPartnerSubcategoryController } from './admin-partner-subcategory.controller';
import { AdminPartnerSubcategoryService } from './admin-partner-subcategory.service';
import { AdminPartnerTypeController } from './admin-partner-type.controller';
import { AdminPartnerTypeService } from './admin-partner-type.service';
import { AdminPartnerController } from './admin-partner.controller';
import { AdminPartnerService } from './admin-partner.service';
import { AdminRevenueController } from './admin-revenue.controller';
import { AdminSpaceController } from './admin-space.controller';
import { AdminSpaceService } from './admin-space.service';
import { AdminSystemController } from './admin-system.controller';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';

import { FinancialConfigController } from './financial-config.controller';
import { TestAdminController } from './test-admin.controller';
// Removed AnalyticsController due to route conflicts with AdminController
// import { AnalyticsController } from '../../controllers/analytics.controller';
// import { AnalyticsService } from '../../services/analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      PartnerEntity,
      PartnerListingEntity,
      PartnerTypeEntity,
      PartnerCategoryEntity,
      PartnerSubcategoryEntity,
      PartnerOfferingEntity,
      SpaceEntity,
      SpaceOptionEntity,
      SpacePackageEntity,
      BookingEntity,
      PaymentEntity,
      ReviewEntity,
      KycVerificationEntity,
      PartnerWalletEntity,
      PayoutRequestEntity,
      PayoutEntity,
      WalletBalanceEntity,
      InvoiceEntity,
      FinancialConfigurationEntity,
      FinancialConfigurationVersionEntity,
      FinancialConfigurationChangeEntity,
    ]),
    NestCacheModule.register(),
    BookingModule,
    PartnerModule,
    PaymentModule,
    ReviewModule,
    FinancialTransactionModule,
    UserModule,
    WalletModule,
    CacheModule,
    NotificationModule,
    FinancialServicesModule,
  ],
  controllers: [
    AdminController,
    AdminAnalyticsController,
    AdminBookingController,
    AdminCategoriesController,
    AdminKycController,
    AdminPartnerController,
    AdminPartnerCategoryController,
    AdminPartnerSubcategoryController,
    AdminPartnerTypeController,
    AdminRevenueController,
    AdminSpaceController,
    AdminSystemController,
    TestAdminController,
    FinancialConfigController,
  ],
  providers: [
    AdminService,
    AdminSpaceService,
    AdminPartnerService,
    AdminPartnerSimpleService,
    AdminPartnerTypeService,
    AdminPartnerCategoryService,
    AdminPartnerSubcategoryService,
    AuditService,
    IdGeneratorService,
    DynamicFinancialConfigService,
  ],
  exports: [AdminService],
})
export class AdminModule {}
