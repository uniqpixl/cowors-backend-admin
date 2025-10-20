import {
  Index,
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateFinancialReportTable1756400200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create financial_report table
    await queryRunner.createTable(
      new Table({
        name: 'financial_report',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'report_type',
            type: 'enum',
            enum: [
              'REVENUE',
              'COMMISSION',
              'PAYOUT',
              'TAX',
              'PARTNER_PERFORMANCE',
              'BOOKING_ANALYTICS',
              'FINANCIAL_SUMMARY',
            ],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['GENERATING', 'COMPLETED', 'FAILED'],
            default: "'GENERATING'",
          },
          {
            name: 'report_format',
            type: 'enum',
            enum: ['PDF', 'CSV', 'EXCEL', 'JSON'],
            isNullable: false,
          },
          {
            name: 'period_start',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'period_end',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'filters',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'report_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'download_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'generated_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      'financial_report',
      new TableForeignKey({
        columnNames: ['generated_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_financial_report_generated_by',
      }),
    );

    // Create indexes using raw SQL
    await queryRunner.query(`
      CREATE INDEX "IDX_financial_report_generated_by" ON "financial_report" ("generated_by");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_financial_report_report_type" ON "financial_report" ("report_type");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_financial_report_status" ON "financial_report" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_financial_report_report_format" ON "financial_report" ("report_format");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_financial_report_period_start" ON "financial_report" ("period_start");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_financial_report_period_end" ON "financial_report" ("period_end");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_financial_report_created_at" ON "financial_report" ("created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_financial_report_completed_at" ON "financial_report" ("completed_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_financial_report_expires_at" ON "financial_report" ("expires_at");
    `);

    // Create composite indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_financial_report_type_status" ON "financial_report" ("report_type", "status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_financial_report_generated_by_type" ON "financial_report" ("generated_by", "report_type");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_financial_report_period" ON "financial_report" ("period_start", "period_end");
    `);

    // Add check constraints
    await queryRunner.query(`
      ALTER TABLE financial_report 
      ADD CONSTRAINT CHK_financial_report_period_valid 
      CHECK (period_end > period_start)
    `);

    await queryRunner.query(`
      ALTER TABLE financial_report 
      ADD CONSTRAINT CHK_financial_report_file_size_positive 
      CHECK (file_size IS NULL OR file_size > 0)
    `);

    await queryRunner.query(`
      ALTER TABLE financial_report 
      ADD CONSTRAINT CHK_financial_report_title_not_empty 
      CHECK (LENGTH(TRIM(title)) > 0)
    `);

    // Add conditional constraints
    await queryRunner.query(`
      ALTER TABLE financial_report 
      ADD CONSTRAINT CHK_financial_report_completed_data 
      CHECK (
        (status = 'COMPLETED' AND completed_at IS NOT NULL AND report_data IS NOT NULL) OR
        (status != 'COMPLETED')
      )
    `);

    await queryRunner.query(`
      ALTER TABLE financial_report 
      ADD CONSTRAINT CHK_financial_report_failed_error 
      CHECK (
        (status = 'FAILED' AND error_message IS NOT NULL) OR
        (status != 'FAILED')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop check constraints
    await queryRunner.query(
      'ALTER TABLE financial_report DROP CONSTRAINT IF EXISTS CHK_financial_report_failed_error',
    );
    await queryRunner.query(
      'ALTER TABLE financial_report DROP CONSTRAINT IF EXISTS CHK_financial_report_completed_data',
    );
    await queryRunner.query(
      'ALTER TABLE financial_report DROP CONSTRAINT IF EXISTS CHK_financial_report_title_not_empty',
    );
    await queryRunner.query(
      'ALTER TABLE financial_report DROP CONSTRAINT IF EXISTS CHK_financial_report_file_size_positive',
    );
    await queryRunner.query(
      'ALTER TABLE financial_report DROP CONSTRAINT IF EXISTS CHK_financial_report_period_valid',
    );

    // Drop indexes
    await queryRunner.dropIndex(
      'financial_report',
      'IDX_financial_report_period',
    );
    await queryRunner.dropIndex(
      'financial_report',
      'IDX_financial_report_generated_by_type',
    );
    await queryRunner.dropIndex(
      'financial_report',
      'IDX_financial_report_type_status',
    );
    await queryRunner.dropIndex(
      'financial_report',
      'IDX_financial_report_expires_at',
    );
    await queryRunner.dropIndex(
      'financial_report',
      'IDX_financial_report_completed_at',
    );
    await queryRunner.dropIndex(
      'financial_report',
      'IDX_financial_report_created_at',
    );
    await queryRunner.dropIndex(
      'financial_report',
      'IDX_financial_report_period_end',
    );
    await queryRunner.dropIndex(
      'financial_report',
      'IDX_financial_report_period_start',
    );
    await queryRunner.dropIndex(
      'financial_report',
      'IDX_financial_report_report_format',
    );
    await queryRunner.dropIndex(
      'financial_report',
      'IDX_financial_report_status',
    );
    await queryRunner.dropIndex(
      'financial_report',
      'IDX_financial_report_report_type',
    );
    await queryRunner.dropIndex(
      'financial_report',
      'IDX_financial_report_generated_by',
    );

    // Drop foreign key
    await queryRunner.dropForeignKey(
      'financial_report',
      'FK_financial_report_generated_by',
    );

    // Drop table
    await queryRunner.dropTable('financial_report');
  }
}
