import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKycVerificationTable1759019000000
  implements MigrationInterface
{
  name = 'CreateKycVerificationTable1759019000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums (idempotent)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_verification_status_enum') THEN
          CREATE TYPE "public"."kyc_verification_status_enum" AS ENUM(
            'pending',
            'in_progress', 
            'approved',
            'rejected',
            'expired',
            'cancelled'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_verification_provider_enum') THEN
          CREATE TYPE "public"."kyc_verification_provider_enum" AS ENUM(
            'jumio',
            'onfido',
            'veriff',
            'sumsub'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_verification_type_enum') THEN
          CREATE TYPE "public"."kyc_verification_type_enum" AS ENUM(
            'identity',
            'address',
            'document',
            'biometric'
          );
        END IF;
      END $$;
    `);

    // Create kyc_verification table (idempotent)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "kyc_verification" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "userId" character varying(10) NOT NULL,
        "bookingId" character varying(10),
        "status" "public"."kyc_verification_status_enum" NOT NULL DEFAULT 'pending',
        "provider" "public"."kyc_verification_provider_enum" NOT NULL,
        "verificationType" "public"."kyc_verification_type_enum" NOT NULL DEFAULT 'identity',
        "providerTransactionId" character varying,
        "providerSessionId" character varying,
        "providerData" jsonb,
        "verificationResult" jsonb,
        "rejectionReason" text,
        "fraudChecks" jsonb,
        "cost" numeric(10,2),
        "currency" character varying(3) NOT NULL DEFAULT 'USD',
        "submittedAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "expiresAt" TIMESTAMP,
        "adminNotes" text,
        "internalNotes" text,
        CONSTRAINT "PK_kyc_verification_id" PRIMARY KEY ("id")
      );
    `);

    // Create indexes (idempotent)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_kyc_verification_userId" ON "kyc_verification" ("userId")
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_kyc_verification_bookingId" ON "kyc_verification" ("bookingId")
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_kyc_verification_user_status" ON "kyc_verification" ("userId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_kyc_verification_provider_status" ON "kyc_verification" ("provider", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_kyc_verification_booking_status" ON "kyc_verification" ("bookingId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_kyc_verification_status_time" ON "kyc_verification" ("status", "createdAt")
    `);

    // Normalize column types if table pre-existed with uuid FKs
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'kyc_verification'
            AND column_name = 'userId'
            AND data_type = 'uuid'
        ) THEN
          ALTER TABLE "kyc_verification" 
          ALTER COLUMN "userId" TYPE VARCHAR(10)
          USING "userId"::text;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'kyc_verification'
            AND column_name = 'bookingId'
            AND data_type = 'uuid'
        ) THEN
          ALTER TABLE "kyc_verification" 
          ALTER COLUMN "bookingId" TYPE VARCHAR(10)
          USING "bookingId"::text;
        END IF;
      END $$;
    `);

    // Add foreign key constraints (idempotent)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_kyc_verification_userId'
        ) THEN
          ALTER TABLE "kyc_verification" 
          ADD CONSTRAINT "FK_kyc_verification_userId" 
          FOREIGN KEY ("userId") REFERENCES "user"("id") 
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_kyc_verification_bookingId'
        ) THEN
          ALTER TABLE "kyc_verification" 
          ADD CONSTRAINT "FK_kyc_verification_bookingId" 
          FOREIGN KEY ("bookingId") REFERENCES "booking"("id") 
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "kyc_verification" DROP CONSTRAINT IF EXISTS "FK_kyc_verification_bookingId"
    `);

    await queryRunner.query(`
      ALTER TABLE "kyc_verification" DROP CONSTRAINT IF EXISTS "FK_kyc_verification_userId"
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "kyc_verification"`);

    // Drop enums
    await queryRunner.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_verification_type_enum') THEN DROP TYPE "public"."kyc_verification_type_enum"; END IF; END $$;`);
    await queryRunner.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_verification_provider_enum') THEN DROP TYPE "public"."kyc_verification_provider_enum"; END IF; END $$;`);
    await queryRunner.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_verification_status_enum') THEN DROP TYPE "public"."kyc_verification_status_enum"; END IF; END $$;`);
  }
}
