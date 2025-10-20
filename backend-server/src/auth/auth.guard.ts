import type {
  CanActivate,
  ContextType,
  ExecutionContext,
} from '@nestjs/common';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Socket } from 'socket.io';
import { AuthService } from './auth.service';

import { IS_OPTIONAL_AUTH, IS_PUBLIC_AUTH } from '@/constants/auth.constant';
import { FastifyRequest } from 'fastify';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  /**
   * Validates if the current request is authenticated for all REST & Websockets
   * Attaches session and user information to the request object
   * @param context - The execution context of the current request
   * @returns True if the request is authorized to proceed, throws an error otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_AUTH,
      [context.getHandler(), context.getClass()],
    );
    if (isAuthPublic) return true;

    // Read optional auth flag early to short-circuit before throwing
    const isAuthOptional = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH,
      [context.getHandler(), context.getClass()],
    );

    const contextType: ContextType = context.getType();

    if (contextType === 'ws') {
      const socket = context.switchToWs().getClient<Socket>();
      try {
        // Extract token from socket headers
        const token = this.extractTokenFromHeaders(socket?.handshake?.headers);
        if (!token) {
          socket.disconnect();
          return false;
        }

        // Validate session
        const result = await this.authService.validateSession(token);
        if (!result.valid) {
          socket.disconnect();
          return false;
        }

        // Attach session user and payload-like user for consistency
        socket['session'] = { user: result.user };
        socket['user'] = {
          sub: result.user.email ?? result.user.id,
          email: result.user.email,
          role: result.user.role,
        };
      } catch (_) {
        socket.disconnect();
        return false;
      }
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    // Extract token from request headers
    const token = this.extractTokenFromHeaders(request?.headers);

    // If endpoint allows optional auth and no token provided, allow through
    if (!token) {
      if (isAuthOptional) {
        return true;
      }
      throw new UnauthorizedException({ code: 'UNAUTHORIZED' });
    }

    // Validate session
    const result = await this.authService.validateSession(token);

    // If optional auth and session invalid, allow through; else reject
    if (!result.valid) {
      if (isAuthOptional) {
        return true;
      }
      throw new UnauthorizedException({ code: 'UNAUTHORIZED' });
    }

    // Attach session user and payload-like user for RolesGuard compatibility
    request['session'] = { user: result.user };
    request['user'] = {
      sub: result.user.email ?? result.user.id,
      email: result.user.email,
      role: result.user.role,
    };

    return true;
  }

  private extractTokenFromHeaders(
    headers: Record<string, any> | undefined,
  ): string | null {
    if (!headers) return null;

    // Check for Authorization header (Bearer token)
    if (headers.authorization) {
      const authHeader = headers.authorization as string;
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
    }

    // Check for cookie (auth-token)
    if (headers.cookie) {
      const cookies = headers.cookie as string;
      const tokenMatch = cookies.match(/auth-token=([^;]+)/);
      if (tokenMatch && tokenMatch[1]) {
        return tokenMatch[1];
      }
    }

    return null;
  }
}
