import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerFieldsToInvoice1756548400000
  implements MigrationInterface
{
  name = 'AddCustomerFieldsToInvoice1756548400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create invoice_type enum if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "invoice_type_enum" AS ENUM (
          'booking',
          'commission',
          'refund',
          'adjustment'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add new columns to invoice table if they don't exist
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "type" "invoice_type_enum" NOT NULL DEFAULT 'booking';
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "customerId" uuid;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "customerName" character varying;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "customerEmail" character varying;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "customerPhone" character varying;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "customerAddress" jsonb;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "customerTaxId" character varying;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "paidAmount" decimal(12,2) NOT NULL DEFAULT '0';
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "outstandingAmount" decimal(12,2) NOT NULL DEFAULT '0';
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "paidDate" TIMESTAMP WITH TIME ZONE;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "terms" text;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Create indexes for new fields
    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_customer_id" 
      ON "invoice" ("customerId") 
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_type" 
      ON "invoice" ("type") 
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_type_status" 
      ON "invoice" ("type", "status") 
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_customer_status" 
      ON "invoice" ("customerId", "status") 
      WHERE "deletedAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_invoice_customer_status"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_type_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_customer_id"`);

    // Drop columns
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "terms"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "paidDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "outstandingAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "paidAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "customerTaxId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "customerAddress"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "customerPhone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "customerEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "customerName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "customerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "type"`,
    );

    // Drop enum
    await queryRunner.query(`DROP TYPE IF EXISTS "invoice_type_enum"`);
  }
}
