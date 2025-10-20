import { MigrationInterface, QueryRunner } from 'typeorm';

export class UnifiedArchitectureMigration1758712500000
  implements MigrationInterface
{
  name = 'UnifiedArchitectureMigration1758712500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums first
    await queryRunner.query(`
      CREATE TYPE "public"."cities_launch_status_enum" AS ENUM(
        'launched', 'coming_soon', 'beta', 'planning'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."cities_tier_classification_enum" AS ENUM(
        'tier_1', 'tier_2', 'tier_3', 'metro', 'non_metro'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."partner_locations_privacy_level_enum" AS ENUM(
        'public', 'neighborhood', 'city'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."partner_listings_listing_type_enum" AS ENUM(
        'cafe', 'coworking_space', 'office_space', 'restobar', 'event_space',
        'freelancer', 'startup_enabler', 'event_organizer'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."partner_listings_approval_status_enum" AS ENUM(
        'pending', 'approved', 'rejected', 'under_review'
      )
    `);

    // Create cities table
    await queryRunner.query(`
      CREATE TABLE "cities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "state" character varying(255) NOT NULL,
        "launch_status" "public"."cities_launch_status_enum" NOT NULL DEFAULT 'planning',
        "tier_classification" "public"."cities_tier_classification_enum" NOT NULL DEFAULT 'tier_3',
        "gst_state_code" character varying(10),
        "expansion_priority" integer DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4762ffb6e5d198cfec5606bc11e" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for cities
    await queryRunner.query(`
      CREATE INDEX "IDX_cities_launch_status" ON "cities" ("launch_status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_cities_tier_classification" ON "cities" ("tier_classification")
    `);

    // Create neighborhoods table
    await queryRunner.query(`
      CREATE TABLE "neighborhoods" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "city_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "display_name" character varying(255),
        "popular_tags" jsonb DEFAULT '[]',
        "is_popular" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_neighborhoods" PRIMARY KEY ("id")
      )
    `);

    // Create index for neighborhoods
    await queryRunner.query(`
      CREATE INDEX "IDX_neighborhoods_city_id" ON "neighborhoods" ("city_id")
    `);

    // Add foreign key constraint for neighborhoods
    await queryRunner.query(`
      ALTER TABLE "neighborhoods" ADD CONSTRAINT "FK_neighborhoods_city_id" 
      FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE
    `);

    // Create partner_locations table
    await queryRunner.query(`
      CREATE TABLE "partner_locations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "partner_id" uuid NOT NULL,
        "city_id" uuid NOT NULL,
        "neighborhood_id" uuid NOT NULL,
        "address" text NOT NULL,
        "latitude" decimal(10,8) NOT NULL,
        "longitude" decimal(11,8) NOT NULL,
        "privacy_level" "public"."partner_locations_privacy_level_enum" NOT NULL DEFAULT 'neighborhood',
        "operating_hours" jsonb,
        "amenities" character varying array DEFAULT '{}',
        "images" character varying array DEFAULT '{}',
        "contact_info" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "location_metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_partner_locations" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for partner_locations
    await queryRunner.query(`
      CREATE INDEX "IDX_partner_locations_partner_id" ON "partner_locations" ("partner_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_partner_locations_city_id" ON "partner_locations" ("city_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_partner_locations_neighborhood_id" ON "partner_locations" ("neighborhood_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_partner_locations_privacy_level" ON "partner_locations" ("privacy_level")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_partner_locations_is_active" ON "partner_locations" ("is_active")
    `);

    // Add foreign key constraints for partner_locations
    await queryRunner.query(`
      ALTER TABLE "partner_locations" ADD CONSTRAINT "FK_partner_locations_partner_id" 
      FOREIGN KEY ("partner_id") REFERENCES "partner"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "partner_locations" ADD CONSTRAINT "FK_partner_locations_city_id" 
      FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "partner_locations" ADD CONSTRAINT "FK_partner_locations_neighborhood_id" 
      FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods"("id") ON DELETE CASCADE
    `);

    // Create partner_listings table
    await queryRunner.query(`
      CREATE TABLE "partner_listings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "partner_id" uuid NOT NULL,
        "location_id" uuid NOT NULL,
        "listing_type" "public"."partner_listings_listing_type_enum" NOT NULL,
        "listing_name" character varying(255) NOT NULL,
        "description" text,
        "approval_status" "public"."partner_listings_approval_status_enum" NOT NULL DEFAULT 'pending',
        "is_active" boolean NOT NULL DEFAULT true,
        "listing_metadata" jsonb,
        "images" character varying array DEFAULT '{}',
        "amenities" character varying array DEFAULT '{}',
        "operating_hours" jsonb,
        "rating" decimal(3,2) NOT NULL DEFAULT 0,
        "review_count" integer NOT NULL DEFAULT 0,
        "total_bookings" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_partner_listings" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for partner_listings
    await queryRunner.query(`
      CREATE INDEX "IDX_partner_listings_partner_id" ON "partner_listings" ("partner_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_partner_listings_location_id" ON "partner_listings" ("location_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_partner_listings_listing_type" ON "partner_listings" ("listing_type")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_partner_listings_approval_status" ON "partner_listings" ("approval_status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_partner_listings_is_active" ON "partner_listings" ("is_active")
    `);

    // Add foreign key constraints for partner_listings
    await queryRunner.query(`
      ALTER TABLE "partner_listings" ADD CONSTRAINT "FK_partner_listings_partner_id" 
      FOREIGN KEY ("partner_id") REFERENCES "partner"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "partner_listings" ADD CONSTRAINT "FK_partner_listings_location_id" 
      FOREIGN KEY ("location_id") REFERENCES "partner_locations"("id") ON DELETE CASCADE
    `);

    // Update partner table - remove address column
    await queryRunner.query(`
      ALTER TABLE "partner" DROP COLUMN IF EXISTS "address"
    `);

    // Update space table - change partnerId to listing_id
    await queryRunner.query(`
      ALTER TABLE "space" ADD COLUMN "listing_id" uuid
    `);

    // Update space table - add space_specific_location column
    await queryRunner.query(`
      ALTER TABLE "space" ADD COLUMN "space_specific_location" jsonb
    `);

    // Drop old location column from space table
    await queryRunner.query(`
      ALTER TABLE "space" DROP COLUMN IF EXISTS "location"
    `);

    // Update partner_extras table - add listing_id
    await queryRunner.query(`
      ALTER TABLE "partner_extras" ADD COLUMN "listing_id" uuid
    `);

    // Add foreign key constraint for partner_extras.listing_id
    await queryRunner.query(`
      ALTER TABLE "partner_extras" ADD CONSTRAINT "FK_partner_extras_listing_id" 
      FOREIGN KEY ("listing_id") REFERENCES "partner_listings"("id") ON DELETE CASCADE
    `);

    // Update indexes for space table
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_space_partnerId_status"
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_space_listing_id_status" ON "space" ("listing_id", "status")
    `);

    // Add index for partner_extras.listing_id
    await queryRunner.query(`
      CREATE INDEX "IDX_partner_extras_listing_id" ON "partner_extras" ("listing_id")
    `);

    // Add foreign key constraint for space.listing_id
    await queryRunner.query(`
      ALTER TABLE "space" ADD CONSTRAINT "FK_space_listing_id" 
      FOREIGN KEY ("listing_id") REFERENCES "partner_listings"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "space" DROP CONSTRAINT IF EXISTS "FK_space_listing_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "partner_extras" DROP CONSTRAINT IF EXISTS "FK_partner_extras_listing_id"
    `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_extras_listing_id"`,
    );
    await queryRunner.query(`
      ALTER TABLE "partner_listings" DROP CONSTRAINT IF EXISTS "FK_partner_listings_location_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "partner_listings" DROP CONSTRAINT IF EXISTS "FK_partner_listings_partner_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "partner_locations" DROP CONSTRAINT IF EXISTS "FK_partner_locations_neighborhood_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "partner_locations" DROP CONSTRAINT IF EXISTS "FK_partner_locations_city_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "partner_locations" DROP CONSTRAINT IF EXISTS "FK_partner_locations_partner_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "neighborhoods" DROP CONSTRAINT IF EXISTS "FK_neighborhoods_city_id"
    `);

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_listing_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_listings_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_listings_approval_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_listings_listing_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_listings_location_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_listings_partner_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_locations_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_locations_privacy_level"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_locations_neighborhood_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_locations_city_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_locations_partner_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_neighborhoods_city_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_cities_tier_classification"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cities_launch_status"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_listings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_locations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "neighborhoods"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cities"`);

    // Drop enums
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."partner_listings_approval_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."partner_listings_listing_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."partner_locations_privacy_level_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."cities_tier_classification_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."cities_launch_status_enum"`,
    );

    // Restore space table columns
    await queryRunner.query(`
      ALTER TABLE "space" DROP COLUMN IF EXISTS "space_specific_location"
    `);
    await queryRunner.query(`
      ALTER TABLE "space" DROP COLUMN IF EXISTS "listing_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "space" ADD COLUMN "location" jsonb
    `);

    // Restore partner_extras table
    await queryRunner.query(`
      ALTER TABLE "partner_extras" DROP COLUMN IF EXISTS "listing_id"
    `);

    // Restore partner table address column
    await queryRunner.query(`
      ALTER TABLE "partner" ADD COLUMN "address" jsonb
    `);

    // Restore old indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_space_partnerId_status" ON "space" ("partnerId", "status")
    `);
  }
}
