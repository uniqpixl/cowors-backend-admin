import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateContentPageTable1756400100000 implements MigrationInterface {
  name = 'CreateContentPageTable1756400100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create content_page_status enum
    await queryRunner.query(`
      CREATE TYPE "content_page_status_enum" AS ENUM (
        'DRAFT',
        'PUBLISHED',
        'ARCHIVED'
      )
    `);

    // Create content_page table
    await queryRunner.createTable(
      new Table({
        name: 'content_page',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'meta_title',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'meta_description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'meta_keywords',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'content_page_status_enum',
            default: "'DRAFT'",
            isNullable: false,
          },
          {
            name: 'published_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'featured_image',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'excerpt',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'custom_fields',
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
          },
          {
            name: 'view_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'allow_comments',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'is_featured',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'template',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'seo_settings',
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes using raw SQL
    await queryRunner.query(`
      CREATE INDEX "IDX_content_page_slug" ON "content_page" ("slug");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_content_page_status" ON "content_page" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_content_page_published_at" ON "content_page" ("published_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_content_page_is_featured" ON "content_page" ("is_featured");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_content_page_template" ON "content_page" ("template");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_content_page_created_by" ON "content_page" ("created_by");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_content_page_created_at" ON "content_page" ("created_at");
    `);

    // Create composite indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_content_page_status_published" ON "content_page" ("status", "published_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_content_page_featured_status" ON "content_page" ("is_featured", "status");
    `);

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      'content_page',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Add check constraints
    await queryRunner.query(`
      ALTER TABLE "content_page" 
      ADD CONSTRAINT "CHK_content_page_title_length" 
      CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 255)
    `);

    await queryRunner.query(`
      ALTER TABLE "content_page" 
      ADD CONSTRAINT "CHK_content_page_slug_format" 
      CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
    `);

    await queryRunner.query(`
      ALTER TABLE "content_page" 
      ADD CONSTRAINT "CHK_content_page_view_count" 
      CHECK (view_count >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "content_page" 
      ADD CONSTRAINT "CHK_content_page_published_status" 
      CHECK (
        (status = 'PUBLISHED' AND published_at IS NOT NULL) OR 
        (status != 'PUBLISHED')
      )
    `);

    // Create trigger for updating updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_content_page_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_content_page_updated_at
        BEFORE UPDATE ON content_page
        FOR EACH ROW
        EXECUTE FUNCTION update_content_page_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger and function
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS update_content_page_updated_at ON content_page',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS update_content_page_updated_at()',
    );

    // Drop table (this will also drop indexes and foreign keys)
    await queryRunner.dropTable('content_page');

    // Drop enum
    await queryRunner.query('DROP TYPE IF EXISTS "content_page_status_enum"');
  }
}
