import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhancePricingSchema1758655000000 implements MigrationInterface {
  name = 'EnhancePricingSchema1758655000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update enhanced_pricing_type_enum to include all pricing types from our DTOs
    await queryRunner.query(`
      ALTER TYPE "public"."enhanced_pricing_type_enum" 
      ADD VALUE IF NOT EXISTS 'tiered'
    `);

    // Update recurring_interval_enum to include annual
    await queryRunner.query(`
      ALTER TYPE "public"."recurring_interval_enum" 
      ADD VALUE IF NOT EXISTS 'annual'
    `);

    // Update usage_unit_enum to include new units from our DTOs
    await queryRunner.query(`
      ALTER TYPE "public"."usage_unit_enum" 
      ADD VALUE IF NOT EXISTS 'per_person'
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."usage_unit_enum" 
      ADD VALUE IF NOT EXISTS 'per_hour'
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."usage_unit_enum" 
      ADD VALUE IF NOT EXISTS 'per_day'
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."usage_unit_enum" 
      ADD VALUE IF NOT EXISTS 'per_item'
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."usage_unit_enum" 
      ADD VALUE IF NOT EXISTS 'per_session'
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."usage_unit_enum" 
      ADD VALUE IF NOT EXISTS 'per_booking'
    `);

    // Enhance SpacePackageEntity with comprehensive pricing schema (if table exists)
    const hasSpacePackageTable = await queryRunner.hasTable('space_package');
    if (hasSpacePackageTable) {
      await queryRunner.query(`
        ALTER TABLE "space_package" 
        ADD COLUMN IF NOT EXISTS "pricingType" "public"."enhanced_pricing_type_enum" DEFAULT 'flat',
        ADD COLUMN IF NOT EXISTS "currency" character varying(3) DEFAULT 'INR',
        ADD COLUMN IF NOT EXISTS "recurringInterval" "public"."recurring_interval_enum",
        ADD COLUMN IF NOT EXISTS "recurringCount" integer DEFAULT 1,
        ADD COLUMN IF NOT EXISTS "usageUnit" "public"."usage_unit_enum",
        ADD COLUMN IF NOT EXISTS "minUsage" numeric(10,2),
        ADD COLUMN IF NOT EXISTS "maxUsage" numeric(10,2),
        ADD COLUMN IF NOT EXISTS "usageIncrement" numeric(10,2),
        ADD COLUMN IF NOT EXISTS "pricingTiers" jsonb DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "pricingMetadata" jsonb DEFAULT '{}'
      `);
    }

    // Enhance PartnerExtrasEntity pricing schema
    await queryRunner.query(`
      ALTER TABLE "partner_extras" 
      ADD COLUMN IF NOT EXISTS "pricingType" "public"."enhanced_pricing_type_enum" DEFAULT 'flat',
      ADD COLUMN IF NOT EXISTS "basePrice" numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "currency" character varying(3) DEFAULT 'INR',
      ADD COLUMN IF NOT EXISTS "recurringInterval" "public"."recurring_interval_enum",
      ADD COLUMN IF NOT EXISTS "recurringCount" integer DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "usageUnit" "public"."usage_unit_enum",
      ADD COLUMN IF NOT EXISTS "minUsage" numeric(10,2),
      ADD COLUMN IF NOT EXISTS "maxUsage" numeric(10,2),
      ADD COLUMN IF NOT EXISTS "usageIncrement" numeric(10,2),
      ADD COLUMN IF NOT EXISTS "pricingTiers" jsonb DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS "pricingMetadata" jsonb DEFAULT '{}'
    `);

    // Enhance SpaceOptionExtrasEntity with override pricing schema
    await queryRunner.query(`
      ALTER TABLE "space_option_extras" 
      ADD COLUMN IF NOT EXISTS "overridePricingType" "public"."enhanced_pricing_type_enum",
      ADD COLUMN IF NOT EXISTS "overrideBasePrice" numeric(10,2),
      ADD COLUMN IF NOT EXISTS "overrideCurrency" character varying(3),
      ADD COLUMN IF NOT EXISTS "overrideRecurringInterval" "public"."recurring_interval_enum",
      ADD COLUMN IF NOT EXISTS "overrideRecurringCount" integer,
      ADD COLUMN IF NOT EXISTS "overrideUsageUnit" "public"."usage_unit_enum",
      ADD COLUMN IF NOT EXISTS "overrideMinUsage" numeric(10,2),
      ADD COLUMN IF NOT EXISTS "overrideMaxUsage" numeric(10,2),
      ADD COLUMN IF NOT EXISTS "overrideUsageIncrement" numeric(10,2),
      ADD COLUMN IF NOT EXISTS "overridePricingTiers" jsonb DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS "overridePricingMetadata" jsonb DEFAULT '{}'
    `);

    // Migrate existing pricing data from jsonb to structured columns
    // For PartnerExtrasEntity - extract pricing from jsonb to structured columns
    await queryRunner.query(`
      UPDATE "partner_extras" 
      SET 
        "pricingType" = COALESCE(
          ("pricing"->>'pricingType')::"public"."enhanced_pricing_type_enum", 
          'flat'
        ),
        "basePrice" = COALESCE(
          ("pricing"->>'basePrice')::numeric(10,2), 
          0
        ),
        "currency" = COALESCE(
          "pricing"->>'currency', 
          'INR'
        ),
        "recurringInterval" = CASE 
          WHEN "pricing"->>'recurringInterval' IS NOT NULL 
          THEN ("pricing"->>'recurringInterval')::"public"."recurring_interval_enum"
          ELSE NULL
        END,
        "recurringCount" = COALESCE(
          ("pricing"->>'recurringCount')::integer, 
          1
        ),
        "usageUnit" = CASE 
          WHEN "pricing"->>'usageUnit' IS NOT NULL 
          THEN ("pricing"->>'usageUnit')::"public"."usage_unit_enum"
          ELSE NULL
        END,
        "minUsage" = CASE 
          WHEN "pricing"->>'minUsage' IS NOT NULL 
          THEN ("pricing"->>'minUsage')::numeric(10,2)
          ELSE NULL
        END,
        "maxUsage" = CASE 
          WHEN "pricing"->>'maxUsage' IS NOT NULL 
          THEN ("pricing"->>'maxUsage')::numeric(10,2)
          ELSE NULL
        END,
        "usageIncrement" = CASE 
          WHEN "pricing"->>'usageIncrement' IS NOT NULL 
          THEN ("pricing"->>'usageIncrement')::numeric(10,2)
          ELSE NULL
        END,
        "pricingTiers" = COALESCE(
          "pricing"->'pricingTiers', 
          '[]'::jsonb
        ),
        "pricingMetadata" = COALESCE(
          "pricing"->'metadata', 
          '{}'::jsonb
        )
      WHERE "pricing" IS NOT NULL
    `);

    // For SpaceOptionExtrasEntity - extract override pricing from jsonb
    await queryRunner.query(`
      UPDATE "space_option_extras" 
      SET 
        "overridePricingType" = CASE 
          WHEN "override"->>'pricingType' IS NOT NULL 
          THEN ("override"->>'pricingType')::"public"."enhanced_pricing_type_enum"
          ELSE NULL
        END,
        "overrideBasePrice" = CASE 
          WHEN "override"->>'basePrice' IS NOT NULL 
          THEN ("override"->>'basePrice')::numeric(10,2)
          ELSE NULL
        END,
        "overrideCurrency" = "override"->>'currency',
        "overrideRecurringInterval" = CASE 
          WHEN "override"->>'recurringInterval' IS NOT NULL 
          THEN ("override"->>'recurringInterval')::"public"."recurring_interval_enum"
          ELSE NULL
        END,
        "overrideRecurringCount" = CASE 
          WHEN "override"->>'recurringCount' IS NOT NULL 
          THEN ("override"->>'recurringCount')::integer
          ELSE NULL
        END,
        "overrideUsageUnit" = CASE 
          WHEN "override"->>'usageUnit' IS NOT NULL 
          THEN ("override"->>'usageUnit')::"public"."usage_unit_enum"
          ELSE NULL
        END,
        "overrideMinUsage" = CASE 
          WHEN "override"->>'minUsage' IS NOT NULL 
          THEN ("override"->>'minUsage')::numeric(10,2)
          ELSE NULL
        END,
        "overrideMaxUsage" = CASE 
          WHEN "override"->>'maxUsage' IS NOT NULL 
          THEN ("override"->>'maxUsage')::numeric(10,2)
          ELSE NULL
        END,
        "overrideUsageIncrement" = CASE 
          WHEN "override"->>'usageIncrement' IS NOT NULL 
          THEN ("override"->>'usageIncrement')::numeric(10,2)
          ELSE NULL
        END,
        "overridePricingTiers" = COALESCE(
          "override"->'pricingTiers', 
          '[]'::jsonb
        ),
        "overridePricingMetadata" = COALESCE(
          "override"->'metadata', 
          '{}'::jsonb
        )
      WHERE "override" IS NOT NULL
    `);

    // For SpacePackageEntity - migrate from enhancedPricing jsonb to structured columns (if table exists)
    if (hasSpacePackageTable) {
      await queryRunner.query(`
        UPDATE "space_package" 
        SET 
          "pricingType" = COALESCE(
            ("enhancedPricing"->>'pricingType')::"public"."enhanced_pricing_type_enum", 
            'flat'
          ),
          "currency" = COALESCE(
            "enhancedPricing"->>'currency', 
            "legacyCurrency",
            'INR'
          ),
          "recurringInterval" = CASE 
            WHEN "enhancedPricing"->>'recurringInterval' IS NOT NULL 
            THEN ("enhancedPricing"->>'recurringInterval')::"public"."recurring_interval_enum"
            ELSE NULL
          END,
          "recurringCount" = COALESCE(
            ("enhancedPricing"->>'recurringCount')::integer, 
            1
          ),
          "usageUnit" = CASE 
            WHEN "enhancedPricing"->>'usageUnit' IS NOT NULL 
            THEN ("enhancedPricing"->>'usageUnit')::"public"."usage_unit_enum"
            ELSE NULL
          END,
          "minUsage" = CASE 
            WHEN "enhancedPricing"->>'minUsage' IS NOT NULL 
            THEN ("enhancedPricing"->>'minUsage')::numeric(10,2)
            ELSE NULL
          END,
          "maxUsage" = CASE 
            WHEN "enhancedPricing"->>'maxUsage' IS NOT NULL 
            THEN ("enhancedPricing"->>'maxUsage')::numeric(10,2)
            ELSE NULL
          END,
          "usageIncrement" = CASE 
            WHEN "enhancedPricing"->>'usageIncrement' IS NOT NULL 
            THEN ("enhancedPricing"->>'usageIncrement')::numeric(10,2)
            ELSE NULL
          END,
          "pricingTiers" = COALESCE(
            "enhancedPricing"->'pricingTiers', 
            '[]'::jsonb
          ),
          "pricingMetadata" = COALESCE(
            "enhancedPricing"->'metadata', 
            '{}'::jsonb
          )
        WHERE "enhancedPricing" IS NOT NULL OR "legacyBasePrice" IS NOT NULL
      `);
    }

    // Update basePrice from legacy data where needed (if table exists)
    if (hasSpacePackageTable) {
      await queryRunner.query(`
        UPDATE "space_package" 
        SET "basePrice" = "legacyBasePrice"
        WHERE "legacyBasePrice" IS NOT NULL AND "basePrice" IS NULL
      `);
    }

    // Add enhanced check constraints for pricing validation (if table exists)
    if (hasSpacePackageTable) {
      await queryRunner.query(`
        ALTER TABLE "space_package" 
        ADD CONSTRAINT "CHK_space_package_base_price" 
        CHECK ("basePrice" IS NULL OR "basePrice" >= 0)
      `);

      await queryRunner.query(`
        ALTER TABLE "space_package" 
        ADD CONSTRAINT "CHK_space_package_recurring_count" 
        CHECK ("recurringCount" IS NULL OR "recurringCount" > 0)
      `);

      await queryRunner.query(`
        ALTER TABLE "space_package" 
        ADD CONSTRAINT "CHK_space_package_usage_range" 
        CHECK (
          "minUsage" IS NULL OR "maxUsage" IS NULL OR "minUsage" <= "maxUsage"
        )
      `);

      await queryRunner.query(`
        ALTER TABLE "space_package" 
        ADD CONSTRAINT "CHK_space_package_usage_increment" 
        CHECK ("usageIncrement" IS NULL OR "usageIncrement" > 0)
      `);
    }

    await queryRunner.query(`
      ALTER TABLE "partner_extras" 
      ADD CONSTRAINT "CHK_partner_extras_base_price" 
      CHECK ("basePrice" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_extras" 
      ADD CONSTRAINT "CHK_partner_extras_recurring_count" 
      CHECK ("recurringCount" IS NULL OR "recurringCount" > 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_extras" 
      ADD CONSTRAINT "CHK_partner_extras_usage_range" 
      CHECK (
        "minUsage" IS NULL OR "maxUsage" IS NULL OR "minUsage" <= "maxUsage"
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_extras" 
      ADD CONSTRAINT "CHK_partner_extras_usage_increment" 
      CHECK ("usageIncrement" IS NULL OR "usageIncrement" > 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option_extras" 
      ADD CONSTRAINT "CHK_space_option_extras_override_base_price" 
      CHECK ("overrideBasePrice" IS NULL OR "overrideBasePrice" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option_extras" 
      ADD CONSTRAINT "CHK_space_option_extras_override_recurring_count" 
      CHECK ("overrideRecurringCount" IS NULL OR "overrideRecurringCount" > 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option_extras" 
      ADD CONSTRAINT "CHK_space_option_extras_override_usage_range" 
      CHECK (
        "overrideMinUsage" IS NULL OR "overrideMaxUsage" IS NULL OR 
        "overrideMinUsage" <= "overrideMaxUsage"
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "space_option_extras" 
      ADD CONSTRAINT "CHK_space_option_extras_override_usage_increment" 
      CHECK ("overrideUsageIncrement" IS NULL OR "overrideUsageIncrement" > 0)
    `);

    // Add indexes for enhanced pricing queries
    if (hasSpacePackageTable) {
      await queryRunner.query(`
        CREATE INDEX "IDX_space_package_pricing_type" 
        ON "space_package" ("pricingType")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_space_package_currency" 
        ON "space_package" ("currency")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_space_package_base_price" 
        ON "space_package" ("basePrice")
      `);
    }

    await queryRunner.query(`
      CREATE INDEX "IDX_partner_extras_pricing_type" 
      ON "partner_extras" ("pricingType")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_partner_extras_currency" 
      ON "partner_extras" ("currency")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_partner_extras_base_price" 
      ON "partner_extras" ("basePrice")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_space_option_extras_override_pricing_type" 
      ON "space_option_extras" ("overridePricingType")
    `);

    // Create composite indexes for complex pricing queries
    if (hasSpacePackageTable) {
      await queryRunner.query(`
        CREATE INDEX "IDX_space_package_pricing_composite" 
        ON "space_package" ("pricingType", "currency", "basePrice")
      `);
    }

    await queryRunner.query(`
      CREATE INDEX "IDX_partner_extras_pricing_composite" 
      ON "partner_extras" ("pricingType", "currency", "basePrice", "category")
    `);

    // Add conditional indexes for recurring and usage-based pricing
    if (hasSpacePackageTable) {
      await queryRunner.query(`
        CREATE INDEX "IDX_space_package_recurring" 
        ON "space_package" ("recurringInterval", "recurringCount") 
        WHERE "pricingType" = 'recurring'
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_space_package_usage_based" 
        ON "space_package" ("usageUnit", "minUsage", "maxUsage") 
        WHERE "pricingType" = 'usage_based'
      `);
    }

    await queryRunner.query(`
      CREATE INDEX "IDX_partner_extras_recurring" 
      ON "partner_extras" ("recurringInterval", "recurringCount") 
      WHERE "pricingType" = 'recurring'
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_partner_extras_usage_based" 
      ON "partner_extras" ("usageUnit", "minUsage", "maxUsage") 
      WHERE "pricingType" = 'usage_based'
    `);

    // Create function for pricing validation
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION validate_pricing_schema(
        pricing_type "public"."enhanced_pricing_type_enum",
        base_price numeric,
        recurring_interval "public"."recurring_interval_enum",
        usage_unit "public"."usage_unit_enum",
        min_usage numeric,
        max_usage numeric
      ) RETURNS boolean AS $$
      BEGIN
        -- Base price must be positive
        IF base_price IS NOT NULL AND base_price < 0 THEN
          RETURN false;
        END IF;
        
        -- Recurring pricing validation
        IF pricing_type = 'recurring' AND recurring_interval IS NULL THEN
          RETURN false;
        END IF;
        
        -- Usage-based pricing validation
        IF pricing_type = 'usage_based' AND usage_unit IS NULL THEN
          RETURN false;
        END IF;
        
        -- Usage range validation
        IF min_usage IS NOT NULL AND max_usage IS NOT NULL AND min_usage > max_usage THEN
          RETURN false;
        END IF;
        
        RETURN true;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Add pricing validation triggers
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION trigger_validate_pricing() RETURNS TRIGGER AS $$
      BEGIN
        IF NOT validate_pricing_schema(
          NEW."pricingType",
          NEW."basePrice",
          NEW."recurringInterval",
          NEW."usageUnit",
          NEW."minUsage",
          NEW."maxUsage"
        ) THEN
          RAISE EXCEPTION 'Invalid pricing schema configuration';
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    if (hasSpacePackageTable) {
      await queryRunner.query(`
        CREATE TRIGGER validate_space_package_pricing
        BEFORE INSERT OR UPDATE ON "space_package"
        FOR EACH ROW EXECUTE FUNCTION trigger_validate_pricing();
      `);
    }

    await queryRunner.query(`
      CREATE TRIGGER validate_partner_extras_pricing
      BEFORE INSERT OR UPDATE ON "partner_extras"
      FOR EACH ROW EXECUTE FUNCTION trigger_validate_pricing();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers and functions
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS validate_partner_extras_pricing ON "partner_extras"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS validate_space_package_pricing ON "space_package"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS trigger_validate_pricing()`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS validate_pricing_schema("public"."enhanced_pricing_type_enum", numeric, "public"."recurring_interval_enum", "public"."usage_unit_enum", numeric, numeric)`,
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_extras_usage_based"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_extras_recurring"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_package_usage_based"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_package_recurring"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_extras_pricing_composite"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_package_pricing_composite"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_option_extras_override_pricing_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_extras_base_price"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_extras_currency"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_extras_pricing_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_package_base_price"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_package_currency"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_space_package_pricing_type"`,
    );

    // Drop check constraints
    await queryRunner.query(
      `ALTER TABLE "space_option_extras" DROP CONSTRAINT IF EXISTS "CHK_space_option_extras_override_usage_increment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option_extras" DROP CONSTRAINT IF EXISTS "CHK_space_option_extras_override_usage_range"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option_extras" DROP CONSTRAINT IF EXISTS "CHK_space_option_extras_override_recurring_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_option_extras" DROP CONSTRAINT IF EXISTS "CHK_space_option_extras_override_base_price"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_extras" DROP CONSTRAINT IF EXISTS "CHK_partner_extras_usage_increment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_extras" DROP CONSTRAINT IF EXISTS "CHK_partner_extras_usage_range"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_extras" DROP CONSTRAINT IF EXISTS "CHK_partner_extras_recurring_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_extras" DROP CONSTRAINT IF EXISTS "CHK_partner_extras_base_price"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_package" DROP CONSTRAINT IF EXISTS "CHK_space_package_usage_increment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_package" DROP CONSTRAINT IF EXISTS "CHK_space_package_usage_range"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_package" DROP CONSTRAINT IF EXISTS "CHK_space_package_recurring_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_package" DROP CONSTRAINT IF EXISTS "CHK_space_package_base_price"`,
    );

    // Drop enhanced pricing columns
    await queryRunner.query(`
      ALTER TABLE "space_option_extras" 
      DROP COLUMN IF EXISTS "overridePricingMetadata",
      DROP COLUMN IF EXISTS "overridePricingTiers",
      DROP COLUMN IF EXISTS "overrideUsageIncrement",
      DROP COLUMN IF EXISTS "overrideMaxUsage",
      DROP COLUMN IF EXISTS "overrideMinUsage",
      DROP COLUMN IF EXISTS "overrideUsageUnit",
      DROP COLUMN IF EXISTS "overrideRecurringCount",
      DROP COLUMN IF EXISTS "overrideRecurringInterval",
      DROP COLUMN IF EXISTS "overrideCurrency",
      DROP COLUMN IF EXISTS "overrideBasePrice",
      DROP COLUMN IF EXISTS "overridePricingType"
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_extras" 
      DROP COLUMN IF EXISTS "pricingMetadata",
      DROP COLUMN IF EXISTS "pricingTiers",
      DROP COLUMN IF EXISTS "usageIncrement",
      DROP COLUMN IF EXISTS "maxUsage",
      DROP COLUMN IF EXISTS "minUsage",
      DROP COLUMN IF EXISTS "usageUnit",
      DROP COLUMN IF EXISTS "recurringCount",
      DROP COLUMN IF EXISTS "recurringInterval",
      DROP COLUMN IF EXISTS "currency",
      DROP COLUMN IF EXISTS "basePrice",
      DROP COLUMN IF EXISTS "pricingType"
    `);

    await queryRunner.query(`
      ALTER TABLE "space_package" 
      DROP COLUMN IF EXISTS "pricingMetadata",
      DROP COLUMN IF EXISTS "pricingTiers",
      DROP COLUMN IF EXISTS "usageIncrement",
      DROP COLUMN IF EXISTS "maxUsage",
      DROP COLUMN IF EXISTS "minUsage",
      DROP COLUMN IF EXISTS "usageUnit",
      DROP COLUMN IF EXISTS "recurringCount",
      DROP COLUMN IF EXISTS "recurringInterval",
      DROP COLUMN IF EXISTS "currency",
      DROP COLUMN IF EXISTS "pricingType"
    `);
  }
}
