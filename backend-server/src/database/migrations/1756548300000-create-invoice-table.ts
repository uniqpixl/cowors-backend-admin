import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoiceTable1756548300000 implements MigrationInterface {
  name = 'CreateInvoiceTable1756548300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create invoice_status enum
    await queryRunner.query(`
      CREATE TYPE "invoice_status_enum" AS ENUM (
        'draft',
        'sent',
        'paid',
        'overdue',
        'cancelled',
        'refunded'
      )
    `);

    // Create tax_type enum
    await queryRunner.query(`
      CREATE TYPE "tax_type_enum" AS ENUM (
        'gst',
        'vat',
        'none'
      )
    `);

    // Create invoice table
    await queryRunner.query(`
      CREATE TABLE "invoice" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "invoiceNumber" character varying NOT NULL,
        "userId" uuid NOT NULL,
        "partnerId" uuid,
        "bookingId" uuid,
        "paymentId" uuid,
        "status" "invoice_status_enum" NOT NULL DEFAULT 'draft',
        "issueDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "paidDate" TIMESTAMP WITH TIME ZONE,
        "currency" character varying(3) NOT NULL DEFAULT 'INR',
        "subtotal" decimal(10,2) NOT NULL DEFAULT '0',
        "taxType" "tax_type_enum" NOT NULL DEFAULT 'gst',
        "taxBreakdown" jsonb NOT NULL DEFAULT '{}',
        "totalTax" decimal(10,2) NOT NULL DEFAULT '0',
        "discountAmount" decimal(10,2) NOT NULL DEFAULT '0',
        "totalAmount" decimal(10,2) NOT NULL DEFAULT '0',
        "lineItems" jsonb NOT NULL DEFAULT '[]',
        "billingAddress" jsonb NOT NULL DEFAULT '{}',
        "notes" text,
        "cancellationReason" text,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_invoice_id" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "invoice" 
      ADD CONSTRAINT "FK_invoice_user" 
      FOREIGN KEY ("userId") 
      REFERENCES "user"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "invoice" 
      ADD CONSTRAINT "FK_invoice_partner" 
      FOREIGN KEY ("partnerId") 
      REFERENCES "partner"("id") 
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "invoice" 
      ADD CONSTRAINT "FK_invoice_booking" 
      FOREIGN KEY ("bookingId") 
      REFERENCES "booking"("id") 
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "invoice" 
      ADD CONSTRAINT "FK_invoice_payment" 
      FOREIGN KEY ("paymentId") 
      REFERENCES "payment"("id") 
      ON DELETE SET NULL
    `);

    // Create unique constraint for invoice number
    await queryRunner.query(`
      ALTER TABLE "invoice" 
      ADD CONSTRAINT "UQ_invoice_number" 
      UNIQUE ("invoiceNumber")
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_user_id" 
      ON "invoice" ("userId") 
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_partner_id" 
      ON "invoice" ("partnerId") 
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_booking_id" 
      ON "invoice" ("bookingId") 
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_payment_id" 
      ON "invoice" ("paymentId") 
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_status" 
      ON "invoice" ("status") 
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_issue_date" 
      ON "invoice" ("issueDate") 
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_due_date" 
      ON "invoice" ("dueDate") 
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_created_at" 
      ON "invoice" ("createdAt") 
      WHERE "deletedAt" IS NULL
    `);

    // Create composite indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_user_status" 
      ON "invoice" ("userId", "status") 
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_partner_status" 
      ON "invoice" ("partnerId", "status") 
      WHERE "deletedAt" IS NULL
    `);

    // Add updated_at trigger
    await queryRunner.query(`
      CREATE TRIGGER "update_invoice_updated_at" 
      BEFORE UPDATE ON "invoice" 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "update_invoice_updated_at" ON "invoice"`,
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_invoice_partner_status"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_user_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_due_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_issue_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_payment_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_booking_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_partner_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_user_id"`);

    // Drop constraints
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT IF EXISTS "UQ_invoice_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT IF EXISTS "FK_invoice_payment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT IF EXISTS "FK_invoice_booking"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT IF EXISTS "FK_invoice_partner"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT IF EXISTS "FK_invoice_user"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "tax_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoice_status_enum"`);
  }
}
