import { CityEntity } from '@/database/entities/city.entity';
import { NeighborhoodEntity } from '@/database/entities/neighborhood.entity';
import { PartnerLocationEntity } from '@/database/entities/partner-location.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitiesController } from './cities.controller';
import { CitiesService } from './cities.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CityEntity, NeighborhoodEntity, PartnerLocationEntity]),
  ],
  controllers: [CitiesController],
  providers: [CitiesService],
  exports: [CitiesService],
})
export class CitiesModule {}
