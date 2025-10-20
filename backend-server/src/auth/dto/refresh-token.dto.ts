import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token to be rotated',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'New access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'New refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Refresh token expiration time in seconds',
    example: 604800,
  })
  refreshExpiresIn: number;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string;
}

export class RevokeTokenDto {
  @ApiProperty({
    description: 'Refresh token to be revoked',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;

  @ApiProperty({
    description: 'Revoke all tokens for the user',
    example: false,
    required: false,
  })
  @IsOptional()
  revokeAll?: boolean;
}

export class TokenStatsDto {
  @ApiProperty({
    description: 'Number of active refresh tokens',
    example: 3,
  })
  activeTokens: number;

  @ApiProperty({
    description: 'Total number of refresh tokens ever issued',
    example: 15,
  })
  totalTokens: number;

  @ApiProperty({
    description: 'Last time a token was used',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  lastUsed: Date | null;
}

export class CreateTokenPairDto {
  @ApiProperty({
    description: 'User ID for token generation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Session token to link with refresh token',
    example: 'session_abc123',
  })
  @IsNotEmpty()
  @IsString()
  sessionToken: string;

  @ApiProperty({
    description: 'Client IP address',
    example: '192.168.1.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({
    description: 'Client user agent',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    required: false,
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
