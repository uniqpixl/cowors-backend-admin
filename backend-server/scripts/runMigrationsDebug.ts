import 'reflect-metadata';
import { DataSource, QueryFailedError } from 'typeorm';
import path from 'path';
import fs from 'fs';
import AppDataSource from '../src/database/data-source';

async function main() {
  const logDir = path.resolve(__dirname, '../logs');
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `migrations-run.${Date.now()}.log`);
  const log = (msg: string) => {
    fs.appendFileSync(logPath, msg + '\n');
    console.log(msg);
  };

  log(`Starting migration run at ${new Date().toISOString()}`);
  try {
    await AppDataSource.initialize();
    log('DataSource initialized.');

    // List configured migrations from the datasource (file-level)
    const configured = AppDataSource.options.migrations;
    log(`Configured migrations count: ${Array.isArray(configured) ? configured.length : 0}`);

    // Show migrations currently registered after initialization
    const dsMigrations = (AppDataSource.migrations || []).map((m: any) => m.name);
    log(`Registered migrations after init (${dsMigrations.length}):`);
    dsMigrations.forEach((m) => log(` - ${m}`));

    log('Running migrations with transaction=none ...');
    const results = await AppDataSource.runMigrations({ transaction: 'none' as any });
    log(`Applied migrations count: ${results.length}`);
    results.forEach((r) => log(` + Applied: ${r.name}`));

    log('Migration run completed successfully.');
  } catch (err: any) {
    log('Migration run FAILED.');
    if (err instanceof QueryFailedError) {
      log(`QueryFailedError: ${err.name}`);
      log(`Message: ${err.message}`);
      // @ts-ignore
      if (err.query) log(`Query: ${err.query}`);
      // @ts-ignore
      if (err.parameters) log(`Parameters: ${JSON.stringify(err.parameters)}`);
    } else {
      log(`Error: ${err?.name || 'UnknownError'}`);
      log(`Message: ${err?.message || String(err)}`);
    }
    if (err?.stack) {
      log('Stack:');
      log(String(err.stack));
    }
  } finally {
    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        log('DataSource destroyed.');
      }
    } catch (e) {
      log(`Error during destroy: ${String((e as any)?.message || e)}`);
    }
    log(`Log written to: ${logPath}`);
  }
}

main().catch((e) => {
  console.error('Unexpected error in migration debug runner:', e);
});