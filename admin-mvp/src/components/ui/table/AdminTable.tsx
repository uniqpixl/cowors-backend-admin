"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "./index";
import SmartPagination from "../pagination/SmartPagination";
import LoadingState from "../loading/LoadingState";
import ErrorState from "../error/ErrorState";

// Types for the standardized table
export interface AdminTableColumn<T = any> {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  hidden?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface AdminTableProps<T = any> {
  // Data
  data: T[];
  columns: AdminTableColumn<T>[];
  
  // Loading and error states
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  
  // Selection
  selectable?: boolean;
  selectedItems?: string[];
  onSelectItem?: (id: string) => void;
  onSelectAll?: () => void;
  getRowId?: (row: T) => string;
  
  // Sorting
  sortState?: {
    field: string | null;
    direction: 'asc' | 'desc';
  };
  onSort?: (field: string) => void;
  
  // Pagination
  pagination?: {
    currentPage: number;
    rowsPerPage: number;
    totalPages: number;
  };
  totalRecords?: number;
  onPaginationChange?: (pagination: any) => void;
  rowsPerPageOptions?: number[];
  
  // Styling
  className?: string;
  emptyMessage?: string;
  
  // Row actions
  onRowClick?: (row: T) => void;
}

export function AdminTable<T = any>({
  data,
  columns,
  isLoading = false,
  error,
  onRetry,
  selectable = false,
  selectedItems = [],
  onSelectItem,
  onSelectAll,
  getRowId = (row: any) => row.id,
  sortState,
  onSort,
  pagination,
  totalRecords,
  onPaginationChange,
  rowsPerPageOptions = [5, 10, 25, 50],
  className = "",
  emptyMessage = "No data available",
  onRowClick,
}: AdminTableProps<T>) {
  
  // Calculate select all state
  const selectAll = selectable && data.length > 0 && selectedItems.length === data.length;
  
  // Handle select all
  const handleSelectAll = () => {
    if (onSelectAll) {
      onSelectAll();
    }
  };
  
  // Handle sort
  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };
  
  // Render sort icon
  const renderSortIcon = (field: string) => {
    if (!sortState || sortState.field !== field) return null;
    
    return (
      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
        {sortState.direction === 'asc' ? (
          <path d="M6 0L11 7H1L6 0Z" fill="currentColor"/>
        ) : (
          <path d="M6 8L1 1H11L6 8Z" fill="currentColor"/>
        )}
      </svg>
    );
  };
  
  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }
  
  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }
  
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Table Layout */}
      <div className="hidden md:block max-w-full overflow-x-auto">
        <Table className="min-w-full">
          {/* Table Header */}
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              {/* Selection checkbox column */}
              {selectable && (
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-12"
                >
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </TableCell>
              )}
              
              {/* Column headers */}
              {columns.map((column) => {
                if (column.hidden) return null;
                
                const alignClass = column.align === 'center' ? 'text-center' : 
                                 column.align === 'right' ? 'text-right' : 'text-left';
                
                return (
                  <TableCell
                    key={column.key}
                    isHeader
                    className={`py-3 font-medium text-gray-500 text-sm dark:text-gray-400 ${alignClass} ${column.width || ''} hidden md:table-cell`}
                  >
                    {column.sortable ? (
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                        onClick={() => handleSort(column.key)}
                      >
                        {column.label}
                        {renderSortIcon(column.key)}
                      </div>
                    ) : (
                      <div className={`flex items-${column.align === 'center' ? 'center' : column.align === 'right' ? 'end' : 'start'}`}>
                        {column.label}
                      </div>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                const rowId = getRowId(row);
                const isSelected = selectedItems.includes(rowId);
                
                return (
                  <TableRow 
                    key={rowId} 
                    className={onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" : ""}
                    onClick={() => onRowClick?.(row)}
                  >
                    {/* Selection checkbox */}
                    {selectable && (
                      <TableCell className="py-3 text-center w-12">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              onSelectItem?.(rowId);
                            }}
                            className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                      </TableCell>
                    )}
                    
                    {/* Data columns */}
                    {columns.map((column) => {
                      if (column.hidden) return null;
                      
                      const value = (row as any)[column.key];
                      const alignClass = column.align === 'center' ? 'text-center' : 
                                       column.align === 'right' ? 'text-right' : 'text-left';
                      
                      return (
                        <TableCell 
                          key={column.key}
                          className={`py-3 ${alignClass} ${column.width || ''} hidden md:table-cell`}
                        >
                          {column.render ? column.render(value, row, index) : (
                            <span className="text-gray-800 dark:text-white/90">
                              {value}
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && onPaginationChange && (
          <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-6">
            <SmartPagination
              pagination={pagination}
              totalRecords={totalRecords || 0}
              onPaginationChange={onPaginationChange}
              rowsPerPageOptions={rowsPerPageOptions}
            />
          </div>
        )}
      </div>
    </div>
  );
}