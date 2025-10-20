import { BookingModule } from '@/api/booking/booking.module';
import { HealthModule } from '@/api/health/health.module';
import { PartnerModule } from '@/api/partner/partner.module';
import { PaymentModule } from '@/api/payment/payment.module';
import { SpaceModule } from '@/api/space/space.module';
import { TestModule } from '@/api/test/test.module';
import { UserModule } from '@/api/user/user.module';
import { WalletModule } from '@/api/wallet/wallet.module';
import { AdminModule } from '../../api/admin/admin.module';
import { AuditModule } from '../../api/audit/audit.module';
import { ContentModerationModule } from '../../api/content-moderation/content-moderation.module';
import { CouponModule } from '../../api/coupon/coupon.module';
import { DynamicPricingModule } from '../../api/dynamic-pricing/dynamic-pricing.module';
import { FileModule } from '../../api/file/file.module';
import { FraudModule } from '../../api/fraud/fraud.module';
import { InvoiceModule } from '../../api/invoice/invoice.module';
import { MessageModule } from '../../api/message/message.module';
import { NotificationModule } from '../../api/notification/notification.module';
import { ReviewModule } from '../../api/review/review.module';
import { RoleModule } from '../../api/role/role.module';
import { SystemConfigModule } from '../../api/system-config/system-config.module';
import { CmsModule } from '../../modules/cms/cms.module';
import { FinancialManagementModule } from '../../modules/financial-management.module';
import { PartnerAnalyticsModule } from '../../modules/partner-analytics.module';
// Missing modules that need to be added
import { type GlobalConfig } from '@/config/config.type';
import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AnalyticsModule } from '../../api/analytics/analytics.module';
import { DisputeModule } from '../../api/dispute/dispute.module';
import { FinancialReportModule } from '../../api/financial-report/financial-report.module';
import { PartnerCommissionModule } from '../../api/partner-commission/partner-commission.module';
import { PayoutModule } from '../../api/payout/payout.module';

export const SWAGGER_PATH = '/swagger';

function setupSwagger(app: INestApplication): OpenAPIObject {
  const configService = app.get(ConfigService<GlobalConfig>);
  const appName = configService.getOrThrow('app.name', { infer: true });

  const config = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(
      `<p><strong>Cowors API Documentation</strong></p>
      <p>This API powers Cowors' workspace marketplace, including bookings, payments, wallet, and partner management.</p>`,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'Api-Key', in: 'header' }, 'Api-Key')
    .addServer(
      configService.getOrThrow('app.url', { infer: true }),
      'Development',
    )
    .build();

  // All modules are now explicitly included in the Swagger documentation
  // This provides better security by only exposing explicitly included modules
  // and helps avoid circular dependency issues in complex applications.

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: false, // Explicit module inclusion to avoid circular dependencies
    include: [
      TestModule,
      HealthModule,
      UserModule,
      PartnerModule,
      SpaceModule,
      BookingModule,
      PaymentModule,
      WalletModule,
      AdminModule, // Re-enabled - RiskLevel dependency fixed
      AuditModule,
      ContentModerationModule,
      CouponModule,
      DynamicPricingModule,
      FileModule,
      InvoiceModule,
      MessageModule,
      NotificationModule,
      ReviewModule,
      RoleModule,
      SystemConfigModule,
      CmsModule,
      FinancialManagementModule, // Re-enabled for comprehensive financial admin features
      PartnerAnalyticsModule,
      // Missing modules now included
      AnalyticsModule,
      DisputeModule,
      PayoutModule,
      FinancialReportModule,
      PartnerCommissionModule,
      FraudModule, // Re-enabled - resolved RiskLevel enum Swagger circular dependency
    ],
    ignoreGlobalPrefix: true,
  });
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: appName,
    jsonDocumentUrl: 'swagger/json',
  });

  return document;
}

export default setupSwagger;
