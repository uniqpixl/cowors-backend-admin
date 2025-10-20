import { AuthService } from '@/auth/auth.service';
import { UserEntity } from '@/auth/entities/user.entity';
import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { ErrorResponseUtil } from '@/common/utils/error-response.util';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { I18nTranslations } from '@/generated/i18n.generated';
import { buildPaginator } from '@/utils/pagination/cursor-pagination';
import { paginate } from '@/utils/pagination/offset-pagination';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import {
  QueryUsersCursorDto,
  QueryUsersOffsetDto,
  UserDto,
} from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly i18nService: I18nService<I18nTranslations>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly authService: AuthService,
  ) {}

  async findAllUsers(
    dto: QueryUsersOffsetDto,
  ): Promise<OffsetPaginatedDto<UserDto>> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC');
    const [users, metaDto] = await paginate<UserEntity>(query, dto, {
      skipCount: false,
      takeAll: false,
    });
    return new OffsetPaginatedDto(users, metaDto);
  }

  async findAllUsersCursor(
    reqDto: QueryUsersCursorDto,
  ): Promise<CursorPaginatedDto<UserDto>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    const paginator = buildPaginator({
      entity: UserEntity,
      alias: 'user',
      paginationKeys: ['createdAt'],
      query: {
        limit: reqDto.limit,
        order: 'DESC',
        afterCursor: reqDto.afterCursor,
        beforeCursor: reqDto.beforeCursor,
      },
    });

    const { data, cursor } = await paginator.paginate(queryBuilder);

    const metaDto = new CursorPaginationDto(
      data.length,
      cursor.afterCursor,
      cursor.beforeCursor,
      reqDto,
    );

    return new CursorPaginatedDto(data, metaDto);
  }

  async findOneUser(
    id: Uuid | string,
    options?: FindOneOptions<UserEntity>,
  ): Promise<UserDto> {
    const user = await this.userRepository.findOne({
      where: { id, ...(options?.where ?? {}) },
      ...(options ?? {}),
    });
    if (!user) {
      ErrorResponseUtil.notFound('User', id);
    }
    return user;
  }

  async deleteUser(id: Uuid | string) {
    await this.userRepository.findOneByOrFail({ id });
    await this.userRepository.softDelete(id);
    return HttpStatus.OK;
  }

  async getAllUsers(options?: FindManyOptions<UserEntity>) {
    return this.userRepository.find(options);
  }

  async updateUserProfile(
    userId: string,
    dto: UpdateUserProfileDto,
    options: { headers: CurrentUserSession['headers'] },
  ) {
    let shouldChangeUsername = !(dto.username == null);

    if (shouldChangeUsername) {
      const user = await this.findOneUser(userId, {
        select: { id: true, username: true },
      });
      shouldChangeUsername = user?.username !== dto.username;
    }

    // Update user profile with our custom auth service
    // Since we're not using Better Auth anymore, we'll update all fields directly
    await this.userRepository.update(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      image: dto.image,
      username: dto.username,
    });

    return await this.findOneUser(userId);
  }

  async getUserDashboardStats(userId: string): Promise<any> {
    // For now, return basic user-specific stats
    // This can be expanded based on what the frontend expects
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      ErrorResponseUtil.notFound('User', userId);
    }

    return {
      profile: {
        completionRate: 85, // Mock data - can be calculated based on filled fields
        verificationStatus: user.kycVerified ? 'verified' : 'pending',
        memberSince: user.createdAt,
      },
      activity: {
        totalBookings: 0, // Will be calculated when booking entity is available
        totalSpent: 0, // Will be calculated from payments
        lastActivity: user.lastLoginAt || user.updatedAt,
      },
      stats: {
        favoriteSpaces: 0,
        reviews: 0,
        referrals: 0,
      },
    };
  }
}
