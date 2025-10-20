import { Module } from '@nestjs/common';
import { CmsModule } from '../modules/cms/cms.module';
import { FinancialManagementModule } from '../modules/financial-management.module';
import { PartnerAnalyticsModule } from '../modules/partner-analytics.module';
import { PartnerCategoryManagementModule } from '../modules/partner-category-management.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditModule } from './audit/audit.module';
import { BookingModule } from './booking/booking.module';
import { BusinessMetricsModule } from './business-metrics/business-metrics.module';
import { CitiesModule } from './cities/cities.module';
import { CommissionModule } from './commission/commission.module';
import { ContentModerationModule } from './content-moderation/content-moderation.module';
import { CouponModule } from './coupon/coupon.module';
import { DisputeModule } from './dispute/dispute.module';
import { DynamicPricingModule } from './dynamic-pricing/dynamic-pricing.module';
import { FileModule } from './file/file.module';
import { FinancialReportModule } from './financial-report/financial-report.module';
import { FinancialReportingModule } from './financial-reporting/financial-reporting.module';
import { FraudModule } from './fraud/fraud.module';
import { HealthModule } from './health/health.module';
import { EnhancedInvoiceModule } from './invoice/enhanced-invoice.module';
import { InvoiceAdminModule } from './invoice/invoice-admin.module';
import { InvoiceModule } from './invoice/invoice.module';
import { LocationMasterModule } from './location-master/location-master.module';
// import { LocationModule } from './location/location.module';
import { MessageModule } from './message/message.module';
import { NotificationModule } from './notification/notification.module';
import { PartnerCommissionModule } from './partner-commission/partner-commission.module';
import { PartnerModule } from './partner/partner.module';
import { PaymentModule } from './payment/payment.module';
import { PayoutModule } from './payout/payout.module';
import { PerformanceMonitoringModule } from './performance-monitoring/performance-monitoring.module';
import { RefundPolicyModule } from './refund-policy/refund-policy.module';
import { ReviewModule } from './review/review.module';
import { RoleModule } from './role/role.module';
import { SpaceInventoryModule } from './space-inventory/space-inventory.module';
import { SpaceModule } from './space/space.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { TaxModule } from './tax/tax.module';
import { TestModule } from './test/test.module';
import { TestingModule } from './testing/testing.module';
import { TransactionModule } from './transaction/transaction.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    AdminModule, // Re-enabled for admin dashboard functionality
    AnalyticsModule,
    AuditModule,
    BookingModule,
    BusinessMetricsModule,
    CmsModule,
    ContentModerationModule,
    CouponModule,
    DisputeModule,
    DynamicPricingModule,
    FileModule,
    FinancialManagementModule, // Re-enabled - database tables exist
    FraudModule,
    HealthModule,
    InvoiceModule,
    InvoiceAdminModule,
    EnhancedInvoiceModule,
    CitiesModule,
    LocationMasterModule,
    // LocationModule,
    MessageModule,
    NotificationModule,
    PartnerModule,
    PartnerAnalyticsModule, // Re-enabled - removed unused PayoutEntity import causing circular dependency
    PaymentModule,
    RefundPolicyModule,
    ReviewModule,
    RoleModule,
    SpaceModule,
    SystemConfigModule,
    TestModule,
    UserModule,
    WalletModule,
    PartnerCategoryManagementModule,
    // CommissionModule, // Temporarily disabled due to dependency injection issues
    SpaceInventoryModule,
    TaxModule,
    TransactionModule,
    PayoutModule, // Re-enabled - resolved circular dependency with BankAccountEntity
    FinancialReportModule, // Re-enabled after resolving conflicts
    FinancialReportingModule, // Enhanced financial reporting with real-time dashboard
    PartnerCommissionModule, // Re-enabled - resolved dependency issues
    PerformanceMonitoringModule, // Advanced monitoring & observability with real-time alerting
    TestingModule, // Comprehensive testing framework with 80% coverage target
  ],
})
export class ApiModule {}
