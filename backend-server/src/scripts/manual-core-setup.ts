import 'dotenv/config';
import { Client } from 'pg';

async function main() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT
      ? parseInt(process.env.DATABASE_PORT, 10)
      : 5432,
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'database',
  });

  await client.connect();
  console.log('Connected to PostgreSQL.');

  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await client.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name varchar(100) NOT NULL,
        state varchar(100) NOT NULL,
        launch_status varchar(20) NOT NULL DEFAULT 'planning',
        tier_classification varchar(20) NOT NULL DEFAULT 'tier_3',
        gst_state_code varchar(2) NOT NULL,
        expansion_priority integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS neighborhoods (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        city_id uuid NOT NULL,
        name varchar(100) NOT NULL,
        display_name varchar(200),
        popular_tags jsonb NOT NULL DEFAULT '[]',
        is_popular boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const cities = [
      {
        name: 'Bangalore',
        state: 'Karnataka',
        gst_state_code: '29',
        launch_status: 'active',
        tier_classification: 'tier_1',
        expansion_priority: 10,
      },
      {
        name: 'Gurgaon',
        state: 'Haryana',
        gst_state_code: '06',
        launch_status: 'active',
        tier_classification: 'tier_1',
        expansion_priority: 8,
      },
      {
        name: 'Mumbai',
        state: 'Maharashtra',
        gst_state_code: '27',
        launch_status: 'active',
        tier_classification: 'tier_1',
        expansion_priority: 9,
      },
      {
        name: 'Pune',
        state: 'Maharashtra',
        gst_state_code: '27',
        launch_status: 'launching',
        tier_classification: 'tier_2',
        expansion_priority: 7,
      },
      {
        name: 'Delhi',
        state: 'Delhi',
        gst_state_code: '07',
        launch_status: 'active',
        tier_classification: 'tier_1',
        expansion_priority: 9,
      },
    ];

    for (const c of cities) {
      const { rows } = await client.query(
        'SELECT id FROM cities WHERE name = $1',
        [c.name],
      );
      if (rows.length) {
        console.log(`City exists: ${c.name} (${rows[0].id})`);
        continue;
      }
      const res = await client.query(
        'INSERT INTO cities (name, state, launch_status, tier_classification, gst_state_code, expansion_priority) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
        [
          c.name,
          c.state,
          c.launch_status,
          c.tier_classification,
          c.gst_state_code,
          c.expansion_priority,
        ],
      );
      console.log(`Created city: ${c.name} (${res.rows[0].id})`);
    }

    const neighborhoods = [
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

    for (const n of neighborhoods) {
      const cityRes = await client.query(
        'SELECT id FROM cities WHERE name = $1',
        [n.cityName],
      );
      if (!cityRes.rows.length) continue;
      const cityId = cityRes.rows[0].id;
      const existsRes = await client.query(
        'SELECT id FROM neighborhoods WHERE city_id = $1 AND name = $2',
        [cityId, n.name],
      );
      if (existsRes.rows.length) {
        console.log(
          `Neighborhood exists: ${n.name} in ${n.cityName} (${existsRes.rows[0].id})`,
        );
        continue;
      }
      const res = await client.query(
        'INSERT INTO neighborhoods (city_id, name, display_name, popular_tags, is_popular) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [
          cityId,
          n.name,
          n.display_name || null,
          JSON.stringify(n.popular_tags || []),
          n.is_popular || false,
        ],
      );
      console.log(
        `Created neighborhood: ${n.name} in ${n.cityName} (${res.rows[0].id})`,
      );
    }

    console.log('Manual core setup completed successfully.');
  } catch (err) {
    console.error('Manual core setup failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
    console.log('Disconnected.');
  }
}

main();
