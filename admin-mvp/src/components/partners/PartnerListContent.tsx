"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Modal } from "../ui/modal";
import { useModal } from "@/hooks/useModal";
import { usePartners } from "@/hooks/usePartners";
import { useAuth } from "@/contexts/AuthContext";
import { Partner as ApiPartner } from '@/lib/api/types';
import { formatPartnerId, isValidCoworsId, getIdType, formatDate } from '@/utils/formatters';
import { AlertTriangle, Building2, Briefcase, LayoutGrid, Coffee, Calendar } from 'lucide-react';

// Import reusable components and hooks
import SearchInput from "@/components/ui/search/SearchInput";
import FilterDropdown from "@/components/ui/filter/FilterDropdown";
import SmartPagination from "@/components/ui/pagination/SmartPagination";
import { useListState } from "@/hooks/useListState";

// Partner type to icon mapping
const getPartnerTypeIcon = (type: string) => {
  const normalizedType = type.toLowerCase().replace(/[\s_-]+/g, '');
  
  switch (normalizedType) {
    case 'coworkingspace':
    case 'coworking':
      return Building2; // Coworking Spaces - building icon
    case 'businesscenter':
    case 'business':
    case 'office':
    case 'officespace':
      return Briefcase; // Office Spaces - briefcase icon
    case 'flexibleoffice':
    case 'flexible':
    case 'restobar':
    case 'restobarspace':
    case 'restaurant':
      return LayoutGrid; // Restobar Spaces - grid layout icon
    case 'cafe':
    case 'coffee':
    case 'cafespace':
      return Coffee; // Cafe Spaces - coffee icon
    case 'eventspace':
    case 'events':
    case 'event':
      return Calendar; // Event Spaces - calendar icon
    default:
      return Building2; // Default to building icon
  }
};

// Partner Type Icon Component
interface PartnerTypeIconProps {
  type: string;
  className?: string;
}

const PartnerTypeIcon: React.FC<PartnerTypeIconProps> = ({ type, className = "" }) => {
  const IconComponent = getPartnerTypeIcon(type);
  
  return (
    <div className={`flex items-center justify-center ${className}`} title={type}>
      <IconComponent 
        size={20} 
        className="text-red-600 dark:text-red-500" 
        strokeWidth={1.5}
      />
    </div>
  );
};

// Define the TypeScript interface for the table rows
interface Partner {
  id: string;
  name: string;
  email?: string;
  type: string;
  status: "active" | "inactive" | "pending" | "suspended";
  verificationStatus: "pending" | "verified" | "rejected";
  spaces: number;
  createdAt: string;
}





// Map Partner from API to Partner interface used in component
const mapPartnerToComponent = (partner: ApiPartner): Partner => {
  const rawType = (partner as any)?.partnerType || partner.businessType || (partner as any)?.category || 'Workspace';
  return {
    id: partner.id,
    name: partner.businessName || partner.name, // Business Name
    email: (partner as any)?.email || undefined,
    type: rawType,
    status: partner.status?.toLowerCase() as "active" | "inactive" | "pending" | "suspended" || "pending",
    verificationStatus: partner.verificationStatus?.toLowerCase() as "pending" | "verified" | "rejected" || "pending",
    spaces: (partner as any)?.spacesCount ?? 0, // Number of spaces this partner has
    createdAt: new Date(partner.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  };
};

export default function PartnerListContent() {
  // Use the reusable list state hook
  const { state, actions } = useListState<Partner>({
    initialFilters: { search: '', verificationStatus: '', dateRange: '' },
    defaultRowsPerPage: 10
  });

  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);

  // Authentication state
  const { isAuthenticated, isLoading: authLoading, user, token, hasAdminAccess } = useAuth();

  // API data fetching
  const { data: partnersData, isLoading, error } = usePartners({
    page: state.pagination.currentPage,
    limit: state.pagination.rowsPerPage,
    search: state.searchTerm,
    verificationStatus: state.filters.verificationStatus
      ? (state.filters.verificationStatus.charAt(0).toUpperCase() + state.filters.verificationStatus.slice(1).toLowerCase()) as 'Pending' | 'Verified' | 'Rejected'
      : undefined,
    // Add more filters as needed
  });

  // Debug log for usePartners hook result
  console.log('🔍 usePartners hook result:');
  console.log('📊 partnersData:', partnersData);
  console.log('⏳ isLoading:', isLoading);
  console.log('❌ error:', error);
  
  // Debug authentication token
  React.useEffect(() => {
    const checkAuth = async () => {
      // Check localStorage directly
      const adminToken = localStorage.getItem('admin_token');
      const adminUser = localStorage.getItem('admin_user');
      console.log('🔑 localStorage admin_token:', adminToken ? `${adminToken.substring(0, 20)}...` : 'null');
      console.log('🔑 localStorage admin_user:', adminUser ? JSON.parse(adminUser) : 'null');
      
      // Check auth context
      console.log('🔍 Auth context - user:', user);
      console.log('🔍 Auth context - token:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('🔍 Auth context - isAuthenticated:', isAuthenticated);
      console.log('🔍 Auth context - authLoading:', authLoading);
      console.log('🔍 Auth context - hasAdminAccess:', hasAdminAccess);
      
      // Check getAuthToken function
      const { getAuthToken } = await import('@/lib/auth');
      const authToken = await getAuthToken();
      console.log('🔑 getAuthToken result:', authToken ? `${authToken.substring(0, 20)}...` : 'null');
      
      console.log('🔍 Query enabled condition:', isAuthenticated && !authLoading);
    };
    checkAuth();
  }, [isAuthenticated, authLoading, user, token, hasAdminAccess]);

  // Modal state for delete confirmation
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
  const [deleteType, setDeleteType] = useState<'soft' | 'permanent' | 'suspend' | 'ban' | 'lock'>('soft');

  // Handle card expansion
  const toggleCardExpansion = (partnerId: string) => {
    setExpandedCards(prev => 
      prev.includes(partnerId) 
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    );
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (!partnersData?.data) return;
    actions.toggleSelectAll(transformedPartners.map(partner => partner.id));
  };

  // Handle individual checkbox
  const handleSelectPartner = (partnerId: string) => {
    actions.selectItem(partnerId);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    actions.updateSort(field as keyof Partner);
  };

  // Handle delete partner
  const handleDeleteClick = (partner: Partner) => {
    setPartnerToDelete(partner);
    openDeleteModal();
  };

  const handleConfirmDelete = () => {
    if (partnerToDelete) {
      // Here you would typically make an API call to delete the partner
      console.log(`Processing partner ${partnerToDelete.id} with ${deleteType} action`);
      
      // For now, just log the action
      switch (deleteType) {
        case 'permanent':
          console.log('Permanently deleting partner data');
          break;
        case 'soft':
          console.log('Soft deleting partner (deactivating)');
          break;
        case 'suspend':
          console.log('Suspending partner account');
          break;
        case 'ban':
          console.log('Banning partner from platform');
          break;
        case 'lock':
          console.log('Locking partner account for security');
          break;
      }
      
      // Close modal and reset state
      closeDeleteModal();
      setPartnerToDelete(null);
      setDeleteType('soft');
    }
  };

  const handleCancelDelete = () => {
    closeDeleteModal();
    setPartnerToDelete(null);
    setDeleteType('soft');
  };

  // Transform API data to component format
  const transformedPartners = useMemo(() => {
    console.log('🔄 Transforming partners data:', partnersData);
    
    if (!partnersData?.data || !Array.isArray(partnersData.data)) {
      console.log('❌ No partnersData.data array, returning empty array');
      return [];
    }
    
    const transformed = partnersData.data.map(mapPartnerToComponent);
    console.log('✅ Transformed partners:', transformed);
    return transformed;
  }, [partnersData]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (!partnersData?.total) return 1;
    return Math.ceil(partnersData.total / state.pagination.rowsPerPage);
  }, [partnersData?.total, state.pagination.rowsPerPage]);

  // Loading and error states
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 font-medium">Error loading partners</div>
        <div className="text-red-500 text-sm mt-1">{error.message}</div>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Partner Management
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage and monitor partner accounts and spaces
          </p>
        </div>

        {/* Bulk actions - Mobile optimized */}
        {state.selectedItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
            <span className="text-sm text-brand-700 dark:text-brand-300 font-medium">
              {state.selectedItems.length} partner{state.selectedItems.length > 1 ? 's' : ''} selected
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
                <DropdownItem onClick={() => console.log('Export selected')}>Export Selected</DropdownItem>
                <DropdownItem onClick={() => console.log('Verify partners')}>Verify Partners</DropdownItem>
                <DropdownItem onClick={() => console.log('Send notification')}>Send Notification</DropdownItem>
                <DropdownItem onClick={() => console.log('Deactivate')}>Deactivate Partners</DropdownItem>
              </Dropdown>
            </div>
          </div>
        )}

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar - Using reusable SearchInput */}
          <SearchInput
            value={state.searchTerm}
            onChange={actions.setSearchTerm}
            placeholder="Search partners by name, email, or ID..."
            className="flex-1"
          />

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {/* Filter button - Using reusable FilterDropdown */}
            <FilterDropdown
              filters={[
                {
                  key: 'verificationStatus',
                  label: 'Verification Status',
                  options: [
                    { value: '', label: 'All Status' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Verified', label: 'Verified' },
                    { value: 'Rejected', label: 'Rejected' }
                  ],
                  value: state.filters.verificationStatus
                }
              ]}
              onFiltersChange={actions.updateFilters}
              onClearFilters={actions.clearFilters}
              className="h-10"
            />

            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="h-10 px-3 flex items-center justify-center"
              startIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
              }
            >
              Refresh
            </Button>

            {/* Export button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log('Export data')}
              className="h-10 px-3 whitespace-nowrap"
            >
              Export
            </Button>

            {/* Import button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log('Import data')}
              className="h-10 px-3 whitespace-nowrap"
            >
              Import
            </Button>

            {/* Create partner button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => console.log('Add new partner')}
              className="h-10 px-4 whitespace-nowrap"
            >
              Create
            </Button>
          </div>
        </div>
      </div>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {transformedPartners.map((partner) => (
          <div key={partner.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={state.selectedItems.includes(partner.id)}
                    onChange={() => actions.selectItem(partner.id)}
                    className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                    {partner.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1">
                    {formatPartnerId(partner.id)}
                    {getIdType(partner.id) === 'uuid' && (
                      <span className="text-orange-500" title="Legacy UUID format">
                        ⚠️
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  size="sm"
                  color={
                    partner.status === "active"
                      ? "success"
                      : partner.status === "suspended"
                      ? "error"
                      : "warning"
                  }
                >
                  {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                </Badge>
                <Badge
                  size="sm"
                  color={
                    partner.verificationStatus === "verified"
                      ? "success"
                      : partner.verificationStatus === "rejected"
                      ? "error"
                      : "warning"
                  }
                >
                  {partner.verificationStatus === "verified" ? "✓ Verified" : 
                   partner.verificationStatus === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                </Badge>
              </div>
            </div>

            {/* Partner Details Section */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    Type
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 capitalize">
                    {partner.type}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    Spaces
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {partner.spaces}
                  </p>
                </div>
                <div className="col-span-2">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    Created At
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    {partner.createdAt}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Card Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleCardExpansion(partner.id)}
                className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors px-3 py-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20"
              >
                <span>{expandedCards.includes(partner.id) ? 'Show Less' : 'Show More'}</span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`transition-transform ${expandedCards.includes(partner.id) ? 'rotate-180' : ''}`}
                >
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <Link
                  href={`/partner/view/${partner.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 border border-green-200 dark:border-green-800"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  View
                </Link>
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 border border-red-200 dark:border-red-800"
                  onClick={() => handleDeleteClick(partner)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            {/* Expandable Details */}
            {expandedCards.includes(partner.id) && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                    <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide font-medium">Partner ID</span>
                    <p className="text-gray-900 dark:text-white mt-1 font-medium font-mono">{partner.id}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                    <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide font-medium">Status Details</span>
                    <div className="mt-1 flex gap-2">
                      <Badge size="sm" color={partner.status === "active" ? "success" : "warning"}>
                        {partner.status}
                      </Badge>
                      <Badge size="sm" color={partner.verificationStatus === "verified" ? "success" : "warning"}>
                        {partner.verificationStatus}
                      </Badge>
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
          {/* Table Header */}
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              {/* Checkbox Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-12"
              >
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={state.selectedItems.length === transformedPartners.length && transformedPartners.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </TableCell>
              {/* ID Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-left text-sm dark:text-gray-400 w-20"
              >
                <div className="flex items-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('id')}>
                  ID
                  {state.sortState.field === 'id' && (
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
                      {state.sortState.direction === 'asc' ? (
                        <path d="M6 0L11 7H1L6 0Z" fill="currentColor"/>
                      ) : (
                        <path d="M6 8L1 1H11L6 8Z" fill="currentColor"/>
                      )}
                    </svg>
                  )}
                </div>
              </TableCell>

              {/* Name Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-left text-sm dark:text-gray-400 w-36"
              >
                <div className="flex items-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('name')}>
                  Name
                  {state.sortState.field === 'name' && (
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
                      {state.sortState.direction === 'asc' ? (
                        <path d="M6 2L2 6h8L6 2z" fill="currentColor"/>
                      ) : (
                        <path d="M6 6L2 2h8L6 6z" fill="currentColor"/>
                      )}
                    </svg>
                  )}
                </div>
              </TableCell>
              {/* Type Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-32 hidden md:table-cell"
              >
                <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('type')}>
                  Type
                  {state.sortState.field === 'type' && (
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
                      {state.sortState.direction === 'asc' ? (
                        <path d="M6 2L2 6h8L6 2z" fill="currentColor"/>
                      ) : (
                        <path d="M6 6L2 2h8L6 6z" fill="currentColor"/>
                      )}
                    </svg>
                  )}
                </div>
              </TableCell>
              {/* Status Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-24 hidden md:table-cell"
              >
                <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('status')}>
                  Status
                  {state.sortState.field === 'status' && (
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
                      {state.sortState.direction === 'asc' ? (
                        <path d="M6 2L2 6h8L6 2z" fill="currentColor"/>
                      ) : (
                        <path d="M6 6L2 2h8L6 6z" fill="currentColor"/>
                      )}
                    </svg>
                  )}
                </div>
              </TableCell>
              {/* Spaces Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-20 hidden md:table-cell"
              >
                <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('spaces')}>
                  Spaces
                  {state.sortState.field === 'spaces' && (
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
                      {state.sortState.direction === 'asc' ? (
                        <path d="M6 2L2 6h8L6 2z" fill="currentColor"/>
                      ) : (
                        <path d="M6 6L2 2h8L6 6z" fill="currentColor"/>
                      )}
                    </svg>
                  )}
                </div>
              </TableCell>
              {/* Created At Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-28 hidden md:table-cell"
              >
                <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('createdAt')}>
                  Created At
                  {state.sortState.field === 'createdAt' && (
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
                      {state.sortState.direction === 'asc' ? (
                        <path d="M6 0L11 7H1L6 0Z" fill="currentColor"/>
                      ) : (
                        <path d="M6 8L1 1H11L6 8Z" fill="currentColor"/>
                      )}
                    </svg>
                  )}
                </div>
              </TableCell>
              {/* Verification Status Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-28 hidden md:table-cell"
              >
                <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('verificationStatus')}>
                  Verification
                  {state.sortState.field === 'verificationStatus' && (
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
                      {state.sortState.direction === 'asc' ? (
                        <path d="M6 2L2 6h8L6 2z" fill="currentColor"/>
                      ) : (
                        <path d="M6 6L2 2h8L6 6z" fill="currentColor"/>
                      )}
                    </svg>
                  )}
                </div>
              </TableCell>
              {/* Actions Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-32"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {(() => {
              console.log('🎯 About to render table rows');
              console.log('🎯 transformedPartners at render time:', transformedPartners);
              console.log('🎯 transformedPartners.length at render time:', transformedPartners.length);
              return null;
            })()}
            {transformedPartners.map((partner) => {
              console.debug('🔍 Rendering individual partner:', partner);
              return (
              <TableRow key={partner.id} className="">
                {/* Checkbox */}
                <TableCell className="py-3 text-center w-12">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={state.selectedItems.includes(partner.id)}
                      onChange={() => handleSelectPartner(partner.id)}
                      className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </TableCell>

                {/* ID */}
                <TableCell className="py-3 text-left w-20">
                  <div className="flex items-center gap-1">
                    <p className="font-mono text-sm text-gray-900 dark:text-white">
                      {formatPartnerId(partner.id)}
                    </p>
                    {getIdType(partner.id) === 'uuid' && (
                      <span className="text-orange-500" title="Legacy UUID format">
                        ⚠️
                      </span>
                    )}
                  </div>
                </TableCell>



                {/* Name */}
                <TableCell className="py-3 text-left w-36">
                  <p className="font-medium text-gray-800 text-sm dark:text-white/90">
                    {partner.name}
                  </p>
                </TableCell>

                {/* Type */}
                <TableCell className="py-3 text-center w-32 hidden md:table-cell">
                  <PartnerTypeIcon type={partner.type} />
                </TableCell>

                {/* Status */}
                <TableCell className="py-3 text-center w-24 hidden md:table-cell">
                  <div className="flex justify-center">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        partner.status === "active" 
                          ? "bg-green-500" 
                          : partner.status === "suspended"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}></div>
                      <Badge
                        size="sm"
                        color={
                          partner.status === "active"
                            ? "success"
                            : partner.status === "suspended"
                            ? "error"
                            : "warning"
                        }
                      >
                        {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </TableCell>

                {/* Spaces */}
                <TableCell className="py-3 text-center w-20 hidden md:table-cell">
                  <p className="text-gray-800 dark:text-white/90 font-medium">
                    {partner.spaces}
                  </p>
                </TableCell>

                {/* Created At */}
                 <TableCell className="py-3 text-center w-28 hidden md:table-cell">
                   <p className="text-gray-800 dark:text-white/90 text-sm">
                     {partner.createdAt}
                   </p>
                 </TableCell>

                {/* Verification Status */}
                <TableCell className="py-3 text-center w-28 hidden md:table-cell">
                  <div className="flex justify-center">
                    <div className="flex items-center gap-1">
                      {partner.verificationStatus === "verified" ? (
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : partner.verificationStatus === "rejected" ? (
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      )}
                      <Badge
                        size="sm"
                        color={
                          partner.verificationStatus === "verified"
                            ? "success"
                            : partner.verificationStatus === "rejected"
                            ? "error"
                            : "warning"
                        }
                      >
                        {partner.verificationStatus === "verified" ? "Verified" : 
                         partner.verificationStatus === "rejected" ? "Rejected" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3 text-center w-32">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/partner/view/${partner.id}`}
                      className="p-1 text-green-600 hover:text-green-700 transition-colors"
                      title="View"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </Link>
                    <button
                      className="p-1 text-red-600 hover:text-red-700 transition-colors"
                      title="Delete"
                      onClick={() => handleDeleteClick(partner)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                      </svg>
                    </button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Footer with pagination */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <SmartPagination
          pagination={state.pagination}
          totalRecords={partnersData?.total || 0}
          onPaginationChange={actions.updatePagination}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCancelDelete}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600 dark:text-red-400">
                <path d="M3 6h18l-2 13H5L3 6z"/>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Delete Partner
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                This action cannot be undone
              </p>
            </div>
          </div>

          {partnerToDelete && (
            <div className="mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Partner Information
                </h4>
                <div className="space-y-1 text-xs">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Name:</span> {partnerToDelete.name}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Email:</span> {partnerToDelete.email}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="font-medium">ID:</span> 
                    <span className="font-mono">{formatPartnerId(partnerToDelete.id)}</span>
                    {getIdType(partnerToDelete.id) === 'uuid' && (
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
                      onChange={(e) => setDeleteType(e.target.value as 'soft' | 'permanent' | 'suspend' | 'ban' | 'lock')}
                      className="mr-3 mt-0.5 w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-brand-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Soft Delete (Deactivate)
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Deactivate account - can be restored later
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="radio"
                      name="deleteType"
                      value="suspend"
                      checked={deleteType === 'suspend'}
                      onChange={(e) => setDeleteType(e.target.value as 'soft' | 'permanent' | 'suspend' | 'ban' | 'lock')}
                      className="mr-3 mt-0.5 w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-brand-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Suspend Partner
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Temporarily disables space listings but keeps account intact (for investigation or pending issue)
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="radio"
                      name="deleteType"
                      value="ban"
                      checked={deleteType === 'ban'}
                      onChange={(e) => setDeleteType(e.target.value as 'soft' | 'permanent' | 'suspend' | 'ban' | 'lock')}
                      className="mr-3 mt-0.5 w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-brand-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ban Partner
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Permanent removal from the platform (fraud, repeated disputes, policy violations)
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="radio"
                      name="deleteType"
                      value="lock"
                      checked={deleteType === 'lock'}
                      onChange={(e) => setDeleteType(e.target.value as 'soft' | 'permanent' | 'suspend' | 'ban' | 'lock')}
                      className="mr-3 mt-0.5 w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-brand-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Lock Account
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Security lock in case of suspicious activity (partner must re-verify via support)
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="radio"
                      name="deleteType"
                      value="permanent"
                      checked={deleteType === 'permanent'}
                      onChange={(e) => setDeleteType(e.target.value as 'soft' | 'permanent' | 'suspend' | 'ban' | 'lock')}
                      className="mr-3 mt-0.5 w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-brand-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        {deleteType === 'permanent' ? 'Warning: This will permanently delete all partner data!' : 'Warning: This will permanently ban the partner from the platform!'}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                        This action cannot be undone. Please ensure you have proper authorization.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
            >
              {deleteType === 'permanent' ? 'Delete Permanently' : 
               deleteType === 'ban' ? 'Ban Partner' :
               deleteType === 'suspend' ? 'Suspend Partner' :
               deleteType === 'lock' ? 'Lock Account' : 'Deactivate'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}