import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { getConfig } from '../src/config/database/database.config';
import { UserEntity } from '../src/auth/entities/user.entity';
import { AccountEntity } from '../src/auth/entities/account.entity';
import * as bcrypt from 'bcrypt';

// Load environment variables
config();

// Use the same database configuration as the main application
const AppDataSource = new DataSource({
  ...getConfig(),
  synchronize: false,
  logging: true,
});

async function setAdminPassword() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connection established.');

    const userRepository = AppDataSource.getRepository(UserEntity);
    const accountRepository = AppDataSource.getRepository(AccountEntity);

    // Find the admin user
    const adminUser = await userRepository.findOne({
      where: { email: 'admin@admin.com' }
    });

    if (!adminUser) {
      console.error('Admin user not found!');
      process.exit(1);
    }

    console.log('Found admin user:', adminUser.email);

    // Hash the password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Find or create the credential account
    let account = await accountRepository.findOne({
      where: { 
        userId: adminUser.id,
        providerId: 'credential'
      }
    });

    if (!account) {
      // Create credential account if it doesn't exist
      account = accountRepository.create({
        accountId: `credential-${adminUser.id}`,
        userId: adminUser.id,
        providerId: 'credential',
        password: hashedPassword
      });
    } else {
      // Update existing account with password
      account.password = hashedPassword;
    }

    await accountRepository.save(account);
    
    console.log('Admin password set successfully!');
    console.log('You can now login with:');
    console.log('Email: admin@admin.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error setting admin password:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

setAdminPassword();