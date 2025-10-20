import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { getConfig } from '../src/config/database/database.config';

config();

const ds = new DataSource({
  ...getConfig(),
  synchronize: false,
  logging: true,
});

async function bootstrapAdmin() {
  try {
    console.log('Initializing database connection...');
    await ds.initialize();
    console.log('Database connected.');

    // Ensure admin user exists
    const existing = await ds.query(
      `SELECT id, email FROM "user" WHERE email = $1 LIMIT 1`,
      ['admin@admin.com']
    );

    let userId: string;
    if (existing.length > 0) {
      userId = existing[0].id;
      console.log('Found admin user:', existing[0].email, userId);
    } else {
      const created = await ds.query(
        `INSERT INTO "user" (
          id, "createdAt", "updatedAt", "username", "email", "isEmailVerified", role
        ) VALUES (
          uuid_generate_v4(), NOW(), NOW(), $1, $2, $3, 'Admin'
        ) RETURNING id`,
        ['admin', 'admin@admin.com', true]
      );
      userId = created[0].id;
      console.log('Created admin user with id:', userId);
    }

    // Hash password
    const password = 'admin123';
    const hashed = await bcrypt.hash(password, 12);

    // Upsert credential account
    const acc = await ds.query(
      `SELECT id FROM account WHERE "userId" = $1 AND "providerId" = 'credential' LIMIT 1`,
      [userId]
    );
    if (acc.length === 0) {
      await ds.query(
        `INSERT INTO account (
          id, "createdAt", "updatedAt", "userId", "accountId", "providerId", password
        ) VALUES (
          uuid_generate_v4(), NOW(), NOW(), $1, $2, 'credential', $3
        )`,
        [userId, `credential-${userId}`, hashed]
      );
      console.log('Created credential account for admin.');
    } else {
      await ds.query(
        `UPDATE account SET password = $1 WHERE id = $2`,
        [hashed, acc[0].id]
      );
      console.log('Updated credential account password for admin.');
    }

    console.log('Admin bootstrap complete. Email: admin@admin.com, Password: admin123');
  } catch (err) {
    console.error('Bootstrap admin error:', err);
    process.exit(1);
  } finally {
    await ds.destroy();
  }
}

bootstrapAdmin();