import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateRefreshTokenTable1746266963366
  implements MigrationInterface
{
  name = 'CreateRefreshTokenTable1746266963366';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'refresh_token',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sessionToken',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'isRevoked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'revokedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'replacedByToken',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'tokenFamily',
            type: 'varchar',
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
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'refresh_token',
      new TableIndex({
        name: 'IDX_refresh_token_userId',
        columnNames: ['userId'],
        where: '"deletedAt" IS NULL',
      }),
    );

    await queryRunner.createIndex(
      'refresh_token',
      new TableIndex({
        name: 'IDX_refresh_token_token',
        columnNames: ['token'],
        isUnique: true,
        where: '"deletedAt" IS NULL',
      }),
    );

    await queryRunner.createIndex(
      'refresh_token',
      new TableIndex({
        name: 'IDX_refresh_token_tokenFamily',
        columnNames: ['tokenFamily'],
      }),
    );

    await queryRunner.createIndex(
      'refresh_token',
      new TableIndex({
        name: 'IDX_refresh_token_expiresAt',
        columnNames: ['expiresAt'],
      }),
    );

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      'refresh_token',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_refresh_token_userId',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('refresh_token');
  }
}
