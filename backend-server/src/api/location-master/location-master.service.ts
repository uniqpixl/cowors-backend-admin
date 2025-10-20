import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CityEntity } from '@/database/entities/city.entity';
import { Country, State, City } from 'country-state-city';

@Injectable()
export class LocationMasterService {
  constructor(
    @InjectRepository(CityEntity)
    private readonly cityRepo: Repository<CityEntity>,
  ) {}

  async getCountries(): Promise<Array<{ code: string; name: string }>> {
    const countries = Country.getAllCountries();
    return countries.map((c) => ({ code: c.isoCode, name: c.name }));
  }

  async getStatesByCountry(
    countryCode: string,
  ): Promise<Array<{ code: string; name: string }>> {
    const states = State.getStatesOfCountry(countryCode);
    return states
      .map((s) => ({ code: s.isoCode, name: s.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCitiesByStateCode(gstStateCode: string): Promise<CityEntity[]> {
    return this.cityRepo.find({
      where: { gst_state_code: gstStateCode },
      order: { expansion_priority: 'DESC', name: 'ASC' },
    });
  }

  async getCityNamesOfState(
    countryCode: string,
    stateCode: string,
  ): Promise<string[]> {
    const cities = City.getCitiesOfState(countryCode, stateCode);
    return cities.map((c) => c.name).sort((a, b) => a.localeCompare(b));
  }
}