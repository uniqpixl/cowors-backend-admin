import {
  CityEntity,
  LaunchStatus,
  TierClassification,
} from '@/database/entities/city.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, QueryFailedError } from 'typeorm';
import { NeighborhoodEntity } from '@/database/entities/neighborhood.entity';
import { PartnerLocationEntity } from '@/database/entities/partner-location.entity';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

type ListParams = {
  status?: LaunchStatus;
  state?: string;
  tier?: TierClassification;
};

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(CityEntity)
    private readonly cityRepo: Repository<CityEntity>,
    @InjectRepository(NeighborhoodEntity)
    private readonly neighborhoodRepo: Repository<NeighborhoodEntity>,
    @InjectRepository(PartnerLocationEntity)
    private readonly locationRepo: Repository<PartnerLocationEntity>,
  ) {}

  async list(params: ListParams): Promise<CityEntity[]> {
    const where: any = {};
    if (params.status) where.launch_status = params.status;
    if (params.tier) where.tier_classification = params.tier;

    return this.cityRepo.find({
      where: {
        ...where,
        ...(params.state ? { state: ILike(`%${params.state}%`) } : {}),
      },
      order: { expansion_priority: 'DESC', name: 'ASC' },
    });
  }

  async create(dto: CreateCityDto): Promise<CityEntity> {
    const existing = await this.cityRepo.findOne({
      where: { name: dto.name, state: dto.state },
    });
    if (existing) {
      throw new ConflictException(
        `City already exists: ${dto.name}, ${dto.state}`,
      );
    }

    const city = this.cityRepo.create(dto);
    return this.cityRepo.save(city);
  }

  async update(id: string, dto: UpdateCityDto): Promise<CityEntity> {
    const city = await this.cityRepo.findOne({ where: { id } });
    if (!city) {
      throw new NotFoundException('City not found');
    }

    // Check uniqueness if name/state is changing
    const nextName = dto.name ?? city.name;
    const nextState = dto.state ?? city.state;
    if (nextName !== city.name || nextState !== city.state) {
      const duplicate = await this.cityRepo.findOne({
        where: { name: nextName, state: nextState },
      });
      if (duplicate && duplicate.id !== city.id) {
        throw new ConflictException(
          `Another city exists with name/state: ${nextName}, ${nextState}`,
        );
      }
    }

    Object.assign(city, dto);
    return this.cityRepo.save(city);
  }

  async remove(id: string): Promise<void> {
    try {
      // Ensure the city exists first
      const city = await this.cityRepo.findOne({ where: { id } });
      if (!city) {
        throw new NotFoundException('City not found');
      }

      // Rely on ON DELETE CASCADE for related records (areas/partner locations)
      const result = await this.cityRepo.delete({ id });
      if (!result.affected || result.affected === 0) {
        throw new NotFoundException('City not found');
      }
    } catch (err) {
      // Convert database constraint violations into a clear 400 response
      if (err instanceof QueryFailedError) {
        const driverErr: any = (err as any).driverError ?? err;
        // Postgres foreign key violation
        if (driverErr?.code === '23503') {
          throw new BadRequestException(
            'Cannot delete city due to existing references (localities or partner locations)',
          );
        }
      }
      // If it's already a Nest HttpException, rethrow as-is
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      // Fallback: surface as a bad request to avoid 500s for known operational issues
      throw new BadRequestException(
        err instanceof Error
          ? `Delete failed: ${err.message}`
          : 'Delete failed due to unexpected error',
      );
    }
  }
}
