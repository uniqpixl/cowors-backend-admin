import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTwoFactorTable1747577474291 implements MigrationInterface {
  name = 'AddTwoFactorTable1747577474291';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "twoFactor" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "userId" uuid NOT NULL,
                "secret" character varying,
                "backupCodes" character varying,
                CONSTRAINT "PK_6e6e22172b1e7437f77cbfed056" PRIMARY KEY ("id")
            )
        `);
    // Note: twoFactorEnabled column already exists in user table from CreateCompleteUserSchema migration
    await queryRunner.query(`
            ALTER TABLE "twoFactor"
            ADD CONSTRAINT "FK_03fe91172968ed69813bc6ff0bd" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "twoFactor" DROP CONSTRAINT "FK_03fe91172968ed69813bc6ff0bd"
        `);
    // Note: twoFactorEnabled column is managed by CreateCompleteUserSchema migration, not this one
    await queryRunner.query(`
            DROP TABLE "twoFactor"
        `);
  }
}
