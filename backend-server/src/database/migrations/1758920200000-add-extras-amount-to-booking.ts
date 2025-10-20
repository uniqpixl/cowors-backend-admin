import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExtrasAmountToBooking1758920200000
  implements MigrationInterface
{
  name = 'AddExtrasAmountToBooking1758920200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add extrasAmount column to booking table
    await queryRunner.query(`
      ALTER TABLE "booking" 
      ADD COLUMN "extrasAmount" decimal(10,2) DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove extrasAmount column from booking table
    await queryRunner.query(`
      ALTER TABLE "booking" 
      DROP COLUMN "extrasAmount"
    `);
  }
}
