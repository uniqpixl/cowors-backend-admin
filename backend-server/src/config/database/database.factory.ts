import { GlobalConfig } from '@/config/config.type';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default function useDatabaseFactory(
  configService: ConfigService<GlobalConfig>,
): TypeOrmModuleOptions {
  const databaseConfig = configService.getOrThrow('database', { infer: true });

  return {
    type: databaseConfig.type,
    host: databaseConfig.host,
    port: databaseConfig.port,
    username: databaseConfig.username,
    password: databaseConfig.password,
    database: databaseConfig.database,
    synchronize: databaseConfig.synchronize,
    dropSchema: databaseConfig.dropSchema,
    logging: databaseConfig.logging,
    entities: databaseConfig.entities,
    migrations: databaseConfig.migrations,
    extra: databaseConfig.extra,
    ssl: databaseConfig.ssl,
  };
}
