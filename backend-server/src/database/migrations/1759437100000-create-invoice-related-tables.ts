import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoiceRelatedTables1759437100000
  implements MigrationInterface
{
  name = 'CreateInvoiceRelatedTables1759437100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    return; // No-op to avoid duplicate index/table creation as 1759437000000 handles these
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    return; // No-op for safety; rely on 1759437000000 down to drop tables if needed
  }
}
