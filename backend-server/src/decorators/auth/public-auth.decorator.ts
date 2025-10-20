import { IS_PUBLIC_AUTH } from '@/constants/auth.constant';
import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route as public, allowing unauthenticated access.
 * When applied to a controller method, the AuthGuard will skip authentication checks.
 */
export const PublicAuth = () => SetMetadata(IS_PUBLIC_AUTH, true);
