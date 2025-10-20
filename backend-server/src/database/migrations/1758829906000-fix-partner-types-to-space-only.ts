import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPartnerTypesToSpaceOnly1758829906000
  implements MigrationInterface
{
  name = 'FixPartnerTypesToSpaceOnly1758829906000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, delete all existing partner types
    await queryRunner.query(`
      DELETE FROM "partner_types"
    `);

    // Insert the 5 correct space partner types only
    await queryRunner.query(`
      INSERT INTO "partner_types" ("name", "slug", "description", "icon", "color", "sortOrder", "isActive") VALUES
      ('Cafe', 'cafe', 'Coffee shops and cafes with workspace facilities', 'coffee', '#8B4513', 1, true),
      ('Restobar', 'restobar', 'Restaurant and bar spaces for dining and events', 'utensils', '#DC2626', 2, true),
      ('Coworking Space', 'coworking-space', 'Shared workspace environments for professionals', 'users', '#3B82F6', 3, true),
      ('Office Space', 'office-space', 'Private office spaces for rent', 'building', '#059669', 4, true),
      ('Event Space', 'event-space', 'Venues for hosting events and gatherings', 'calendar', '#7C3AED', 5, true)
    `);

    console.log(
      'Partner types updated to include only the 5 correct space types',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the previous partner types if needed
    await queryRunner.query(`
      DELETE FROM "partner_types"
    `);

    await queryRunner.query(`
      INSERT INTO "partner_types" ("name", "slug", "description", "icon", "color", "sortOrder", "isActive") VALUES
      ('Space Provider', 'space-provider', 'Providers of physical spaces including coworking spaces, meeting rooms, and event venues', 'building', '#8B5CF6', 10, true),
      ('Service Provider', 'service-provider', 'Professional service providers including freelancers, consultants, and specialists', 'briefcase', '#3B82F6', 20, true),
      ('Event Organizer', 'event-organizer', 'Professional event organizers and planners for various types of events', 'calendar', '#F59E0B', 30, true),
      ('Workspace Providers', 'workspace-providers', 'Coworking spaces, meeting rooms, and office rentals', 'building', '#8B5CF6', 3, true),
      ('Event Services', 'event-services', 'Event planning, catering, and entertainment services', 'calendar', '#F59E0B', 4, true),
      ('Food & Beverage', 'food-beverage', 'Restaurants, cafes, and food delivery services', 'utensils', '#EF4444', 5, true)
    `);

    console.log('Reverted to previous partner types');
  }
}
