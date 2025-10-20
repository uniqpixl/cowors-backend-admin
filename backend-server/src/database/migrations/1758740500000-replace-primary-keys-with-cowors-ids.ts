import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplacePrimaryKeysWithCoworsIds1758740500000
  implements MigrationInterface
{
  name = 'ReplacePrimaryKeysWithCoworsIds1758740500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Update the user table to use new_id as primary key

    // First, drop all foreign key constraints that reference the user table
    await queryRunner.query(`
      ALTER TABLE "booking" DROP CONSTRAINT IF EXISTS "FK_336b3f4a235460dc93645fbf222";
      ALTER TABLE "partner" DROP CONSTRAINT IF EXISTS "FK_17701946f05279c9fe1a05cccf5";
      ALTER TABLE "space" DROP CONSTRAINT IF EXISTS "FK_983ce16992cc16213b9f667ea85";
      ALTER TABLE "refresh_token" DROP CONSTRAINT IF EXISTS "FK_8e913e288156c133999341156ad";
      ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "FK_3d2f174ef04fb312fdebd0ddc53";
      ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "FK_60328bf27019ff5498c4b977421";
      ALTER TABLE "twoFactor" DROP CONSTRAINT IF EXISTS "FK_03fe91172968ed69813bc6ff0bd";
      ALTER TABLE "passkey" DROP CONSTRAINT IF EXISTS "FK_3d2f174ef04fb312fdebd0ddc53";
      ALTER TABLE "wallet_balance" DROP CONSTRAINT IF EXISTS "FK_7de0cb10b53fbd1181fde7d013d";
      ALTER TABLE "wallet_transaction" DROP CONSTRAINT IF EXISTS "FK_9071d3c9266c4521bdafe29307a";
      ALTER TABLE "payment" DROP CONSTRAINT IF EXISTS "FK_b046318e0b341a7f72110b75857";
      ALTER TABLE "refund" DROP CONSTRAINT IF EXISTS "FK_052bf83187cb80bdb003f2650ee";
    `);

    // Dynamically drop any remaining foreign keys that reference partner.id, space.id, booking.id, or user.id
    await queryRunner.query(`
      DO $$
      DECLARE rec RECORD;
      BEGIN
        -- Drop FKs referencing partner(id)
        FOR rec IN (
          SELECT tc.table_schema, tc.table_name, tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
          JOIN information_schema.constraint_column_usage ccu ON rc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'partner'
            AND ccu.column_name = 'id'
        ) LOOP
          EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', rec.table_schema, rec.table_name, rec.constraint_name);
        END LOOP;

        -- Drop FKs referencing space(id)
        FOR rec IN (
          SELECT tc.table_schema, tc.table_name, tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
          JOIN information_schema.constraint_column_usage ccu ON rc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'space'
            AND ccu.column_name = 'id'
        ) LOOP
          EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', rec.table_schema, rec.table_name, rec.constraint_name);
        END LOOP;

        -- Drop FKs referencing booking(id)
        FOR rec IN (
          SELECT tc.table_schema, tc.table_name, tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
          JOIN information_schema.constraint_column_usage ccu ON rc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'booking'
            AND ccu.column_name = 'id'
        ) LOOP
          EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', rec.table_schema, rec.table_name, rec.constraint_name);
        END LOOP;

        -- Drop FKs referencing user(id)
        FOR rec IN (
          SELECT tc.table_schema, tc.table_name, tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
          JOIN information_schema.constraint_column_usage ccu ON rc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'user'
            AND ccu.column_name = 'id'
        ) LOOP
          EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', rec.table_schema, rec.table_name, rec.constraint_name);
        END LOOP;
      END $$;
    `);

    // Add temporary columns to tables that reference user and booking/space
    await queryRunner.query(`
      ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "temp_user_id" VARCHAR(10);
      ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "temp_space_id" VARCHAR(10);

      ALTER TABLE "partner" ADD COLUMN IF NOT EXISTS "temp_user_id" VARCHAR(10);
      ALTER TABLE "space" ADD COLUMN IF NOT EXISTS "temp_partner_id" VARCHAR(10);

      ALTER TABLE "refresh_token" ADD COLUMN IF NOT EXISTS "temp_user_id" VARCHAR(10);
      ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "temp_user_id" VARCHAR(10);
      ALTER TABLE "twoFactor" ADD COLUMN IF NOT EXISTS "temp_user_id" VARCHAR(10);
      ALTER TABLE "passkey" ADD COLUMN IF NOT EXISTS "temp_user_id" VARCHAR(10);

      ALTER TABLE "wallet_balance" ADD COLUMN IF NOT EXISTS "temp_user_id" VARCHAR(10);
      ALTER TABLE "wallet_transaction" ADD COLUMN IF NOT EXISTS "temp_user_id" VARCHAR(10);

      ALTER TABLE "booking_item" ADD COLUMN IF NOT EXISTS "temp_booking_id" VARCHAR(10);
      ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "temp_booking_id" VARCHAR(10);

      ALTER TABLE IF EXISTS "kyc_verification" ADD COLUMN IF NOT EXISTS "temp_user_id" VARCHAR(10);
      ALTER TABLE IF EXISTS "kyc_verification" ADD COLUMN IF NOT EXISTS "temp_booking_id" VARCHAR(10);

      ALTER TABLE IF EXISTS "fraud_alert" ADD COLUMN IF NOT EXISTS "temp_user_id" VARCHAR(10);
      ALTER TABLE IF EXISTS "fraud_alert" ADD COLUMN IF NOT EXISTS "temp_booking_id" VARCHAR(10);
      ALTER TABLE IF EXISTS "fraud_alert" ADD COLUMN IF NOT EXISTS "temp_assigned_user_id" VARCHAR(10);

      ALTER TABLE IF EXISTS "support_message" ADD COLUMN IF NOT EXISTS "temp_user_id" VARCHAR(10);
      ALTER TABLE IF EXISTS "support_message" ADD COLUMN IF NOT EXISTS "temp_booking_id" VARCHAR(10);
      ALTER TABLE IF EXISTS "support_message" ADD COLUMN IF NOT EXISTS "temp_sender_user_id" VARCHAR(10);
      ALTER TABLE IF EXISTS "support_message" ADD COLUMN IF NOT EXISTS "temp_assigned_user_id" VARCHAR(10);

      -- Additional references not covered before
      ALTER TABLE "partner_offerings" ADD COLUMN IF NOT EXISTS "temp_partner_id" VARCHAR(10);
      ALTER TABLE "space_option" ADD COLUMN IF NOT EXISTS "temp_space_id" VARCHAR(10);
      ALTER TABLE IF EXISTS "space_options" ADD COLUMN IF NOT EXISTS "temp_space_id" VARCHAR(10);
    `);

    // Update foreign key references to use new IDs
    await queryRunner.query(`
      UPDATE "booking" SET "temp_user_id" = u."new_id" 
      FROM "user" u WHERE "booking"."userId" = u."id";
      UPDATE "booking" SET "temp_space_id" = s."new_id" 
      FROM "space" s WHERE "booking"."spaceId" = s."id";
      
      UPDATE "partner" SET "temp_user_id" = u."new_id" 
      FROM "user" u WHERE "partner"."userId" = u."id";
      
      UPDATE "space" SET "temp_partner_id" = p."new_id" 
      FROM "partner" p WHERE "space"."partnerId" = p."id";
      
      UPDATE "refresh_token" SET "temp_user_id" = u."new_id" 
      FROM "user" u WHERE "refresh_token"."userId" = u."id";
      
      UPDATE "session" SET "temp_user_id" = u."new_id" 
      FROM "user" u WHERE "session"."userId" = u."id";
      
      UPDATE "twoFactor" SET "temp_user_id" = u."new_id" 
      FROM "user" u WHERE "twoFactor"."userId" = u."id";
      
      UPDATE "passkey" SET "temp_user_id" = u."new_id" 
      FROM "user" u WHERE "passkey"."userId" = u."id";
      
      UPDATE "wallet_balance" SET "temp_user_id" = u."new_id" 
      FROM "user" u WHERE "wallet_balance"."userId" = u."id";
      
      UPDATE "wallet_transaction" SET "temp_user_id" = u."new_id" 
      FROM "user" u WHERE "wallet_transaction"."userId" = u."id";

      UPDATE "booking_item" SET "temp_booking_id" = b."new_id" 
      FROM "booking" b WHERE "booking_item"."bookingId" = b."id";
      
      UPDATE "payment" SET "temp_booking_id" = b."new_id" 
      FROM "booking" b WHERE "payment"."bookingId" = b."id";

      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='kyc_verification') THEN
          UPDATE "kyc_verification" SET "temp_user_id" = u."new_id" 
          FROM "user" u WHERE "kyc_verification"."userId" = u."id";
          UPDATE "kyc_verification" SET "temp_booking_id" = b."new_id" 
          FROM "booking" b WHERE "kyc_verification"."bookingId" = b."id";
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fraud_alert') THEN
          UPDATE "fraud_alert" SET "temp_user_id" = u."new_id" 
          FROM "user" u WHERE "fraud_alert"."userId" = u."id";
          UPDATE "fraud_alert" SET "temp_booking_id" = b."new_id" 
          FROM "booking" b WHERE "fraud_alert"."bookingId" = b."id";
          UPDATE "fraud_alert" SET "temp_assigned_user_id" = u."new_id" 
          FROM "user" u WHERE "fraud_alert"."assignedToUserId" = u."id";
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='support_message') THEN
          UPDATE "support_message" SET "temp_user_id" = u."new_id" 
          FROM "user" u WHERE "support_message"."userId" = u."id";
          UPDATE "support_message" SET "temp_booking_id" = b."new_id" 
          FROM "booking" b WHERE "support_message"."bookingId" = b."id";
          UPDATE "support_message" SET "temp_sender_user_id" = u."new_id" 
          FROM "user" u WHERE "support_message"."senderUserId" = u."id";
          UPDATE "support_message" SET "temp_assigned_user_id" = u."new_id" 
          FROM "user" u WHERE "support_message"."assignedToUserId" = u."id";
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='space_options') THEN
          UPDATE "space_options" SET "temp_space_id" = s."new_id"
          FROM "space" s WHERE "space_options"."space_id" = s."id";
        END IF;
      END $$;
    `);

    // Drop the old primary key constraint and create new one for user
    await queryRunner.query(`
      ALTER TABLE "user" DROP CONSTRAINT "PK_cace4a159ff9f2512dd42373760" CASCADE;
      ALTER TABLE "user" DROP COLUMN "id";
      ALTER TABLE "user" RENAME COLUMN "new_id" TO "id";
      ALTER TABLE "user" ADD CONSTRAINT "PK_user" PRIMARY KEY ("id");
    `);

    // Swap partner PK to Cowors ID using drop/rename for consistency
    await queryRunner.query(`
      ALTER TABLE "partner" DROP CONSTRAINT IF EXISTS "PK_8f34ff11ddd5459eacbfacd48ca" CASCADE;
      ALTER TABLE "partner" DROP COLUMN "id";
      ALTER TABLE "partner" RENAME COLUMN "new_id" TO "id";
      ALTER TABLE "partner" ADD CONSTRAINT "PK_partner" PRIMARY KEY ("id");
    `);

    // Swap space PK to Cowors ID
    await queryRunner.query(`
      ALTER TABLE "space" DROP CONSTRAINT IF EXISTS "PK_094f5ec727fe052956a11623640" CASCADE;
      ALTER TABLE "space" DROP COLUMN "id";
      ALTER TABLE "space" RENAME COLUMN "new_id" TO "id";
      ALTER TABLE "space" ADD CONSTRAINT "PK_space" PRIMARY KEY ("id");
    `);

    // Swap booking PK to Cowors ID
    await queryRunner.query(`
      ALTER TABLE "booking" DROP CONSTRAINT IF EXISTS "PK_49171efc69702ed84c812f33540" CASCADE;
      ALTER TABLE "booking" DROP COLUMN "id";
      ALTER TABLE "booking" RENAME COLUMN "new_id" TO "id";
      ALTER TABLE "booking" ADD CONSTRAINT "PK_booking" PRIMARY KEY ("id");
    `);

    // Update foreign key columns and recreate constraints (align types and names)
    await queryRunner.query(`
      ALTER TABLE "booking" DROP COLUMN "userId";
      ALTER TABLE "booking" RENAME COLUMN "temp_user_id" TO "userId";
      -- FK_booking_user postponed
      
      ALTER TABLE "booking" DROP COLUMN "spaceId";
      ALTER TABLE "booking" RENAME COLUMN "temp_space_id" TO "spaceId";
      -- FK_booking_space postponed
      
      ALTER TABLE "partner" DROP COLUMN "userId";
      ALTER TABLE "partner" RENAME COLUMN "temp_user_id" TO "userId";
      -- FK_partner_user postponed
      
      ALTER TABLE "space" DROP COLUMN "partnerId";
      ALTER TABLE "space" RENAME COLUMN "temp_partner_id" TO "partnerId";
      -- FK_space_partner postponed
      
      ALTER TABLE "refresh_token" DROP COLUMN "userId";
      ALTER TABLE "refresh_token" RENAME COLUMN "temp_user_id" TO "userId";
      -- FK_refresh_token_user postponed
      
      ALTER TABLE "session" DROP COLUMN "userId";
      ALTER TABLE "session" RENAME COLUMN "temp_user_id" TO "userId";
      -- FK_session_user postponed
      
      ALTER TABLE "twoFactor" DROP COLUMN "userId";
      ALTER TABLE "twoFactor" RENAME COLUMN "temp_user_id" TO "userId";
      -- FK_twoFactor_user postponed
      
      ALTER TABLE "passkey" DROP COLUMN "userId";
      ALTER TABLE "passkey" RENAME COLUMN "temp_user_id" TO "userId";
      -- FK_passkey_user postponed
      
      ALTER TABLE "wallet_balance" DROP COLUMN "userId";
      ALTER TABLE "wallet_balance" RENAME COLUMN "temp_user_id" TO "userId";
      -- FK_wallet_balance_user postponed
      
      ALTER TABLE "wallet_transaction" DROP COLUMN "userId";
      ALTER TABLE "wallet_transaction" RENAME COLUMN "temp_user_id" TO "userId";
      -- FK_wallet_transaction_user postponed
      
      ALTER TABLE "booking_item" DROP COLUMN "bookingId";
      ALTER TABLE "booking_item" RENAME COLUMN "temp_booking_id" TO "bookingId";
      -- FK_booking_item_booking postponed
      
      ALTER TABLE "payment" DROP COLUMN "bookingId";
      ALTER TABLE "payment" RENAME COLUMN "temp_booking_id" TO "bookingId";
      -- FK_payment_booking postponed
      
      ALTER TABLE IF EXISTS "kyc_verification" DROP COLUMN "userId";
      ALTER TABLE IF EXISTS "kyc_verification" RENAME COLUMN "temp_user_id" TO "userId";
      -- FK_kyc_verification_user postponed
      ALTER TABLE IF EXISTS "kyc_verification" DROP COLUMN "bookingId";
      ALTER TABLE IF EXISTS "kyc_verification" RENAME COLUMN "temp_booking_id" TO "bookingId";
      -- FK_kyc_verification_booking postponed
      
      ALTER TABLE IF EXISTS "fraud_alert" DROP COLUMN "userId";
      ALTER TABLE IF EXISTS "fraud_alert" RENAME COLUMN "temp_user_id" TO "userId";
      -- FK_fraud_alert_user postponed
      ALTER TABLE IF EXISTS "fraud_alert" DROP COLUMN "bookingId";
      ALTER TABLE IF EXISTS "fraud_alert" RENAME COLUMN "temp_booking_id" TO "bookingId";
      -- FK_fraud_alert_booking postponed
      ALTER TABLE IF EXISTS "fraud_alert" DROP COLUMN "assignedToUserId";
      ALTER TABLE IF EXISTS "fraud_alert" RENAME COLUMN "temp_assigned_user_id" TO "assignedToUserId";
      -- FK_fraud_alert_assigned_user postponed
      
      ALTER TABLE IF EXISTS "support_message" DROP COLUMN "userId";
      ALTER TABLE IF EXISTS "support_message" RENAME COLUMN "temp_user_id" TO "userId";
      -- FK_support_message_user postponed
      ALTER TABLE IF EXISTS "support_message" DROP COLUMN "bookingId";
      ALTER TABLE IF EXISTS "support_message" RENAME COLUMN "temp_booking_id" TO "bookingId";
      -- FK_support_message_booking postponed
      ALTER TABLE IF EXISTS "support_message" DROP COLUMN "senderUserId";
      ALTER TABLE IF EXISTS "support_message" RENAME COLUMN "temp_sender_user_id" TO "senderUserId";
      -- FK_support_message_sender_user postponed
      ALTER TABLE IF EXISTS "support_message" DROP COLUMN "assignedToUserId";
      ALTER TABLE IF EXISTS "support_message" RENAME COLUMN "temp_assigned_user_id" TO "assignedToUserId";
      -- FK_support_message_assigned_user postponed

      -- Recreate FKs for additional references
      ALTER TABLE "partner_offerings" DROP COLUMN "partnerId";
      ALTER TABLE "partner_offerings" RENAME COLUMN "temp_partner_id" TO "partnerId";
      -- FK to partner postponed; will be added in a follow-up migration once partner.id is fully swapped

      ALTER TABLE "space_option" DROP COLUMN "spaceId";
      ALTER TABLE "space_option" RENAME COLUMN "temp_space_id" TO "spaceId";
      -- FK_space_option_space postponed

      ALTER TABLE IF EXISTS "space_options" DROP COLUMN "space_id";
      ALTER TABLE IF EXISTS "space_options" RENAME COLUMN "temp_space_id" TO "space_id";
      -- FK_space_options_space_id postponed
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is a complex rollback - in production, this should be carefully planned
    // For now, we'll just add the old UUID column back and restore from mapping table

    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN "old_id" UUID;
      UPDATE "user" SET "old_id" = m."old_id" 
      FROM "id_migration_mapping" m 
      WHERE "user"."id" = m."new_id" AND m."entity_type" = 'user';
    `);

    // Note: Full rollback would require restoring all foreign key relationships
    // This is left as a simplified version for safety
  }
}
