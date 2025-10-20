import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFraudScoresTable1756768300000 implements MigrationInterface {
  name = 'CreateFraudScoresTable1756768300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create risk level enum
    await queryRunner.query(`
      CREATE TYPE "public"."fraud_scores_risk_level_enum" AS ENUM(
        'very_low', 'low', 'medium', 'high', 'very_high'
      )
    `);

    // Create fraud_scores table
    await queryRunner.query(`
      CREATE TABLE "fraud_scores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "overallScore" numeric(5,2) NOT NULL DEFAULT '50',
        "riskLevel" "public"."fraud_scores_risk_level_enum" NOT NULL DEFAULT 'medium',
        "scoreFactors" jsonb NOT NULL DEFAULT '{}',
        "behaviorMetrics" jsonb NOT NULL DEFAULT '{}',
        "scoreHistory" jsonb NOT NULL DEFAULT '[]',
        "lastCalculatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "nextCalculationDue" TIMESTAMP,
        "activeFlags" text array NOT NULL DEFAULT '{}',
        "deviceFingerprints" jsonb NOT NULL DEFAULT '[]',
        "locationHistory" jsonb NOT NULL DEFAULT '[]',
        "isBlacklisted" boolean NOT NULL DEFAULT false,
        "isWhitelisted" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_fraud_scores" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_fraud_scores_userId" UNIQUE ("userId")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_fraud_scores_userId" 
      ON "fraud_scores" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_fraud_scores_riskLevel" 
      ON "fraud_scores" ("riskLevel")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_fraud_scores_overallScore" 
      ON "fraud_scores" ("overallScore")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_fraud_scores_lastCalculatedAt" 
      ON "fraud_scores" ("lastCalculatedAt")
    `);

    // Add foreign key constraint to user table if it exists
    const hasUserTable = await queryRunner.hasTable('user');
    if (hasUserTable) {
      await queryRunner.query(`
        ALTER TABLE "fraud_scores" 
        ADD CONSTRAINT "FK_fraud_scores_userId" 
        FOREIGN KEY ("userId") REFERENCES "user"("id") 
        ON DELETE CASCADE
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "fraud_scores" 
      DROP CONSTRAINT IF EXISTS "FK_fraud_scores_userId"
    `);

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_fraud_scores_lastCalculatedAt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_fraud_scores_overallScore"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_fraud_scores_riskLevel"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fraud_scores_userId"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "fraud_scores"`);

    // Drop enum
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."fraud_scores_risk_level_enum"`,
    );
  }
}
