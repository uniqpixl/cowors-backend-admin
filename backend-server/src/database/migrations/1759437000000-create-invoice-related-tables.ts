import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoiceRelatedTables1759437000000
  implements MigrationInterface
{
  name = 'CreateInvoiceRelatedTables1759437000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_status enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_status_enum" AS ENUM (
          'pending',
          'processing',
          'completed',
          'failed',
          'cancelled',
          'refunded'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create export_format enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "export_format_enum" AS ENUM (
          'csv',
          'excel',
          'pdf'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create report_type enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "report_type_enum" AS ENUM (
          'revenue',
          'outstanding',
          'tax',
          'customer',
          'partner'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create invoice_payments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice_payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "invoiceId" uuid NOT NULL,
        "amount" decimal(12,2) NOT NULL,
        "paymentMethod" character varying NOT NULL,
        "paymentReference" character varying,
        "transactionId" character varying,
        "status" "payment_status_enum" NOT NULL DEFAULT 'pending',
        "paymentDate" TIMESTAMP NOT NULL,
        "processedDate" TIMESTAMP,
        "notes" text,
        "paymentDetails" jsonb,
        "gatewayResponse" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying(10) NOT NULL,
        CONSTRAINT "PK_invoice_payments" PRIMARY KEY ("id")
      )
    `);

    // Create invoice_refunds table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice_refunds" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "invoiceId" uuid NOT NULL,
        "paymentId" uuid,
        "amount" decimal(12,2) NOT NULL,
        "reason" character varying NOT NULL,
        "refundMethod" character varying,
        "refundReference" character varying,
        "status" character varying NOT NULL DEFAULT 'pending',
        "refundDate" TIMESTAMP NOT NULL,
        "processedDate" TIMESTAMP,
        "notes" text,
        "refundDetails" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying(10) NOT NULL,
        CONSTRAINT "PK_invoice_refunds" PRIMARY KEY ("id")
      )
    `);

    // Create invoice_audit_trail table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice_audit_trail" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "invoiceId" uuid NOT NULL,
        "action" character varying NOT NULL,
        "description" text,
        "oldValues" jsonb,
        "newValues" jsonb,
        "metadata" jsonb,
        "performedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "performedBy" character varying(10) NOT NULL,
        "ipAddress" character varying,
        "userAgent" character varying,
        CONSTRAINT "PK_invoice_audit_trail" PRIMARY KEY ("id")
      )
    `);

    // Create invoice_exports table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice_exports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "exportType" character varying NOT NULL,
        "format" "export_format_enum" NOT NULL,
        "filters" jsonb,
        "parameters" jsonb,
        "status" character varying NOT NULL DEFAULT 'pending',
        "fileName" character varying,
        "filePath" character varying,
        "downloadUrl" character varying,
        "recordCount" integer,
        "fileSize" integer,
        "startedAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "expiresAt" TIMESTAMP,
        "errorMessage" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying(10) NOT NULL,
        CONSTRAINT "PK_invoice_exports" PRIMARY KEY ("id")
      )
    `);

    // Create invoice_reports table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reportType" "report_type_enum" NOT NULL,
        "format" "export_format_enum" NOT NULL,
        "parameters" jsonb,
        "filters" jsonb,
        "status" character varying NOT NULL DEFAULT 'pending',
        "fileName" character varying,
        "filePath" character varying,
        "downloadUrl" character varying,
        "reportData" jsonb,
        "startedAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "expiresAt" TIMESTAMP,
        "errorMessage" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying(10) NOT NULL,
        CONSTRAINT "PK_invoice_reports" PRIMARY KEY ("id")
      )
    `);

    // Create invoice_settings table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "defaultTemplate" character varying,
        "defaultPaymentTerms" integer,
        "defaultCurrency" character varying(3),
        "defaultTaxRate" decimal(5,2),
        "autoSendInvoices" boolean NOT NULL DEFAULT false,
        "sendPaymentReminders" boolean NOT NULL DEFAULT true,
        "paymentReminderDays" text,
        "latePaymentFeePercentage" decimal(5,2),
        "invoiceNumberPrefix" character varying,
        "invoiceNumberFormat" character varying,
        "companyInfo" jsonb,
        "emailTemplates" jsonb,
        "integrations" jsonb,
        "notifications" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying(10) NOT NULL,
        "updatedBy" character varying(10),
        CONSTRAINT "PK_invoice_settings" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for invoice_payments
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_payments_invoiceId_status" 
      ON "invoice_payments" ("invoiceId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_payments_paymentDate" 
      ON "invoice_payments" ("paymentDate")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_payments_amount" 
      ON "invoice_payments" ("amount")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_payments_invoiceId" 
      ON "invoice_payments" ("invoiceId")
    `);

    // Create indexes for invoice_refunds
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_refunds_invoiceId_status" 
      ON "invoice_refunds" ("invoiceId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_refunds_refundDate" 
      ON "invoice_refunds" ("refundDate")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_refunds_amount" 
      ON "invoice_refunds" ("amount")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_refunds_invoiceId" 
      ON "invoice_refunds" ("invoiceId")
    `);

    // Create indexes for invoice_audit_trail
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_audit_trail_invoiceId_action" 
      ON "invoice_audit_trail" ("invoiceId", "action")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_audit_trail_performedAt" 
      ON "invoice_audit_trail" ("performedAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_audit_trail_performedBy" 
      ON "invoice_audit_trail" ("performedBy")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_audit_trail_invoiceId" 
      ON "invoice_audit_trail" ("invoiceId")
    `);

    // Create indexes for invoice_exports
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_exports_exportType_status" 
      ON "invoice_exports" ("exportType", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_exports_createdAt" 
      ON "invoice_exports" ("createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_exports_createdBy" 
      ON "invoice_exports" ("createdBy")
    `);

    // Create indexes for invoice_reports
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_reports_reportType_status" 
      ON "invoice_reports" ("reportType", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_reports_createdAt" 
      ON "invoice_reports" ("createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_reports_createdBy" 
      ON "invoice_reports" ("createdBy")
    `);

    // Normalize user reference column types to VARCHAR(10) before adding FKs
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_payments' AND column_name='createdBy' AND data_type='uuid') THEN
          ALTER TABLE "invoice_payments" ALTER COLUMN "createdBy" TYPE VARCHAR(10) USING "createdBy"::text;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_refunds' AND column_name='createdBy' AND data_type='uuid') THEN
          ALTER TABLE "invoice_refunds" ALTER COLUMN "createdBy" TYPE VARCHAR(10) USING "createdBy"::text;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_audit_trail' AND column_name='performedBy' AND data_type='uuid') THEN
          ALTER TABLE "invoice_audit_trail" ALTER COLUMN "performedBy" TYPE VARCHAR(10) USING "performedBy"::text;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_exports' AND column_name='createdBy' AND data_type='uuid') THEN
          ALTER TABLE "invoice_exports" ALTER COLUMN "createdBy" TYPE VARCHAR(10) USING "createdBy"::text;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_reports' AND column_name='createdBy' AND data_type='uuid') THEN
          ALTER TABLE "invoice_reports" ALTER COLUMN "createdBy" TYPE VARCHAR(10) USING "createdBy"::text;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_settings' AND column_name='createdBy' AND data_type='uuid') THEN
          ALTER TABLE "invoice_settings" ALTER COLUMN "createdBy" TYPE VARCHAR(10) USING "createdBy"::text;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_settings' AND column_name='updatedBy' AND data_type='uuid') THEN
          ALTER TABLE "invoice_settings" ALTER COLUMN "updatedBy" TYPE VARCHAR(10) USING "updatedBy"::text;
        END IF;
      END $$;
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_invoice_payments_invoice') THEN
          ALTER TABLE "invoice_payments" 
          ADD CONSTRAINT "FK_invoice_payments_invoice" 
          FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_invoice_payments_creator') THEN
          ALTER TABLE "invoice_payments" 
          ADD CONSTRAINT "FK_invoice_payments_creator" 
          FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_invoice_refunds_invoice') THEN
          ALTER TABLE "invoice_refunds" 
          ADD CONSTRAINT "FK_invoice_refunds_invoice" 
          FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_invoice_refunds_payment') THEN
          ALTER TABLE "invoice_refunds" 
          ADD CONSTRAINT "FK_invoice_refunds_payment" 
          FOREIGN KEY ("paymentId") REFERENCES "invoice_payments"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_invoice_refunds_creator') THEN
          ALTER TABLE "invoice_refunds" 
          ADD CONSTRAINT "FK_invoice_refunds_creator" 
          FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_invoice_audit_trail_invoice') THEN
          ALTER TABLE "invoice_audit_trail" 
          ADD CONSTRAINT "FK_invoice_audit_trail_invoice" 
          FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_invoice_audit_trail_performer') THEN
          ALTER TABLE "invoice_audit_trail" 
          ADD CONSTRAINT "FK_invoice_audit_trail_performer" 
          FOREIGN KEY ("performedBy") REFERENCES "user"("id") ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_invoice_exports_creator') THEN
          ALTER TABLE "invoice_exports" 
          ADD CONSTRAINT "FK_invoice_exports_creator" 
          FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_invoice_reports_creator') THEN
          ALTER TABLE "invoice_reports" 
          ADD CONSTRAINT "FK_invoice_reports_creator" 
          FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_invoice_settings_creator') THEN
          ALTER TABLE "invoice_settings" 
          ADD CONSTRAINT "FK_invoice_settings_creator" 
          FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_invoice_settings_updater') THEN
          ALTER TABLE "invoice_settings" 
          ADD CONSTRAINT "FK_invoice_settings_updater" 
          FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "update_invoice_settings_updated_at" ON "invoice_settings"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "update_invoice_reports_updated_at" ON "invoice_reports"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "update_invoice_exports_updated_at" ON "invoice_exports"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "update_invoice_refunds_updated_at" ON "invoice_refunds"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "update_invoice_payments_updated_at" ON "invoice_payments"`,
    );

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "invoice_settings" DROP CONSTRAINT IF EXISTS "FK_invoice_settings_updater"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_settings" DROP CONSTRAINT IF EXISTS "FK_invoice_settings_creator"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_reports" DROP CONSTRAINT IF EXISTS "FK_invoice_reports_creator"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_exports" DROP CONSTRAINT IF EXISTS "FK_invoice_exports_creator"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_audit_trail" DROP CONSTRAINT IF EXISTS "FK_invoice_audit_trail_performer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_audit_trail" DROP CONSTRAINT IF EXISTS "FK_invoice_audit_trail_invoice"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_refunds" DROP CONSTRAINT IF EXISTS "FK_invoice_refunds_creator"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_refunds" DROP CONSTRAINT IF EXISTS "FK_invoice_refunds_payment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_refunds" DROP CONSTRAINT IF EXISTS "FK_invoice_refunds_invoice"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_payments" DROP CONSTRAINT IF EXISTS "FK_invoice_payments_creator"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_payments" DROP CONSTRAINT IF EXISTS "FK_invoice_payments_invoice"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_exports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_audit_trail"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_refunds"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_payments"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "report_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "export_format_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_enum"`);
  }
}
