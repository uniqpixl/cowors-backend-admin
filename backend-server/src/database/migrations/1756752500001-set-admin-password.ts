import * as bcrypt from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetAdminPassword1756752500001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Hash the password 'admin123'
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Update the admin user with the hashed password
    await queryRunner.query(
      `UPDATE "user" SET password = $1 WHERE email = 'admin@admin.com'`,
      [hashedPassword],
    );

    console.log('✅ Admin password set to: admin123');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the password from admin user
    await queryRunner.query(
      `UPDATE "user" SET password = NULL WHERE email = 'admin@admin.com'`,
    );
  }
}
