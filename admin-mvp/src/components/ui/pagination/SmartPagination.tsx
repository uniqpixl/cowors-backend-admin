import React from 'react';

/**
 * Pagination state interface
 */
interface PaginationState {
  /** Current page number (1-based) */
  currentPage: number;
  /** Number of rows per page */
  rowsPerPage: number;
}

/**
 * Props for the SmartPagination component
 */
interface SmartPaginationProps {
  /** Current pagination state */
  pagination: PaginationState;
  /** Total number of records */
  totalRecords: number;
  /** Callback when pagination changes */
  onPaginationChange: (pagination: PaginationState) => void;
  /** Available rows per page options */
  rowsPerPageOptions?: number[];
  /** Whether to show rows per page selector */
  showRowsPerPage?: boolean;
  /** Whether to show page info */
  showPageInfo?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether pagination is disabled */
  disabled?: boolean;
}

/**
 * Smart pagination component with rows per page selection and page navigation
 * 
 * @example
 * ```tsx
 * <SmartPagination
 *   pagination={{ currentPage: 1, rowsPerPage: 10 }}
 *   totalRecords={100}
 *   onPaginationChange={setPagination}
 *   rowsPerPageOptions={[5, 10, 25, 50]}
 * />
 * ```
 */
const SmartPagination: React.FC<SmartPaginationProps> = ({
  pagination = { currentPage: 1, rowsPerPage: 10 },
  totalRecords,
  onPaginationChange,
  rowsPerPageOptions = [5, 10, 25, 50],
  showRowsPerPage = true,
  showPageInfo = true,
  className = "",
  disabled = false
}) => {
  const { currentPage, rowsPerPage } = pagination;
  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  
  // Calculate displayed records range
  const startRecord = (currentPage - 1) * rowsPerPage + 1;
  const endRecord = Math.min(currentPage * rowsPerPage, totalRecords);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !disabled) {
      onPaginationChange({
        ...pagination,
        currentPage: newPage
      });
    }
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    if (!disabled) {
      onPaginationChange({
        currentPage: 1, // Reset to first page when changing rows per page
        rowsPerPage: newRowsPerPage
      });
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalRecords === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Rows per page selector */}
      {showRowsPerPage && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
            disabled={disabled}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Page info */}
      {showPageInfo && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {startRecord} to {endRecord} of {totalRecords} results
        </div>
      )}

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          className="flex items-center justify-center h-10 px-3 border border-gray-300 bg-white rounded-lg text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] text-sm"
        >
          Previous
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(page as number)}
                  disabled={disabled}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                    currentPage === page
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-700 dark:text-gray-400 hover:bg-brand-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          className="flex items-center justify-center h-10 px-3 border border-gray-300 bg-white rounded-lg text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] text-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SmartPagination;