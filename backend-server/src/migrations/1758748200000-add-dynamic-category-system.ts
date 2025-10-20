import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDynamicCategorySystem1758748200000
  implements MigrationInterface
{
  name = 'AddDynamicCategorySystem1758748200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add rule inheritance system columns to partner_types
    await queryRunner.query(`
      ALTER TABLE "partner_types" 
      ADD COLUMN "pricing_rules" jsonb,
      ADD COLUMN "feature_rules" jsonb,
      ADD COLUMN "validation_rules" jsonb
    `);

    // Add rule inheritance system columns to partner_categories
    await queryRunner.query(`
      ALTER TABLE "partner_categories" 
      ADD COLUMN "pricing_rules" jsonb,
      ADD COLUMN "feature_rules" jsonb,
      ADD COLUMN "validation_rules" jsonb
    `);

    // Add rule inheritance system columns to partner_subcategories
    await queryRunner.query(`
      ALTER TABLE "partner_subcategories" 
      ADD COLUMN "pricing_rules" jsonb,
      ADD COLUMN "feature_rules" jsonb,
      ADD COLUMN "validation_rules" jsonb,
      ADD COLUMN "rule_overrides" jsonb
    `);

    // Rename partner_extras table to partner_addons
    await queryRunner.query(`
      ALTER TABLE "partner_extras" RENAME TO "partner_addons"
    `);

    // Update indexes for the renamed table
    await queryRunner.query(`
      ALTER INDEX "IDX_partner_extras_partnerId_category" RENAME TO "IDX_partner_addons_partnerId_category"
    `);

    await queryRunner.query(`
      ALTER INDEX "IDX_partner_extras_category_status" RENAME TO "IDX_partner_addons_category_status"
    `);

    await queryRunner.query(`
      ALTER INDEX "IDX_partner_extras_isActive_priority" RENAME TO "IDX_partner_addons_isActive_priority"
    `);

    await queryRunner.query(`
      ALTER INDEX "IDX_partner_extras_createdAt" RENAME TO "IDX_partner_addons_createdAt"
    `);

    // Add indexes for new dynamic category system fields in partners table
    await queryRunner.query(`
      CREATE INDEX "IDX_partner_partnerTypeId" ON "partner" ("partnerTypeId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_partner_primaryCategoryId" ON "partner" ("primaryCategoryId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_partner_primarySubcategoryId" ON "partner" ("primarySubcategoryId")
    `);

    // Add foreign key constraints for dynamic category system
    await queryRunner.query(`
      ALTER TABLE "partner" 
      ADD CONSTRAINT "FK_partner_partnerType" 
      FOREIGN KEY ("partnerTypeId") REFERENCES "partner_types"("id") 
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "partner" 
      ADD CONSTRAINT "FK_partner_primaryCategory" 
      FOREIGN KEY ("primaryCategoryId") REFERENCES "partner_categories"("id") 
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "partner" 
      ADD CONSTRAINT "FK_partner_primarySubcategory" 
      FOREIGN KEY ("primarySubcategoryId") REFERENCES "partner_subcategories"("id") 
      ON DELETE SET NULL
    `);

    // Insert default partner types based on existing enum values
    await queryRunner.query(`
      INSERT INTO "partner_types" ("id", "name", "slug", "description", "isActive", "sortOrder", "createdAt", "updatedAt")
      VALUES 
        (gen_random_uuid(), 'Space Provider', 'space-provider', 'Partners who provide physical spaces for coworking, events, and meetings', true, 1, NOW(), NOW()),
        (gen_random_uuid(), 'Service Provider', 'service-provider', 'Partners who provide professional services and expertise', true, 2, NOW(), NOW()),
        (gen_random_uuid(), 'Event Organizer', 'event-organizer', 'Partners who organize and manage events and experiences', true, 3, NOW(), NOW())
      ON CONFLICT ("slug") DO NOTHING
    `);

    // Insert default categories for Space Provider - 5 specific space partner types
    await queryRunner.query(`
      INSERT INTO "partner_categories" ("id", "name", "slug", "description", "isActive", "sortOrder", "partnerTypeId", "createdAt", "updatedAt")
      SELECT 
        gen_random_uuid(), 
        'Cafe', 
        'cafe', 
        'Coffee shops and casual dining spaces for work and meetings', 
        true, 
        1, 
        pt."id", 
        NOW(), 
        NOW()
      FROM "partner_types" pt WHERE pt."slug" = 'space-provider'
      ON CONFLICT ("slug") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "partner_categories" ("id", "name", "slug", "description", "isActive", "sortOrder", "partnerTypeId", "createdAt", "updatedAt")
      SELECT 
        gen_random_uuid(), 
        'Restobar', 
        'restobar', 
        'Restaurant and bar spaces suitable for business meetings and events', 
        true, 
        2, 
        pt."id", 
        NOW(), 
        NOW()
      FROM "partner_types" pt WHERE pt."slug" = 'space-provider'
      ON CONFLICT ("slug") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "partner_categories" ("id", "name", "slug", "description", "isActive", "sortOrder", "partnerTypeId", "createdAt", "updatedAt")
      SELECT 
        gen_random_uuid(), 
        'Coworking Space', 
        'coworking-space', 
        'Shared workspaces and collaborative office environments', 
        true, 
        3, 
        pt."id", 
        NOW(), 
        NOW()
      FROM "partner_types" pt WHERE pt."slug" = 'space-provider'
      ON CONFLICT ("slug") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "partner_categories" ("id", "name", "slug", "description", "isActive", "sortOrder", "partnerTypeId", "createdAt", "updatedAt")
      SELECT 
        gen_random_uuid(), 
        'Office Space', 
        'office-space', 
        'Private office spaces and business centers for rent', 
        true, 
        4, 
        pt."id", 
        NOW(), 
        NOW()
      FROM "partner_types" pt WHERE pt."slug" = 'space-provider'
      ON CONFLICT ("slug") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "partner_categories" ("id", "name", "slug", "description", "isActive", "sortOrder", "partnerTypeId", "createdAt", "updatedAt")
      SELECT 
        gen_random_uuid(), 
        'Event Space', 
        'event-space', 
        'Venues for hosting events, conferences, and special occasions', 
        true, 
        5, 
        pt."id", 
        NOW(), 
        NOW()
      FROM "partner_types" pt WHERE pt."slug" = 'space-provider'
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "partner" DROP CONSTRAINT IF EXISTS "FK_partner_partnerType"
    `);

    await queryRunner.query(`
      ALTER TABLE "partner" DROP CONSTRAINT IF EXISTS "FK_partner_primaryCategory"
    `);

    await queryRunner.query(`
      ALTER TABLE "partner" DROP CONSTRAINT IF EXISTS "FK_partner_primarySubcategory"
    `);

    // Remove indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_partner_partnerTypeId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_partner_primaryCategoryId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_partner_primarySubcategoryId"
    `);

    // Rename partner_addons back to partner_extras
    await queryRunner.query(`
      ALTER TABLE "partner_addons" RENAME TO "partner_extras"
    `);

    // Rename indexes back
    await queryRunner.query(`
      ALTER INDEX "IDX_partner_addons_partnerId_category" RENAME TO "IDX_partner_extras_partnerId_category"
    `);

    await queryRunner.query(`
      ALTER INDEX "IDX_partner_addons_category_status" RENAME TO "IDX_partner_extras_category_status"
    `);

    await queryRunner.query(`
      ALTER INDEX "IDX_partner_addons_isActive_priority" RENAME TO "IDX_partner_extras_isActive_priority"
    `);

    await queryRunner.query(`
      ALTER INDEX "IDX_partner_addons_createdAt" RENAME TO "IDX_partner_extras_createdAt"
    `);

    // Remove rule inheritance system columns from partner_subcategories
    await queryRunner.query(`
      ALTER TABLE "partner_subcategories" 
      DROP COLUMN IF EXISTS "pricing_rules",
      DROP COLUMN IF EXISTS "feature_rules",
      DROP COLUMN IF EXISTS "validation_rules",
      DROP COLUMN IF EXISTS "rule_overrides"
    `);

    // Remove rule inheritance system columns from partner_categories
    await queryRunner.query(`
      ALTER TABLE "partner_categories" 
      DROP COLUMN IF EXISTS "pricing_rules",
      DROP COLUMN IF EXISTS "feature_rules",
      DROP COLUMN IF EXISTS "validation_rules"
    `);

    // Remove rule inheritance system columns from partner_types
    await queryRunner.query(`
      ALTER TABLE "partner_types" 
      DROP COLUMN IF EXISTS "pricing_rules",
      DROP COLUMN IF EXISTS "feature_rules",
      DROP COLUMN IF EXISTS "validation_rules"
    `);
  }
}
