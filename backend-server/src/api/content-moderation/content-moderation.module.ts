import { UserEntity } from '@/auth/entities/user.entity';
import { RolesGuard } from '@/guards/roles.guard';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentModerationController } from './content-moderation.controller';
import { ContentModerationService } from './content-moderation.service';
import { ContentModerationEntity } from './entities/content-moderation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContentModerationEntity, UserEntity])],
  controllers: [ContentModerationController],
  providers: [ContentModerationService, RolesGuard],
  exports: [ContentModerationService],
})
export class ContentModerationModule {}
