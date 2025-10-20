import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingInvoiceColumns1759434300000
  implements MigrationInterface
{
  name = 'AddMissingInvoiceColumns1759434300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add sentAt column
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "sentAt" TIMESTAMP WITH TIME ZONE;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Add paidAt column
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "paidAt" TIMESTAMP WITH TIME ZONE;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Add cancelledAt column
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "cancelledAt" TIMESTAMP WITH TIME ZONE;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Add pdfUrl column
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoice" 
        ADD COLUMN "pdfUrl" character varying;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Create indexes for the new timestamp columns
    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_sent_at" 
      ON "invoice" ("sentAt") 
      WHERE "deletedAt" IS NULL AND "sentAt" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_paid_at" 
      ON "invoice" ("paidAt") 
      WHERE "deletedAt" IS NULL AND "paidAt" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_cancelled_at" 
      ON "invoice" ("cancelledAt") 
      WHERE "deletedAt" IS NULL AND "cancelledAt" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_cancelled_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_paid_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_sent_at"`);

    // Drop columns
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "pdfUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "cancelledAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "paidAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN IF EXISTS "sentAt"`,
    );
  }
}
