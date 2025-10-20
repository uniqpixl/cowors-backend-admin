import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { getConfig } from '../../config/database/database.config';
import { BookingItemEntity } from '../entities/booking-item.entity';
import { BookingEntity } from '../entities/booking.entity';
import { CityEntity } from '../entities/city.entity';
import { NeighborhoodEntity } from '../entities/neighborhood.entity';
import { PartnerListingEntity } from '../entities/partner-listing.entity';
import { PartnerLocationEntity } from '../entities/partner-location.entity';
import { PartnerEntity } from '../entities/partner.entity';
import { SpaceOptionEntity } from '../entities/space-option.entity';
import { SpaceEntity } from '../entities/space.entity';
import { seedDatabase } from './seed-data';

// Load environment variables
config();

// Use the same database configuration as the main application
const baseConfig = getConfig();
const minimalEntities = [
  CityEntity,
  NeighborhoodEntity,
  UserEntity,
  PartnerEntity,
  SpaceEntity,
  PartnerLocationEntity,
  PartnerListingEntity,
  SpaceOptionEntity,
  BookingEntity,
  BookingItemEntity,
];

const AppDataSource = new DataSource({
  ...baseConfig,
  // Allow enabling synchronize for local seeding via env
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  logging: true,
  // Ensure UUID extension availability
  uuidExtension:
    (process.env.UUID_EXTENSION as 'uuid-ossp' | 'pgcrypto') || 'uuid-ossp',
  // Optionally limit entities to avoid schema sync issues in dev
  entities:
    process.env.SYNC_MINIMAL === 'true' ? minimalEntities : baseConfig.entities,
});

async function runSeed() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connection established.');
    // Optionally run migrations when requested
    if (process.env.RUN_MIGRATIONS === 'true') {
      console.log('Running migrations before seeding...');
      await AppDataSource.runMigrations();
      console.log('Migrations completed.');
    }

    await seedDatabase(AppDataSource);

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('Database connection closed.');
  }
}

if (require.main === module) {
  runSeed();
}

export { runSeed };
