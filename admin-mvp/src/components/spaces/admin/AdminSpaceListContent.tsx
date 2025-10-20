'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Loader2, 
  Eye, 
  Trash2, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Star, 
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Search,
  ChevronDown
} from 'lucide-react';

// UI Components
import { 
  SearchInput, 
  FilterDropdown, 
  SmartPagination, 
  LoadingState, 
  ErrorState, 
  Button, 
  Badge, 
  Avatar, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableCell, 
  Modal, 
  Dropdown 
} from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Hooks
import { useListState } from '@/hooks/useListState';
import { 
  useAdminSpaces, 
  useAdminSpaceStats, 
  usePendingSpaces,
  useUpdateAdminSpace,
  useApproveSpace,
  useRejectSpace,
  useUpdateAdminSpaceStatus,
  useDeleteAdminSpace,
  useAdminSpaceBulkAction
} from '@/hooks/useAdminSpaces';
import { useModal } from '@/hooks/useModal';

// Types
import { AdminSpace, AdminSpaceFilters, SpaceBulkAction } from '@/types/admin-spaces';

// Utils
import { formatSpaceId, getIdType, formatDate, formatCurrency } from '@/utils/formatters';

// Modals
import AdminSpaceDetailModal from './AdminSpaceDetailModal';
import SpaceApprovalModal from './SpaceApprovalModal';

interface AdminSpaceListContentProps {
  className?: string;
}

type DeleteType = 'soft' | 'permanent';

// Helper functions
const getStatusBadge = (status: string, approvalStatus?: string) => {
  if (approvalStatus === 'pending') {
    return <Badge variant="warning" className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
  }
  
  switch (status) {
    case 'Active':
      return <Badge variant="success" className="bg-green-100 text-green-800">Active</Badge>;
    case 'Inactive':
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>;
    case 'Maintenance':
      return <Badge variant="warning" className="bg-orange-100 text-orange-800">Maintenance</Badge>;
    case 'suspended':
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Suspended</Badge>;
    case 'rejected':
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

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
    default:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="M9 9h6v6H9z"/>
        </svg>
      );
  }
};

export const AdminSpaceListContent: React.FC<AdminSpaceListContentProps> = ({ className = "" }) => {
  // State management
  const { state, actions } = useListState<AdminSpace>({
    initialFilters: {
      search: "",
      status: "",
      approvalStatus: "",
      spaceType: "",
      partnerId: "",
      city: "",
      featured: null,
      verified: null,
    },
    initialSort: { field: 'createdAt', direction: 'desc' }
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

  // API hooks
  const { data: spacesData, isLoading, error, refetch } = useAdminSpaces({
    page: pagination.currentPage,
    limit: pagination.rowsPerPage,
    search: filters.search,
    status: filters.status === 'all' ? undefined : filters.status as any,
    approvalStatus: filters.approvalStatus === 'all' ? undefined : filters.approvalStatus as any,
    spaceType: filters.spaceType === 'all' ? undefined : filters.spaceType,
    city: filters.city === 'all' ? undefined : filters.city,
    featured: filters.featured,
    verified: filters.verified,
    sortBy: sortState.field as any,
    sortOrder: sortState.direction?.toUpperCase() as 'ASC' | 'DESC'
  });

  const { data: statsData } = useAdminSpaceStats();
  const { data: pendingSpaces } = usePendingSpaces();

  // Mutations
  const updateSpace = useUpdateAdminSpace();
  const approveSpace = useApproveSpace();
  const rejectSpace = useRejectSpace();
  const updateSpaceStatus = useUpdateAdminSpaceStatus();
  const deleteSpace = useDeleteAdminSpace();
  const bulkAction = useAdminSpaceBulkAction();

  // Extract data
  const spaces = spacesData?.data || [];
  const totalRecords = spacesData?.total || 0;
  const totalPages = Math.ceil(totalRecords / pagination.rowsPerPage);

  // Modal states
  const { isOpen: isDetailModalOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();
  const { isOpen: isApprovalModalOpen, openModal: openApprovalModal, closeModal: closeApprovalModal } = useModal();
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  
  // Local states
  const [selectedSpace, setSelectedSpace] = useState<AdminSpace | null>(null);
  const [deleteType, setDeleteType] = useState<DeleteType>('soft');
  const [bulkActionType, setBulkActionType] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filter options
  const filterFields = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' },
        { value: 'Maintenance', label: 'Maintenance' },
        { value: 'suspended', label: 'Suspended' }
      ],
      value: filters.status || 'all'
    },
    {
      key: 'approvalStatus',
      label: 'Approval Status',
      options: [
        { value: 'all', label: 'All Approval Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'under_review', label: 'Under Review' }
      ],
      value: filters.approvalStatus || 'all'
    },
    {
      key: 'spaceType',
      label: 'Space Type',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'cafe', label: 'Cafe' },
        { value: 'coworking', label: 'Coworking' },
        { value: 'office', label: 'Office' },
        { value: 'meeting', label: 'Meeting Room' },
        { value: 'event', label: 'Event Space' }
      ],
      value: filters.spaceType || 'all'
    }
  ];

  // Handlers
  const handleRefresh = () => {
    refetch();
  };

  const handleSpaceClick = (space: AdminSpace) => {
    setSelectedSpace(space);
    openDetailModal();
  };

  const handleApprovalClick = (space: AdminSpace) => {
    setSelectedSpace(space);
    openApprovalModal();
  };

  const handleDeleteClick = (space: AdminSpace) => {
    setSelectedSpace(space);
    setDeleteType('soft');
    openDeleteModal();
  };

  const handleConfirmDelete = async () => {
    if (!selectedSpace) return;

    try {
      await deleteSpace.mutateAsync(selectedSpace.id);
      closeDeleteModal();
      setSelectedSpace(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkActionType || selectedSpaces.length === 0) return;

    const action: SpaceBulkAction = {
      action: bulkActionType as any,
      spaceIds: selectedSpaces.map(space => space.id),
      notifyPartners: true
    };

    try {
      await bulkAction.mutateAsync(action);
      actions.clearSelection();
      setBulkActionType('');
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const handleStatusChange = async (space: AdminSpace, newStatus: 'Active' | 'Inactive' | 'Maintenance') => {
    try {
      await updateSpaceStatus.mutateAsync({ id: space.id, status: newStatus });
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  // Statistics cards
  const statsCards = [
    {
      title: 'Total Spaces',
      value: statsData?.total || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'blue'
    },
    {
      title: 'Pending Approval',
      value: statsData?.pending || 0,
      icon: <Clock className="w-5 h-5" />,
      color: 'yellow'
    },
    {
      title: 'Active Spaces',
      value: statsData?.active || 0,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'green'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(statsData?.totalRevenue || 0),
      icon: <DollarSign className="w-5 h-5" />,
      color: 'purple'
    }
  ];

  // Loading and error states
  if (isLoading) {
    return <LoadingState message="Loading admin spaces..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load spaces" onRetry={handleRefresh} />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                  <div className={`text-${stat.color}-600 dark:text-${stat.color}-400`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <SearchInput
                value={filters.search}
                onChange={(value) => updateFilters({ search: value })}
                placeholder="Search spaces by name, partner, or location..."
                className="max-w-md"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {filterFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.label}
                  </label>
                  <Select
                    value={field.value}
                    onValueChange={(value) => updateFilters({ [field.key]: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedSpaces.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {selectedSpaces.length} space{selectedSpaces.length !== 1 ? 's' : ''} selected
              </span>
              
              <div className="flex items-center gap-3">
                <Select value={bulkActionType} onValueChange={setBulkActionType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Bulk Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="activate">Activate</SelectItem>
                    <SelectItem value="deactivate">Deactivate</SelectItem>
                    <SelectItem value="suspend">Suspend</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="unfeature">Unfeature</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  size="sm"
                  onClick={handleBulkAction}
                  disabled={!bulkActionType || bulkAction.isPending}
                  className="bg-[#d4203d] hover:bg-[#b91c3c] text-white"
                >
                  {bulkAction.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Spaces Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="w-12">
                <Checkbox
                  checked={selectedSpaces.length === spaces.length && spaces.length > 0}
                  onCheckedChange={(checked) => handleSelectAll(checked ? spaces : [])}
                />
              </TableCell>
              <TableCell>Space</TableCell>
              <TableCell>Partner</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Created</TableCell>
              <TableCell className="w-12">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {spaces.map((space) => (
              <TableRow key={space.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedSpaces.some(s => s.id === space.id)}
                    onCheckedChange={(checked) => handleSelectSpace(space, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {space.gallery?.[0]?.url ? (
                        <img
                          src={space.gallery[0].url}
                          alt={space.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getSpaceTypeIcon(space.spaceType)}
                        </div>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => handleSpaceClick(space)}
                        className="font-medium text-gray-900 dark:text-white hover:text-[#d4203d] transition-colors"
                      >
                        {space.name}
                      </button>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatSpaceId(space.id)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={space.partner?.avatar}
                      alt={space.partner?.name}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {space.partner?.businessName || space.partner?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {space.partner?.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(space.status, space.approvalStatus)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getSpaceTypeIcon(space.spaceType)}
                    <span className="capitalize">{space.spaceType || space.type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{space.location?.city || space.city}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{space.capacity?.total || space.capacity}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {formatCurrency(space.pricing?.hourlyRate || space.hourlyRate || 0)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{space.rating?.average?.toFixed(1) || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {formatDate(space.createdAt)}
                </TableCell>
                <TableCell>
                  <Dropdown>
                    <Dropdown.Trigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </Dropdown.Trigger>
                    <Dropdown.Content align="end">
                      <Dropdown.Item onClick={() => handleSpaceClick(space)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Dropdown.Item>
                      {space.approvalStatus === 'pending' && (
                        <Dropdown.Item onClick={() => handleApprovalClick(space)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Review
                        </Dropdown.Item>
                      )}
                      <Dropdown.Item onClick={() => handleDeleteClick(space)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Dropdown.Item>
                    </Dropdown.Content>
                  </Dropdown>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <SmartPagination
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={pagination.rowsPerPage}
            onPageChange={(page) => updatePagination({ currentPage: page })}
            onPageSizeChange={(size) => updatePagination({ rowsPerPage: size, currentPage: 1 })}
          />
        </div>
      </Card>

      {/* Modals */}
      {selectedSpace && (
        <>
          <AdminSpaceDetailModal
            isOpen={isDetailModalOpen}
            onClose={closeDetailModal}
            space={selectedSpace}
          />
          
          <SpaceApprovalModal
            isOpen={isApprovalModalOpen}
            onClose={closeApprovalModal}
            space={selectedSpace}
            onApprove={(data) => approveSpace.mutateAsync({ id: selectedSpace.id, data })}
            onReject={(data) => rejectSpace.mutateAsync({ id: selectedSpace.id, data })}
          />
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Delete Space
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete "{selectedSpace?.name}"?
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteSpace.isPending}
            >
              {deleteSpace.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSpaceListContent;