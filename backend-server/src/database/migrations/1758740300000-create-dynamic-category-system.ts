import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDynamicCategorySystem1758740300000
  implements MigrationInterface
{
  name = 'CreateDynamicCategorySystem1758740300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create partner_types table
    await queryRunner.query(`
      CREATE TABLE "partner_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying(100) NOT NULL,
        "slug" character varying(100) NOT NULL,
        "description" text,
        "icon" character varying(50),
        "color" character varying(7),
        "isActive" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        CONSTRAINT "UQ_partner_types_name" UNIQUE ("name"),
        CONSTRAINT "UQ_partner_types_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_partner_types" PRIMARY KEY ("id")
      )
    `);

    // Create partner_categories table
    await queryRunner.query(`
      CREATE TABLE "partner_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying(100) NOT NULL,
        "slug" character varying(100) NOT NULL,
        "description" text,
        "icon" character varying(50),
        "color" character varying(7),
        "isActive" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "requiresSubcategory" boolean NOT NULL DEFAULT false,
        "ruleTemplates" jsonb,
        "metadata" jsonb,
        "partnerTypeId" uuid NOT NULL,
        CONSTRAINT "PK_partner_categories" PRIMARY KEY ("id")
      )
    `);

    // Create partner_subcategories table
    await queryRunner.query(`
      CREATE TABLE "partner_subcategories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying(100) NOT NULL,
        "slug" character varying(100) NOT NULL,
        "description" text,
        "icon" character varying(50),
        "color" character varying(7),
        "isActive" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "ruleOverrides" jsonb,
        "metadata" jsonb,
        "categoryId" uuid NOT NULL,
        CONSTRAINT "PK_partner_subcategories" PRIMARY KEY ("id")
      )
    `);

    // Create partner_offerings table
    await queryRunner.query(`
      CREATE TABLE "partner_offerings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "title" character varying(200) NOT NULL,
        "slug" character varying(200) NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "isFeatured" boolean NOT NULL DEFAULT false,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "pricing" jsonb,
        "availability" jsonb,
        "features" jsonb,
        "requirements" jsonb,
        "media" jsonb,
        "location" jsonb,
        "metadata" jsonb,
        "rating" numeric(3,2) NOT NULL DEFAULT 0,
        "reviewCount" integer NOT NULL DEFAULT 0,
        "partnerId" uuid NOT NULL,
        "categoryId" uuid NOT NULL,
        "subcategoryId" uuid,
        CONSTRAINT "PK_partner_offerings" PRIMARY KEY ("id")
      )
    `);

    // Add new columns to partner table for dynamic category system
    await queryRunner.query(`
      ALTER TABLE "partner" 
      ADD COLUMN "partnerTypeId" uuid,
      ADD COLUMN "primaryCategoryId" uuid,
      ADD COLUMN "primarySubcategoryId" uuid
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_types_name" ON "partner_types" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_types_slug" ON "partner_types" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_types_isActive" ON "partner_types" ("isActive")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_partner_categories_name" ON "partner_categories" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_categories_slug" ON "partner_categories" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_categories_isActive" ON "partner_categories" ("isActive")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_categories_partnerTypeId" ON "partner_categories" ("partnerTypeId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_partner_subcategories_name" ON "partner_subcategories" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_subcategories_slug" ON "partner_subcategories" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_subcategories_isActive" ON "partner_subcategories" ("isActive")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_subcategories_categoryId" ON "partner_subcategories" ("categoryId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_partner_offerings_title" ON "partner_offerings" ("title")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_offerings_slug" ON "partner_offerings" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_offerings_isActive" ON "partner_offerings" ("isActive")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_offerings_partnerId" ON "partner_offerings" ("partnerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_offerings_categoryId" ON "partner_offerings" ("categoryId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_offerings_subcategoryId" ON "partner_offerings" ("subcategoryId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_partner_partnerTypeId" ON "partner" ("partnerTypeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_primaryCategoryId" ON "partner" ("primaryCategoryId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_partner_primarySubcategoryId" ON "partner" ("primarySubcategoryId")`,
    );

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "partner_categories" 
      ADD CONSTRAINT "FK_partner_categories_partnerTypeId" 
      FOREIGN KEY ("partnerTypeId") REFERENCES "partner_types"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_subcategories" 
      ADD CONSTRAINT "FK_partner_subcategories_categoryId" 
      FOREIGN KEY ("categoryId") REFERENCES "partner_categories"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_offerings" 
      ADD CONSTRAINT "FK_partner_offerings_partnerId" 
      FOREIGN KEY ("partnerId") REFERENCES "partner"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_offerings" 
      ADD CONSTRAINT "FK_partner_offerings_categoryId" 
      FOREIGN KEY ("categoryId") REFERENCES "partner_categories"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_offerings" 
      ADD CONSTRAINT "FK_partner_offerings_subcategoryId" 
      FOREIGN KEY ("subcategoryId") REFERENCES "partner_subcategories"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "partner" 
      ADD CONSTRAINT "FK_partner_partnerTypeId" 
      FOREIGN KEY ("partnerTypeId") REFERENCES "partner_types"("id") ON DELETE SET NULL
    `);

    // Insert default partner types
    await queryRunner.query(`
      INSERT INTO "partner_types" ("name", "slug", "description", "icon", "color", "sortOrder") VALUES
      ('Professional Services', 'professional-services', 'Freelancers, consultants, and professional service providers', 'briefcase', '#3B82F6', 1),
      ('Home Services', 'home-services', 'Home maintenance, cleaning, and repair services', 'home', '#10B981', 2),
      ('Workspace Providers', 'workspace-providers', 'Coworking spaces, meeting rooms, and office rentals', 'building', '#8B5CF6', 3),
      ('Event Services', 'event-services', 'Event planning, catering, and entertainment services', 'calendar', '#F59E0B', 4),
      ('Food & Beverage', 'food-beverage', 'Restaurants, cafes, and food delivery services', 'utensils', '#EF4444', 5)
    `);

    // Get partner type IDs for categories
    const professionalServicesResult = await queryRunner.query(
      `SELECT id FROM "partner_types" WHERE slug = 'professional-services'`,
    );
    const homeServicesResult = await queryRunner.query(
      `SELECT id FROM "partner_types" WHERE slug = 'home-services'`,
    );
    const workspaceResult = await queryRunner.query(
      `SELECT id FROM "partner_types" WHERE slug = 'workspace-providers'`,
    );
    const eventServicesResult = await queryRunner.query(
      `SELECT id FROM "partner_types" WHERE slug = 'event-services'`,
    );
    const foodBeverageResult = await queryRunner.query(
      `SELECT id FROM "partner_types" WHERE slug = 'food-beverage'`,
    );

    const professionalServicesId = professionalServicesResult[0].id;
    const homeServicesId = homeServicesResult[0].id;
    const workspaceId = workspaceResult[0].id;
    const eventServicesId = eventServicesResult[0].id;
    const foodBeverageId = foodBeverageResult[0].id;

    // Insert default categories for Professional Services
    await queryRunner.query(`
      INSERT INTO "partner_categories" ("name", "slug", "description", "icon", "partnerTypeId", "sortOrder", "ruleTemplates") VALUES
      ('Freelancers', 'freelancers', 'Independent contractors and freelance professionals', 'user', '${professionalServicesId}', 1, '{
        "pricing": {
          "pricingModel": "hourly",
          "currency": "USD"
        },
        "availability": {
          "advanceBooking": 1,
          "maxBookingDuration": 8,
          "bufferTime": 30
        },
        "requirements": {
          "verification": ["identity", "skills"],
          "minimumRating": 4.0
        },
        "features": {
          "allowInstantBooking": true,
          "allowCancellation": true,
          "cancellationPolicy": "24 hours notice required"
        }
      }'),
      ('Startup Enablers', 'startup-enablers', 'Business consultants and startup advisors', 'trending-up', '${professionalServicesId}', 2, '{
        "pricing": {
          "pricingModel": "hourly",
          "currency": "USD"
        },
        "availability": {
          "advanceBooking": 3,
          "maxBookingDuration": 4,
          "bufferTime": 15
        },
        "requirements": {
          "verification": ["identity", "business", "experience"],
          "minimumRating": 4.5
        },
        "features": {
          "allowInstantBooking": false,
          "allowCancellation": true,
          "cancellationPolicy": "48 hours notice required"
        }
      }')
    `);

    // Insert default categories for Workspace Providers
    await queryRunner.query(`
      INSERT INTO "partner_categories" ("name", "slug", "description", "icon", "partnerTypeId", "sortOrder", "requiresSubcategory", "ruleTemplates") VALUES
      ('Coworking Spaces', 'coworking-spaces', 'Shared workspaces and hot desks', 'users', '${workspaceId}', 1, true, '{
        "pricing": {
          "pricingModel": "hourly",
          "currency": "USD"
        },
        "availability": {
          "advanceBooking": 1,
          "maxBookingDuration": 12,
          "bufferTime": 15
        },
        "requirements": {
          "verification": ["identity"],
          "minimumRating": 3.5
        },
        "features": {
          "allowInstantBooking": true,
          "allowCancellation": true,
          "cancellationPolicy": "2 hours notice required"
        }
      }'),
      ('Meeting Rooms', 'meeting-rooms', 'Private meeting and conference rooms', 'video', '${workspaceId}', 2, false, '{
        "pricing": {
          "pricingModel": "hourly",
          "currency": "USD"
        },
        "availability": {
          "advanceBooking": 1,
          "maxBookingDuration": 8,
          "bufferTime": 30
        },
        "requirements": {
          "verification": ["identity"],
          "minimumRating": 3.0
        },
        "features": {
          "allowInstantBooking": true,
          "allowCancellation": true,
          "cancellationPolicy": "4 hours notice required"
        }
      }'),
      ('Event Spaces', 'event-spaces', 'Venues for events and gatherings', 'calendar', '${workspaceId}', 3, false, '{
        "pricing": {
          "pricingModel": "daily",
          "currency": "USD"
        },
        "availability": {
          "advanceBooking": 7,
          "maxBookingDuration": 24,
          "bufferTime": 60
        },
        "requirements": {
          "verification": ["identity", "business"],
          "minimumRating": 4.0
        },
        "features": {
          "allowInstantBooking": false,
          "allowCancellation": true,
          "cancellationPolicy": "7 days notice required"
        }
      }')
    `);

    // Insert default categories for Food & Beverage
    await queryRunner.query(`
      INSERT INTO "partner_categories" ("name", "slug", "description", "icon", "partnerTypeId", "sortOrder", "ruleTemplates") VALUES
      ('Cafes', 'cafes', 'Coffee shops and casual dining', 'coffee', '${foodBeverageId}', 1, '{
        "pricing": {
          "pricingModel": "hourly",
          "currency": "USD"
        },
        "availability": {
          "advanceBooking": 0,
          "maxBookingDuration": 6,
          "bufferTime": 0
        },
        "requirements": {
          "verification": ["identity"],
          "minimumRating": 3.0
        },
        "features": {
          "allowInstantBooking": true,
          "allowCancellation": true,
          "cancellationPolicy": "No cancellation fee"
        }
      }'),
      ('Restaurants', 'restaurants', 'Full-service dining establishments', 'utensils', '${foodBeverageId}', 2, '{
        "pricing": {
          "pricingModel": "fixed",
          "currency": "USD"
        },
        "availability": {
          "advanceBooking": 1,
          "maxBookingDuration": 3,
          "bufferTime": 15
        },
        "requirements": {
          "verification": ["identity"],
          "minimumRating": 3.5
        },
        "features": {
          "allowInstantBooking": true,
          "allowCancellation": true,
          "cancellationPolicy": "2 hours notice required"
        }
      }')
    `);

    // Insert default categories for Event Services
    await queryRunner.query(`
      INSERT INTO "partner_categories" ("name", "slug", "description", "icon", "partnerTypeId", "sortOrder", "ruleTemplates") VALUES
      ('Event Organizers', 'event-organizers', 'Professional event planning and management', 'calendar-check', '${eventServicesId}', 1, '{
        "pricing": {
          "pricingModel": "fixed",
          "currency": "USD"
        },
        "availability": {
          "advanceBooking": 14,
          "maxBookingDuration": 24,
          "bufferTime": 120
        },
        "requirements": {
          "verification": ["identity", "business", "insurance"],
          "minimumRating": 4.0
        },
        "features": {
          "allowInstantBooking": false,
          "allowCancellation": true,
          "cancellationPolicy": "14 days notice required"
        }
      }')
    `);

    console.log(
      'Dynamic category system tables created and populated with default data',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "partner" DROP CONSTRAINT IF EXISTS "FK_partner_partnerTypeId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_offerings" DROP CONSTRAINT IF EXISTS "FK_partner_offerings_subcategoryId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_offerings" DROP CONSTRAINT IF EXISTS "FK_partner_offerings_categoryId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_offerings" DROP CONSTRAINT IF EXISTS "FK_partner_offerings_partnerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_subcategories" DROP CONSTRAINT IF EXISTS "FK_partner_subcategories_categoryId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_categories" DROP CONSTRAINT IF EXISTS "FK_partner_categories_partnerTypeId"`,
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_primarySubcategoryId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_primaryCategoryId"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partner_partnerTypeId"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_offerings_subcategoryId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_offerings_categoryId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_offerings_partnerId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_offerings_isActive"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_offerings_slug"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_offerings_title"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_subcategories_categoryId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_subcategories_isActive"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_subcategories_slug"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_subcategories_name"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_categories_partnerTypeId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_categories_isActive"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_categories_slug"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_categories_name"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_partner_types_isActive"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partner_types_slug"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partner_types_name"`);

    // Remove columns from partner table
    await queryRunner.query(
      `ALTER TABLE "partner" DROP COLUMN IF EXISTS "primarySubcategoryId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner" DROP COLUMN IF EXISTS "primaryCategoryId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner" DROP COLUMN IF EXISTS "partnerTypeId"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_offerings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_subcategories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_types"`);

    console.log('Dynamic category system tables dropped');
  }
}
