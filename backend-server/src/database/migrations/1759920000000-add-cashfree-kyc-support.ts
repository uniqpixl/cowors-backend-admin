import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCashfreeKycSupport1759920000000 implements MigrationInterface {
  name = 'AddCashfreeKycSupport1759920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add CASHFREE to provider enum
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "public"."kyc_verification_provider_enum" 
        ADD VALUE 'cashfree';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add new verification types for Cashfree
    await queryRunner.query(`
      ALTER TYPE "public"."kyc_verification_type_enum" 
      ADD VALUE 'aadhaar_verification';
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."kyc_verification_type_enum" 
      ADD VALUE 'pan_verification';
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."kyc_verification_type_enum" 
      ADD VALUE 'business_details';
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."kyc_verification_type_enum" 
      ADD VALUE 'bank_account';
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."kyc_verification_type_enum" 
      ADD VALUE 'business_pan';
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."kyc_verification_type_enum" 
      ADD VALUE 'director_aadhaar';
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."kyc_verification_type_enum" 
      ADD VALUE 'gstin_verification';
    `);

    // Create UserType enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."kyc_verification_user_type_enum" AS ENUM(
          'user',
          'partner'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add new columns to kyc_verification table
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='kyc_verification' AND column_name='userType'
        ) THEN
          ALTER TABLE "kyc_verification" 
          ADD COLUMN "userType" "public"."kyc_verification_user_type_enum" NOT NULL DEFAULT 'user';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='kyc_verification' AND column_name='partnerId'
        ) THEN
          ALTER TABLE "kyc_verification" 
          ADD COLUMN "partnerId" character varying(10);
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='kyc_verification' AND column_name='partnerId' AND data_type='uuid'
        ) THEN
          ALTER TABLE "kyc_verification" 
          ALTER COLUMN "partnerId" TYPE VARCHAR(10) USING "partnerId"::text;
        END IF;
      END $$;
    `);

    // Add Cashfree-specific columns
    await queryRunner.query(`
      ALTER TABLE "kyc_verification" 
      ADD COLUMN "cashfreeFormId" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "kyc_verification" 
      ADD COLUMN "cashfreeFormUrl" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "kyc_verification" 
      ADD COLUMN "cashfreeVerificationId" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "kyc_verification" 
      ADD COLUMN "cashfreeData" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "kyc_verification" 
      ADD COLUMN "cashfreeResult" jsonb
    `);

    // Create new indexes for User vs Partner distinction
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_kyc_verification_user_type_verification" 
      ON "kyc_verification" ("userType", "verificationType")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_kyc_verification_partner_verification" 
      ON "kyc_verification" ("partnerId", "verificationType")
    `);

    // Add foreign key constraint for partnerId
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name='FK_kyc_verification_partnerId'
        ) THEN
          ALTER TABLE "kyc_verification" 
          ADD CONSTRAINT "FK_kyc_verification_partnerId" 
          FOREIGN KEY ("partnerId") REFERENCES "partner"("id") 
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "kyc_verification" DROP CONSTRAINT "FK_kyc_verification_partnerId"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_kyc_verification_partner_verification"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_kyc_verification_user_type_verification"
    `);

    // Drop new columns
    await queryRunner.query(`
      ALTER TABLE "kyc_verification" DROP COLUMN "cashfreeResult"
    `);

    await queryRunner.query(`
      ALTER TABLE "kyc_verification" DROP COLUMN "cashfreeData"
    `);

    await queryRunner.query(`
      ALTER TABLE "kyc_verification" DROP COLUMN "cashfreeVerificationId"
    `);

    await queryRunner.query(`
      ALTER TABLE "kyc_verification" DROP COLUMN "cashfreeFormUrl"
    `);

    await queryRunner.query(`
      ALTER TABLE "kyc_verification" DROP COLUMN "cashfreeFormId"
    `);

    await queryRunner.query(`
      ALTER TABLE "kyc_verification" DROP COLUMN "partnerId"
    `);

    await queryRunner.query(`
      ALTER TABLE "kyc_verification" DROP COLUMN "userType"
    `);

    // Drop UserType enum
    await queryRunner.query(`
      DROP TYPE "public"."kyc_verification_user_type_enum"
    `);

    // Note: Cannot remove values from existing enums in PostgreSQL
    // The new verification types and cashfree provider will remain in the enum
    // This is acceptable as they won't cause issues
  }
}
