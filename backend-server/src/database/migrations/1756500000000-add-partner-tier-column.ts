import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPartnerTierColumn1756500000000 implements MigrationInterface {
  name = 'AddPartnerTierColumn1756500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the tier enum type if it doesn't exist
    await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."partner_tier_enum" AS ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

    // Add the tier column to the partner table if it doesn't exist
    const hasColumn = await queryRunner.hasColumn('partner', 'tier');
    if (!hasColumn) {
      await queryRunner.query(`
              ALTER TABLE "partner" ADD "tier" "public"."partner_tier_enum" NOT NULL DEFAULT 'bronze'
          `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the tier column
    await queryRunner.query(`
            ALTER TABLE "partner" DROP COLUMN "tier"
        `);

    // Drop the tier enum type
    await queryRunner.query(`
            DROP TYPE "public"."partner_tier_enum"
        `);
  }
}
