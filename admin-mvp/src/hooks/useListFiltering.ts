import { useMemo } from 'react';

/**
 * Filter function type
 */
export type FilterFunction<T> = (item: T, filters: Record<string, any>) => boolean;

/**
 * Sort function type
 */
export type SortFunction<T> = (a: T, b: T, field: keyof T, direction: 'asc' | 'desc') => number;

/**
 * Search function type
 */
export type SearchFunction<T> = (item: T, searchTerm: string) => boolean;

/**
 * Filtering configuration interface
 */
export interface FilteringConfig<T> {
  /** Raw data to filter */
  data: T[];
  /** Current filters */
  filters: Record<string, any>;
  /** Search term */
  searchTerm?: string;
  /** Sort configuration */
  sort?: {
    field: keyof T | null;
    direction: 'asc' | 'desc';
  };
  /** Custom filter function */
  filterFunction?: FilterFunction<T>;
  /** Custom search function */
  searchFunction?: SearchFunction<T>;
  /** Custom sort function */
  sortFunction?: SortFunction<T>;
}

/**
 * Filtering result interface
 */
export interface FilteringResult<T> {
  /** Filtered and sorted data */
  filteredData: T[];
  /** Number of items after filtering */
  filteredCount: number;
  /** Whether any filters are active */
  hasActiveFilters: boolean;
  /** Whether search is active */
  hasActiveSearch: boolean;
}

/**
 * Default search function that searches in common string fields
 */
const defaultSearchFunction = <T>(item: T, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true;
  
  const searchLower = searchTerm.toLowerCase();
  const itemValues = Object.values(item as any);
  
  return itemValues.some(value => {
    if (typeof value === 'string') {
      return value.toLowerCase().includes(searchLower);
    }
    if (typeof value === 'number') {
      return value.toString().includes(searchTerm);
    }
    return false;
  });
};

/**
 * Default filter function that matches exact values for non-empty filters
 */
const defaultFilterFunction = <T>(item: T, filters: Record<string, any>): boolean => {
  return Object.entries(filters).every(([key, value]) => {
    // Skip empty filters
    if (!value || value === '') return true;
    
    const itemValue = (item as any)[key];
    
    // Handle different comparison types
    if (typeof itemValue === 'string' && typeof value === 'string') {
      return itemValue.toLowerCase().includes(value.toLowerCase());
    }
    
    return itemValue === value;
  });
};

/**
 * Default sort function that handles common data types
 */
const defaultSortFunction = <T>(
  a: T, 
  b: T, 
  field: keyof T, 
  direction: 'asc' | 'desc'
): number => {
  const aValue = a[field];
  const bValue = b[field];
  
  // Handle null/undefined values
  if (aValue == null && bValue == null) return 0;
  if (aValue == null) return direction === 'asc' ? -1 : 1;
  if (bValue == null) return direction === 'asc' ? 1 : -1;
  
  // Handle different data types
  let comparison = 0;
  
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    comparison = aValue.localeCompare(bValue);
  } else if (typeof aValue === 'number' && typeof bValue === 'number') {
    comparison = aValue - bValue;
  } else if (aValue instanceof Date && bValue instanceof Date) {
    comparison = aValue.getTime() - bValue.getTime();
  } else {
    // Fallback to string comparison
    comparison = String(aValue).localeCompare(String(bValue));
  }
  
  return direction === 'asc' ? comparison : -comparison;
};

/**
 * Custom hook for filtering, searching, and sorting list data
 * 
 * @example
 * ```tsx
 * const { filteredData, filteredCount, hasActiveFilters } = useListFiltering({
 *   data: users,
 *   filters: { status: 'active', role: '' },
 *   searchTerm: 'john',
 *   sort: { field: 'name', direction: 'asc' },
 *   searchFunction: (user, term) => 
 *     user.name.toLowerCase().includes(term.toLowerCase()) ||
 *     user.email.toLowerCase().includes(term.toLowerCase())
 * });
 * ```
 */
export const useListFiltering = <T>(config: FilteringConfig<T>): FilteringResult<T> => {
  const {
    data,
    filters,
    searchTerm = '',
    sort,
    filterFunction = defaultFilterFunction,
    searchFunction = defaultSearchFunction,
    sortFunction = defaultSortFunction
  } = config;

  return useMemo(() => {
    let result = [...data];
    
    // Apply filters
    const hasActiveFilters = filters && Object.values(filters).some(value => value && value !== '');
    if (hasActiveFilters && filters) {
      result = result.filter(item => filterFunction(item, filters));
    }
    
    // Apply search
    const hasActiveSearch = searchTerm.trim() !== '';
    if (hasActiveSearch) {
      result = result.filter(item => searchFunction(item, searchTerm));
    }
    
    // Apply sorting
    if (sort?.field) {
      result.sort((a, b) => sortFunction(a, b, sort.field!, sort.direction));
    }
    
    return {
      filteredData: result,
      filteredCount: result.length,
      hasActiveFilters,
      hasActiveSearch
    };
  }, [data, filters, searchTerm, sort, filterFunction, searchFunction, sortFunction]);
};

/**
 * Utility function to create a search function for specific fields
 */
export const createFieldSearchFunction = <T>(fields: (keyof T)[]): SearchFunction<T> => {
  return (item: T, searchTerm: string): boolean => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    return fields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchLower);
      }
      if (typeof value === 'number') {
        return value.toString().includes(searchTerm);
      }
      return false;
    });
  };
};

/**
 * Utility function to create a filter function for specific field mappings
 */
export const createFieldFilterFunction = <T>(
  fieldMappings: Record<string, (itemValue: any, filterValue: any) => boolean>
): FilterFunction<T> => {
  return (item: T, filters: Record<string, any>): boolean => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value || value === '') return true;
      
      const itemValue = (item as any)[key];
      const customComparison = fieldMappings[key];
      
      if (customComparison) {
        return customComparison(itemValue, value);
      }
      
      // Default comparison
      return itemValue === value;
    });
  };
};