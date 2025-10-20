import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesForThreeMainTypes1758896100000
  implements MigrationInterface
{
  name = 'CreateCategoriesForThreeMainTypes1758896100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get the partner type IDs
    const spaceTypeResult = await queryRunner.query(
      `SELECT id FROM "partner_types" WHERE slug = 'space'`,
    );
    const serviceTypeResult = await queryRunner.query(
      `SELECT id FROM "partner_types" WHERE slug = 'service'`,
    );
    const eventTypeResult = await queryRunner.query(
      `SELECT id FROM "partner_types" WHERE slug = 'event'`,
    );

    if (
      spaceTypeResult.length === 0 ||
      serviceTypeResult.length === 0 ||
      eventTypeResult.length === 0
    ) {
      throw new Error(
        'Partner types not found. Please run the previous migration first.',
      );
    }

    const spaceTypeId = spaceTypeResult[0].id;
    const serviceTypeId = serviceTypeResult[0].id;
    const eventTypeId = eventTypeResult[0].id;

    // Clear existing categories
    await queryRunner.query(`DELETE FROM "partner_categories"`);

    // Insert Space categories (former space types)
    await queryRunner.query(`
      INSERT INTO "partner_categories" ("name", "slug", "description", "icon", "color", "partnerTypeId", "sortOrder", "isActive") VALUES
      ('Cafe', 'cafe', 'Coffee shops and cafes with workspace facilities', 'coffee', '#8B4513', '${spaceTypeId}', 1, true),
      ('Restobar', 'restobar', 'Restaurant and bar spaces for dining and events', 'utensils', '#DC2626', '${spaceTypeId}', 2, true),
      ('Coworking Space', 'coworking-space', 'Shared workspace environments for professionals', 'users', '#3B82F6', '${spaceTypeId}', 3, true),
      ('Office Space', 'office-space', 'Private office spaces for rent', 'building', '#059669', '${spaceTypeId}', 4, true),
      ('Event Space', 'event-space', 'Venues for hosting events and gatherings', 'calendar', '#7C3AED', '${spaceTypeId}', 5, true)
    `);

    // Insert Service categories
    await queryRunner.query(`
      INSERT INTO "partner_categories" ("name", "slug", "description", "icon", "color", "partnerTypeId", "sortOrder", "isActive") VALUES
      ('Freelancer', 'freelancer', 'Independent contractors and freelance professionals', 'user', '#10B981', '${serviceTypeId}', 1, true),
      ('Startup Enabler', 'startup-enabler', 'Services that help startups grow and succeed', 'rocket', '#8B5CF6', '${serviceTypeId}', 2, true),
      ('Consulting', 'consulting', 'Professional consulting and advisory services', 'briefcase', '#F59E0B', '${serviceTypeId}', 3, true),
      ('Marketing', 'marketing', 'Marketing and promotional services', 'megaphone', '#EF4444', '${serviceTypeId}', 4, true)
    `);

    // Insert Event categories (bookable events)
    await queryRunner.query(`
      INSERT INTO "partner_categories" ("name", "slug", "description", "icon", "color", "partnerTypeId", "sortOrder", "isActive") VALUES
      ('Conference', 'conference', 'Professional conferences and large-scale events', 'presentation', '#3B82F6', '${eventTypeId}', 1, true),
      ('Workshop', 'workshop', 'Hands-on learning and skill development sessions', 'tools', '#10B981', '${eventTypeId}', 2, true),
      ('Seminar', 'seminar', 'Educational seminars and knowledge sharing sessions', 'book', '#8B5CF6', '${eventTypeId}', 3, true),
      ('Networking', 'networking', 'Professional networking and social events', 'users', '#F59E0B', '${eventTypeId}', 4, true),
      ('Exhibition', 'exhibition', 'Trade shows, exhibitions, and showcase events', 'eye', '#EF4444', '${eventTypeId}', 5, true)
    `);

    console.log('Categories created for all three main partner types');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Clear all categories
    await queryRunner.query(`DELETE FROM "partner_categories"`);

    console.log('All categories removed');
  }
}
