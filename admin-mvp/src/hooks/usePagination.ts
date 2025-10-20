import { useMemo } from 'react';

/**
 * Pagination configuration interface
 */
export interface PaginationConfig {
  /** Current page number (1-based) */
  currentPage: number;
  /** Number of items per page */
  rowsPerPage: number;
  /** Total number of items */
  totalItems: number;
}

/**
 * Pagination result interface
 */
export interface PaginationResult<T> {
  /** Paginated data for current page */
  paginatedData: T[];
  /** Total number of pages */
  totalPages: number;
  /** Index of first item on current page (0-based) */
  startIndex: number;
  /** Index of last item on current page (0-based) */
  endIndex: number;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Information about current page */
  pageInfo: {
    /** Current page number */
    currentPage: number;
    /** Total pages */
    totalPages: number;
    /** Total items */
    totalItems: number;
    /** Items per page */
    itemsPerPage: number;
    /** First item number on current page (1-based) */
    firstItem: number;
    /** Last item number on current page (1-based) */
    lastItem: number;
  };
}

/**
 * Custom hook for handling pagination logic
 * 
 * @example
 * ```tsx
 * const { paginatedData, totalPages, pageInfo } = usePagination({
 *   data: users,
 *   currentPage: pagination.currentPage,
 *   rowsPerPage: pagination.rowsPerPage,
 *   totalItems: users.length
 * });
 * 
 * // Use with SmartPagination component
 * <SmartPagination
 *   pagination={{ currentPage, rowsPerPage }}
 *   totalRecords={pageInfo.totalItems}
 *   onPaginationChange={setPagination}
 * />
 * ```
 */
export const usePagination = <T>(
  data: T[],
  config: PaginationConfig
): PaginationResult<T> => {
  const { currentPage, rowsPerPage, totalItems } = config;

  return useMemo(() => {
    // Calculate pagination values
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage - 1, totalItems - 1);
    
    // Get paginated data
    const paginatedData = data.slice(startIndex, startIndex + rowsPerPage);
    
    // Calculate page info
    const firstItem = totalItems > 0 ? startIndex + 1 : 0;
    const lastItem = totalItems > 0 ? Math.min(startIndex + rowsPerPage, totalItems) : 0;
    
    return {
      paginatedData,
      totalPages,
      startIndex,
      endIndex,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
      pageInfo: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: rowsPerPage,
        firstItem,
        lastItem
      }
    };
  }, [data, currentPage, rowsPerPage, totalItems]);
};

/**
 * Hook for pagination with server-side data
 * When data is fetched from server with pagination
 */
export const useServerPagination = (
  config: PaginationConfig
): Omit<PaginationResult<never>, 'paginatedData'> => {
  const { currentPage, rowsPerPage, totalItems } = config;

  return useMemo(() => {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage - 1, totalItems - 1);
    
    const firstItem = totalItems > 0 ? startIndex + 1 : 0;
    const lastItem = totalItems > 0 ? Math.min(startIndex + rowsPerPage, totalItems) : 0;
    
    return {
      totalPages,
      startIndex,
      endIndex,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
      pageInfo: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: rowsPerPage,
        firstItem,
        lastItem
      }
    };
  }, [currentPage, rowsPerPage, totalItems]);
};