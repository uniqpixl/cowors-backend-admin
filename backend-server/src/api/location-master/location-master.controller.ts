import { AuthGuard } from '@/auth/auth.guard';
import { CityEntity } from '@/database/entities/city.entity';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LocationMasterService } from './location-master.service';

@ApiTags('Location Master')
@Controller('locations')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class LocationMasterController {
  constructor(private readonly locationService: LocationMasterService) {}

  @Get('countries')
  @ApiOperation({ summary: 'List supported countries' })
  @ApiResponse({ status: 200, description: 'Countries fetched' })
  async getCountries() {
    return this.locationService.getCountries();
  }

  @Get('countries/:code/states')
  @ApiOperation({ summary: 'List states by country code' })
  @ApiResponse({ status: 200, description: 'States fetched' })
  async getStates(@Param('code') code: string) {
    return this.locationService.getStatesByCountry(code);
  }

  @Get('states/:code/cities')
  @ApiOperation({ summary: 'List cities by state code (GST for IN)' })
  @ApiResponse({ status: 200, description: 'Cities fetched', type: [CityEntity] })
  async getCities(@Param('code') gstCode: string) {
    return this.locationService.getCitiesByStateCode(gstCode);
  }

  @Get('countries/:countryCode/states/:stateCode/cities')
  @ApiOperation({ summary: 'List city names by country/state ISO codes' })
  @ApiResponse({ status: 200, description: 'City names fetched', type: [String] })
  async getCityNames(
    @Param('countryCode') countryCode: string,
    @Param('stateCode') stateCode: string,
  ) {
    return this.locationService.getCityNamesOfState(countryCode, stateCode);
  }
}