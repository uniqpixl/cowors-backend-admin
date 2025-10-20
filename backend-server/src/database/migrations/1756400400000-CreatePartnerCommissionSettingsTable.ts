import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePartnerCommissionSettingsTable1756400400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "partner_commission_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "partner_id" uuid NOT NULL,
        "commission_rate" decimal(5,4) NOT NULL DEFAULT 0.1000,
        "custom_rates" jsonb,
        "payout_schedule" varchar(20) NOT NULL DEFAULT 'MONTHLY',
        "minimum_payout" decimal(10,2) NOT NULL DEFAULT 50.00,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "FK_partner_commission_settings_partner" FOREIGN KEY ("partner_id") REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_partner_commission_settings_partner" UNIQUE ("partner_id"),
        CONSTRAINT "CHK_commission_rate_range" CHECK ("commission_rate" >= 0 AND "commission_rate" <= 1),
        CONSTRAINT "CHK_minimum_payout_positive" CHECK ("minimum_payout" >= 0),
        CONSTRAINT "CHK_payout_schedule_values" CHECK ("payout_schedule" IN ('WEEKLY', 'MONTHLY', 'CUSTOM'))
      );
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_partner_commission_settings_partner_id" ON "partner_commission_settings" ("partner_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_partner_commission_settings_payout_schedule" ON "partner_commission_settings" ("payout_schedule");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_partner_commission_settings_created_at" ON "partner_commission_settings" ("created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_partner_commission_settings_created_at";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_partner_commission_settings_payout_schedule";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_partner_commission_settings_partner_id";
    `);

    // Drop the table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "partner_commission_settings";
    `);
  }
}
