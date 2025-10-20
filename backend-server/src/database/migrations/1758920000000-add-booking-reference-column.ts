import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBookingReferenceColumn1758920000000
  implements MigrationInterface
{
  name = 'AddBookingReferenceColumn1758920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, add bookingReference column as nullable
    await queryRunner.addColumn(
      'booking',
      new TableColumn({
        name: 'bookingReference',
        type: 'varchar',
        length: '50',
        isUnique: false,
        isNullable: true,
      }),
    );

    // Update existing records with generated booking references
    // Generate unique booking references for existing records
    await queryRunner.query(`
      UPDATE booking 
      SET "bookingReference" = 'REF-' || "bookingNumber" 
      WHERE "bookingReference" IS NULL
    `);

    // Now make the column non-nullable and unique
    await queryRunner.changeColumn(
      'booking',
      'bookingReference',
      new TableColumn({
        name: 'bookingReference',
        type: 'varchar',
        length: '50',
        isUnique: true,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove bookingReference column
    await queryRunner.dropColumn('booking', 'bookingReference');
  }
}
