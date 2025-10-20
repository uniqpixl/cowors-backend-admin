import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameAddonsToExtras1758741700000 implements MigrationInterface {
  name = 'RenameAddonsToExtras1758741700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename add_ons table to extras
    await queryRunner.query(`ALTER TABLE "add_ons" RENAME TO "extras"`);

    // Rename space_add_ons table to space_extras
    await queryRunner.query(
      `ALTER TABLE "space_add_ons" RENAME TO "space_extras"`,
    );

    // Rename columns in space_extras table
    await queryRunner.query(
      `ALTER TABLE "space_extras" RENAME COLUMN "add_on_type" TO "extras_type"`,
    );

    // Update enum type name from AddOnType to ExtrasType
    await queryRunner.query(`ALTER TYPE "AddOnType" RENAME TO "ExtrasType"`);

    // Rename indexes for extras table
    await queryRunner.query(
      `ALTER INDEX "IDX_add_ons_type_isActive" RENAME TO "IDX_extras_type_isActive"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_add_ons_category_isActive" RENAME TO "IDX_extras_category_isActive"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_add_ons_name" RENAME TO "IDX_extras_name"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_add_ons_type" RENAME TO "IDX_extras_type"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_add_ons_category" RENAME TO "IDX_extras_category"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_add_ons_isActive" RENAME TO "IDX_extras_isActive"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_add_ons_createdAt" RENAME TO "IDX_extras_createdAt"`,
    );

    // Rename indexes for space_extras table
    await queryRunner.query(
      `ALTER INDEX "IDX_space_add_ons_spaceId_addOnType" RENAME TO "IDX_space_extras_spaceId_extrasType"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_space_add_ons_isActive_priority" RENAME TO "IDX_space_extras_isActive_priority"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_space_add_ons_createdAt" RENAME TO "IDX_space_extras_createdAt"`,
    );

    // Update foreign key constraints in related tables
    // Update booking_items table if it has addOnId column
    const bookingItemsTable = await queryRunner.hasTable('booking_items');
    if (bookingItemsTable) {
      const hasAddOnIdColumn = await queryRunner.hasColumn(
        'booking_items',
        'addOnId',
      );
      if (hasAddOnIdColumn) {
        await queryRunner.query(
          `ALTER TABLE "booking_items" RENAME COLUMN "addOnId" TO "extrasId"`,
        );
      }

      const hasAddonAmountColumn = await queryRunner.hasColumn(
        'booking_items',
        'addonAmount',
      );
      if (hasAddonAmountColumn) {
        await queryRunner.query(
          `ALTER TABLE "booking_items" RENAME COLUMN "addonAmount" TO "extrasAmount"`,
        );
      }
    }

    // Update pricing_rules table if it has addOnId column
    const pricingRulesTable = await queryRunner.hasTable('pricing_rules');
    if (pricingRulesTable) {
      const hasAddOnIdColumn = await queryRunner.hasColumn(
        'pricing_rules',
        'addOnId',
      );
      if (hasAddOnIdColumn) {
        await queryRunner.query(
          `ALTER TABLE "pricing_rules" RENAME COLUMN "addOnId" TO "extrasId"`,
        );
      }
    }

    // Update any other tables that might reference addons
    const invoicesTable = await queryRunner.hasTable('invoices');
    if (invoicesTable) {
      const hasAddonAmountColumn = await queryRunner.hasColumn(
        'invoices',
        'addonAmount',
      );
      if (hasAddonAmountColumn) {
        await queryRunner.query(
          `ALTER TABLE "invoices" RENAME COLUMN "addonAmount" TO "extrasAmount"`,
        );
      }
    }

    const paymentsTable = await queryRunner.hasTable('payments');
    if (paymentsTable) {
      const hasAddonAmountColumn = await queryRunner.hasColumn(
        'payments',
        'addonAmount',
      );
      if (hasAddonAmountColumn) {
        await queryRunner.query(
          `ALTER TABLE "payments" RENAME COLUMN "addonAmount" TO "extrasAmount"`,
        );
      }
    }

    const refundsTable = await queryRunner.hasTable('refunds');
    if (refundsTable) {
      const hasAddonAmountColumn = await queryRunner.hasColumn(
        'refunds',
        'addonAmount',
      );
      if (hasAddonAmountColumn) {
        await queryRunner.query(
          `ALTER TABLE "refunds" RENAME COLUMN "addonAmount" TO "extrasAmount"`,
        );
      }
    }

    // Update commission_tracking table if it has addon-related columns
    const commissionTrackingTable = await queryRunner.hasTable(
      'commission_tracking',
    );
    if (commissionTrackingTable) {
      const hasAddonCommissionColumn = await queryRunner.hasColumn(
        'commission_tracking',
        'addonCommission',
      );
      if (hasAddonCommissionColumn) {
        await queryRunner.query(
          `ALTER TABLE "commission_tracking" RENAME COLUMN "addonCommission" TO "extrasCommission"`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse all the changes

    // Revert commission_tracking table changes
    const commissionTrackingTable = await queryRunner.hasTable(
      'commission_tracking',
    );
    if (commissionTrackingTable) {
      const hasExtrasCommissionColumn = await queryRunner.hasColumn(
        'commission_tracking',
        'extrasCommission',
      );
      if (hasExtrasCommissionColumn) {
        await queryRunner.query(
          `ALTER TABLE "commission_tracking" RENAME COLUMN "extrasCommission" TO "addonCommission"`,
        );
      }
    }

    // Revert refunds table changes
    const refundsTable = await queryRunner.hasTable('refunds');
    if (refundsTable) {
      const hasExtrasAmountColumn = await queryRunner.hasColumn(
        'refunds',
        'extrasAmount',
      );
      if (hasExtrasAmountColumn) {
        await queryRunner.query(
          `ALTER TABLE "refunds" RENAME COLUMN "extrasAmount" TO "addonAmount"`,
        );
      }
    }

    // Revert payments table changes
    const paymentsTable = await queryRunner.hasTable('payments');
    if (paymentsTable) {
      const hasExtrasAmountColumn = await queryRunner.hasColumn(
        'payments',
        'extrasAmount',
      );
      if (hasExtrasAmountColumn) {
        await queryRunner.query(
          `ALTER TABLE "payments" RENAME COLUMN "extrasAmount" TO "addonAmount"`,
        );
      }
    }

    // Revert invoices table changes
    const invoicesTable = await queryRunner.hasTable('invoices');
    if (invoicesTable) {
      const hasExtrasAmountColumn = await queryRunner.hasColumn(
        'invoices',
        'extrasAmount',
      );
      if (hasExtrasAmountColumn) {
        await queryRunner.query(
          `ALTER TABLE "invoices" RENAME COLUMN "extrasAmount" TO "addonAmount"`,
        );
      }
    }

    // Revert pricing_rules table changes
    const pricingRulesTable = await queryRunner.hasTable('pricing_rules');
    if (pricingRulesTable) {
      const hasExtrasIdColumn = await queryRunner.hasColumn(
        'pricing_rules',
        'extrasId',
      );
      if (hasExtrasIdColumn) {
        await queryRunner.query(
          `ALTER TABLE "pricing_rules" RENAME COLUMN "extrasId" TO "addOnId"`,
        );
      }
    }

    // Revert booking_items table changes
    const bookingItemsTable = await queryRunner.hasTable('booking_items');
    if (bookingItemsTable) {
      const hasExtrasAmountColumn = await queryRunner.hasColumn(
        'booking_items',
        'extrasAmount',
      );
      if (hasExtrasAmountColumn) {
        await queryRunner.query(
          `ALTER TABLE "booking_items" RENAME COLUMN "extrasAmount" TO "addonAmount"`,
        );
      }

      const hasExtrasIdColumn = await queryRunner.hasColumn(
        'booking_items',
        'extrasId',
      );
      if (hasExtrasIdColumn) {
        await queryRunner.query(
          `ALTER TABLE "booking_items" RENAME COLUMN "extrasId" TO "addOnId"`,
        );
      }
    }

    // Revert index names for space_extras table
    await queryRunner.query(
      `ALTER INDEX "IDX_space_extras_createdAt" RENAME TO "IDX_space_add_ons_createdAt"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_space_extras_isActive_priority" RENAME TO "IDX_space_add_ons_isActive_priority"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_space_extras_spaceId_extrasType" RENAME TO "IDX_space_add_ons_spaceId_addOnType"`,
    );

    // Revert index names for extras table
    await queryRunner.query(
      `ALTER INDEX "IDX_extras_createdAt" RENAME TO "IDX_add_ons_createdAt"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_extras_isActive" RENAME TO "IDX_add_ons_isActive"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_extras_category" RENAME TO "IDX_add_ons_category"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_extras_type" RENAME TO "IDX_add_ons_type"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_extras_name" RENAME TO "IDX_add_ons_name"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_extras_category_isActive" RENAME TO "IDX_add_ons_category_isActive"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_extras_type_isActive" RENAME TO "IDX_add_ons_type_isActive"`,
    );

    // Revert enum type name
    await queryRunner.query(`ALTER TYPE "ExtrasType" RENAME TO "AddOnType"`);

    // Revert column names in space_extras table
    await queryRunner.query(
      `ALTER TABLE "space_extras" RENAME COLUMN "extras_type" TO "add_on_type"`,
    );

    // Revert table names
    await queryRunner.query(
      `ALTER TABLE "space_extras" RENAME TO "space_add_ons"`,
    );
    await queryRunner.query(`ALTER TABLE "extras" RENAME TO "add_ons"`);
  }
}
