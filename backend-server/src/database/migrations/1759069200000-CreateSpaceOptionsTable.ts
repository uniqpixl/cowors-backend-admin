import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSpaceOptionsTable1759069200000
  implements MigrationInterface
{
  name = 'CreateSpaceOptionsTable1759069200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums first (idempotent)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'space_options_option_type_enum') THEN
          CREATE TYPE "public"."space_options_option_type_enum" AS ENUM(
            'meeting_room', 'conference_room', 'private_office', 'hot_desk', 
            'dedicated_desk', 'phone_booth', 'event_space', 'training_room', 
            'studio', 'workshop_space', 'lounge', 'kitchen', 'storage', 
            'parking_spot', 'other'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'space_options_status_enum') THEN
          CREATE TYPE "public"."space_options_status_enum" AS ENUM(
            'active', 'inactive', 'maintenance', 'coming_soon'
          );
        END IF;
      END $$;
    `);

    // Create space_options table (idempotent)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "space_options" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "space_id" character varying(10) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "option_type" "public"."space_options_option_type_enum" NOT NULL,
        "status" "public"."space_options_status_enum" NOT NULL DEFAULT 'active',
        "max_capacity" integer NOT NULL,
        "min_capacity" integer NOT NULL DEFAULT 1,
        "area" decimal(10,2),
        "area_unit" character varying(10),
        "amenities" jsonb,
        "features" jsonb,
        "equipment" jsonb,
        "location" jsonb,
        "images" jsonb,
        "availability_rules" jsonb,
        "cancellation_policy" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "priority" integer NOT NULL DEFAULT 0,
        "rating" decimal(3,2) NOT NULL DEFAULT 0,
        "review_count" integer NOT NULL DEFAULT 0,
        "total_bookings" integer NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_space_options" PRIMARY KEY ("id")
      )
    `);

    // Normalize column type if table pre-existed with uuid
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'space_options'
            AND column_name = 'space_id'
            AND data_type = 'uuid'
        ) THEN
          ALTER TABLE "space_options" 
          ALTER COLUMN "space_id" TYPE VARCHAR(10)
          USING "space_id"::text;
        END IF;
      END $$;
    `);

    // Create indexes (idempotent)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_space_options_space_id" ON "space_options" ("space_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_space_options_space_id_status" ON "space_options" ("space_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_space_options_option_type_status" ON "space_options" ("option_type", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_space_options_is_active_priority" ON "space_options" ("is_active", "priority")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_space_options_createdAt" ON "space_options" ("createdAt")
    `);

    // Add foreign key constraint (idempotent)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_space_options_space_id'
        ) THEN
          ALTER TABLE "space_options" ADD CONSTRAINT "FK_space_options_space_id" 
          FOREIGN KEY ("space_id") REFERENCES "space"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "space_options" DROP CONSTRAINT IF EXISTS "FK_space_options_space_id"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_space_options_createdAt"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_space_options_is_active_priority"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_space_options_option_type_status"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_space_options_space_id_status"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_space_options_space_id"
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "space_options"`);

    // Drop enums
    await queryRunner.query(`
      DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'space_options_status_enum') THEN
        DROP TYPE "public"."space_options_status_enum";
      END IF; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'space_options_option_type_enum') THEN
        DROP TYPE "public"."space_options_option_type_enum";
      END IF; END $$;
    `);
  }
}
