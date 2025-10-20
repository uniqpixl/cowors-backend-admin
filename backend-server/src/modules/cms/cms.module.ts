import { UserEntity } from '@/auth/entities/user.entity';
import { ContentPageEntity } from '@/database/entities/content-page.entity';
import { MediaEntity } from '@/database/entities/media.entity';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as multer from 'multer';
import { CmsController } from './cms.controller';
import { ContentPageService } from './content-page.service';
import { MediaService } from './media.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentPageEntity, MediaEntity, UserEntity]),
    MulterModule.register({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  ],
  controllers: [CmsController],
  providers: [ContentPageService, MediaService],
  exports: [ContentPageService, MediaService],
})
export class CmsModule {}
