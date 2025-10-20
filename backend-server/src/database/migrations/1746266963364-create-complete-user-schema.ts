import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompleteUserSchema1746266963364
  implements MigrationInterface
{
  name = 'CreateCompleteUserSchema1746266963364';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing user table if it exists to start fresh
    await queryRunner.query(`DROP TABLE IF EXISTS "user" CASCADE`);

    // Create user role enum
    await queryRunner.query(`
      CREATE TYPE "public"."user_role_enum" AS ENUM('User', 'Partner', 'Admin', 'SuperAdmin', 'Moderator')
    `);

    // Create user status enum
    await queryRunner.query(`
      CREATE TYPE "public"."user_status_enum" AS ENUM('active', 'inactive', 'suspended', 'banned', 'deleted')
    `);

    // Create complete user table with all required columns
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "username" character varying NOT NULL,
        "displayUsername" character varying,
        "email" character varying NOT NULL,
        "isEmailVerified" boolean NOT NULL DEFAULT false,
        "role" "public"."user_role_enum" NOT NULL DEFAULT 'User',
        "status" "public"."user_status_enum" NOT NULL DEFAULT 'active',
        "firstName" character varying,
        "lastName" character varying,
        "image" character varying,
        "bio" character varying,
        "password" character varying,
        "twoFactorEnabled" boolean NOT NULL DEFAULT false,
        "lastLoginAt" TIMESTAMP,
        "adminNotes" character varying,
        "bannedAt" TIMESTAMP,
        "banExpiresAt" TIMESTAMP,
        "suspendedAt" TIMESTAMP,
        "suspensionExpiresAt" TIMESTAMP,
        "kycVerified" boolean NOT NULL DEFAULT false,
        "kycProvider" character varying,
        "kycVerifiedAt" TIMESTAMP,
        "kycVerificationId" character varying,
        "new_id" character varying(10),
        CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_070157ac5f9096d1a00bab15aa" ON "user" ("username")
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_d0012b9482ca5b4f270e6fdb5e" ON "user" ("email")
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_25dca47b418c43ad4bdbe4fbb9" ON "user" ("displayUsername")
      WHERE "deletedAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_25dca47b418c43ad4bdbe4fbb9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d0012b9482ca5b4f270e6fdb5e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_070157ac5f9096d1a00bab15aa"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}
