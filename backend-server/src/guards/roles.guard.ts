import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '@/auth/entities/user.entity';
import { ROLES_KEY } from '@/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRolesRaw = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Normalize required roles to lowercase for consistent comparison
    const requiredRoles = requiredRolesRaw?.map((r) => r.toLowerCase());
    this.logger.log(`Required roles: ${JSON.stringify(requiredRoles)}`);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const sessionUser = request.session?.user;

    // Fast-path: if session user exists and has one of required roles, allow
    if (
      sessionUser &&
      requiredRoles?.includes(String(sessionUser.role).toLowerCase())
    ) {
      this.logger.log(
        `Session user role authorized: ${sessionUser.role} for ${JSON.stringify(requiredRoles)}`,
      );
      return true;
    }

    if (!user || !user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userId = user.sub;
    const isEmail = userId.includes('@');
    const isCoworsId = this.isValidCoworsId(userId);

    // Get the full user entity from the database
    let whereCondition;
    if (isEmail) {
      whereCondition = { email: userId };
    } else if (isCoworsId) {
      whereCondition = { id: userId };
    } else {
      whereCondition = { id: userId };
    }

    const dbUser = await this.userRepository.findOne({
      where: whereCondition,
    });

    this.logger.log(`Database user: ${JSON.stringify(dbUser)}`);

    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    const hasRole = requiredRoles.includes(String(dbUser.role).toLowerCase());
    this.logger.log(
      `Role check result: ${hasRole} (user role: ${dbUser.role}, required: ${JSON.stringify(requiredRoles)})`,
    );

    return hasRole;
  }

  /**
   * Validates if an ID follows the Cowors format
   */
  private isValidCoworsId(id: string): boolean {
    // Support all Cowors entity types
    const pattern =
      /^(CUS|CPT|CSP|BK|CTY|NBH|CAD|CCT|CSC|CNT|CPY|CRF|COR|CPI|CTX|CXT|CPO|CAU|CMG|CRV|CRQ|CIN|CTT|CTC|CPR|CPA|CWT)-[A-Z0-9]{6}$/;
    return pattern.test(id);
  }
}
