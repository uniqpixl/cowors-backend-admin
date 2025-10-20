import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMediaTable1756400300000 implements MigrationInterface {
  name = 'CreateMediaTable1756400300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create media_type enum
    await queryRunner.query(`
      CREATE TYPE "media_type_enum" AS ENUM (
        'IMAGE',
        'VIDEO',
        'AUDIO',
        'DOCUMENT',
        'ARCHIVE',
        'OTHER'
      )
    `);

    // Create media_status enum
    await queryRunner.query(`
      CREATE TYPE "media_status_enum" AS ENUM (
        'UPLOADING',
        'PROCESSING',
        'READY',
        'FAILED',
        'DELETED'
      )
    `);

    // Create media table
    await queryRunner.createTable(
      new Table({
        name: 'media',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'original_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'media_type_enum',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'media_status_enum',
            default: "'UPLOADING'",
            isNullable: false,
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'thumbnail_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'alt',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'folder',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
          },
          {
            name: 'variants',
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
          },
          {
            name: 'checksum',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'is_public',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'download_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'tags',
            type: 'text[]',
            isNullable: true,
            default: "'{}'",
          },
          {
            name: 'uploaded_by',
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
      CREATE INDEX "IDX_media_filename" ON "media" ("filename");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_media_type" ON "media" ("type");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_media_status" ON "media" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_media_folder" ON "media" ("folder");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_media_mime_type" ON "media" ("mime_type");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_media_checksum" ON "media" ("checksum");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_media_is_public" ON "media" ("is_public");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_media_uploaded_by" ON "media" ("uploaded_by");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_media_created_at" ON "media" ("created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_media_expires_at" ON "media" ("expires_at");
    `);

    // Create GIN indexes for arrays and JSONB
    await queryRunner.query(
      'CREATE INDEX "IDX_media_tags_gin" ON "media" USING GIN ("tags")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_media_metadata_gin" ON "media" USING GIN ("metadata")',
    );

    // Create composite indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_media_type_status" ON "media" ("type", "status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_media_folder_type" ON "media" ("folder", "type");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_media_public_status" ON "media" ("is_public", "status");
    `);

    // Create foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "media" 
      ADD CONSTRAINT "FK_media_uploaded_by" 
      FOREIGN KEY ("uploaded_by") 
      REFERENCES "user"("id") 
      ON DELETE RESTRICT 
      ON UPDATE CASCADE
    `);

    // Add check constraints
    await queryRunner.query(`
      ALTER TABLE "media" 
      ADD CONSTRAINT "CHK_media_file_size" 
      CHECK (file_size > 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "media" 
      ADD CONSTRAINT "CHK_media_download_count" 
      CHECK (download_count >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "media" 
      ADD CONSTRAINT "CHK_media_filename_length" 
      CHECK (LENGTH(filename) >= 1 AND LENGTH(filename) <= 255)
    `);

    await queryRunner.query(`
      ALTER TABLE "media" 
      ADD CONSTRAINT "CHK_media_original_name_length" 
      CHECK (LENGTH(original_name) >= 1 AND LENGTH(original_name) <= 255)
    `);

    await queryRunner.query(`
      ALTER TABLE "media" 
      ADD CONSTRAINT "CHK_media_expires_at" 
      CHECK (expires_at IS NULL OR expires_at > created_at)
    `);

    await queryRunner.query(`
      ALTER TABLE "media" 
      ADD CONSTRAINT "CHK_media_checksum_format" 
      CHECK (checksum IS NULL OR LENGTH(checksum) = 64)
    `);

    // Create trigger for updating updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_media_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_media_updated_at
        BEFORE UPDATE ON media
        FOR EACH ROW
        EXECUTE FUNCTION update_media_updated_at();
    `);

    // Create function to clean up expired media
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION cleanup_expired_media()
      RETURNS INTEGER AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        DELETE FROM media 
        WHERE expires_at IS NOT NULL 
        AND expires_at < CURRENT_TIMESTAMP
        AND status != 'DELETED';
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RETURN deleted_count;
      END;
      $$ language 'plpgsql';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop functions
    await queryRunner.query('DROP FUNCTION IF EXISTS cleanup_expired_media()');

    // Drop trigger and function
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS update_media_updated_at ON media',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS update_media_updated_at()',
    );

    // Drop table (this will also drop indexes and foreign keys)
    await queryRunner.dropTable('media');

    // Drop enums
    await queryRunner.query('DROP TYPE IF EXISTS "media_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "media_type_enum"');
  }
}
