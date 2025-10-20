'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2, Eye, Trash2, MoreVertical } from 'lucide-react';

// Reusable components
import { SearchInput, FilterDropdown, SmartPagination, LoadingState, ErrorState, Button, Badge, Avatar, Table, TableHeader, TableBody, TableRow, TableCell, Modal, Dropdown } from '@/components/ui';

// Hooks
import { useListState } from '@/hooks/useListState';
import { useSpaces, useActivateSpace, useDeactivateSpace, useSetSpaceMaintenance } from '@/hooks/useSpaces';
import { useModal } from '@/hooks/useModal';

// Utils
import { formatSpaceId, getIdType, formatDate } from '@/utils/formatters';

// Types
import { Space } from '@/lib/api/types';

interface SpaceListContentProps {
  className?: string;
}

type DeleteType = 'soft' | 'permanent' | 'suspend' | 'ban' | 'lock';

// Helper functions
const getSpaceTypeIcon = (type?: string) => {
  const iconClass = "w-5 h-5 text-gray-600 dark:text-gray-400";
  
  switch (type?.toLowerCase()) {
    case 'meeting room':
    case 'meeting':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="12" rx="2" ry="2"/>
          <line x1="7" y1="8" x2="17" y2="8"/>
          <line x1="7" y1="12" x2="17" y2="12"/>
        </svg>
      );
    case 'desk':
    case 'hot desk':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
          <circle cx="12" cy="5" r="2"/>
          <path d="M12 7v4"/>
        </svg>
      );
    case 'office':
    case 'private office':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      );
    case 'event space':
    case 'event':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      );
    default:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="M9 9h6v6H9z"/>
        </svg>
      );
  }
};

export const SpaceListContent: React.FC<SpaceListContentProps> = ({ className = "" }) => {
  // Use centralized list state management first
  const { state, actions } = useListState<Space>({
    initialFilters: {
      search: "",
      status: "",
    },
    initialSort: { field: 'name', direction: 'asc' }
  });

  const {
    selectedItems: selectedSpaces,
    filters,
    pagination,
    sortState
  } = state;

  const {
    selectItem: handleSelectSpace,
    selectAllItems: handleSelectAll,
    updateFilters,
    updatePagination,
    clearFilters
  } = actions;

  // API hooks - now we can use the state variables
  const { data: spacesData, isLoading, error, refetch } = useSpaces({
    page: pagination.currentPage,
    limit: pagination.rowsPerPage,
    search: filters.search,
    status: filters.status === 'all' ? undefined : filters.status as 'Active' | 'Inactive' | 'Maintenance',
    spaceType: filters.spaceType === 'all' ? undefined : filters.spaceType,
    sortBy: sortState.field as 'name' | 'createdAt' | 'pricePerHour' | 'capacity',
    sortOrder: sortState.direction?.toUpperCase() as 'ASC' | 'DESC'
  });
  const activateSpace = useActivateSpace();
  const deactivateSpace = useDeactivateSpace();
  const setSpaceMaintenance = useSetSpaceMaintenance();

  // Extract spaces array from paginated response
  const spaces = spacesData?.data || [];
  const totalRecords = spacesData?.total || 0;

  // Use spaces directly from API response (already filtered and paginated)
  const currentSpaces = spaces;
  const totalPages = Math.ceil(totalRecords / pagination.rowsPerPage);

  // Modal state
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  
  // Delete state
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [deleteType, setDeleteType] = useState<DeleteType>('soft');
  
  // Mobile card expansion
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  
  // Bulk actions dropdown state
  const [isBulkDropdownOpen, setIsBulkDropdownOpen] = useState(false);

  // Filter options for the filter dropdown
  const filterFields = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' },
        { value: 'Maintenance', label: 'Maintenance' }
      ],
      value: filters.status || 'all'
    },
    {
      key: 'spaceType',
      label: 'Space Type',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'cafe', label: 'Cafe' },
        { value: 'coworking', label: 'Coworking' },
        { value: 'office', label: 'Office' },
        { value: 'meeting', label: 'Meeting Room' }
      ],
      value: filters.spaceType || 'all'
    }
  ];

  // Handlers
  const handleRefresh = () => {
    refetch();
  };

  const handleDeleteClick = (space: Space) => {
    setSpaceToDelete(space);
    setDeleteType('soft');
    openDeleteModal();
  };

  const handleCancelDelete = () => {
    setSpaceToDelete(null);
    closeDeleteModal();
  };

  const handleConfirmDelete = async () => {
    if (!spaceToDelete) return;

    try {
      switch (deleteType) {
        case 'soft':
          await deactivateSpace.mutateAsync(spaceToDelete.id);
          break;
        case 'suspend':
        case 'ban':
        case 'lock':
          await setSpaceMaintenance.mutateAsync(spaceToDelete.id);
          break;
        case 'permanent':
          console.log('Permanent delete:', spaceToDelete.id);
          break;
      }
      
      handleCancelDelete();
      refetch();
    } catch (error) {
      console.error('Delete operation failed:', error);
    }
  };

  const toggleCardExpansion = (spaceId: string) => {
    setExpandedCards(prev => 
      prev.includes(spaceId) 
        ? prev.filter(id => id !== spaceId)
        : [...prev, spaceId]
    );
  };

  // Bulk actions
  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} for spaces:`, selectedSpaces);
  };

  // Loading and error states
  if (isLoading) {
    return <LoadingState message="Loading spaces..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load spaces" error={error.message} onRetry={handleRefresh} />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Space Management
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Manage and monitor all workspace spaces
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedSpaces.length > 0 && (
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsBulkDropdownOpen(!isBulkDropdownOpen)}
                  className="dropdown-toggle"
                >
                  Bulk Actions ({selectedSpaces.length})
                </Button>
                <Dropdown
                  isOpen={isBulkDropdownOpen}
                  onClose={() => setIsBulkDropdownOpen(false)}
                >
                  <div className="py-2">
                    <button
                      onClick={() => {
                        handleBulkAction('activate');
                        setIsBulkDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Activate Selected
                    </button>
                    <button
                      onClick={() => {
                        handleBulkAction('deactivate');
                        setIsBulkDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Deactivate Selected
                    </button>
                    <button
                      onClick={() => {
                        handleBulkAction('maintenance');
                        setIsBulkDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Set Maintenance
                    </button>
                  </div>
                </Dropdown>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-10 px-3 flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
              )}
              Refresh
            </Button>

            <Button variant="outline" size="sm" onClick={() => console.log('Export data')}>
              Export
            </Button>

            <Button variant="outline" size="sm" onClick={() => console.log('Import data')}>
              Import
            </Button>

            <Button variant="primary" size="sm" onClick={() => console.log('Add new space')}>
              Create
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={filters.search}
              onChange={(value) => updateFilters({ search: value })}
              placeholder="Search spaces by name or ID..."
              className="w-full"
            />
          </div>
          
          <div className="flex gap-3">
            <FilterDropdown
                filters={filterFields}
                onFiltersChange={updateFilters}
                onClearFilters={clearFilters}
              />
          </div>
        </div>
        
        {/* Status Chip Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateFilters({ status: "" })}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !filters.status 
                ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => updateFilters({ status: "Active" })}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filters.status === "Active" 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => updateFilters({ status: "Inactive" })}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filters.status === "Inactive" 
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Inactive
          </button>
          <button
            onClick={() => updateFilters({ status: "Maintenance" })}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filters.status === "Maintenance" 
                ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Maintenance
          </button>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {currentSpaces.map((space) => (
          <div key={space.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedSpaces.includes(space.id)}
                  onChange={() => handleSelectSpace(space.id)}
                  className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <Avatar
                  src={space.gallery?.[0]?.url || '/placeholder-space.jpg'}
                  alt={space.name}
                  size="medium"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{space.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {formatSpaceId(space.id)}
                    {getIdType(space.id) === 'uuid' && (
                      <span className="ml-1 text-orange-500" title="Legacy UUID format">
                        ⚠️
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  size="sm"
                  color={space.status === "Active" ? "success" : space.status === "Inactive" ? "primary" : "dark"}
                >
                  {space.status}
                </Badge>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleCardExpansion(space.id)}
                className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
              >
                <span>{expandedCards.includes(space.id) ? 'Show Less' : 'Show More'}</span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`transition-transform ${expandedCards.includes(space.id) ? 'rotate-180' : ''}`}
                >
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <Link
                  href={`/inventory/space/view/${space.id}`}
                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDeleteClick(space)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expandable Details */}
            {expandedCards.includes(space.id) && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Type:</span>
                      <p className="text-gray-900 dark:text-white font-medium mt-1">{space.spaceType || space.type || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Rate:</span>
                      <p className="text-gray-900 dark:text-white mt-1">
                        {space.pricing?.hourlyRate ? `$${space.pricing.hourlyRate}/hr` : 
                         space.pricing?.startingPrice ? `$${space.pricing.startingPrice}/hr` : 
                         space.hourlyRate ? `$${space.hourlyRate}/hr` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Location:</span>
                    <p className="text-gray-900 dark:text-white mt-1">{space.location?.city || space.city || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Type:</span>
                    <div className="mt-1 flex items-center gap-2">
                      {getSpaceTypeIcon(space.spaceType || space.type)}
                      <span className="text-gray-900 dark:text-white text-sm">{space.spaceType || space.type || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block max-w-full overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-12">
                <div className="flex items-center justify-center">
                  <input
                        type="checkbox"
                        checked={selectedSpaces.length === currentSpaces.length && currentSpaces.length > 0}
                        onChange={() => handleSelectAll(currentSpaces.map(s => s.id))}
                        className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                </div>
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-left text-sm dark:text-gray-400 w-20">
                <button
                    onClick={() => actions.updateSort('id')}
                    className="flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    ID
                    {sortState.field === 'id' && (
                      <span className="ml-1">{sortState.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-16">
                Image
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-left text-sm dark:text-gray-400 w-56">
                <button
                  onClick={() => actions.updateSort('name')}
                  className="flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Space Name
                  {sortState.field === 'name' && (
                    <span className="ml-1">{sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-24 hidden md:table-cell">
                <button
                  onClick={() => actions.updateSort('spaceType')}
                  className="flex items-center justify-center gap-2 hover:text-gray-700 dark:hover:text-gray-200 mx-auto"
                >
                  Type
                  {sortState.field === 'spaceType' && (
                    <span className="ml-1">{sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-28 hidden md:table-cell">
                <button
                  onClick={() => actions.updateSort('location')}
                  className="flex items-center justify-center gap-2 hover:text-gray-700 dark:hover:text-gray-200 mx-auto"
                >
                  Location
                  {sortState.field === 'location' && (
                    <span className="ml-1">{sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-24 hidden md:table-cell">
                <button
                  onClick={() => actions.updateSort('status')}
                  className="flex items-center justify-center gap-2 hover:text-gray-700 dark:hover:text-gray-200 mx-auto"
                >
                  Status
                  {sortState.field === 'status' && (
                    <span className="ml-1">{sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-28 hidden md:table-cell">
                <button
                  onClick={() => actions.updateSort('capacity')}
                  className="flex items-center justify-center gap-2 hover:text-gray-700 dark:hover:text-gray-200 mx-auto"
                >
                  Capacity
                  {sortState.field === 'capacity' && (
                    <span className="ml-1">{sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-32">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {currentSpaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center">
                  <span className="text-gray-500 dark:text-gray-400">No spaces found</span>
                </TableCell>
              </TableRow>
            ) : (
              currentSpaces.map((space) => (
                <TableRow key={space.id}>
                  <TableCell className="py-3 text-center w-12">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedSpaces.includes(space.id)}
                        onChange={() => handleSelectSpace(space.id)}
                        className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-left w-20">
                    <div className="flex items-center gap-1">
                      <p className="font-mono text-sm text-gray-900 dark:text-white">
                        {formatSpaceId(space.id)}
                      </p>
                      {getIdType(space.id) === 'uuid' && (
                        <span className="text-orange-500" title="Legacy UUID format">
                          ⚠️
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-center w-16">
                    <div className="flex justify-center">
                      <Avatar
                        src={space.gallery?.[0]?.url || '/placeholder-space.jpg'}
                        alt={space.name}
                        size="medium"
                      />
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-left w-36">
                    <p className="font-medium text-sm text-gray-800 dark:text-white/90">
                      {space.name}
                    </p>
                  </TableCell>

                  <TableCell className="py-3 text-center w-24 hidden md:table-cell">
                    <div className="flex items-center justify-center">
                      {getSpaceTypeIcon(space.spaceType || space.type)}
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-center w-28 hidden md:table-cell">
                    <p className="text-sm text-gray-800 dark:text-white/90">
                      {space.location?.city || space.city || 'N/A'}
                    </p>
                  </TableCell>

                  <TableCell className="py-3 text-center w-24 hidden md:table-cell">
                    <div className="flex justify-center">
                      <Badge
                        size="sm"
                        color={
                          space.status === "Active"
                            ? "success"
                            : space.status === "Inactive"
                            ? "primary"
                            : "dark"
                        }
                      >
                        {space.status}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-center w-28 hidden md:table-cell">
                    <div className="flex justify-center">
                      <p className="text-sm text-gray-800 dark:text-white/90 font-medium">
                        {typeof space.capacity === 'number' 
                          ? space.capacity 
                          : space.capacity?.total || space.capacity?.seating || 'N/A'}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-center w-32">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/inventory/space/view/${space.id}`}
                        className="p-1 text-brand-600 hover:text-brand-700 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        className="p-1 text-red-600 hover:text-red-700 transition-colors"
                        title="Delete"
                        onClick={() => handleDeleteClick(space)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <SmartPagination
        pagination={pagination}
        totalRecords={totalRecords}
        onPaginationChange={(newPagination) => updatePagination(newPagination)}
        className="mt-6"
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCancelDelete}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Space
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                This action cannot be undone
              </p>
            </div>
          </div>

          {spaceToDelete && (
            <div className="mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Space Information
                </h4>
                <div className="space-y-1 text-xs">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Name:</span> {spaceToDelete.name}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="font-medium">ID:</span> 
                    <span className="font-mono">{formatSpaceId(spaceToDelete.id)}</span>
                    {getIdType(spaceToDelete.id) === 'uuid' && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Action Type
                </label>
                <div className="space-y-3">
                  <label className="flex items-start">
                    <input
                      type="radio"
                      name="deleteType"
                      value="soft"
                      checked={deleteType === 'soft'}
                      onChange={(e) => setDeleteType(e.target.value as DeleteType)}
                      className="mr-3 mt-0.5 w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-brand-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Soft Delete (Deactivate)
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Deactivate space - can be restored later
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="radio"
                      name="deleteType"
                      value="suspend"
                      checked={deleteType === 'suspend'}
                      onChange={(e) => setDeleteType(e.target.value as DeleteType)}
                      className="mr-3 mt-0.5 w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-brand-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Suspend Space
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Temporarily disable bookings but keep space data intact
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="radio"
                      name="deleteType"
                      value="ban"
                      checked={deleteType === 'ban'}
                      onChange={(e) => setDeleteType(e.target.value as DeleteType)}
                      className="mr-3 mt-0.5 w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-brand-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Remove Space
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Remove space from platform (quality issues, violations)
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="radio"
                      name="deleteType"
                      value="lock"
                      checked={deleteType === 'lock'}
                      onChange={(e) => setDeleteType(e.target.value as DeleteType)}
                      className="mr-3 mt-0.5 w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-brand-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Lock Space
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Lock for maintenance or investigation
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="radio"
                      name="deleteType"
                      value="permanent"
                      checked={deleteType === 'permanent'}
                      onChange={(e) => setDeleteType(e.target.value as DeleteType)}
                      className="mr-3 mt-0.5 w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-brand-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Permanent Delete
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        All data will be lost forever - cannot be undone
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {(deleteType === 'permanent' || deleteType === 'ban') && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-red-800 dark:text-red-200">
                        {deleteType === 'permanent' ? 'Warning: Permanent Deletion' : 'Warning: Space Removal'}
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300">
                        {deleteType === 'permanent' 
                          ? 'This will permanently delete all space data including bookings and history. This action cannot be undone.'
                          : 'This will permanently remove the space from the platform. This action should only be used for serious violations.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmDelete}
              className="px-4 py-2"
            >
              {deleteType === 'permanent' ? 'Delete Permanently' : 
               deleteType === 'ban' ? 'Remove Space' :
               deleteType === 'suspend' ? 'Suspend Space' :
               deleteType === 'lock' ? 'Lock Space' :
               'Deactivate Space'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SpaceListContent;