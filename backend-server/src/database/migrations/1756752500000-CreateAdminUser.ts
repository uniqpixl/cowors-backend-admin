import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminUser1756752500000 implements MigrationInterface {
  name = 'CreateAdminUser1756752500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update user1@example.com to have Admin role
    await queryRunner.query(`
      UPDATE "user" 
      SET "role" = 'Admin' 
      WHERE "email" = 'user1@example.com';
    `);

    console.log('Updated user1@example.com to Admin role');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert user1@example.com back to User role
    await queryRunner.query(`
      UPDATE "user" 
      SET "role" = 'User' 
      WHERE "email" = 'user1@example.com';
    `);

    console.log('Reverted user1@example.com back to User role');
  }
}
