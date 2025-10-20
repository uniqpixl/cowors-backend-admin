import { UserEntity } from '@/auth/entities/user.entity';
import { RolesGuard } from '@/guards/roles.guard';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraudAlert } from './entities/fraud-alert.entity';
import { FraudScore } from './entities/fraud-score.entity';
import { FraudController } from './fraud.controller';
import { FraudDetectionService } from './services/fraud-detection.service';

@Module({
  imports: [TypeOrmModule.forFeature([FraudAlert, FraudScore, UserEntity])],
  controllers: [FraudController],
  providers: [FraudDetectionService, RolesGuard],
  exports: [FraudDetectionService],
})
export class FraudModule {}
