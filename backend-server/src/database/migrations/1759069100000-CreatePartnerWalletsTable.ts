import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePartnerWalletsTable1759069100000
  implements MigrationInterface
{
  name = 'CreatePartnerWalletsTable1759069100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create partner_wallets table (idempotent)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "partner_wallets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "partnerId" character varying(10) NOT NULL,
        "availableBalance" decimal(15,2) NOT NULL DEFAULT 0,
        "pendingBalance" decimal(15,2) NOT NULL DEFAULT 0,
        "totalBalance" decimal(15,2) NOT NULL DEFAULT 0,
        "currency" character varying(3) NOT NULL DEFAULT 'INR',
        "lastTransactionDate" TIMESTAMP,
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "isBlocked" boolean NOT NULL DEFAULT false,
        "blockReason" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_partner_wallets" PRIMARY KEY ("id")
      )
    `);

    // Normalize column type if table pre-existed with uuid
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'partner_wallets'
            AND column_name = 'partnerId'
            AND data_type = 'uuid'
        ) THEN
          ALTER TABLE "partner_wallets" 
          ALTER COLUMN "partnerId" TYPE VARCHAR(10)
          USING "partnerId"::text;
        END IF;
      END $$;
    `);

    // Create indexes (idempotent)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_partner_wallets_partnerId" ON "partner_wallets" ("partnerId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_partner_wallets_partnerId_regular" ON "partner_wallets" ("partnerId")
    `);

    // Add foreign key constraint (idempotent)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_partner_wallets_partnerId'
        ) THEN
          ALTER TABLE "partner_wallets" ADD CONSTRAINT "FK_partner_wallets_partnerId" 
          FOREIGN KEY ("partnerId") REFERENCES "user"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "partner_wallets" DROP CONSTRAINT IF EXISTS "FK_partner_wallets_partnerId"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_partner_wallets_partnerId_regular"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_partner_wallets_partnerId"
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_wallets"`);
  }
}
