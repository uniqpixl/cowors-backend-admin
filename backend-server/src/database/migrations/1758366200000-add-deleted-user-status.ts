import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedUserStatus1758366200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'deleted' value to user_status_enum if it doesn't already exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON e.enumtypid = t.oid
          WHERE t.typname = 'user_status_enum'
            AND e.enumlabel = 'deleted'
        ) THEN
          ALTER TYPE "public"."user_status_enum" ADD VALUE 'deleted';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type and updating all references
    // For now, we'll leave the enum value in place
    console.log('Cannot remove enum value from PostgreSQL enum type');
  }
}
