import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactInfoToSpace1759200000000 implements MigrationInterface {
  name = 'AddContactInfoToSpace1759200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add contact_info column to space table
    await queryRunner.query(`
      ALTER TABLE "space" ADD COLUMN "contact_info" jsonb
    `);

    // Add operating_hours column to space table
    await queryRunner.query(`
      ALTER TABLE "space" ADD COLUMN "operating_hours" jsonb
    `);

    // Add space_policies column to space table
    await queryRunner.query(`
      ALTER TABLE "space" ADD COLUMN "space_policies" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the added columns
    await queryRunner.query(`
      ALTER TABLE "space" DROP COLUMN IF EXISTS "contact_info"
    `);

    await queryRunner.query(`
      ALTER TABLE "space" DROP COLUMN IF EXISTS "operating_hours"
    `);

    await queryRunner.query(`
      ALTER TABLE "space" DROP COLUMN IF EXISTS "space_policies"
    `);
  }
}
