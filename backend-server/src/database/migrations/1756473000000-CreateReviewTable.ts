import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateReviewTable1756473000000 implements MigrationInterface {
  name = 'CreateReviewTable1756473000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create review_type enum
    await queryRunner.query(`
      CREATE TYPE "review_type_enum" AS ENUM (
        'SPACE',
        'PARTNER',
        'BOOKING'
      )
    `);

    // Create reviews table
    await queryRunner.createTable(
      new Table({
        name: 'reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['SPACE', 'PARTNER', 'BOOKING'],
            enumName: 'review_type_enum',
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 2,
            scale: 1,
            isNullable: false,
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'images',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'isVerified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isHidden',
            type: 'boolean',
            default: false,
          },
          {
            name: 'response',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'responseDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'isFlagged',
            type: 'boolean',
            default: false,
          },
          {
            name: 'flagReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'flaggedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'flaggedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'helpfulCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'spaceId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'partnerId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'bookingId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys
    await queryRunner.createForeignKeys('reviews', [
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_reviews_user',
      }),
      new TableForeignKey({
        columnNames: ['spaceId'],
        referencedTableName: 'space',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_reviews_space',
      }),
      new TableForeignKey({
        columnNames: ['partnerId'],
        referencedTableName: 'partner',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_reviews_partner',
      }),
      new TableForeignKey({
        columnNames: ['bookingId'],
        referencedTableName: 'booking',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_reviews_booking',
      }),
    ]);

    // Create indexes
    await queryRunner.createIndices('reviews', [
      new TableIndex({
        name: 'IDX_reviews_spaceId_rating',
        columnNames: ['spaceId', 'rating'],
      }),
      new TableIndex({
        name: 'IDX_reviews_partnerId_rating',
        columnNames: ['partnerId', 'rating'],
      }),
      new TableIndex({
        name: 'IDX_reviews_userId_createdAt',
        columnNames: ['userId', 'createdAt'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the table (this will also drop foreign keys and indexes)
    await queryRunner.dropTable('reviews');

    // Drop the enum
    await queryRunner.query('DROP TYPE IF EXISTS "review_type_enum"');
  }
}
