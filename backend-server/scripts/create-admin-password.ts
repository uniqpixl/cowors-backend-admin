import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import dataSource from '../src/database/data-source';

async function createAdminPassword() {
  try {
    // Initialize database connection
    await dataSource.initialize();
    
    // Hash the password using bcrypt (same as Better Auth uses internally)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    console.log('Hashed password:', hashedPassword);
    
    // Insert the account record with proper hash
    const result = await dataSource.query(`
      INSERT INTO "account" (
        id, 
        "accountId", 
        "providerId", 
        "userId", 
        "accessToken", 
        "refreshToken", 
        "idToken", 
        "accessTokenExpiresAt", 
        "refreshTokenExpiresAt", 
        "scope", 
        "password", 
        "createdAt", 
        "updatedAt"
      ) VALUES (
        uuid_generate_v4(), 
        'admin@admin.com', 
        'credential', 
        '7ffa22f3-f278-49f2-bb4d-1e1b05020e0f', 
        null, 
        null, 
        null, 
        null, 
        null, 
        null, 
        $1, 
        NOW(), 
        NOW()
      )
    `, [hashedPassword]);
    
    console.log('Account created successfully:', result);
    
  } catch (error) {
    console.error('Error creating admin password:', error);
  } finally {
    await dataSource.destroy();
  }
}

createAdminPassword();