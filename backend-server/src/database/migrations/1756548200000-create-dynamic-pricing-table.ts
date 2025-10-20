import { Index, MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDynamicPricingTable1756548200000
  implements MigrationInterface
{
  name = 'CreateDynamicPricingTable1756548200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'dynamic_pricing',
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
            name: 'space_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'rule_type',
            type: 'enum',
            enum: [
              'PEAK_HOURS',
              'SEASONAL',
              'DEMAND_BASED',
              'BULK_DISCOUNT',
              'ADVANCE_BOOKING',
              'SPECIAL_EVENT',
              'DURATION_BASED',
            ],
            isNullable: false,
          },
          {
            name: 'multiplier',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'priority',
            type: 'integer',
            default: 0,
          },
          {
            name: 'valid_from',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'valid_until',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'conditions',
            type: 'jsonb',
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['partner_id'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['space_id'],
            referencedTableName: 'space',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_dynamic_pricing_partner_id" ON "dynamic_pricing" ("partner_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dynamic_pricing_space_id" ON "dynamic_pricing" ("space_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dynamic_pricing_rule_type" ON "dynamic_pricing" ("rule_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dynamic_pricing_is_active" ON "dynamic_pricing" ("is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dynamic_pricing_priority" ON "dynamic_pricing" ("priority")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dynamic_pricing_valid_dates" ON "dynamic_pricing" ("valid_from", "valid_until")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dynamic_pricing_partner_space" ON "dynamic_pricing" ("partner_id", "space_id")
    `);

    // Create a composite index for active rules lookup
    await queryRunner.query(`
      CREATE INDEX "IDX_dynamic_pricing_active_lookup" ON "dynamic_pricing" ("partner_id", "is_active", "priority")
    `);

    // Add trigger for updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_dynamic_pricing_updated_at
        BEFORE UPDATE ON dynamic_pricing
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dynamic_pricing_active_lookup"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dynamic_pricing_partner_space"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dynamic_pricing_valid_dates"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dynamic_pricing_priority"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dynamic_pricing_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dynamic_pricing_rule_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dynamic_pricing_space_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dynamic_pricing_partner_id"`,
    );

    // Drop trigger
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_dynamic_pricing_updated_at ON dynamic_pricing
    `);

    // Drop function
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS update_updated_at_column()
    `);

    // Drop table
    await queryRunner.dropTable('dynamic_pricing');
  }
}
