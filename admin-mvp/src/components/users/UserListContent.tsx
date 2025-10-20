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
import Avatar from "../ui/avatar/Avatar";
import { Modal } from "../ui/modal";
import { useModal } from "@/hooks/useModal";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { AdminUser } from "@/lib/api/types";
import { formatCoworsId, isValidCoworsId, getIdType, formatDate } from '@/utils/formatters';
import { AlertTriangle } from 'lucide-react';

// Reusable components and hooks
import { SearchInput, FilterDropdown, SmartPagination, LoadingState, ErrorState } from '@/components/ui';
import { useListState } from '@/hooks/useListState';

// Define the TypeScript interface for the table rows
interface User {
  id: string; // Cowors alphanumeric ID
  name: string;
  email: string;
  phone: string;
  location?: string;
  userStatus: "active" | "inactive";
  kycStatus: "verified" | "unverified";
  registrationDate: string;
  avatar: string;
  createdAt?: string;
  totalBookings: number;
}



// Map AdminUser from API to User interface used in component
const mapAdminUserToUser = (adminUser: AdminUser): User => {
  // Format the name properly - never use email as fallback
  const firstName = adminUser.firstName?.trim() || '';
  const lastName = adminUser.lastName?.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  // Format the Cowors ID properly
  const coworsId = isValidCoworsId(adminUser.id) ? formatCoworsId(adminUser.id) : formatCoworsId(adminUser.id);
  
  return {
    id: coworsId,
    name: fullName || 'N/A', // Show 'N/A' instead of email when name is not available
    email: adminUser.email,
    phone: adminUser.phoneNumber || "+1 234 567 8900", // Default phone if not available
    location: "New York, USA", // Default location, would need to extract from address
    userStatus: adminUser.status === "Active" ? "active" : "inactive",
    kycStatus: adminUser.kycStatus === "Verified" ? "verified" : "unverified",
    registrationDate: adminUser.createdAt,
    avatar: `/images/user/user-${(Math.floor(Math.random() * 10) + 1).toString().padStart(2, '0')}.jpg`,
    createdAt: new Date(adminUser.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    totalBookings: adminUser.totalBookings || 0
  };
};

export default function UserListContent() {
  // Use the reusable list state hook
  const { state, actions } = useListState<User>({
    initialFilters: { search: '', kycStatus: '', dateRange: '' },
    defaultRowsPerPage: 10
  });

  const [showBulkActions, setShowBulkActions] = useState(false);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);

  // API data fetching
  const { data: usersData, isLoading, error } = useAdminUsers({
    page: state.pagination.currentPage,
    limit: state.pagination.rowsPerPage,
    search: state.filters.search,
    // Add more filters as needed
  });

  // Modal state for delete confirmation
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteType, setDeleteType] = useState<'soft' | 'permanent' | 'suspend' | 'ban' | 'lock'>('soft');

  // Handle card expansion
  const toggleCardExpansion = (userId: string) => {
    setExpandedCards(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle sorting
  const handleSort = (field: keyof User) => {
    actions.updateSort(field);
  };

  // Handle delete user
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    openDeleteModal();
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      // Here you would typically make an API call to delete the user
      console.log(`Processing user ${userToDelete.id} with ${deleteType} action`);
      
      // For now, just log the action
      switch (deleteType) {
        case 'permanent':
          console.log('Permanently deleting user data');
          break;
        case 'soft':
          console.log('Soft deleting user (deactivating)');
          break;
        case 'suspend':
          console.log('Suspending user account');
          break;
        case 'ban':
          console.log('Banning user from platform');
          break;
        case 'lock':
          console.log('Locking user account for security');
          break;
      }
      
      // Close modal and reset state
      closeDeleteModal();
      setUserToDelete(null);
      setDeleteType('soft');
    }
  };

  const handleCancelDelete = () => {
    closeDeleteModal();
    setUserToDelete(null);
    setDeleteType('soft');
  };

  // Transform API data to component data and filter out admin users
  const transformedUsers = useMemo(() => {
    if (!usersData?.data) return [];
    // Filter out users with Admin or SuperAdmin roles
    const filteredUsers = usersData.data.filter(user => 
      user.role !== 'Admin' && user.role !== 'SuperAdmin'
    );
    return filteredUsers.map(mapAdminUserToUser);
  }, [usersData]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...transformedUsers];
    
    // Apply filters
    result = result.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(state.filters.search.toLowerCase()) ||
                           user.email.toLowerCase().includes(state.filters.search.toLowerCase()) ||
                           user.id.toLowerCase().includes(state.filters.search.toLowerCase());
      const matchesStatus = !state.filters.kycStatus || user.userStatus === state.filters.kycStatus;
      return matchesSearch && matchesStatus;
    });
    
    // Apply sorting
    if (state.sortState?.field) {
      result.sort((a, b) => {
        const aValue = a[state.sortState!.field as keyof User];
        const bValue = b[state.sortState!.field as keyof User];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return state.sortState!.direction === 'asc' ? comparison : -comparison;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          const comparison = aValue - bValue;
          return state.sortState!.direction === 'asc' ? comparison : -comparison;
        }
        
        return 0;
      });
    }
    
    return result;
  }, [transformedUsers, state.filters, state.sortState]);

  // Note: totalRecords is passed directly to SmartPagination component
  // No need to store it in pagination state

  // Paginate data
  const currentUsers = filteredData;

  // Calculate selectAll state
  const selectAll = currentUsers.length > 0 && state.selectedItems.length === currentUsers.length;

  // Get sort state for UI
  const sortState = state.sortState || { field: null, direction: 'asc' };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      actions.clearSelection();
    } else {
      currentUsers.forEach(user => actions.selectItem(user.id));
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error.message || 'An error occurred'} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            User Management
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage and monitor user accounts and activities
          </p>
        </div>

        {/* Bulk actions - Mobile optimized */}
        {state.selectedItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
            <span className="text-xs text-brand-700 dark:text-brand-300 font-medium">
              {state.selectedItems.length} user{state.selectedItems.length > 1 ? 's' : ''} selected
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
                <DropdownItem onClick={() => console.log('Verify KYC')}>Verify KYC</DropdownItem>
                <DropdownItem onClick={() => console.log('Send notification')}>Send Notification</DropdownItem>
                <DropdownItem onClick={() => console.log('Deactivate')}>Deactivate Users</DropdownItem>
              </Dropdown>
            </div>
          </div>
        )}

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar - Using reusable SearchInput */}
          <div className="flex-1">
            <SearchInput
              value={state.filters.search}
              onChange={(value) => actions.updateFilters({ search: value })}
              placeholder="Search users by name, email, or ID..."
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {/* Filter button - Using reusable FilterDropdown */}
            <FilterDropdown
              filters={[
                {
                  key: 'kycStatus',
                  label: 'KYC Status',
                  options: [
                    { value: '', label: 'All Status' },
                    { value: 'verified', label: 'Verified' },
                    { value: 'unverified', label: 'Unverified' }
                  ],
                  value: state.filters.kycStatus || ''
                }
              ]}
              onFiltersChange={(newFilters) => actions.updateFilters(newFilters)}
              onClearFilters={() => actions.updateFilters({ search: '', kycStatus: '', dateRange: '' })}
              buttonText="Filters"
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

            {/* Create user button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => console.log('Add new user')}
              className="h-10 px-4 whitespace-nowrap"
            >
              Create
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {currentUsers.map((user) => (
          <div key={user.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={state.selectedItems.includes(user.id)}
                  onChange={() => actions.selectItem(user.id)}
                  className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <Avatar
                  src={user.avatar}
                  alt={user.name}
                  size="medium"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {formatCoworsId(user.id)}
                    {getIdType(user.id) === 'uuid' && (
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
                  color={user.userStatus === "active" ? "success" : "error"}
                >
                  {user.userStatus.charAt(0).toUpperCase() + user.userStatus.slice(1)}
                </Badge>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleCardExpansion(user.id)}
                className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
              >
                <span>{expandedCards.includes(user.id) ? 'Show Less' : 'Show More'}</span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`transition-transform ${expandedCards.includes(user.id) ? 'rotate-180' : ''}`}
                >
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <Link
                  href={`/user/view/${user.id}`}
                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="View"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </Link>
                <button
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete"
                  onClick={() => handleDeleteClick(user)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Expandable Details */}
            {expandedCards.includes(user.id) && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                    <p className="text-gray-900 dark:text-white mt-1">{user.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Bookings:</span>
                      <p className="text-gray-900 dark:text-white font-medium mt-1">{user.totalBookings}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>
                      <p className="text-gray-900 dark:text-white mt-1">{formatDate(user.registrationDate)}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">KYC Status:</span>
                    <div className="mt-1">
                      <Badge
                        size="sm"
                        color={user.kycStatus === "verified" ? "success" : "warning"}
                      >
                        {user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1)}
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
                    checked={selectAll}
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
                  {sortState.field === 'id' && (
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
                      {sortState.direction === 'asc' ? (
                        <path d="M6 0L11 7H1L6 0Z" fill="currentColor"/>
                      ) : (
                        <path d="M6 8L1 1H11L6 8Z" fill="currentColor"/>
                      )}
                    </svg>
                  )}
                </div>
              </TableCell>
              {/* Avatar Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-16"
              >
                Avatar
              </TableCell>
              {/* Name Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-left text-sm dark:text-gray-400 w-36"
              >
                <div className="flex items-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('name')}>
                  Name
                  {sortState.field === 'name' && (
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
                      {sortState.direction === 'asc' ? (
                        <path d="M6 0L11 7H1L6 0Z" fill="currentColor"/>
                      ) : (
                        <path d="M6 8L1 1H11L6 8Z" fill="currentColor"/>
                      )}
                    </svg>
                  )}
                </div>
              </TableCell>
              {/* Email Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-left text-sm dark:text-gray-400 w-56 hidden md:table-cell"
              >
                <div className="flex items-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('email')}>
                  Email
                  {sortState.field === 'email' && (
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
                      {sortState.direction === 'asc' ? (
                        <path d="M6 0L11 7H1L6 0Z" fill="currentColor"/>
                      ) : (
                        <path d="M6 8L1 1H11L6 8Z" fill="currentColor"/>
                      )}
                    </svg>
                  )}
                </div>
              </TableCell>
              {/* Total Bookings Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-24 hidden md:table-cell"
              >
                <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('totalBookings')}>
                  Bookings
                  {sortState.field === 'totalBookings' && (
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
                      {sortState.direction === 'asc' ? (
                        <path d="M6 0L11 7H1L6 0Z" fill="currentColor"/>
                      ) : (
                        <path d="M6 8L1 1H11L6 8Z" fill="currentColor"/>
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
                  {sortState.field === 'createdAt' && (
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
                      {sortState.direction === 'asc' ? (
                        <path d="M6 0L11 7H1L6 0Z" fill="currentColor"/>
                      ) : (
                        <path d="M6 8L1 1H11L6 8Z" fill="currentColor"/>
                      )}
                    </svg>
                  )}
                </div>
              </TableCell>
              {/* User Status Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-24 hidden md:table-cell"
              >
                <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('userStatus')}>
                  Status
                  {sortState.field === 'userStatus' && (
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
                      {sortState.direction === 'asc' ? (
                        <path d="M6 0L11 7H1L6 0Z" fill="currentColor"/>
                      ) : (
                        <path d="M6 8L1 1H11L6 8Z" fill="currentColor"/>
                      )}
                    </svg>
                  )}
                </div>
              </TableCell>
              {/* KYC Status Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-28 hidden md:table-cell"
              >
                <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('kycStatus')}>
                  KYC
                  {sortState.field === 'kycStatus' && (
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-600 dark:text-gray-300">
                      {sortState.direction === 'asc' ? (
                        <path d="M6 0L11 7H1L6 0Z" fill="currentColor"/>
                      ) : (
                        <path d="M6 8L1 1H11L6 8Z" fill="currentColor"/>
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
            {currentUsers.map((user) => (
              <TableRow key={user.id} className="">
                {/* Checkbox */}
                <TableCell className="py-3 text-center w-12">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={state.selectedItems.includes(user.id)}
                      onChange={() => actions.selectItem(user.id)}
                      className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </TableCell>

                {/* ID */}
                <TableCell className="py-3 text-left w-20">
                  <div className="flex items-center gap-1">
                    <p className="font-mono text-sm text-gray-900 dark:text-white">
                      {formatCoworsId(user.id)}
                    </p>
                    {getIdType(user.id) === 'uuid' && (
                      <span className="text-orange-500" title="Legacy UUID format">
                        ⚠️
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Avatar */}
                 <TableCell className="py-3 text-center w-16">
                   <div className="flex justify-center">
                     <Avatar
                       src={user.avatar}
                       alt={user.name}
                       size="medium"
                     />
                   </div>
                 </TableCell>

                {/* Name */}
                <TableCell className="py-3 text-left w-36">
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {user.name}
                  </p>
                </TableCell>

                {/* Email */}
                <TableCell className="py-3 text-left w-56 hidden md:table-cell">
                  <p className="text-gray-800 dark:text-white/90">{user.email}</p>
                </TableCell>

                {/* Total Bookings */}
                <TableCell className="py-3 text-center w-24 hidden md:table-cell">
                  <p className="text-gray-800 dark:text-white/90">{user.totalBookings}</p>
                </TableCell>

                {/* Created At */}
                <TableCell className="py-3 text-center w-28 hidden md:table-cell">
                  <p className="text-gray-800 dark:text-white/90">{user.createdAt}</p>
                </TableCell>

                {/* User Status */}
                <TableCell className="py-3 text-center w-24 hidden md:table-cell">
                  <Badge
                    size="sm"
                    color={user.userStatus === "active" ? "success" : "error"}
                  >
                    {user.userStatus.charAt(0).toUpperCase() + user.userStatus.slice(1)}
                  </Badge>
                </TableCell>

                {/* KYC Status */}
                <TableCell className="py-3 text-center w-28 hidden md:table-cell">
                  <Badge
                    size="sm"
                    color={user.kycStatus === "verified" ? "success" : "warning"}
                  >
                    {user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1)}
                  </Badge>
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3 text-center w-32">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/user/view/${user.id}`}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="View"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </Link>
                    <button
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                      onClick={() => handleDeleteClick(user)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                      </svg>
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination - Using reusable SmartPagination */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-6">
          <SmartPagination
            pagination={state.pagination}
            totalRecords={usersData?.total || 0}
            onPaginationChange={actions.updatePagination}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </div>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete User
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This action cannot be undone
              </p>
            </div>
          </div>

          {userToDelete && (
            <div className="mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  User Information
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Name:</span> {userToDelete.name}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Email:</span> {userToDelete.email}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="font-medium">ID:</span> 
                    <span className="flex items-center gap-1">
                      {formatCoworsId(userToDelete.id)}
                      {getIdType(userToDelete.id) === 'uuid' && (
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                      )}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        Suspend User
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Temporarily disables bookings/payments but keeps account intact (for investigation or pending issue)
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
                        Ban User
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Permanent removal from the platform (fraud, repeated disputes, chargebacks)
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
                        Security lock in case of suspicious activity (user must re-verify via support)
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
                        {deleteType === 'permanent' ? 'Warning: Permanent Deletion' : 'Warning: User Ban'}
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {deleteType === 'permanent' 
                          ? 'This will permanently delete all user data including profile, transactions, and history. This action cannot be undone.'
                          : 'This will permanently ban the user from the platform. This action should only be used for serious violations.'}
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
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmDelete}
            >
              {deleteType === 'permanent' ? 'Delete Permanently' : 
               deleteType === 'ban' ? 'Ban User' :
               deleteType === 'suspend' ? 'Suspend User' :
               deleteType === 'lock' ? 'Lock Account' :
               'Deactivate User'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
   );
 };