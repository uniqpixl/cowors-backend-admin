"use client";
import React from "react";
import Button from "../button/Button";
import SearchInput from "../search/SearchInput";
import FilterDropdown from "../filter/FilterDropdown";
import { Dropdown } from "../dropdown/Dropdown";
import { DropdownItem } from "../dropdown/DropdownItem";

export interface AdminPageLayoutProps {
  // Page header
  title: string;
  description?: string;
  
  // Search and filters
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    key: string;
    label: string;
    options: Array<{ value: string; label: string }>;
    value: string;
  }>;
  onFiltersChange?: (filters: Record<string, any>) => void;
  onClearFilters?: () => void;
  
  // Bulk actions
  selectedCount?: number;
  bulkActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }>;
  
  // Action buttons
  actionButtons?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'outline' | 'ghost';
  }>;
  
  // Content
  children: React.ReactNode;
  
  // Styling
  className?: string;
}

export function AdminPageLayout({
  title,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onFiltersChange,
  onClearFilters,
  selectedCount = 0,
  bulkActions = [],
  actionButtons = [],
  children,
  className = "",
}: AdminPageLayoutProps) {
  const [showBulkActions, setShowBulkActions] = React.useState(false);
  
  return (
    <div className={`overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>

        {/* Bulk actions - Mobile optimized */}
        {selectedCount > 0 && bulkActions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
            <span className="text-xs text-brand-700 dark:text-brand-300 font-medium">
              {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
            </span>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="dropdown-toggle w-full sm:w-auto"
                startIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                  </svg>
                }
              >
                Bulk Actions
              </Button>
              <Dropdown isOpen={showBulkActions} onClose={() => setShowBulkActions(false)}>
                {bulkActions.map((action, index) => (
                  <DropdownItem 
                    key={index}
                    onClick={() => {
                      action.onClick();
                      setShowBulkActions(false);
                    }}
                    className={action.variant === 'danger' ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20' : ''}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </DropdownItem>
                ))}
              </Dropdown>
            </div>
          </div>
        )}

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          {onSearchChange && (
            <div className="flex-1">
              <SearchInput
                value={searchValue || ''}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {/* Filter button */}
            {filters.length > 0 && onFiltersChange && (
              <FilterDropdown
                filters={filters}
                onFiltersChange={onFiltersChange}
                onClearFilters={onClearFilters}
                buttonText="Filters"
                className="h-10 px-3 whitespace-nowrap"
              />
            )}

            {/* Custom action buttons */}
            {actionButtons.map((button, index) => (
              <Button
                key={index}
                variant={button.variant || 'outline'}
                size="sm"
                onClick={button.onClick}
                className="h-10 px-3 whitespace-nowrap"
                startIcon={button.icon}
              >
                {button.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}