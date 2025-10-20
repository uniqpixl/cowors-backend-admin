import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    console.log('🔍 JwtAuthGuard: Processing request');
    console.log(
      '🔍 JwtAuthGuard: Authorization header:',
      req.headers.authorization,
    );

    const token = this.extractTokenFromHeader(req);
    console.log('🔍 JwtAuthGuard: Extracted token:', token);

    if (!token) {
      console.log('❌ JwtAuthGuard: No token provided');
      throw new UnauthorizedException('No token provided');
    }

    try {
      console.log('🔍 JwtAuthGuard: Validating token...');
      const payload = await this.authService.validateToken(token);
      console.log('✅ JwtAuthGuard: Token validated successfully:', payload);
      req.user = payload;
      // Set session for compatibility with RolesGuard
      req.session = { user: payload };
      return true;
    } catch (error) {
      console.log('❌ JwtAuthGuard: Token validation failed:', error.message);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
