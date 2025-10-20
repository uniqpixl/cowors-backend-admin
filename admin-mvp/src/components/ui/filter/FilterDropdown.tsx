import React, { useState } from 'react';
import Button from '@/components/ui/button/Button';
import { Dropdown } from '@/components/ui/dropdown/Dropdown';

/**
 * Filter option interface
 */
interface FilterOption {
  /** Unique value for the option */
  value: string;
  /** Display label for the option */
  label: string;
}

/**
 * Filter field configuration
 */
interface FilterField {
  /** Unique key for the filter field */
  key: string;
  /** Display label for the filter field */
  label: string;
  /** Available options for this filter */
  options: FilterOption[];
  /** Current selected value */
  value: string;
}

/**
 * Props for the FilterDropdown component
 */
interface FilterDropdownProps {
  /** Array of filter fields */
  filters: FilterField[];
  /** Callback when filter values change */
  onFiltersChange: (filters: Record<string, string>) => void;
  /** Callback to clear all filters */
  onClearFilters: () => void;
  /** Custom button text */
  buttonText?: string;
  /** Additional CSS classes for the button */
  className?: string;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
}

/**
 * Reusable FilterDropdown component with standardized filtering logic
 * 
 * @example
 * ```tsx
 * const filterFields = [
 *   {
 *     key: 'status',
 *     label: 'Status',
 *     options: [
 *       { value: '', label: 'All Status' },
 *       { value: 'active', label: 'Active' },
 *       { value: 'inactive', label: 'Inactive' }
 *     ],
 *     value: filters.status
 *   }
 * ];
 * 
 * <FilterDropdown
 *   filters={filterFields}
 *   onFiltersChange={(newFilters) => setFilters({...filters, ...newFilters})}
 *   onClearFilters={() => setFilters(initialFilters)}
 * />
 * ```
 */
const FilterDropdown: React.FC<FilterDropdownProps> = ({
  filters = [],
  onFiltersChange,
  onClearFilters,
  buttonText = "Filters",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { [key]: value };
    onFiltersChange(newFilters);
  };

  const filterIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
    </svg>
  );

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="dropdown-toggle h-10 px-3 flex items-center justify-center gap-2 whitespace-nowrap"
        startIcon={filterIcon}
      >
        {buttonText}
      </Button>
      
      <div className="absolute top-full left-0 mt-1 z-[9999] min-w-[250px]">
        <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-64 max-h-96 overflow-y-auto">
          <div className="p-4 space-y-3">
            {filters?.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {filter.label}
                </label>
                <select
                  value={filter.value}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            
            <Button
              size="sm"
              onClick={() => {
                onClearFilters();
                setIsOpen(false);
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default FilterDropdown;