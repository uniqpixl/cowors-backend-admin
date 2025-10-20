import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { getConfig } from '../../config/database/database.config';
import {
  CityEntity,
  LaunchStatus,
  TierClassification,
} from '../entities/city.entity';
import { NeighborhoodEntity } from '../entities/neighborhood.entity';

config();

const baseConfig = getConfig();

const AppDataSource = new DataSource({
  ...baseConfig,
  synchronize: true,
  logging: true,
  uuidExtension:
    (process.env.UUID_EXTENSION as 'uuid-ossp' | 'pgcrypto') || 'uuid-ossp',
  entities: [CityEntity, NeighborhoodEntity],
});

async function seedCore() {
  try {
    console.log('Initializing minimal database connection...');
    await AppDataSource.initialize();
    console.log('Connection established. Seeding core data...');

    const cityRepository = AppDataSource.getRepository(CityEntity);
    const neighborhoodRepository =
      AppDataSource.getRepository(NeighborhoodEntity);

    const cities: Array<Partial<CityEntity> & { name: string }> = [
      {
        name: 'Bangalore',
        state: 'Karnataka',
        launch_status: LaunchStatus.ACTIVE,
        tier_classification: TierClassification.TIER_1,
        gst_state_code: '29',
        expansion_priority: 10,
      },
      {
        name: 'Gurgaon',
        state: 'Haryana',
        launch_status: LaunchStatus.ACTIVE,
        tier_classification: TierClassification.TIER_1,
        gst_state_code: '06',
        expansion_priority: 8,
      },
      {
        name: 'Mumbai',
        state: 'Maharashtra',
        launch_status: LaunchStatus.ACTIVE,
        tier_classification: TierClassification.TIER_1,
        gst_state_code: '27',
        expansion_priority: 9,
      },
      {
        name: 'Pune',
        state: 'Maharashtra',
        launch_status: LaunchStatus.LAUNCHING,
        tier_classification: TierClassification.TIER_2,
        gst_state_code: '27',
        expansion_priority: 7,
      },
      {
        name: 'Delhi',
        state: 'Delhi',
        launch_status: LaunchStatus.ACTIVE,
        tier_classification: TierClassification.TIER_1,
        gst_state_code: '07',
        expansion_priority: 9,
      },
    ];

    const createdCities: Record<string, CityEntity> = {};
    for (const c of cities) {
      const existing = await cityRepository.findOne({
        where: { name: c.name },
      });
      if (existing) {
        createdCities[c.name] = existing;
        console.log(`City already exists: ${c.name} (${existing.id})`);
        continue;
      }
      const city = cityRepository.create(c);
      const savedCity = await cityRepository.save(city);
      createdCities[c.name] = savedCity;
      console.log(`Created city: ${c.name} (${savedCity.id})`);
    }

    const neighborhoodsSeed: Array<{
      cityName: string;
      name: string;
      display_name?: string;
      popular_tags?: string[];
      is_popular?: boolean;
    }> = [
      {
        cityName: 'Bangalore',
        name: 'Indiranagar',
        display_name: 'Indiranagar',
        popular_tags: ['cafe', 'workspace'],
        is_popular: true,
      },
      {
        cityName: 'Bangalore',
        name: 'Koramangala',
        display_name: 'Koramangala',
        popular_tags: ['startup', 'coworking'],
        is_popular: true,
      },
      {
        cityName: 'Gurgaon',
        name: 'Cyber City',
        display_name: 'DLF Cyber City',
        popular_tags: ['coworking', 'office'],
        is_popular: true,
      },
      {
        cityName: 'Mumbai',
        name: 'MG Road',
        display_name: 'MG Road',
        popular_tags: ['cafe', 'shopping'],
        is_popular: true,
      },
      {
        cityName: 'Delhi',
        name: 'Connaught Place',
        display_name: 'CP',
        popular_tags: ['central', 'business'],
        is_popular: true,
      },
      {
        cityName: 'Pune',
        name: 'Kothrud',
        display_name: 'Kothrud',
        popular_tags: ['libraries', 'quiet'],
        is_popular: false,
      },
    ];

    for (const n of neighborhoodsSeed) {
      const city = createdCities[n.cityName];
      if (!city) continue;
      const existing = await neighborhoodRepository.findOne({
        where: { city_id: city.id, name: n.name },
      });
      if (existing) {
        console.log(
          `Neighborhood already exists: ${n.name} in ${n.cityName} (${existing.id})`,
        );
        continue;
      }
      const neighborhood = neighborhoodRepository.create({
        city_id: city.id,
        name: n.name,
        display_name: n.display_name,
        popular_tags: n.popular_tags || [],
        is_popular: !!n.is_popular,
      });
      const savedNeighborhood = await neighborhoodRepository.save(neighborhood);
      console.log(
        `Created neighborhood: ${n.name} in ${n.cityName} (${savedNeighborhood.id})`,
      );
    }

    console.log('Core seeding completed successfully!');
  } catch (error) {
    console.error('Error during core seeding:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('Database connection closed.');
  }
}

if (require.main === module) {
  seedCore();
}

export { seedCore };
