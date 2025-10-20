import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrdPartnerTypes1758741000000 implements MigrationInterface {
  name = 'AddPrdPartnerTypes1758741000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert the partner types as specified in the PRD
    await queryRunner.query(`
      INSERT INTO "partner_types" ("name", "slug", "description", "icon", "color", "sortOrder", "isActive") VALUES
      ('Space Provider', 'space-provider', 'Providers of physical spaces including coworking spaces, meeting rooms, and event venues', 'building', '#8B5CF6', 10, true),
      ('Service Provider', 'service-provider', 'Professional service providers including freelancers, consultants, and specialists', 'briefcase', '#3B82F6', 20, true),
      ('Event Organizer', 'event-organizer', 'Professional event organizers and planners for various types of events', 'calendar', '#F59E0B', 30, true)
      ON CONFLICT (slug) DO NOTHING
    `);

    console.log('PRD partner types added successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the PRD partner types
    await queryRunner.query(`
      DELETE FROM "partner_types" 
      WHERE "slug" IN ('space-provider', 'service-provider', 'event-organizer')
    `);

    console.log('PRD partner types removed');
  }
}
