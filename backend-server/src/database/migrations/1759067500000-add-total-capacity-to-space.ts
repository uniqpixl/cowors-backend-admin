import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTotalCapacityToSpace1759067500000
  implements MigrationInterface
{
  name = 'AddTotalCapacityToSpace1759067500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add total_capacity column to space table
    await queryRunner.query(`
      ALTER TABLE "space" 
      ADD COLUMN "total_capacity" integer
    `);

    // Add index for total_capacity for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_space_total_capacity" ON "space" ("total_capacity")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_space_total_capacity"
    `);

    // Drop total_capacity column
    await queryRunner.query(`
      ALTER TABLE "space" 
      DROP COLUMN IF EXISTS "total_capacity"
    `);
  }
}
