import validateConfig from '@/utils/config/validate-config';
import { registerAs } from '@nestjs/config';
import { IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import process from 'node:process';
import { CashfreeConfig } from './cashfree-config.type';

class EnvironmentVariablesValidator {
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  CASHFREE_VRS_BASE_URL: string;

  @IsString()
  @IsNotEmpty()
  CASHFREE_VRS_CLIENT_ID: string;

  @IsString()
  @IsNotEmpty()
  CASHFREE_VRS_CLIENT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  CASHFREE_VRS_WEBHOOK_SECRET: string;

  @IsEnum(['sandbox', 'production'])
  @IsNotEmpty()
  CASHFREE_VRS_ENVIRONMENT: 'sandbox' | 'production';
}

export function getConfig(): CashfreeConfig {
  return {
    baseUrl: process.env.CASHFREE_VRS_BASE_URL,
    clientId: process.env.CASHFREE_VRS_CLIENT_ID,
    clientSecret: process.env.CASHFREE_VRS_CLIENT_SECRET,
    webhookSecret: process.env.CASHFREE_VRS_WEBHOOK_SECRET,
    environment: process.env.CASHFREE_VRS_ENVIRONMENT as
      | 'sandbox'
      | 'production',
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoffMs: 10000,
    },
  };
}

export default registerAs<CashfreeConfig>('cashfree', () => {
  // eslint-disable-next-line no-console
  console.info(`Registering CashfreeConfig from environment variables`);
  validateConfig(process.env, EnvironmentVariablesValidator);
  return getConfig();
});
