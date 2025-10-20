import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateNotificationTable1756752500000
  implements MigrationInterface
{
  name = 'CreateNotificationTable1756752500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create notification_type enum
    await queryRunner.query(`
      CREATE TYPE "notification_type" AS ENUM (
        'BOOKING_CONFIRMATION',
        'BOOKING_REMINDER',
        'BOOKING_CANCELLATION',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'PAYMENT_REFUND',
        'WALLET_CREDIT',
        'WALLET_DEBIT',
        'PARTNER_COMMISSION',
        'PARTNER_PAYOUT',
        'SYSTEM_UPDATE',
        'SYSTEM_MAINTENANCE',
        'MARKETING_PROMOTION',
        'MARKETING_NEWSLETTER'
      )
    `);

    // Create notification_category enum
    await queryRunner.query(`
      CREATE TYPE "notification_category" AS ENUM (
        'booking',
        'payment',
        'wallet',
        'partner',
        'system',
        'marketing'
      )
    `);

    // Create notification_priority enum
    await queryRunner.query(`
      CREATE TYPE "notification_priority" AS ENUM (
        'LOW',
        'MEDIUM',
        'HIGH',
        'URGENT'
      )
    `);

    // Create notification_status enum
    await queryRunner.query(`
      CREATE TYPE "notification_status" AS ENUM (
        'PENDING',
        'SENT',
        'DELIVERED',
        'READ',
        'FAILED',
        'CANCELLED'
      )
    `);

    // Create notification table
    await queryRunner.createTable(
      new Table({
        name: 'notification',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'notificationId',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: [
              'BOOKING_CONFIRMATION',
              'BOOKING_REMINDER',
              'BOOKING_CANCELLATION',
              'PAYMENT_SUCCESS',
              'PAYMENT_FAILED',
              'PAYMENT_REFUND',
              'WALLET_CREDIT',
              'WALLET_DEBIT',
              'PARTNER_COMMISSION',
              'PARTNER_PAYOUT',
              'SYSTEM_UPDATE',
              'SYSTEM_MAINTENANCE',
              'MARKETING_PROMOTION',
              'MARKETING_NEWSLETTER',
            ],
          },
          {
            name: 'category',
            type: 'enum',
            enum: [
              'booking',
              'payment',
              'wallet',
              'partner',
              'system',
              'marketing',
            ],
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            default: "'MEDIUM'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'PENDING',
              'SENT',
              'DELIVERED',
              'READ',
              'FAILED',
              'CANCELLED',
            ],
            default: "'PENDING'",
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'referenceId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'referenceType',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'channels',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'scheduledAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'sentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'readAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'campaign',
            type: 'varchar',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndices('notification', [
      new TableIndex({
        name: 'IDX_notification_userId_deletedAt',
        columnNames: ['userId'],
        where: '"deletedAt" IS NULL',
      }),
      new TableIndex({
        name: 'IDX_notification_status',
        columnNames: ['status'],
      }),
      new TableIndex({
        name: 'IDX_notification_type',
        columnNames: ['type'],
      }),
      new TableIndex({
        name: 'IDX_notification_category',
        columnNames: ['category'],
      }),
      new TableIndex({
        name: 'IDX_notification_scheduledAt',
        columnNames: ['scheduledAt'],
      }),
    ]);

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      'notification',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notification');
    await queryRunner.query(`DROP TYPE "notification_status"`);
    await queryRunner.query(`DROP TYPE "notification_priority"`);
    await queryRunner.query(`DROP TYPE "notification_category"`);
    await queryRunner.query(`DROP TYPE "notification_type"`);
  }
}
