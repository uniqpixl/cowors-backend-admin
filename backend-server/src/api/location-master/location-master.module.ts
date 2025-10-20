import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CityEntity } from '@/database/entities/city.entity';
import { LocationMasterController } from './location-master.controller';
import { LocationMasterService } from './location-master.service';

@Module({
  imports: [TypeOrmModule.forFeature([CityEntity])],
  controllers: [LocationMasterController],
  providers: [LocationMasterService],
})
export class LocationMasterModule {}