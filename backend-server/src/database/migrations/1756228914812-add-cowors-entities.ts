import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoworsEntities1756228914812 implements MigrationInterface {
  name = 'AddCoworsEntities1756228914812';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."wallet_balance_balancetype_enum" AS ENUM(
                'refund',
                'reward',
                'promo',
                'welcome',
                'referral'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "wallet_balance" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "userId" uuid NOT NULL,
                "balanceType" "public"."wallet_balance_balancetype_enum" NOT NULL,
                "balance" numeric(12, 2) NOT NULL DEFAULT '0',
                "lockedBalance" numeric(12, 2) NOT NULL DEFAULT '0',
                "currency" character varying(3) NOT NULL DEFAULT 'INR',
                "lastTransactionAt" TIMESTAMP,
                "limits" jsonb,
                "metadata" jsonb,
                CONSTRAINT "UQ_5385108213103137e530dfc7ee6" UNIQUE ("userId", "balanceType"),
                CONSTRAINT "PK_ec31e88796415d49a1ee8d821f8" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_b308c100af751be06c0801194b" ON "wallet_balance" ("userId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."wallet_transaction_type_enum" AS ENUM('credit', 'debit', 'transfer', 'withdrawal')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."wallet_transaction_source_enum" AS ENUM(
                'booking_payment',
                'booking_refund',
                'cashback',
                'referral_bonus',
                'promotional_credit',
                'admin_adjustment',
                'withdrawal',
                'top_up',
                'transfer'
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."wallet_transaction_status_enum" AS ENUM('pending', 'completed', 'failed', 'cancelled')
        `);
    await queryRunner.query(`
            CREATE TABLE "wallet_transaction" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "userId" uuid NOT NULL,
                "walletBalanceId" uuid NOT NULL,
                "transactionId" character varying(50) NOT NULL,
                "type" "public"."wallet_transaction_type_enum" NOT NULL,
                "source" "public"."wallet_transaction_source_enum" NOT NULL,
                "amount" numeric(12, 2) NOT NULL,
                "balanceAfter" numeric(12, 2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'INR',
                "status" "public"."wallet_transaction_status_enum" NOT NULL DEFAULT 'pending',
                "description" text NOT NULL,
                "referenceId" character varying(100),
                "referenceType" character varying(50),
                "processedAt" TIMESTAMP,
                "failedAt" TIMESTAMP,
                "failureReason" text,
                "metadata" jsonb,
                CONSTRAINT "UQ_440094053e5e4c846243f6928be" UNIQUE ("transactionId"),
                CONSTRAINT "PK_62a01b9c3a734b96a08c621b371" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_64d3aef2cd4bc395ce37f09fe0" ON "wallet_transaction" ("userId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_97b758efe88e38ffeb99dca6de" ON "wallet_transaction" ("walletBalanceId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."partner_businesstype_enum" AS ENUM('space', 'service', 'event')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."partner_verificationstatus_enum" AS ENUM('pending', 'verified', 'rejected', 'suspended')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."partner_status_enum" AS ENUM('active', 'inactive', 'suspended', 'draft')
        `);
    await queryRunner.query(`
            CREATE TABLE "partner" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "createdByUserId" uuid NOT NULL,
                "updatedByUserId" uuid NOT NULL,
                "deletedByUserId" uuid,
                "userId" uuid NOT NULL,
                "businessName" character varying(255) NOT NULL,
                "businessType" "public"."partner_businesstype_enum" NOT NULL DEFAULT 'space',
                "businessSubtype" character varying(100),
                "address" jsonb,
                "contactInfo" jsonb,
                "verificationStatus" "public"."partner_verificationstatus_enum" NOT NULL DEFAULT 'pending',
                "status" "public"."partner_status_enum" NOT NULL DEFAULT 'active',
                "businessDetails" jsonb,
                "operatingHours" jsonb,
                "rating" numeric(3, 2) NOT NULL DEFAULT '0',
                "reviewCount" integer NOT NULL DEFAULT '0',
                "commissionRate" numeric(5, 2) NOT NULL DEFAULT '0',
                CONSTRAINT "PK_8f34ff11ddd5459eacbfacd48ca" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0b74f8933bbbefcd10324af0f9" ON "partner" ("createdByUserId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_372c22aa65a4191cc423fab6c6" ON "partner" ("updatedByUserId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_bd6fbb27bef21f5b89864ee5a4" ON "partner" ("deletedByUserId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d37abbe64a84c9ff507b190742" ON "partner" ("userId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."space_availability_type_enum" AS ENUM(
                'available',
                'blocked',
                'maintenance',
                'reserved'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "space_availability" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "spaceId" uuid NOT NULL,
                "date" date NOT NULL,
                "startTime" TIME NOT NULL,
                "endTime" TIME NOT NULL,
                "type" "public"."space_availability_type_enum" NOT NULL DEFAULT 'available',
                "priceOverride" numeric(10, 2),
                "capacityOverride" integer,
                "notes" text,
                "metadata" jsonb,
                CONSTRAINT "PK_3fd3f1f8f34ddb3bba473c3d2ca" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_1719a5e275729f503107d92a7f" ON "space_availability" ("spaceId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_efcfb9652e55a9dfb5fc905001" ON "space_availability" ("date")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."space_spacetype_enum" AS ENUM(
                'cafe',
                'coworking_space',
                'office_space',
                'restobar',
                'event_space'
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."space_bookingmodel_enum" AS ENUM(
                'time_based',
                'slot_based',
                'fixed_rate',
                'tiered',
                'flexible'
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."space_status_enum" AS ENUM('active', 'inactive', 'suspended', 'draft')
        `);
    await queryRunner.query(`
            CREATE TABLE "space" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "partnerId" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "spaceType" "public"."space_spacetype_enum" NOT NULL,
                "bookingModel" "public"."space_bookingmodel_enum" NOT NULL DEFAULT 'time_based',
                "capacity" integer NOT NULL,
                "amenities" jsonb NOT NULL,
                "location" jsonb,
                "pricing" jsonb NOT NULL,
                "availabilityRules" jsonb,
                "images" jsonb,
                "status" "public"."space_status_enum" NOT NULL DEFAULT 'active',
                "rating" numeric(3, 2) NOT NULL DEFAULT '0',
                "reviewCount" integer NOT NULL DEFAULT '0',
                "totalBookings" integer NOT NULL DEFAULT '0',
                "metadata" jsonb,
                CONSTRAINT "PK_094f5ec727fe052956a11623640" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f82db828f6b51e19219638fae9" ON "space" ("partnerId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."booking_item_type_enum" AS ENUM('addon', 'service', 'equipment', 'catering')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."booking_item_category_enum" AS ENUM(
                'food_beverages',
                'equipment',
                'services',
                'amenities'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "booking_item" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "bookingId" uuid NOT NULL,
                "type" "public"."booking_item_type_enum" NOT NULL DEFAULT 'addon',
                "category" "public"."booking_item_category_enum" NOT NULL,
                "name" character varying(255) NOT NULL,
                "description" text,
                "quantity" integer NOT NULL DEFAULT '1',
                "unitPrice" numeric(10, 2) NOT NULL,
                "totalPrice" numeric(10, 2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'INR',
                "specifications" jsonb,
                "metadata" jsonb,
                CONSTRAINT "PK_5f00cae6b1d793669a01d03df5d" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6a52bca489ac5426622d9794cd" ON "booking_item" ("bookingId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."booking_status_enum" AS ENUM(
                'pending',
                'confirmed',
                'cancelled',
                'completed',
                'no_show',
                'refunded'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "booking" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "userId" uuid NOT NULL,
                "spaceId" uuid NOT NULL,
                "bookingNumber" character varying(20) NOT NULL,
                "startDateTime" TIMESTAMP NOT NULL,
                "endDateTime" TIMESTAMP NOT NULL,
                "duration" integer NOT NULL,
                "guestCount" integer NOT NULL DEFAULT '1',
                "baseAmount" numeric(10, 2) NOT NULL,
                "addonAmount" numeric(10, 2) NOT NULL DEFAULT '0',
                "discountAmount" numeric(10, 2) NOT NULL DEFAULT '0',
                "taxAmount" numeric(10, 2) NOT NULL DEFAULT '0',
                "totalAmount" numeric(10, 2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'INR',
                "status" "public"."booking_status_enum" NOT NULL DEFAULT 'pending',
                "specialRequests" text,
                "cancellationReason" text,
                "cancelledAt" TIMESTAMP,
                "confirmedAt" TIMESTAMP,
                "checkedInAt" TIMESTAMP,
                "checkedOutAt" TIMESTAMP,
                "contactInfo" jsonb,
                "pricing" jsonb,
                "metadata" jsonb,
                CONSTRAINT "UQ_f3beb9d77946b9959fcac91fd1e" UNIQUE ("bookingNumber"),
                CONSTRAINT "PK_49171efc69702ed84c812f33540" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9eebd1566f6996fd1f48adf918" ON "booking" ("userId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_511c54f7242b23e94c41074ee7" ON "booking" ("spaceId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_63c62aa535fe00ab570fd126d2" ON "booking" ("startDateTime")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_bb19f3cf7552be67fd0a238627" ON "booking" ("endDateTime")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."payment_gateway_enum" AS ENUM('stripe', 'razorpay', 'wallet')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."payment_method_enum" AS ENUM(
                'card',
                'upi',
                'net_banking',
                'wallet',
                'emi',
                'cash'
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."payment_status_enum" AS ENUM(
                'pending',
                'processing',
                'completed',
                'failed',
                'cancelled',
                'refunded',
                'partially_refunded'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "payment" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "userId" uuid NOT NULL,
                "bookingId" uuid NOT NULL,
                "paymentId" character varying(50) NOT NULL,
                "gatewayPaymentId" character varying(100),
                "gatewayOrderId" character varying(100),
                "gateway" "public"."payment_gateway_enum" NOT NULL,
                "method" "public"."payment_method_enum" NOT NULL,
                "amount" numeric(10, 2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'INR',
                "status" "public"."payment_status_enum" NOT NULL DEFAULT 'pending',
                "paidAt" TIMESTAMP,
                "failedAt" TIMESTAMP,
                "failureReason" text,
                "gatewayResponse" jsonb,
                "breakdown" jsonb,
                "metadata" jsonb,
                CONSTRAINT "UQ_67ee4523b649947b6a7954dc673" UNIQUE ("paymentId"),
                CONSTRAINT "REL_5738278c92c15e1ec9d27e3a09" UNIQUE ("bookingId"),
                CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_251ce3f5dd4104d6fd69324046" ON "payment" ("userId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_83b37a7cdabb0dea5cdac5a84c" ON "payment" ("bookingId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."refund_type_enum" AS ENUM('full', 'partial', 'cancellation', 'adjustment')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."refund_method_enum" AS ENUM(
                'original_source',
                'wallet',
                'bank_transfer',
                'cash'
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."refund_status_enum" AS ENUM(
                'pending',
                'processing',
                'completed',
                'failed',
                'cancelled'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "refund" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "userId" uuid NOT NULL,
                "paymentId" uuid NOT NULL,
                "refundId" character varying(50) NOT NULL,
                "gatewayRefundId" character varying(100),
                "type" "public"."refund_type_enum" NOT NULL,
                "method" "public"."refund_method_enum" NOT NULL DEFAULT 'original_source',
                "amount" numeric(10, 2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'INR',
                "status" "public"."refund_status_enum" NOT NULL DEFAULT 'pending',
                "reason" text NOT NULL,
                "adminNotes" text,
                "processedAt" TIMESTAMP,
                "completedAt" TIMESTAMP,
                "failedAt" TIMESTAMP,
                "failureReason" text,
                "gatewayResponse" jsonb,
                "breakdown" jsonb,
                "metadata" jsonb,
                CONSTRAINT "UQ_14cd319e17940a28952b929f2de" UNIQUE ("refundId"),
                CONSTRAINT "PK_f1cefa2e60d99b206c46c1116e5" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_afdb81a5a0aa9b00175c910f64" ON "refund" ("userId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f59460b24f4fc36a8b20cbf08e" ON "refund" ("paymentId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "wallet_balance"
            ADD CONSTRAINT "FK_7de0cb10b53fbd1181fde7d013d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "wallet_transaction"
            ADD CONSTRAINT "FK_9071d3c9266c4521bdafe29307a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "wallet_transaction"
            ADD CONSTRAINT "FK_69babf9ac975530e636ad434d13" FOREIGN KEY ("walletBalanceId") REFERENCES "wallet_balance"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "partner"
            ADD CONSTRAINT "FK_95c1739b3290d6797f10169d891" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "partner"
            ADD CONSTRAINT "FK_c5be04a5e88b0a6dc9d49f73adf" FOREIGN KEY ("updatedByUserId") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "partner"
            ADD CONSTRAINT "FK_54d02087aa29eb8e0ca3047f7d7" FOREIGN KEY ("deletedByUserId") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "partner"
            ADD CONSTRAINT "FK_17701946f05279c9fe1a05cccf5" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "space_availability"
            ADD CONSTRAINT "FK_4da9741083d2aa799e3323950b6" FOREIGN KEY ("spaceId") REFERENCES "space"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    // Intentionally omitted: FK for space.partnerId -> partner.id will be added later after Cowors ID migration
    await queryRunner.query(`
            ALTER TABLE "booking_item"
            ADD CONSTRAINT "FK_9faafa553fc2800ecd63392aedc" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "booking"
            ADD CONSTRAINT "FK_336b3f4a235460dc93645fbf222" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "booking"
            ADD CONSTRAINT "FK_bf921b479b7d5881d1e764f7d4f" FOREIGN KEY ("spaceId") REFERENCES "space"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "payment"
            ADD CONSTRAINT "FK_b046318e0b341a7f72110b75857" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "payment"
            ADD CONSTRAINT "FK_5738278c92c15e1ec9d27e3a098" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "refund"
            ADD CONSTRAINT "FK_052bf83187cb80bdb003f2650ee" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "refund"
            ADD CONSTRAINT "FK_1c6932a756108788a361e7d4404" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "refund" DROP CONSTRAINT "FK_1c6932a756108788a361e7d4404"
        `);
    await queryRunner.query(`
            ALTER TABLE "refund" DROP CONSTRAINT "FK_052bf83187cb80bdb003f2650ee"
        `);
    await queryRunner.query(`
            ALTER TABLE "payment" DROP CONSTRAINT "FK_5738278c92c15e1ec9d27e3a098"
        `);
    await queryRunner.query(`
            ALTER TABLE "payment" DROP CONSTRAINT "FK_b046318e0b341a7f72110b75857"
        `);
    await queryRunner.query(`
            ALTER TABLE "booking" DROP CONSTRAINT "FK_bf921b479b7d5881d1e764f7d4f"
        `);
    await queryRunner.query(`
            ALTER TABLE "booking" DROP CONSTRAINT "FK_336b3f4a235460dc93645fbf222"
        `);
    await queryRunner.query(`
            ALTER TABLE "booking_item" DROP CONSTRAINT "FK_9faafa553fc2800ecd63392aedc"
        `);
    await queryRunner.query(`
            ALTER TABLE "space" DROP CONSTRAINT IF EXISTS "FK_983ce16992cc16213b9f667ea85"
        `);
    await queryRunner.query(`
            ALTER TABLE "space_availability" DROP CONSTRAINT "FK_4da9741083d2aa799e3323950b6"
        `);
    await queryRunner.query(`
            ALTER TABLE "partner" DROP CONSTRAINT "FK_17701946f05279c9fe1a05cccf5"
        `);
    await queryRunner.query(`
            ALTER TABLE "partner" DROP CONSTRAINT "FK_54d02087aa29eb8e0ca3047f7d7"
        `);
    await queryRunner.query(`
            ALTER TABLE "partner" DROP CONSTRAINT "FK_c5be04a5e88b0a6dc9d49f73adf"
        `);
    await queryRunner.query(`
            ALTER TABLE "partner" DROP CONSTRAINT "FK_95c1739b3290d6797f10169d891"
        `);
    await queryRunner.query(`
            ALTER TABLE "wallet_transaction" DROP CONSTRAINT "FK_69babf9ac975530e636ad434d13"
        `);
    await queryRunner.query(`
            ALTER TABLE "wallet_transaction" DROP CONSTRAINT "FK_9071d3c9266c4521bdafe29307a"
        `);
    await queryRunner.query(`
            ALTER TABLE "wallet_balance" DROP CONSTRAINT "FK_7de0cb10b53fbd1181fde7d013d"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f59460b24f4fc36a8b20cbf08e"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_afdb81a5a0aa9b00175c910f64"
        `);
    await queryRunner.query(`
            DROP TABLE "refund"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."refund_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."refund_method_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."refund_type_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_83b37a7cdabb0dea5cdac5a84c"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_251ce3f5dd4104d6fd69324046"
        `);
    await queryRunner.query(`
            DROP TABLE "payment"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."payment_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."payment_method_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."payment_gateway_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_bb19f3cf7552be67fd0a238627"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_63c62aa535fe00ab570fd126d2"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_511c54f7242b23e94c41074ee7"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9eebd1566f6996fd1f48adf918"
        `);
    await queryRunner.query(`
            DROP TABLE "booking"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."booking_status_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_6a52bca489ac5426622d9794cd"
        `);
    await queryRunner.query(`
            DROP TABLE "booking_item"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."booking_item_category_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."booking_item_type_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f82db828f6b51e19219638fae9"
        `);
    await queryRunner.query(`
            DROP TABLE "space"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."space_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."space_bookingmodel_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."space_spacetype_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_efcfb9652e55a9dfb5fc905001"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_1719a5e275729f503107d92a7f"
        `);
    await queryRunner.query(`
            DROP TABLE "space_availability"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."space_availability_type_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_d37abbe64a84c9ff507b190742"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_bd6fbb27bef21f5b89864ee5a4"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_372c22aa65a4191cc423fab6c6"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0b74f8933bbbefcd10324af0f9"
        `);
    await queryRunner.query(`
            DROP TABLE "partner"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."partner_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."partner_verificationstatus_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."partner_businesstype_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_97b758efe88e38ffeb99dca6de"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_64d3aef2cd4bc395ce37f09fe0"
        `);
    await queryRunner.query(`
            DROP TABLE "wallet_transaction"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."wallet_transaction_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."wallet_transaction_source_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."wallet_transaction_type_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_b308c100af751be06c0801194b"
        `);
    await queryRunner.query(`
            DROP TABLE "wallet_balance"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."wallet_balance_balancetype_enum"
        `);
  }
}
