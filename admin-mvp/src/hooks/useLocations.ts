import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listServiceableCities,
  createServiceableCity,
  updateServiceableCity,
  deleteServiceableCity,
  getCountries,
  getStatesByCountry,
  getCitiesByCountryState,
  type CityEntity,
  type CreateCityDto,
  type UpdateCityDto,
  type LocationCountry,
  type LocationState,
} from '@/lib/api/locationApi';
import { getGstCodeFromStateName } from '@/lib/gst';

// Query keys
const QUERY_KEYS = {
  countries: ['locations', 'countries'] as const,
  states: (countryCode: string) => ['locations', 'states', countryCode] as const,
  citiesByState: (countryCode: string, stateCode: string) => ['locations', 'cities', countryCode, stateCode] as const,
  serviceableCities: (params?: Record<string, unknown>) => ['serviceable-cities', params] as const,
};

export const useCountries = () => {
  return useQuery<LocationCountry[], Error>({
    queryKey: QUERY_KEYS.countries,
    queryFn: () => getCountries(),
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });
};

export const useStates = (countryCode: string) => {
  return useQuery<LocationState[], Error>({
    queryKey: QUERY_KEYS.states(countryCode),
    queryFn: () => getStatesByCountry(countryCode),
    staleTime: 5 * 60 * 1000,
    enabled: !!countryCode,
  });
};

export const useCitiesByState = (countryCode: string, stateCode: string) => {
  return useQuery<string[], Error>({
    queryKey: QUERY_KEYS.citiesByState(countryCode, stateCode),
    queryFn: async () => getCitiesByCountryState(countryCode, stateCode),
    staleTime: 5 * 60 * 1000,
    enabled: !!countryCode && !!stateCode,
  });
};

export const useServiceableCities = (params?: {
  status?: 'ACTIVE' | 'PLANNING' | 'PAUSED' | 'INACTIVE';
  state?: string;
  tier?: 'TIER_1' | 'TIER_2' | 'TIER_3';
}) => {
  return useQuery<CityEntity[], Error>({
    queryKey: QUERY_KEYS.serviceableCities(params),
    queryFn: () => listServiceableCities(params),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    enabled: true,
  });
};

export const useCreateServiceableCity = () => {
  const queryClient = useQueryClient();
  return useMutation<CityEntity, Error, CreateCityDto>({
    mutationFn: (data) => createServiceableCity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceable-cities'] });
    },
  });
};

export const useUpdateServiceableCity = () => {
  const queryClient = useQueryClient();
  return useMutation<CityEntity, Error, { id: string; data: UpdateCityDto }>({
    mutationFn: ({ id, data }) => updateServiceableCity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceable-cities'] });
    },
  });
};

export const useDeleteServiceableCity = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => deleteServiceableCity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceable-cities'] });
    },
  });
};

// Helper for GST code lookup using CSC state code or name
export const useGstCodeForState = (countryCode: string, stateCodeOrName: string) => {
  return useQuery<string | null, Error>({
    queryKey: ['gst-code', countryCode, stateCodeOrName],
    queryFn: () => Promise.resolve(getGstCodeFromStateName(countryCode, stateCodeOrName)),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!countryCode && !!stateCodeOrName,
  });
};