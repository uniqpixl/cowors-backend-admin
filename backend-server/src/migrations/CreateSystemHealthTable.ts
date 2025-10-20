import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSystemHealthTable1700000000001
  implements MigrationInterface
{
  name = 'CreateSystemHealthTable1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create service_type enum
    await queryRunner.query(`
      CREATE TYPE "service_type" AS ENUM (
        'DATABASE',
        'REDIS',
        'ELASTICSEARCH',
        'STORAGE',
        'EMAIL',
        'SMS',
        'PAYMENT',
        'EXTERNAL_API',
        'QUEUE',
        'CACHE',
        'CDN',
        'MONITORING',
        'LOGGING',
        'SECURITY',
        'BACKUP',
        'SYSTEM',
        'APPLICATION',
        'NETWORK',
        'LOAD_BALANCER',
        'PROXY'
      )
    `);

    // Create health_status enum
    await queryRunner.query(`
      CREATE TYPE "health_status" AS ENUM (
        'HEALTHY',
        'WARNING',
        'CRITICAL',
        'DOWN',
        'MAINTENANCE',
        'UNKNOWN'
      )
    `);

    // Create system_health table
    await queryRunner.createTable(
      new Table({
        name: 'system_health',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'service_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'service_type',
            type: 'service_type',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'health_status',
            isNullable: false,
          },
          {
            name: 'response_time',
            type: 'integer',
            isNullable: true,
            comment: 'Response time in milliseconds',
          },
          {
            name: 'cpu_usage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: 'CPU usage percentage (0-100)',
          },
          {
            name: 'memory_usage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: 'Memory usage percentage (0-100)',
          },
          {
            name: 'disk_usage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: 'Disk usage percentage (0-100)',
          },
          {
            name: 'active_connections',
            type: 'integer',
            isNullable: true,
            comment: 'Number of active connections',
          },
          {
            name: 'error_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: 'Error rate percentage (0-100)',
          },
          {
            name: 'throughput',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Requests per second or operations per second',
          },
          {
            name: 'message',
            type: 'text',
            isNullable: true,
            comment: 'Human-readable status message',
          },
          {
            name: 'metrics',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional metrics and metadata',
          },
          {
            name: 'check_duration',
            type: 'integer',
            isNullable: true,
            comment: 'Time taken to perform the health check in milliseconds',
          },
          {
            name: 'is_alert_sent',
            type: 'boolean',
            default: false,
            comment: 'Whether an alert has been sent for this status',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for performance optimization using raw SQL
    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_service_name" ON "system_health" ("service_name");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_service_type" ON "system_health" ("service_type");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_status" ON "system_health" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_created_at" ON "system_health" ("created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_response_time" ON "system_health" ("response_time");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_cpu_usage" ON "system_health" ("cpu_usage");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_memory_usage" ON "system_health" ("memory_usage");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_error_rate" ON "system_health" ("error_rate");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_is_alert_sent" ON "system_health" ("is_alert_sent");
    `);

    // Composite indexes for common query patterns
    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_service_status_date" ON "system_health" ("service_name", "status", "created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_type_status_date" ON "system_health" ("service_type", "status", "created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_status_date" ON "system_health" ("status", "created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_service_date" ON "system_health" ("service_name", "created_at");
    `);

    // Index for latest status queries
    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_latest_status" ON "system_health" ("service_name", "service_type", "created_at");
    `);

    // GIN index for JSONB metrics column
    await queryRunner.query(`
      CREATE INDEX "IDX_system_health_metrics_gin" ON "system_health" USING GIN ("metrics");
    `);

    // Add check constraints
    await queryRunner.query(`
      ALTER TABLE "system_health" 
      ADD CONSTRAINT "CHK_system_health_response_time" 
      CHECK ("response_time" IS NULL OR "response_time" >= 0);
    `);

    await queryRunner.query(`
      ALTER TABLE "system_health" 
      ADD CONSTRAINT "CHK_system_health_cpu_usage" 
      CHECK ("cpu_usage" IS NULL OR ("cpu_usage" >= 0 AND "cpu_usage" <= 100));
    `);

    await queryRunner.query(`
      ALTER TABLE "system_health" 
      ADD CONSTRAINT "CHK_system_health_memory_usage" 
      CHECK ("memory_usage" IS NULL OR ("memory_usage" >= 0 AND "memory_usage" <= 100));
    `);

    await queryRunner.query(`
      ALTER TABLE "system_health" 
      ADD CONSTRAINT "CHK_system_health_disk_usage" 
      CHECK ("disk_usage" IS NULL OR ("disk_usage" >= 0 AND "disk_usage" <= 100));
    `);

    await queryRunner.query(`
      ALTER TABLE "system_health" 
      ADD CONSTRAINT "CHK_system_health_active_connections" 
      CHECK ("active_connections" IS NULL OR "active_connections" >= 0);
    `);

    await queryRunner.query(`
      ALTER TABLE "system_health" 
      ADD CONSTRAINT "CHK_system_health_error_rate" 
      CHECK ("error_rate" IS NULL OR ("error_rate" >= 0 AND "error_rate" <= 100));
    `);

    await queryRunner.query(`
      ALTER TABLE "system_health" 
      ADD CONSTRAINT "CHK_system_health_throughput" 
      CHECK ("throughput" IS NULL OR "throughput" >= 0);
    `);

    await queryRunner.query(`
      ALTER TABLE "system_health" 
      ADD CONSTRAINT "CHK_system_health_check_duration" 
      CHECK ("check_duration" IS NULL OR "check_duration" >= 0);
    `);

    await queryRunner.query(`
      ALTER TABLE "system_health" 
      ADD CONSTRAINT "CHK_system_health_service_name_length" 
      CHECK (LENGTH("service_name") >= 1 AND LENGTH("service_name") <= 100);
    `);

    // Add comments
    await queryRunner.query(`
      COMMENT ON TABLE "system_health" IS 'System health monitoring and performance metrics';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "system_health"."response_time" IS 'Service response time in milliseconds';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "system_health"."cpu_usage" IS 'CPU usage percentage (0-100)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "system_health"."memory_usage" IS 'Memory usage percentage (0-100)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "system_health"."disk_usage" IS 'Disk usage percentage (0-100)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "system_health"."metrics" IS 'Additional service-specific metrics and metadata';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "system_health"."check_duration" IS 'Time taken to perform the health check in milliseconds';
    `);

    // Create a function to clean up old health records
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION cleanup_old_system_health()
      RETURNS void AS $$
      BEGIN
        -- Keep only the last 30 days of health records
        DELETE FROM system_health 
        WHERE created_at < NOW() - INTERVAL '30 days';
        
        -- Keep only the latest 1000 records per service for performance
        WITH ranked_records AS (
          SELECT id, 
                 ROW_NUMBER() OVER (
                   PARTITION BY service_name, service_type 
                   ORDER BY created_at DESC
                 ) as rn
          FROM system_health
        )
        DELETE FROM system_health 
        WHERE id IN (
          SELECT id FROM ranked_records WHERE rn > 1000
        );
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create a trigger to automatically update alert status
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_alert_status()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Reset alert status when service becomes healthy
        IF NEW.status = 'HEALTHY' AND OLD.status != 'HEALTHY' THEN
          NEW.is_alert_sent = false;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_alert_status
        BEFORE UPDATE ON system_health
        FOR EACH ROW
        EXECUTE FUNCTION update_alert_status();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers and functions
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS trigger_update_alert_status ON system_health',
    );
    await queryRunner.query('DROP FUNCTION IF EXISTS update_alert_status()');
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS cleanup_old_system_health()',
    );

    // Drop the table (this will also drop all indexes and constraints)
    await queryRunner.dropTable('system_health');

    // Drop the enums
    await queryRunner.query('DROP TYPE "health_status"');
    await queryRunner.query('DROP TYPE "service_type"');
  }
}
