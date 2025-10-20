import { apiRequest } from './client';

// Location Master API
export type LocationCountry = { code: string; name: string };
export type LocationState = { code: string; name: string };

export const getCountries = async (): Promise<LocationCountry[]> => {
  return apiRequest<LocationCountry[]>({
    url: '/api/v1/locations/countries',
    method: 'GET',
  });
};

export const getStatesByCountry = async (
  countryCode: string,
): Promise<LocationState[]> => {
  return apiRequest<LocationState[]>({
    url: `/api/v1/locations/countries/${countryCode}/states`,
    method: 'GET',
  });
};

export const getCitiesByCountryState = async (
  countryCode: string,
  stateCode: string,
): Promise<string[]> => {
  return apiRequest<string[]>({
    url: `/api/v1/locations/countries/${countryCode}/states/${stateCode}/cities`,
    method: 'GET',
  });
};

export type CityEntity = {
  id: string;
  name: string;
  state: string;
  gst_state_code: string;
  // Backend enums are lowercase strings
  launch_status?: 'active' | 'planning' | 'paused' | 'launching';
  tier_classification?: 'tier_1' | 'tier_2' | 'tier_3';
  expansion_priority?: number;
};

export const getCitiesByStateCode = async (
  gstStateCode: string,
): Promise<CityEntity[]> => {
  return apiRequest<CityEntity[]>({
    url: `/api/v1/locations/states/${gstStateCode}/cities`,
    method: 'GET',
  });
};

// Serviceable Cities (CRUD)
export type CreateCityDto = {
  name: string;
  state: string;
  gst_state_code: string;
  // Align with backend DTO validation (class-validator IsEnum)
  launch_status?: 'active' | 'planning' | 'paused' | 'launching';
  tier_classification?: 'tier_1' | 'tier_2' | 'tier_3';
  expansion_priority?: number;
};

export type UpdateCityDto = Partial<CreateCityDto>;

export const listServiceableCities = async (params?: {
  status?: 'active' | 'planning' | 'paused' | 'launching';
  state?: string;
  tier?: 'tier_1' | 'tier_2' | 'tier_3';
}) => {
  return apiRequest<CityEntity[]>({
    url: '/api/v1/serviceable-cities',
    method: 'GET',
    params,
  });
};

export const createServiceableCity = async (data: CreateCityDto) => {
  // Normalize any accidental uppercase values to backend enum format
  const payload: CreateCityDto = {
    ...data,
    launch_status: data.launch_status ? (data.launch_status.toLowerCase() as CreateCityDto['launch_status']) : undefined,
    tier_classification: data.tier_classification ? (data.tier_classification.toLowerCase() as CreateCityDto['tier_classification']) : undefined,
  };
  return apiRequest<CityEntity>({
    url: '/api/v1/serviceable-cities',
    method: 'POST',
    data: payload,
  });
};

export const updateServiceableCity = async (id: string, data: UpdateCityDto) => {
  const payload: UpdateCityDto = {
    ...data,
    launch_status: data.launch_status ? (data.launch_status.toLowerCase() as CreateCityDto['launch_status']) : undefined,
    tier_classification: data.tier_classification ? (data.tier_classification.toLowerCase() as CreateCityDto['tier_classification']) : undefined,
  };
  return apiRequest<CityEntity>({
    url: `/api/v1/serviceable-cities/${id}`,
    method: 'PATCH',
    data: payload,
  });
};

export const deleteServiceableCity = async (id: string) => {
  return apiRequest<void>({
    url: `/api/v1/serviceable-cities/${id}`,
    method: 'DELETE',
  });
};