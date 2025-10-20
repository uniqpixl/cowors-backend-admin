import { GlobalConfig } from '@/config/config.type';
import { GetUser } from '@/decorators/auth/get-user.decorator';
import { CacheService } from '@/shared/cache/cache.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import { Request } from 'express';
import {
  CreateTokenPairDto,
  RefreshTokenDto,
  RevokeTokenDto,
  TokenResponseDto,
  TokenStatsDto,
} from '../dto/refresh-token.dto';
import { UserEntity } from '../entities/user.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RefreshTokenService } from '../services/refresh-token.service';

@ApiTags('Authentication')
@Controller('auth/refresh')
export class RefreshTokenController {
  private readonly accessTokenTTL: number;
  private readonly refreshTokenTTL: number;

  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService<GlobalConfig>,
  ) {
    const authConfig = this.configService.getOrThrow('auth', { infer: true });
    this.accessTokenTTL = authConfig.accessTokenTTL || 60 * 60; // 1 hour
    this.refreshTokenTTL = authConfig.refreshTokenTTL || 7 * 24 * 60 * 60; // 7 days
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate refresh token',
    description:
      'Exchange a valid refresh token for a new access token and refresh token pair',
  })
  @ApiResponse({
    status: 200,
    description: 'Token successfully rotated',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async rotateToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ): Promise<TokenResponseDto> {
    const userAgent = req.get('User-Agent');

    // Generate new session token (simulating Better Auth session)
    const newSessionToken = this.generateSessionToken();

    // Rotate the refresh token
    const newRefreshToken = await this.refreshTokenService.rotateRefreshToken(
      refreshTokenDto.refreshToken,
      newSessionToken,
      ipAddress,
      userAgent,
    );

    // Generate new access token (store in cache like Better Auth does)
    const newAccessToken = this.generateAccessToken();
    await this.cacheService.set(
      { key: 'AccessToken', args: [newAccessToken] },
      {
        sessionToken: newSessionToken,
        createdAt: new Date().toISOString(),
      },
      { ttl: this.accessTokenTTL * 1000 },
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.accessTokenTTL,
      refreshExpiresIn: this.refreshTokenTTL,
      tokenType: 'Bearer',
    };
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new token pair',
    description:
      'Create a new access token and refresh token pair for authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'Token pair successfully created',
    type: TokenResponseDto,
  })
  async createTokenPair(
    @Body() createTokenDto: CreateTokenPairDto,
    @GetUser() user: UserEntity,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ): Promise<TokenResponseDto> {
    const userAgent = req.get('User-Agent');

    // Generate refresh token
    const refreshToken = await this.refreshTokenService.generateRefreshToken({
      userId: user.id,
      sessionToken: createTokenDto.sessionToken,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Generate access token
    const accessToken = this.generateAccessToken();
    await this.cacheService.set(
      { key: 'AccessToken', args: [accessToken] },
      {
        sessionToken: createTokenDto.sessionToken,
        userId: user.id,
        createdAt: new Date().toISOString(),
      },
      { ttl: this.accessTokenTTL * 1000 },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenTTL,
      refreshExpiresIn: this.refreshTokenTTL,
      tokenType: 'Bearer',
    };
  }

  @Delete('revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revoke refresh token',
    description: 'Revoke a specific refresh token or all tokens for the user',
  })
  @ApiResponse({
    status: 204,
    description: 'Token(s) successfully revoked',
  })
  async revokeToken(@Body() revokeTokenDto: RevokeTokenDto): Promise<void> {
    if (revokeTokenDto.revokeAll) {
      // Get user ID from token first
      const tokenData = await this.refreshTokenService.validateRefreshToken(
        revokeTokenDto.refreshToken,
      );
      if (tokenData) {
        await this.refreshTokenService.revokeAllUserTokens(tokenData.userId);
      }
    } else {
      await this.refreshTokenService.revokeRefreshToken(
        revokeTokenDto.refreshToken,
      );
    }
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get token statistics',
    description: 'Get refresh token statistics for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Token statistics retrieved successfully',
    type: TokenStatsDto,
  })
  async getTokenStats(@GetUser() user: UserEntity): Promise<TokenStatsDto> {
    return await this.refreshTokenService.getUserTokenStats(user.id);
  }

  @Delete('cleanup')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cleanup expired tokens',
    description: 'Remove expired refresh tokens from the database (admin only)',
  })
  @ApiResponse({
    status: 204,
    description: 'Expired tokens cleaned up successfully',
  })
  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenService.cleanupExpiredTokens();
  }

  /**
   * Generate a session token compatible with Better Auth format
   */
  private generateSessionToken(): string {
    return randomBytes(16).toString('base64url');
  }

  /**
   * Generate an access token
   */
  private generateAccessToken(): string {
    return randomBytes(32).toString('base64url');
  }
}
