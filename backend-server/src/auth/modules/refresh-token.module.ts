import { UserEntity } from '@/auth/entities/user.entity';
import { RefreshTokenEntity } from '@/database/entities/refresh-token.entity';
import { CacheModule } from '@/shared/cache/cache.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenController } from '../controllers/refresh-token.controller';
import { RefreshTokenService } from '../services/refresh-token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshTokenEntity, UserEntity]),
    CacheModule,
  ],
  controllers: [RefreshTokenController],
  providers: [RefreshTokenService],
  exports: [RefreshTokenService],
})
export class RefreshTokenModule {}
