import { UserEntity } from '@/auth/entities/user.entity';
import { RefundPolicyEntity } from '@/database/entities/refund-policy.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefundPolicyController } from './refund-policy.controller';
import { RefundPolicyService } from './refund-policy.service';

@Module({
  imports: [TypeOrmModule.forFeature([RefundPolicyEntity, UserEntity])],
  controllers: [RefundPolicyController],
  providers: [RefundPolicyService],
  exports: [RefundPolicyService],
})
export class RefundPolicyModule {}
