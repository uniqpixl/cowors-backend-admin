import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateIdsToCoworsFormat1758740400000
  implements MigrationInterface
{
  name = 'UpdateIdsToCoworsFormat1758740400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, add temporary columns for new IDs
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "new_id" VARCHAR(10);
      ALTER TABLE "partner" ADD COLUMN IF NOT EXISTS "new_id" VARCHAR(10);
      ALTER TABLE "space" ADD COLUMN IF NOT EXISTS "new_id" VARCHAR(10);
      ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "new_id" VARCHAR(10);
      ALTER TABLE "partner_categories" ADD COLUMN IF NOT EXISTS "new_id" VARCHAR(10);
      ALTER TABLE "partner_subcategories" ADD COLUMN IF NOT EXISTS "new_id" VARCHAR(10);
    `);

    // Generate new Cowors IDs for existing records
    const generateCoworsId = (prefix: string, index: number): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let suffix = '';

      // Generate 6 random alphanumeric characters
      for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        suffix += chars[randomIndex];
      }

      return `C${prefix}-${suffix}`;
    };

    // Update users with new IDs
    const users = await queryRunner.query(
      'SELECT id FROM "user" ORDER BY "createdAt"',
    );
    for (let i = 0; i < users.length; i++) {
      const newId = generateCoworsId('US', i + 1);
      await queryRunner.query(
        'UPDATE "user" SET "new_id" = $1 WHERE "id" = $2',
        [newId, users[i].id],
      );
    }

    // Update partners with new IDs
    const partners = await queryRunner.query(
      'SELECT id FROM "partner" ORDER BY "createdAt"',
    );
    for (let i = 0; i < partners.length; i++) {
      const newId = generateCoworsId('PT', i + 1);
      await queryRunner.query(
        'UPDATE "partner" SET "new_id" = $1 WHERE "id" = $2',
        [newId, partners[i].id],
      );
    }

    // Update spaces with new IDs
    const spaces = await queryRunner.query(
      'SELECT id FROM "space" ORDER BY "createdAt"',
    );
    for (let i = 0; i < spaces.length; i++) {
      const newId = generateCoworsId('SP', i + 1);
      await queryRunner.query(
        'UPDATE "space" SET "new_id" = $1 WHERE "id" = $2',
        [newId, spaces[i].id],
      );
    }

    // Update bookings with new IDs
    const bookings = await queryRunner.query(
      'SELECT id FROM "booking" ORDER BY "createdAt"',
    );
    for (let i = 0; i < bookings.length; i++) {
      const newId = generateCoworsId('BK', i + 1);
      await queryRunner.query(
        'UPDATE "booking" SET "new_id" = $1 WHERE "id" = $2',
        [newId, bookings[i].id],
      );
    }

    // Update categories with new IDs
    const categories = await queryRunner.query(
      'SELECT id FROM "partner_categories" ORDER BY "createdAt"',
    );
    for (let i = 0; i < categories.length; i++) {
      const newId = generateCoworsId('CT', i + 1);
      await queryRunner.query(
        'UPDATE "partner_categories" SET "new_id" = $1 WHERE "id" = $2',
        [newId, categories[i].id],
      );
    }

    // Update subcategories with new IDs
    const subcategories = await queryRunner.query(
      'SELECT id FROM "partner_subcategories" ORDER BY "createdAt"',
    );
    for (let i = 0; i < subcategories.length; i++) {
      const newId = generateCoworsId('SC', i + 1);
      await queryRunner.query(
        'UPDATE "partner_subcategories" SET "new_id" = $1 WHERE "id" = $2',
        [newId, subcategories[i].id],
      );
    }

    // Create mapping tables to track old ID to new ID relationships
    await queryRunner.query(`
      CREATE TABLE "id_migration_mapping" (
        "old_id" UUID NOT NULL,
        "new_id" VARCHAR(10) NOT NULL,
        "entity_type" VARCHAR(20) NOT NULL,
        "migrated_at" TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY ("old_id", "entity_type")
      );
    `);

    // Populate mapping table
    await queryRunner.query(`
      INSERT INTO "id_migration_mapping" ("old_id", "new_id", "entity_type")
      SELECT "id", "new_id", 'user' FROM "user" WHERE "new_id" IS NOT NULL
      UNION ALL
      SELECT "id", "new_id", 'partner' FROM "partner" WHERE "new_id" IS NOT NULL
      UNION ALL
      SELECT "id", "new_id", 'space' FROM "space" WHERE "new_id" IS NOT NULL
      UNION ALL
      SELECT "id", "new_id", 'booking' FROM "booking" WHERE "new_id" IS NOT NULL
      UNION ALL
      SELECT "id", "new_id", 'category' FROM "partner_categories" WHERE "new_id" IS NOT NULL
      UNION ALL
      SELECT "id", "new_id", 'subcategory' FROM "partner_subcategories" WHERE "new_id" IS NOT NULL;
    `);

    // Note: Foreign key updates will be handled in a separate migration
    // to avoid complexity and ensure data integrity
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the mapping table
    await queryRunner.query('DROP TABLE IF EXISTS "id_migration_mapping"');

    // Remove temporary new_id columns
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN IF EXISTS "new_id";
      ALTER TABLE "partner" DROP COLUMN IF EXISTS "new_id";
      ALTER TABLE "space" DROP COLUMN IF EXISTS "new_id";
      ALTER TABLE "booking" DROP COLUMN IF EXISTS "new_id";
      ALTER TABLE "partner_categories" DROP COLUMN IF EXISTS "new_id";
      ALTER TABLE "partner_subcategories" DROP COLUMN IF EXISTS "new_id";
    `);
  }
}
