import { DataSource } from 'typeorm';
import { IdGeneratorService, EntityType } from '../src/utils/id-generator.service';
import { PartnerEntity } from '../src/database/entities/partner.entity';
import { SpaceEntity } from '../src/database/entities/space.entity';

// Database configuration
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'cowors_mvp',
  entities: [PartnerEntity, SpaceEntity],
  synchronize: false,
});

async function updateIdsToCoworstFormat() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    
    const idGenerator = new IdGeneratorService();
    const queryRunner = dataSource.createQueryRunner();
    
    console.log('Starting ID update process...');
    
    // Update Partner IDs
    console.log('Updating Partner IDs...');
    const partners = await queryRunner.query(`
      SELECT id, "businessName" FROM partner 
      WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      LIMIT 5
    `);
    
    console.log(`Found ${partners.length} partners with UUID format`);
    
    for (const partner of partners) {
      const oldId = partner.id;
      const newId = idGenerator.generateId(EntityType.PARTNER);
      
      console.log(`Updating partner "${partner.businessName}" from ${oldId} to ${newId}`);
      
      // Update partner table
      await queryRunner.query(`UPDATE partner SET id = $1 WHERE id = $2`, [newId, oldId]);
      
      console.log(`✓ Updated partner ${partner.businessName}`);
    }
    
    // Update Space IDs
    console.log('Updating Space IDs...');
    const spaces = await queryRunner.query(`
      SELECT id, name FROM space 
      WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      LIMIT 5
    `);
    
    console.log(`Found ${spaces.length} spaces with UUID format`);
    
    for (const space of spaces) {
      const oldId = space.id;
      const newId = idGenerator.generateId(EntityType.SPACE);
      
      console.log(`Updating space "${space.name}" from ${oldId} to ${newId}`);
      
      // Update space table
      await queryRunner.query(`UPDATE space SET id = $1 WHERE id = $2`, [newId, oldId]);
      
      console.log(`✓ Updated space ${space.name}`);
    }
    
    console.log('ID update completed successfully!');
    
    // Test the new IDs
    console.log('\nTesting updated records...');
    const updatedPartners = await queryRunner.query(`
      SELECT id, "businessName" FROM partner 
      WHERE id ~ '^CPT-[A-Z0-9]{6}$'
      LIMIT 3
    `);
    
    const updatedSpaces = await queryRunner.query(`
      SELECT id, name FROM space 
      WHERE id ~ '^CSP-[A-Z0-9]{6}$'
      LIMIT 3
    `);
    
    console.log('Updated Partners:', updatedPartners);
    console.log('Updated Spaces:', updatedSpaces);
    
    await queryRunner.release();
    await dataSource.destroy();
    
  } catch (error) {
    console.error('Error updating IDs:', error);
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config();

updateIdsToCoworstFormat()