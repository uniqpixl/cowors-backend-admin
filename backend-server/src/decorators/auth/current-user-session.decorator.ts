import { UserSession as UserSessionType } from '@/auth/auth.type';
import {
  ContextType,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { type FastifyRequest } from 'fastify';

export type CurrentUserSession = UserSessionType & {
  headers: FastifyRequest['headers'];
};

export const CurrentUserSession = createParamDecorator(
  (
    data: keyof UserSessionType | 'headers',
    ctx: ExecutionContext,
  ): CurrentUserSession | any => {
    const request: FastifyRequest & UserSessionType = ctx
      .switchToHttp()
      .getRequest();

    // For NextAuth integration, we'll get user data from the request
    const sessionData: UserSessionType = {
      user: (request as any).user || null,
    };

    return data == null
      ? {
          ...sessionData,
          headers: request?.headers,
        }
      : (sessionData as any)?.[data];
  },
);
