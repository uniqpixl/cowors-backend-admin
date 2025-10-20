import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import { Search, Filter, X } from 'lucide-react'
import React from 'react'

interface FilterState {
  search: string
  status: string
  dateRange: string
}

interface InvoiceFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  statusOptions?: { value: string; label: string }[]
  additionalFilters?: React.ReactNode
}

const defaultStatusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'draft', label: 'Draft' }
]

const dateRangeOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' }
]

export function InvoiceFilters({ 
  filters, 
  onFiltersChange, 
  statusOptions = defaultStatusOptions,
  additionalFilters 
}: InvoiceFiltersProps) {
  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.dateRange !== 'all'

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      dateRange: 'all'
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search invoices..."
          defaultValue={filters.search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Status Filter */}
      {/* Note: The custom Select component doesn't support all the features we need, so we'll use a simple select for now */}
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <select
          value={filters.status}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onFiltersChange({ ...filters, status: e.target.value })}
          className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-10 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range Filter */}
      <div className="relative">
        <select
          value={filters.dateRange}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onFiltersChange({ ...filters, dateRange: e.target.value })}
          className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        >
          {dateRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Additional Filters */}
      {additionalFilters}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}