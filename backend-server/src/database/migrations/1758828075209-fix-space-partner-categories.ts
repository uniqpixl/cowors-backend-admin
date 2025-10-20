import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSpacePartnerCategories1758828075209
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, get the Space Provider partner type ID
    const spaceProviderResult = await queryRunner.query(
      `SELECT id FROM partner_types WHERE slug = 'space-provider' LIMIT 1`,
    );

    if (spaceProviderResult.length === 0) {
      throw new Error('Space Provider partner type not found');
    }

    const spaceProviderTypeId = spaceProviderResult[0].id;

    // Delete existing incorrect categories for Space Provider
    await queryRunner.query(
      `DELETE FROM partner_categories WHERE "partnerTypeId" = $1 AND slug IN ('coworking-spaces', 'meeting-rooms', 'event-venues')`,
      [spaceProviderTypeId],
    );

    // Insert the correct 5 space partner categories
    const categories = [
      {
        name: 'Cafe',
        slug: 'cafe',
        description:
          'Coffee shops and cafes offering workspace and meeting areas',
        sortOrder: 1,
      },
      {
        name: 'Restobar',
        slug: 'restobar',
        description: 'Restaurant and bar venues with flexible space options',
        sortOrder: 2,
      },
      {
        name: 'Coworking Space',
        slug: 'coworking-space',
        description:
          'Shared workspace environments for professionals and teams',
        sortOrder: 3,
      },
      {
        name: 'Office Space',
        slug: 'office-space',
        description: 'Private office spaces and business centers',
        sortOrder: 4,
      },
      {
        name: 'Event Space',
        slug: 'event-space',
        description: 'Venues designed for events, conferences, and gatherings',
        sortOrder: 5,
      },
    ];

    for (const category of categories) {
      // Check if category already exists
      const existingCategory = await queryRunner.query(
        `SELECT id FROM partner_categories WHERE slug = $1 AND "partnerTypeId" = $2`,
        [category.slug, spaceProviderTypeId],
      );

      if (existingCategory.length === 0) {
        // Insert new category
        await queryRunner.query(
          `INSERT INTO partner_categories (id, name, slug, description, "sortOrder", "partnerTypeId", "isActive", "requiresSubcategory", "createdAt", "updatedAt")
                     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, true, false, NOW(), NOW())`,
          [
            category.name,
            category.slug,
            category.description,
            category.sortOrder,
            spaceProviderTypeId,
          ],
        );
      } else {
        // Update existing category
        await queryRunner.query(
          `UPDATE partner_categories SET
                     name = $1,
                     description = $2,
                     "sortOrder" = $3,
                     "updatedAt" = NOW()
                     WHERE slug = $4 AND "partnerTypeId" = $5`,
          [
            category.name,
            category.description,
            category.sortOrder,
            category.slug,
            spaceProviderTypeId,
          ],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get the Space Provider partner type ID
    const spaceProviderResult = await queryRunner.query(
      `SELECT id FROM partner_types WHERE slug = 'space-provider' LIMIT 1`,
    );

    if (spaceProviderResult.length === 0) {
      return; // If no Space Provider type, nothing to rollback
    }

    const spaceProviderTypeId = spaceProviderResult[0].id;

    // Delete the correct categories we added
    await queryRunner.query(
      `DELETE FROM partner_categories WHERE "partnerTypeId" = $1 AND slug IN ('cafe', 'restobar', 'coworking-space', 'office-space', 'event-space')`,
      [spaceProviderTypeId],
    );

    // Re-insert the old incorrect categories
    const oldCategories = [
      {
        name: 'Coworking Spaces',
        slug: 'coworking-spaces',
        description: 'Shared workspace environments',
        sortOrder: 1,
      },
      {
        name: 'Meeting Rooms',
        slug: 'meeting-rooms',
        description: 'Professional meeting and conference rooms',
        sortOrder: 2,
      },
      {
        name: 'Event Venues',
        slug: 'event-venues',
        description: 'Spaces for events and gatherings',
        sortOrder: 3,
      },
    ];

    for (const category of oldCategories) {
      await queryRunner.query(
        `INSERT INTO partner_categories (id, name, slug, description, "sortOrder", "partnerTypeId", "isActive", "requiresSubcategory", "createdAt", "updatedAt")
                 VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, true, false, NOW(), NOW())`,
        [
          category.name,
          category.slug,
          category.description,
          category.sortOrder,
          spaceProviderTypeId,
        ],
      );
    }
  }
}
