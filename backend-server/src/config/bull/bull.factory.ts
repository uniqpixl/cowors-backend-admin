import { GlobalConfig } from '@/config/config.type';
import { type BullRootModuleOptions } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

async function useBullFactory(
  configService: ConfigService<GlobalConfig>,
): Promise<BullRootModuleOptions> {
  const queueConfig = configService.getOrThrow('queue', { infer: true });
  return {
    prefix: queueConfig.prefix,
    defaultJobOptions: queueConfig.defaultJobOptions,
    connection: {
      host: configService.getOrThrow('redis.host', {
        infer: true,
      }),
      port: configService.getOrThrow('redis.port', {
        infer: true,
      }),
      password: configService.getOrThrow('redis.password', {
        infer: true,
      }),
      tls: configService.get('redis.tls', { infer: true }),
    },
  };
}

export default useBullFactory;
