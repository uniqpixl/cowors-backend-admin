import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestructureToThreeMainPartnerTypes1758896000000
  implements MigrationInterface
{
  name = 'RestructureToThreeMainPartnerTypes1758896000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, delete all existing partner types
    await queryRunner.query(`
      DELETE FROM "partner_types"
    `);

    // Insert the 3 main partner types: Space, Service, Event
    await queryRunner.query(`
      INSERT INTO "partner_types" ("name", "slug", "description", "icon", "color", "sortOrder", "isActive") VALUES
      ('Space', 'space', 'Physical spaces including cafes, coworking spaces, offices, and event venues', 'building', '#3B82F6', 1, true),
      ('Service', 'service', 'Professional services including freelancers, consultants, and startup enablers', 'briefcase', '#10B981', 2, true),
      ('Event', 'event', 'Bookable events including conferences, workshops, seminars, and networking events', 'calendar', '#F59E0B', 3, true)
    `);

    console.log(
      'Partner types restructured to 3 main types: Space, Service, Event',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the previous partner types (space types only)
    await queryRunner.query(`
      DELETE FROM "partner_types"
    `);

    await queryRunner.query(`
      INSERT INTO "partner_types" ("name", "slug", "description", "icon", "color", "sortOrder", "isActive") VALUES
      ('Cafe', 'cafe', 'Coffee shops and cafes with workspace facilities', 'coffee', '#8B4513', 1, true),
      ('Restobar', 'restobar', 'Restaurant and bar spaces for dining and events', 'utensils', '#DC2626', 2, true),
      ('Coworking Space', 'coworking-space', 'Shared workspace environments for professionals', 'users', '#3B82F6', 3, true),
      ('Office Space', 'office-space', 'Private office spaces for rent', 'building', '#059669', 4, true),
      ('Event Space', 'event-space', 'Venues for hosting events and gatherings', 'calendar', '#7C3AED', 5, true)
    `);

    console.log('Reverted to previous space-only partner types');
  }
}
