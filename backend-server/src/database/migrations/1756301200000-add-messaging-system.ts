import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessagingSystem1756301200000 implements MigrationInterface {
  name = 'AddMessagingSystem1756301200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create conversations table
    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "booking_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "partner_id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "last_activity" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id")
      )
    `);

    // Create messages table
    await queryRunner.query(
      `CREATE TYPE "public"."messages_sender_type_enum" AS ENUM('user', 'partner', 'system')`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."messages_message_type_enum" AS ENUM('text', 'system_action', 'booking_update')`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."messages_status_enum" AS ENUM('sent', 'delivered', 'read')`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."messages_action_type_enum" AS ENUM('extend_time', 'modify_booking', 'cancel_booking')`,
    );

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversation_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "sender_type" "public"."messages_sender_type_enum" NOT NULL DEFAULT 'user',
        "content" text NOT NULL,
        "message_type" "public"."messages_message_type_enum" NOT NULL DEFAULT 'text',
        "status" "public"."messages_status_enum" NOT NULL DEFAULT 'sent',
        "action_type" "public"."messages_action_type_enum",
        "read_at" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_messages" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_conversations_booking_id" ON "conversations" ("booking_id") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_conversations_user_id" ON "conversations" ("user_id") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_conversations_partner_id" ON "conversations" ("partner_id") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_conversation_id" ON "messages" ("conversation_id") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_sender_id" ON "messages" ("sender_id") WHERE "deletedAt" IS NULL`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_booking_id" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_partner_id" FOREIGN KEY ("partner_id") REFERENCES "partner"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_conversation_id" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_sender_id" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_sender_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_conversation_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_conversations_partner_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_conversations_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_conversations_booking_id"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_messages_sender_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_messages_conversation_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_conversations_partner_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_conversations_user_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_conversations_booking_id"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "conversations"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "public"."messages_action_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."messages_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."messages_message_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."messages_sender_type_enum"`);
  }
}
