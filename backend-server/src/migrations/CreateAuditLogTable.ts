import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAuditLogTable1700000000000 implements MigrationInterface {
  name = 'CreateAuditLogTable1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create audit_action enum
    await queryRunner.query(`
      CREATE TYPE "audit_action" AS ENUM (
        'CREATE',
        'UPDATE', 
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'PASSWORD_CHANGE',
        'ROLE_CHANGE',
        'PERMISSION_GRANT',
        'PERMISSION_REVOKE',
        'FILE_UPLOAD',
        'FILE_DELETE',
        'PAYMENT_PROCESS',
        'PAYOUT_PROCESS',
        'BOOKING_CREATE',
        'BOOKING_CANCEL',
        'SPACE_APPROVE',
        'SPACE_REJECT',
        'CONTENT_PUBLISH',
        'CONTENT_UNPUBLISH',
        'CONFIGURATION_CHANGE',
        'SYSTEM_BACKUP',
        'SYSTEM_RESTORE',
        'DATA_EXPORT',
        'DATA_IMPORT',
        'SECURITY_ALERT',
        'ACCESS_DENIED'
      )
    `);

    // Create audit_severity enum
    await queryRunner.query(`
      CREATE TYPE "audit_severity" AS ENUM (
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
      )
    `);

    // Create audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'audit_action',
            isNullable: false,
          },
          {
            name: 'resource_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'resource_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'old_values',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'new_values',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'inet',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'severity',
            type: 'audit_severity',
            default: "'LOW'",
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'session_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'request_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'endpoint',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'http_method',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'response_status',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'execution_time',
            type: 'integer',
            isNullable: true,
            comment: 'Execution time in milliseconds',
          },
          {
            name: 'is_successful',
            type: 'boolean',
            default: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
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

    // Create foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "audit_logs" 
      ADD CONSTRAINT "FK_audit_logs_user_id" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `);

    // Create indexes for better query performance using raw SQL
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_resource" ON "audit_logs" ("resource_type", "resource_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_severity" ON "audit_logs" ("severity");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_ip_address" ON "audit_logs" ("ip_address");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_session_id" ON "audit_logs" ("session_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_request_id" ON "audit_logs" ("request_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_endpoint" ON "audit_logs" ("endpoint");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_response_status" ON "audit_logs" ("response_status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_is_successful" ON "audit_logs" ("is_successful");
    `);

    // Composite indexes for common query patterns
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_user_action_date" ON "audit_logs" ("user_id", "action", "created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_severity_date" ON "audit_logs" ("severity", "created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_resource_date" ON "audit_logs" ("resource_type", "resource_id", "created_at");
    `);

    // GIN indexes for JSONB columns
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_old_values_gin" ON "audit_logs" USING GIN ("old_values");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_new_values_gin" ON "audit_logs" USING GIN ("new_values");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_metadata_gin" ON "audit_logs" USING GIN ("metadata");
    `);

    // Add check constraints
    await queryRunner.query(`
      ALTER TABLE "audit_logs" 
      ADD CONSTRAINT "CHK_audit_logs_execution_time" 
      CHECK ("execution_time" IS NULL OR "execution_time" >= 0);
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs" 
      ADD CONSTRAINT "CHK_audit_logs_response_status" 
      CHECK ("response_status" IS NULL OR ("response_status" >= 100 AND "response_status" <= 599));
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs" 
      ADD CONSTRAINT "CHK_audit_logs_resource_consistency" 
      CHECK (
        ("resource_type" IS NULL AND "resource_id" IS NULL) OR
        ("resource_type" IS NOT NULL)
      );
    `);

    // Add comments
    await queryRunner.query(`
      COMMENT ON TABLE "audit_logs" IS 'Audit trail for all system actions and events';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "audit_logs"."execution_time" IS 'Request execution time in milliseconds';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "audit_logs"."old_values" IS 'Previous values before the action (for UPDATE operations)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "audit_logs"."new_values" IS 'New values after the action (for CREATE/UPDATE operations)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "audit_logs"."metadata" IS 'Additional context and metadata for the audit event';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the table (this will also drop all indexes and constraints)
    await queryRunner.dropTable('audit_logs');

    // Drop the enums
    await queryRunner.query('DROP TYPE "audit_severity"');
    await queryRunner.query('DROP TYPE "audit_action"');
  }
}
