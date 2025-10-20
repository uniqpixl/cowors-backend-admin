import {
  Index,
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreatePayoutTable1756400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payout table
    await queryRunner.createTable(
      new Table({
        name: 'payout',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'partner_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'commission_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'fee_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'net_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
            default: "'PENDING'",
          },
          {
            name: 'payout_method',
            type: 'enum',
            enum: ['BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'RAZORPAY'],
            isNullable: false,
          },
          {
            name: 'payout_details',
            type: 'jsonb',
            isNullable: true,
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
            name: 'transaction_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'processed_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'processed_at',
            type: 'timestamp',
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

    // Create foreign key constraints
    await queryRunner.createForeignKeys('payout', [
      new TableForeignKey({
        columnNames: ['partner_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_payout_partner',
      }),
      new TableForeignKey({
        columnNames: ['processed_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_payout_processed_by',
      }),
    ]);

    // Create indexes using raw SQL
    await queryRunner.query(`
      CREATE INDEX "IDX_payout_partner_id" ON "payout" ("partner_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payout_status" ON "payout" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payout_created_at" ON "payout" ("created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payout_processed_at" ON "payout" ("processed_at");
    `);

    // Composite indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_payout_partner_status" ON "payout" ("partner_id", "status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payout_partner_period" ON "payout" ("partner_id", "period_start", "period_end");
    `);

    // Add check constraints
    await queryRunner.query(`
      ALTER TABLE payout 
      ADD CONSTRAINT CHK_payout_amount_positive 
      CHECK (amount > 0)
    `);

    await queryRunner.query(`
      ALTER TABLE payout 
      ADD CONSTRAINT CHK_payout_commission_amount_positive 
      CHECK (commission_amount >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE payout 
      ADD CONSTRAINT CHK_payout_fee_amount_non_negative 
      CHECK (fee_amount >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE payout 
      ADD CONSTRAINT CHK_payout_net_amount_positive 
      CHECK (net_amount > 0)
    `);

    await queryRunner.query(`
      ALTER TABLE payout 
      ADD CONSTRAINT CHK_payout_period_valid 
      CHECK (period_end > period_start)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop check constraints
    await queryRunner.query(
      'ALTER TABLE payout DROP CONSTRAINT IF EXISTS CHK_payout_period_valid',
    );
    await queryRunner.query(
      'ALTER TABLE payout DROP CONSTRAINT IF EXISTS CHK_payout_net_amount_positive',
    );
    await queryRunner.query(
      'ALTER TABLE payout DROP CONSTRAINT IF EXISTS CHK_payout_fee_amount_non_negative',
    );
    await queryRunner.query(
      'ALTER TABLE payout DROP CONSTRAINT IF EXISTS CHK_payout_commission_amount_positive',
    );
    await queryRunner.query(
      'ALTER TABLE payout DROP CONSTRAINT IF EXISTS CHK_payout_amount_positive',
    );

    // Drop indexes
    await queryRunner.dropIndex('payout', 'IDX_payout_partner_period');
    await queryRunner.dropIndex('payout', 'IDX_payout_partner_status');
    await queryRunner.dropIndex('payout', 'IDX_payout_processed_at');
    await queryRunner.dropIndex('payout', 'IDX_payout_created_at');
    await queryRunner.dropIndex('payout', 'IDX_payout_period_end');
    await queryRunner.dropIndex('payout', 'IDX_payout_period_start');
    await queryRunner.dropIndex('payout', 'IDX_payout_payout_method');
    await queryRunner.dropIndex('payout', 'IDX_payout_status');
    await queryRunner.dropIndex('payout', 'IDX_payout_partner_id');

    // Drop foreign keys
    await queryRunner.dropForeignKey('payout', 'FK_payout_processed_by');
    await queryRunner.dropForeignKey('payout', 'FK_payout_partner');

    // Drop table
    await queryRunner.dropTable('payout');
  }
}
