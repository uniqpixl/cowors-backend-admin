import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddSpaceOptionIdToBooking1756900000000
  implements MigrationInterface
{
  name = 'AddSpaceOptionIdToBooking1756900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add spaceOptionId column to booking table
    await queryRunner.addColumn(
      'booking',
      new TableColumn({
        name: 'spaceOptionId',
        type: 'uuid',
        isNullable: true, // Initially nullable to allow existing records
      }),
    );

    // Check if space_options table exists before adding foreign key
    const spaceOptionsTableExists = await queryRunner.hasTable('space_options');
    if (spaceOptionsTableExists) {
      // Add foreign key constraint
      await queryRunner.createForeignKey(
        'booking',
        new TableForeignKey({
          columnNames: ['spaceOptionId'],
          referencedTableName: 'space_options',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }

    // Create index for performance
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_spaceOptionId" ON "booking" ("spaceOptionId") WHERE "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_booking_spaceOptionId"`);

    // Drop foreign key
    const table = await queryRunner.getTable('booking');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('spaceOptionId') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('booking', foreignKey);
    }

    // Drop column
    await queryRunner.dropColumn('booking', 'spaceOptionId');
  }
}
