import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemConfigTable1756303075454
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "system_config" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "category" character varying(50) NOT NULL,
        "key" character varying(100) NOT NULL,
        "value" jsonb NOT NULL,
        "data_type" character varying(20) NOT NULL,
        "description" text,
        "is_public" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_system_config" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_system_config_category_key" 
      ON "system_config" ("category", "key")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_system_config_category" 
      ON "system_config" ("category")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_system_config_is_public" 
      ON "system_config" ("is_public")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_system_config_is_public"`);
    await queryRunner.query(`DROP INDEX "IDX_system_config_category"`);
    await queryRunner.query(`DROP INDEX "IDX_system_config_category_key"`);
    await queryRunner.query(`DROP TABLE "system_config"`);
  }
}
