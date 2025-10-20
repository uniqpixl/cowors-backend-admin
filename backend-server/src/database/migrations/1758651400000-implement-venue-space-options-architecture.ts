import { MigrationInterface, QueryRunner } from 'typeorm';

export class ImplementVenueSpaceOptionsArchitecture1758651400000
  implements MigrationInterface
{
  name = 'ImplementVenueSpaceOptionsArchitecture1758651400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums for new entities
    await queryRunner.query(`
      CREATE TYPE "public"."space_option_type_enum" AS ENUM(
        'meeting_room', 'conference_room', 'private_office', 'hot_desk', 
        'dedicated_desk', 'event_space', 'workshop_area', 'phone_booth', 
        'lounge_area', 'kitchen_access', 'storage_unit', 'parking_spot', 
        'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."space_option_status_enum" AS ENUM(
        'active', 'inactive', 'maintenance', 'coming_soon', 'fully_booked'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."enhanced_pricing_type_enum" AS ENUM(
        'flat', 'recurring', 'usage_based', 'tiered'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."recurring_interval_enum" AS ENUM(
        'hourly', 'daily', 'weekly', 'monthly', 'yearly'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."usage_unit_enum" AS ENUM(
        'hour', 'day', 'week', 'month', 'person', 'item', 'gb', 'mb', 'minute'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."partner_extras_category_enum" AS ENUM(
        'catering', 'equipment', 'service', 'amenity', 'add_on', 'upgrade', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."partner_extras_status_enum" AS ENUM(
        'active', 'inactive', 'out_of_stock', 'discontinued'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."override_type_enum" AS ENUM(
        'none', 'flat', 'recurring', 'usage_based', 'tiered', 'partial'
      )
    `);

    // Create SpaceOptionEntity table
    await queryRunner.query(`
      CREATE TABLE "space_option" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "spaceId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "optionType" "public"."space_option_type_enum" NOT NULL DEFAULT 'other',
        "status" "public"."space_option_status_enum" NOT NULL DEFAULT 'active',
        "maxCapacity" integer,
        "minCapacity" integer DEFAULT 1,
        "area" numeric(10,2),
        "amenities" jsonb DEFAULT '[]',
        "features" jsonb DEFAULT '[]',
        "equipment" jsonb DEFAULT '[]',
        "location" jsonb,
        "images" jsonb DEFAULT '[]',
        "availabilityRules" jsonb,
        "cancellationPolicy" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "priority" integer NOT NULL DEFAULT 0,
        "rating" numeric(3,2) DEFAULT 0,
        "reviewCount" integer NOT NULL DEFAULT 0,
        "totalBookings" integer NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedBy" uuid,
        CONSTRAINT "PK_space_option" PRIMARY KEY ("id")
      )
    `);

    // Create PartnerExtrasEntity table
    await queryRunner.query(`
      CREATE TABLE "partner_extras" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "partnerId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "category" "public"."partner_extras_category_enum" NOT NULL DEFAULT 'other',
        "status" "public"."partner_extras_status_enum" NOT NULL DEFAULT 'active',
        "pricing" jsonb NOT NULL,
        "stockQuantity" integer,
        "minOrderQuantity" integer NOT NULL DEFAULT 1,
        "maxOrderQuantity" integer,
        "requiresApproval" boolean NOT NULL DEFAULT false,
        "leadTimeHours" integer DEFAULT 0,
        "images" jsonb DEFAULT '[]',
        "specifications" jsonb DEFAULT '[]',
        "termsAndConditions" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "priority" integer NOT NULL DEFAULT 0,
        "rating" numeric(3,2) DEFAULT 0,
        "reviewCount" integer NOT NULL DEFAULT 0,
        "totalOrders" integer NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedBy" uuid,
        CONSTRAINT "PK_partner_extras" PRIMARY KEY ("id")
      )
    `);

    // Create SpaceOptionExtrasEntity table
    await queryRunner.query(`
      CREATE TABLE "space_option_extras" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "spaceOptionId" uuid NOT NULL,
        "partnerExtrasId" uuid NOT NULL,
        "override" jsonb NOT NULL,
        "overrideStockQuantity" integer,
        "overrideMinOrderQuantity" integer,
        "overrideMaxOrderQuantity" integer,
        "isActive" boolean NOT NULL DEFAULT true,
        "isIncluded" boolean NOT NULL DEFAULT false,
        "isMandatory" boolean NOT NULL DEFAULT false,
        "priority" integer NOT NULL DEFAULT 0,
        "spaceSpecificDescription" text,
        "spaceSpecificTerms" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_space_option_extras" PRIMARY KEY ("id")
      )
    `);

    // Update SpaceEntity table structure for space model
    await queryRunner.query(`
      ALTER TABLE "space" 
      DROP COLUMN IF EXISTS "bookingModel",
      DROP COLUMN IF EXISTS "capacity",
      DROP COLUMN IF EXISTS "availabilityRules"
    `);

    await queryRunner.query(`
      ALTER TABLE "space" 
      ADD COLUMN "totalCapacity" integer,
      ADD COLUMN "commonAmenities" jsonb DEFAULT '[]',
      ADD COLUMN "contactInfo" jsonb,
      ADD COLUMN "operatingHours" jsonb,
      ADD COLUMN "spacePolicies" jsonb,
      ADD COLUMN "totalSpaceOptions" integer NOT NULL DEFAULT 0
    `);

    // Rename amenities column to commonAmenities if it exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'space' AND column_name = 'amenities') THEN
          ALTER TABLE "space" RENAME COLUMN "amenities" TO "commonAmenities_old";
        END IF;
      END $$;
    `);

    // Update SpacePackageEntity to link to SpaceOption instead of Space (if table exists)
    const hasSpacePackageTable = await queryRunner.hasTable('space_package');
    if (hasSpacePackageTable) {
      await queryRunner.query(`
        ALTER TABLE "space_package" 
        RENAME COLUMN "spaceId" TO "spaceOptionId"
      `);
    }

    // Update SpacePackageEntity pricing structure (if table exists)
    if (hasSpacePackageTable) {
      await queryRunner.query(`
        ALTER TABLE "space_package" 
        ADD COLUMN "enhancedPricing" jsonb,
        ADD COLUMN "legacyBasePrice" numeric(10,2),
        ADD COLUMN "legacyCurrency" character varying(3)
      `);

      // Migrate existing pricing data to new structure
      await queryRunner.query(`
        UPDATE "space_package" 
        SET 
          "legacyBasePrice" = "basePrice",
          "legacyCurrency" = "currency",
          "enhancedPricing" = jsonb_build_object(
            'pricingType', 'flat',
            'basePrice', "basePrice",
            'currency', "currency"
          )
        WHERE "basePrice" IS NOT NULL
      `);
    }

    // Create indexes for SpaceOptionEntity
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_space_id" ON "space_option" ("spaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_type" ON "space_option" ("optionType")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_status" ON "space_option" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_active" ON "space_option" ("isActive")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_capacity" ON "space_option" ("maxCapacity")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_created_at" ON "space_option" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_rating" ON "space_option" ("rating")`,
    );

    // Create indexes for PartnerExtrasEntity
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_extras_partner_id" ON "partner_extras" ("partnerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_extras_category" ON "partner_extras" ("category")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_extras_status" ON "partner_extras" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_extras_active" ON "partner_extras" ("isActive")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_extras_stock" ON "partner_extras" ("stockQuantity")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_extras_created_at" ON "partner_extras" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_extras_rating" ON "partner_extras" ("rating")`,
    );

    // Create indexes for SpaceOptionExtrasEntity
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_extras_space_option_id" ON "space_option_extras" ("spaceOptionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_extras_partner_extras_id" ON "space_option_extras" ("partnerExtrasId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_extras_active" ON "space_option_extras" ("isActive")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_extras_included" ON "space_option_extras" ("isIncluded")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_extras_mandatory" ON "space_option_extras" ("isMandatory")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_extras_priority" ON "space_option_extras" ("priority")`,
    );

    // Create composite indexes for better query performance
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_space_type_status" ON "space_option" ("spaceId", "optionType", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_extras_partner_category_status" ON "partner_extras" ("partnerId", "category", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_space_option_extras_composite" ON "space_option_extras" ("spaceOptionId", "partnerExtrasId", "isActive")`,
    );

    // Update Space entity indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_space_partner_id" ON "space" ("partnerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_space_type" ON "space" ("spaceType")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_space_status" ON "space" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_space_created_at" ON "space" ("createdAt")`,
    );

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "space_option" 
      ADD CONSTRAINT "FK_space_option_space" 
      FOREIGN KEY ("spaceId") REFERENCES "space"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option" 
      ADD CONSTRAINT "FK_space_option_created_by" 
      FOREIGN KEY ("createdBy") REFERENCES "user"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option" 
      ADD CONSTRAINT "FK_space_option_updated_by" 
      FOREIGN KEY ("updatedBy") REFERENCES "user"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_extras" 
      ADD CONSTRAINT "FK_partner_extras_partner" 
      FOREIGN KEY ("partnerId") REFERENCES "partner"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_extras" 
      ADD CONSTRAINT "FK_partner_extras_created_by" 
      FOREIGN KEY ("createdBy") REFERENCES "user"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_extras" 
      ADD CONSTRAINT "FK_partner_extras_updated_by" 
      FOREIGN KEY ("updatedBy") REFERENCES "user"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option_extras" 
      ADD CONSTRAINT "FK_space_option_extras_space_option" 
      FOREIGN KEY ("spaceOptionId") REFERENCES "space_option"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option_extras" 
      ADD CONSTRAINT "FK_space_option_extras_partner_extras" 
      FOREIGN KEY ("partnerExtrasId") REFERENCES "partner_extras"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add unique constraints
    await queryRunner.query(`
      ALTER TABLE "space_option_extras" 
      ADD CONSTRAINT "UQ_space_option_extras_unique" 
      UNIQUE ("spaceOptionId", "partnerExtrasId")
    `);

    // Add check constraints for data validation
    await queryRunner.query(`
      ALTER TABLE "space_option" 
      ADD CONSTRAINT "CHK_space_option_capacity" 
      CHECK ("maxCapacity" IS NULL OR "maxCapacity" > 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option" 
      ADD CONSTRAINT "CHK_space_option_min_max_capacity" 
      CHECK ("minCapacity" IS NULL OR "maxCapacity" IS NULL OR "minCapacity" <= "maxCapacity")
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option" 
      ADD CONSTRAINT "CHK_space_option_area" 
      CHECK ("area" IS NULL OR "area" > 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option" 
      ADD CONSTRAINT "CHK_space_option_rating" 
      CHECK ("rating" >= 0 AND "rating" <= 5)
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option" 
      ADD CONSTRAINT "CHK_space_option_priority" 
      CHECK ("priority" >= 0 AND "priority" <= 100)
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_extras" 
      ADD CONSTRAINT "CHK_partner_extras_stock" 
      CHECK ("stockQuantity" IS NULL OR "stockQuantity" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_extras" 
      ADD CONSTRAINT "CHK_partner_extras_order_quantity" 
      CHECK ("minOrderQuantity" > 0 AND ("maxOrderQuantity" IS NULL OR "maxOrderQuantity" >= "minOrderQuantity"))
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_extras" 
      ADD CONSTRAINT "CHK_partner_extras_lead_time" 
      CHECK ("leadTimeHours" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_extras" 
      ADD CONSTRAINT "CHK_partner_extras_rating" 
      CHECK ("rating" >= 0 AND "rating" <= 5)
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_extras" 
      ADD CONSTRAINT "CHK_partner_extras_priority" 
      CHECK ("priority" >= 0 AND "priority" <= 100)
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option_extras" 
      ADD CONSTRAINT "CHK_space_option_extras_override_stock" 
      CHECK ("overrideStockQuantity" IS NULL OR "overrideStockQuantity" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option_extras" 
      ADD CONSTRAINT "CHK_space_option_extras_override_order_quantity" 
      CHECK (
        "overrideMinOrderQuantity" IS NULL OR 
        "overrideMinOrderQuantity" > 0 AND 
        ("overrideMaxOrderQuantity" IS NULL OR "overrideMaxOrderQuantity" >= "overrideMinOrderQuantity")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option_extras" 
      ADD CONSTRAINT "CHK_space_option_extras_priority" 
      CHECK ("priority" >= 0 AND "priority" <= 100)
    `);

    // Update existing space_package foreign key to point to space_option (if table exists)
    if (hasSpacePackageTable) {
      await queryRunner.query(`
        ALTER TABLE "space_package" 
        DROP CONSTRAINT IF EXISTS "FK_space_package_space"
      `);

      await queryRunner.query(`
        ALTER TABLE "space_package" 
        ADD CONSTRAINT "FK_space_package_space_option" 
        FOREIGN KEY ("spaceOptionId") REFERENCES "space_option"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION
      `);
    }

    // Create triggers for updating timestamps
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_space_option_updated_at 
      BEFORE UPDATE ON "space_option" 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_partner_extras_updated_at 
      BEFORE UPDATE ON "partner_extras" 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_space_option_extras_updated_at 
      BEFORE UPDATE ON "space_option_extras" 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_space_option_extras_updated_at ON "space_option_extras"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_partner_extras_updated_at ON "partner_extras"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_space_option_updated_at ON "space_option"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_updated_at_column()`,
    );

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "space_package" DROP CONSTRAINT IF EXISTS "FK_space_package_space_option"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option_extras" DROP CONSTRAINT IF EXISTS "FK_space_option_extras_partner_extras"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option_extras" DROP CONSTRAINT IF EXISTS "FK_space_option_extras_space_option"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_extras" DROP CONSTRAINT IF EXISTS "FK_partner_extras_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_extras" DROP CONSTRAINT IF EXISTS "FK_partner_extras_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_extras" DROP CONSTRAINT IF EXISTS "FK_partner_extras_partner"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option" DROP CONSTRAINT IF EXISTS "FK_space_option_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option" DROP CONSTRAINT IF EXISTS "FK_space_option_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option" DROP CONSTRAINT IF EXISTS "FK_space_option_space"`,
    );

    // Drop unique constraints
    await queryRunner.query(
      `ALTER TABLE "space_option_extras" DROP CONSTRAINT IF EXISTS "UQ_space_option_extras_unique"`,
    );

    // Drop check constraints
    await queryRunner.query(
      `ALTER TABLE "space_option_extras" DROP CONSTRAINT IF EXISTS "CHK_space_option_extras_priority"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option_extras" DROP CONSTRAINT IF EXISTS "CHK_space_option_extras_override_order_quantity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option_extras" DROP CONSTRAINT IF EXISTS "CHK_space_option_extras_override_stock"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_extras" DROP CONSTRAINT IF EXISTS "CHK_partner_extras_priority"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_extras" DROP CONSTRAINT IF EXISTS "CHK_partner_extras_rating"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_extras" DROP CONSTRAINT IF EXISTS "CHK_partner_extras_lead_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_extras" DROP CONSTRAINT IF EXISTS "CHK_partner_extras_order_quantity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_extras" DROP CONSTRAINT IF EXISTS "CHK_partner_extras_stock"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option" DROP CONSTRAINT IF EXISTS "CHK_space_option_priority"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option" DROP CONSTRAINT IF EXISTS "CHK_space_option_rating"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option" DROP CONSTRAINT IF EXISTS "CHK_space_option_area"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option" DROP CONSTRAINT IF EXISTS "CHK_space_option_min_max_capacity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option" DROP CONSTRAINT IF EXISTS "CHK_space_option_capacity"`,
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_option_extras_composite"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_extras_partner_category_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_option_space_type_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_option_extras_priority"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_option_extras_mandatory"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_option_extras_included"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_option_extras_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_option_extras_partner_extras_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_option_extras_space_option_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partner_extras_rating"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_extras_created_at"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partner_extras_stock"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partner_extras_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partner_extras_status"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_extras_category"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_extras_partner_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_space_option_rating"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_option_created_at"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_space_option_capacity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_space_option_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_space_option_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_space_option_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_space_option_space_id"`);

    // Revert SpacePackageEntity changes
    await queryRunner.query(
      `ALTER TABLE "space_package" DROP COLUMN IF EXISTS "legacyCurrency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_package" DROP COLUMN IF EXISTS "legacyBasePrice"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_package" DROP COLUMN IF EXISTS "enhancedPricing"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_package" RENAME COLUMN "spaceOptionId" TO "spaceId"`,
    );

    // Revert SpaceEntity changes
    await queryRunner.query(`
      ALTER TABLE "space" 
      DROP COLUMN IF EXISTS "totalSpaceOptions",
      DROP COLUMN IF EXISTS "spacePolicies",
      DROP COLUMN IF EXISTS "operatingHours",
      DROP COLUMN IF EXISTS "contactInfo",
      DROP COLUMN IF EXISTS "commonAmenities",
      DROP COLUMN IF EXISTS "totalCapacity"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "space_option_extras"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_extras"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "space_option"`);

    // Drop enums
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."override_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."partner_extras_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."partner_extras_category_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."usage_unit_enum"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."recurring_interval_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."enhanced_pricing_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."space_option_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."space_option_type_enum"`,
    );
  }
}
