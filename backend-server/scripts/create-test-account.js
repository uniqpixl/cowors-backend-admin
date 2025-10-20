const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

async function createTestAccount() {
  const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
  });

  try {
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insert account record for test@example.com user
    const userId = '550e8400-e29b-41d4-a716-446655440001'; // thirdwave_owner from seed data
    const email = 'owner@thirdwavecoffee.com';
    
    const query = `
      INSERT INTO "account" ("id", "userId", "accountId", "providerId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "scope", "password", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, gen_random_uuid(), 'credential', NULL, NULL, NULL, NULL, NULL, NULL, $2, NOW(), NOW())
    `;
    
    await pool.query(query, [userId, hashedPassword]);
    console.log('Account created successfully for test@example.com');
    
  } catch (error) {
    console.error('Error creating account:', error);
  } finally {
    await pool.end();
  }
}

createTestAccount();