import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingUserRoles1756367073219 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if Partner role exists, add if not
    const partnerExists = await queryRunner.query(`
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'Partner' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')
    `);
    if (partnerExists.length === 0) {
      await queryRunner.query(
        `ALTER TYPE "user_role_enum" ADD VALUE 'Partner'`,
      );
    }

    // Check if SuperAdmin role exists, add if not
    const superAdminExists = await queryRunner.query(`
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'SuperAdmin' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')
    `);
    if (superAdminExists.length === 0) {
      await queryRunner.query(
        `ALTER TYPE "user_role_enum" ADD VALUE 'SuperAdmin'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type and updating all references
    // For now, we'll leave this empty as it's a destructive operation
  }
}
