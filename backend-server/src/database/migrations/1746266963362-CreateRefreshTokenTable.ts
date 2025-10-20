import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokenTable1746266963362
  implements MigrationInterface
{
  name = 'CreateRefreshTokenTable1746266963362';

  // This migration is a duplicate of 1746266963366 and ran earlier than the
  // user table creation, causing foreign key errors. Make it a no-op to rely
  // on the later, correctly ordered migration.
  public async up(_queryRunner: QueryRunner): Promise<void> {
    return;
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    return;
  }
}
