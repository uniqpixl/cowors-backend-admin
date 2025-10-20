import { useState, useCallback, useMemo } from 'react';

/**
 * Generic filter state interface
 */
export interface FilterState {
  search: string;
  [key: string]: string;
}

/**
 * Pagination state interface
 */
export interface PaginationState {
  currentPage: number;
  rowsPerPage: number;
}

/**
 * Sort state interface
 */
export interface SortState<T = any> {
  field: keyof T | null;
  direction: 'asc' | 'desc';
}

/**
 * List state interface
 */
export interface ListState<T = any> {
  selectedItems: string[];
  filters: FilterState;
  pagination: PaginationState;
  sortState: SortState<T>;
  searchTerm: string;
}

/**
 * List actions interface
 */
export interface ListActions<T = any> {
  // Selection actions
  selectItem: (id: string) => void;
  selectAllItems: (itemIds: string[]) => void;
  clearSelection: () => void;
  toggleSelectAll: (itemIds: string[]) => void;
  
  // Filter actions
  updateFilters: (newFilters: Partial<FilterState>) => void;
  clearFilters: () => void;
  setSearchTerm: (term: string) => void;
  
  // Pagination actions
  updatePagination: (newPagination: Partial<PaginationState>) => void;
  goToPage: (page: number) => void;
  changeRowsPerPage: (rowsPerPage: number) => void;
  
  // Sort actions
  updateSort: (field: keyof T) => void;
  clearSort: () => void;
  
  // Reset actions
  resetState: () => void;
}

/**
 * Configuration for useListState hook
 */
export interface UseListStateConfig<T = any> {
  /** Initial filter state */
  initialFilters?: Partial<FilterState>;
  /** Initial pagination state */
  initialPagination?: Partial<PaginationState>;
  /** Initial sort state */
  initialSort?: Partial<SortState<T>>;
  /** Default rows per page */
  defaultRowsPerPage?: number;
}

/**
 * Custom hook for managing list component state
 * 
 * @example
 * ```tsx
 * const { state, actions } = useListState<User>({
 *   initialFilters: { search: '', status: '' },
 *   defaultRowsPerPage: 10
 * });
 * 
 * // Use in component
 * <SearchInput
 *   value={state.searchTerm}
 *   onChange={actions.setSearchTerm}
 * />
 * ```
 */
export const useListState = <T = any>(config: UseListStateConfig<T> = {}) => {
  const {
    initialFilters = {},
    initialPagination = {},
    initialSort = {},
    defaultRowsPerPage = 10
  } = config;

  // Default states - memoized to prevent infinite re-renders
  const defaultFilters: FilterState = useMemo(() => ({
    search: '',
    ...initialFilters
  }), [initialFilters]);

  const defaultPagination: PaginationState = useMemo(() => ({
    currentPage: 1,
    rowsPerPage: defaultRowsPerPage,
    ...initialPagination
  }), [defaultRowsPerPage, initialPagination]);

  const defaultSortState: SortState<T> = useMemo(() => ({
    field: null,
    direction: 'asc',
    ...initialSort
  }), [initialSort]);

  // State management
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [pagination, setPagination] = useState<PaginationState>(defaultPagination);
  const [sortState, setSortState] = useState<SortState<T>>(defaultSortState);
  const [searchTerm, setSearchTermState] = useState<string>(defaultFilters.search);

  // Selection actions
  const selectItem = useCallback((id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);

  const selectAllItems = useCallback((itemIds: string[]) => {
    setSelectedItems(itemIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const toggleSelectAll = useCallback((itemIds: string[]) => {
    setSelectedItems(prev => 
      prev.length === itemIds.length ? [] : itemIds
    );
  }, []);

  // Filter actions
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => {
      const updated = { ...prev };
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined) {
          updated[key] = value;
        }
      });
      return updated;
    });
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchTermState(defaultFilters.search);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [defaultFilters]);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
    updateFilters({ search: term });
  }, [updateFilters]);

  // Pagination actions
  const updatePagination = useCallback((newPagination: Partial<PaginationState>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const changeRowsPerPage = useCallback((rowsPerPage: number) => {
    setPagination({ currentPage: 1, rowsPerPage });
  }, []);

  // Sort actions
  const updateSort = useCallback((field: keyof T) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const clearSort = useCallback(() => {
    setSortState(defaultSortState);
  }, [defaultSortState]);

  // Reset actions
  const resetState = useCallback(() => {
    setSelectedItems([]);
    setFilters(defaultFilters);
    setPagination(defaultPagination);
    setSortState(defaultSortState);
    setSearchTermState(defaultFilters.search);
  }, [defaultFilters, defaultPagination, defaultSortState]);

  const state: ListState<T> = {
    selectedItems,
    filters,
    pagination,
    sortState,
    searchTerm
  };

  const actions: ListActions<T> = useMemo(() => ({
    selectItem,
    selectAllItems,
    clearSelection,
    toggleSelectAll,
    updateFilters,
    clearFilters,
    setSearchTerm,
    updatePagination,
    goToPage,
    changeRowsPerPage,
    updateSort,
    clearSort,
    resetState
  }), [
    selectItem,
    selectAllItems,
    clearSelection,
    toggleSelectAll,
    updateFilters,
    clearFilters,
    setSearchTerm,
    updatePagination,
    goToPage,
    changeRowsPerPage,
    updateSort,
    clearSort,
    resetState
  ]);

  return { state, actions };
};