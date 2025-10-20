"use client";
import React, { useMemo, useState } from "react";
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
import { useBookings } from "@/hooks/useBookings";
import { Booking as ApiBooking } from '@/lib/api/types';
import { formatCoworsId, isValidCoworsId } from '@/utils/formatters';
import { getIdType, formatBookingId } from '@/utils/formatters';
import { useListState } from '@/hooks/useListState';
import { SearchInput, FilterDropdown, SmartPagination, LoadingState, ErrorState } from '@/components/ui';

// Define the TypeScript interface for booking data
interface Booking {
  id: string; // Booking ID
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  partnerId: string;
  partnerName: string;
  spaceId: string;
  spaceName: string;
  serviceType: string;
  serviceDescription: string;
  amount: number;
  currency: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: number; // in hours
  status: "confirmed" | "pending" | "cancelled" | "completed" | "no-show";
  paymentMethod: "card" | "upi" | "wallet" | "cash" | "bank_transfer";
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
  bookingType: "individual" | "team" | "event" | "meeting";
  guests: number;
  addOns: string[];
  addOnsCost: number;
  location: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to format date to dd-mm-yyyy
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Helper function to format time
const formatTime = (timeString: string): string => {
  const time = new Date(`2024-01-01T${timeString}`);
  return time.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

// Map API Booking to component Booking interface
const mapApiBookingToComponent = (apiBooking: ApiBooking): Booking => {
  // Helper function to safely extract time from datetime string
  const extractTime = (dateTimeString: string): string => {
    try {
      const timePart = dateTimeString.split('T')[1];
      return timePart ? timePart.substring(0, 5) : "00:00";
    } catch {
      return "00:00";
    }
  };

  // Helper function to safely extract date from datetime string
  const extractDate = (dateTimeString: string): string => {
    try {
      return dateTimeString.split('T')[0] || new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  return {
    id: formatBookingId(apiBooking.id),
    customerId: apiBooking.userId,
    customerName: apiBooking.user ? `${apiBooking.user.firstName || ''} ${apiBooking.user.lastName || ''}`.trim() || apiBooking.user.email : "Unknown User",
    customerEmail: apiBooking.user?.email || "N/A",
    customerAvatar: `/images/user/user-${(Math.floor(Math.random() * 10) + 1).toString().padStart(2, '0')}.jpg`,
    partnerId: apiBooking.partnerId || "N/A",
    partnerName: apiBooking.partnerName || "Unknown Partner",
    spaceId: apiBooking.spaceId,
    spaceName: apiBooking.space?.name || "Unknown Space",
    serviceType: apiBooking.space?.spaceType || "Workspace",
    serviceDescription: `Booking for ${apiBooking.space?.spaceType || "workspace"}`,
    amount: apiBooking.totalAmount,
    currency: "INR",
    bookingDate: extractDate(apiBooking.startTime),
    startTime: extractTime(apiBooking.startTime),
    endTime: extractTime(apiBooking.endTime),
    duration: Math.round((new Date(apiBooking.endTime).getTime() - new Date(apiBooking.startTime).getTime()) / (1000 * 60 * 60)),
    status: apiBooking.status.toLowerCase() as "confirmed" | "pending" | "cancelled" | "completed" | "no-show",
    paymentMethod: apiBooking.paymentMethod?.toLowerCase() as "card" | "upi" | "wallet" | "cash" | "bank_transfer" || "card",
    paymentStatus: apiBooking.paymentStatus.toLowerCase() as "paid" | "pending" | "failed" | "refunded",
    bookingType: (apiBooking.bookingType as "individual" | "team" | "event" | "meeting") || "individual",
    guests: apiBooking.guests || 1,
    addOns: apiBooking.amenities || [],
    addOnsCost: 0, // Would need to calculate from booking items if available
    location: `${apiBooking.space?.city || "Unknown"}, ${apiBooking.space?.state || "Unknown"}`,
    createdAt: apiBooking.createdAt,
    updatedAt: apiBooking.updatedAt
  };
};

export default function BookingListContent() {
  // Use centralized list state management
  const { state, actions } = useListState<Booking>({
    initialFilters: {
      search: "",
      status: "",
      paymentStatus: "",
      serviceType: "",
      dateRange: "",
    },
    initialSort: { field: 'createdAt', direction: 'desc' }
  });

  // Destructure state and actions for easier access
  const { selectedItems: selectedBookings, filters, pagination, sortState } = state;
  const { 
    selectItem: handleSelectBooking, 
    updateFilters, 
    updatePagination, 
    clearFilters,
    updateSort: handleSort,
    toggleSelectAll: handleSelectAll
  } = actions;

  // Local state for UI features not in useListState
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);

  // Helper functions
  const toggleFilters = () => setShowFilters(!showFilters);
  const toggleCardExpansion = (id: string) => {
    setExpandedCards(prev => 
      prev.includes(id) 
        ? prev.filter(cardId => cardId !== id)
        : [...prev, id]
    );
  };

  // API data fetching
  const { data: bookingsData, isLoading, error } = useBookings({
    page: pagination.currentPage,
    limit: pagination.rowsPerPage,
    search: filters.search,
    status: filters.status,
    paymentStatus: filters.paymentStatus,
    sortBy: sortState.field || 'createdAt',
    sortOrder: sortState.direction,
  });

  // Transform API data to component data
  const transformedBookings = useMemo(() => {
    if (!bookingsData?.data) return [];
    return bookingsData.data.map(mapApiBookingToComponent);
  }, [bookingsData]);

  // Calculate selectAll state
  const selectAll = transformedBookings.length > 0 && selectedBookings.length === transformedBookings.length;

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (!bookingsData?.total) return 1;
    return Math.ceil(bookingsData.total / pagination.rowsPerPage);
  }, [bookingsData?.total, pagination.rowsPerPage]);

  // Filter options for the filter dropdown
  const filterOptions = [
    {
      key: 'status',
      label: 'Booking Status',
      options: [
        { value: '', label: 'All Status' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'pending', label: 'Pending' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'completed', label: 'Completed' }
      ]
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      options: [
        { value: '', label: 'All Payment Status' },
        { value: 'paid', label: 'Paid' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' },
        { value: 'refunded', label: 'Refunded' }
      ]
    }
  ];

  // Loading and error states
  if (isLoading) {
    return <LoadingState message="Loading bookings..." />;
  }

  if (error) {
    return <ErrorState message="Error loading bookings" error={error.message} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Booking Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and monitor all bookings and reservations
          </p>
        </div>

        {/* Bulk actions - Mobile optimized */}
        {selectedBookings.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
            <span className="text-sm text-brand-700 dark:text-brand-300 font-medium">
              {selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''} selected
            </span>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
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
              <Dropdown isOpen={false} onClose={() => {}}>
                <DropdownItem onClick={() => console.log('Export selected')}>Export Selected</DropdownItem>
                <DropdownItem onClick={() => console.log('Cancel bookings')}>Cancel Bookings</DropdownItem>
                <DropdownItem onClick={() => console.log('Send notification')}>Send Notification</DropdownItem>
                <DropdownItem onClick={() => console.log('Refund')}>Process Refund</DropdownItem>
              </Dropdown>
            </div>
          </div>
        )}

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <SearchInput
            value={filters.search}
            onChange={(value) => updateFilters({ search: value })}
            placeholder="Search bookings by customer, space, or ID..."
            className="flex-1"
          />

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {/* Filter button */}
            <FilterDropdown
          filters={filterOptions.map(option => ({
            ...option,
            value: filters[option.key] || ''
          }))}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
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

            {/* Create booking button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => console.log('Add new booking')}
              className="h-10 px-4 whitespace-nowrap"
            >
              Create
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {transformedBookings.map((booking) => (
          <div key={booking.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedBookings.includes(booking.id)}
                  onChange={() => handleSelectBooking(booking.id)}
                  className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <Avatar
                  src={booking.customerAvatar}
                  alt={booking.customerName}
                  size="medium"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{booking.customerName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {formatBookingId(booking.id)}
                    {getIdType(booking.id) === 'uuid' && (
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
                  color={booking.status === "confirmed" ? "success" : booking.status === "cancelled" ? "error" : "warning"}
                >
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
              </div>
            </div>

            {/* Card Content */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Space:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{booking.spaceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Date:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(booking.bookingDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Time:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Amount:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(booking.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Payment:</span>
                <Badge
                  size="sm"
                  color={booking.paymentStatus === "paid" ? "success" : booking.paymentStatus === "failed" ? "error" : "warning"}
                >
                  {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                </Badge>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleCardExpansion(booking.id)}
                className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
              >
                <span>{expandedCards.includes(booking.id) ? 'Show Less' : 'Show More'}</span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`transition-transform ${expandedCards.includes(booking.id) ? 'rotate-180' : ''}`}
                >
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <Link
                  href={`/booking/view/${booking.id}`}
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
                  title="Cancel"
                  onClick={() => console.log('Cancel booking', booking.id)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Expandable Details */}
            {expandedCards.includes(booking.id) && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Customer Email:</span>
                    <p className="text-gray-900 dark:text-white mt-1">{booking.customerEmail}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Service Type:</span>
                    <p className="text-gray-900 dark:text-white font-medium mt-1">{booking.serviceType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Location:</span>
                    <p className="text-gray-900 dark:text-white mt-1">{booking.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Created:</span>
                    <p className="text-gray-900 dark:text-white mt-1">{formatDate(booking.createdAt)}</p>
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
                className="py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-12"
              >
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={() => handleSelectAll(transformedBookings.map(b => b.id))}
                    className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </TableCell>
              {/* ID Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-left text-theme-xs dark:text-gray-400 w-20"
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
              {/* Customer Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-left text-theme-xs dark:text-gray-400 w-48"
              >
                <div className="flex items-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('customerName')}>
                  Customer
                  {sortState.field === 'customerName' && (
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
              {/* Space Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-left text-theme-xs dark:text-gray-400 w-48 hidden md:table-cell"
              >
                <div className="flex items-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('spaceName')}>
                  Space
                  {sortState.field === 'spaceName' && (
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
              {/* Date Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-28 hidden md:table-cell"
              >
                <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('bookingDate')}>
                  Date
                  {sortState.field === 'bookingDate' && (
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
              {/* Time Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-32 hidden md:table-cell"
              >
                <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                  Time
                </div>
              </TableCell>
              {/* Amount Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400 w-24"
              >
                <div className="flex items-center justify-end gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('amount')}>
                  Amount
                  {sortState.field === 'amount' && (
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
              {/* Status Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-24"
              >
                <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('status')}>
                  Status
                  {sortState.field === 'status' && (
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
              {/* Payment Status Column */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-28 hidden md:table-cell"
              >
                <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('paymentStatus')}>
                  Payment
                  {sortState.field === 'paymentStatus' && (
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
                className="py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-32"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {transformedBookings.map((booking) => (
              <TableRow key={booking.id} className="">
                {/* Checkbox */}
                <TableCell className="py-3 text-center w-12">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedBookings.includes(booking.id)}
                      onChange={() => handleSelectBooking(booking.id)}
                      className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </TableCell>

                {/* ID */}
                <TableCell className="py-3 text-left w-20">
                  <div className="flex items-center gap-1">
                    <p className="font-mono text-sm text-gray-900 dark:text-white">
                      {formatBookingId(booking.id)}
                    </p>
                    {getIdType(booking.id) === 'uuid' && (
                      <span className="text-orange-500" title="Legacy UUID format">
                        ⚠️
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Customer */}
                <TableCell className="py-3 text-left w-48">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={booking.customerAvatar}
                      alt={booking.customerName}
                      size="small"
                    />
                    <div>
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {booking.customerName}
                      </p>
                      <p className="text-gray-500 text-xs dark:text-gray-400">
                        {booking.customerEmail}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Space */}
                <TableCell className="py-3 text-left w-48 hidden md:table-cell">
                  <div>
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {booking.spaceName}
                    </p>
                    <p className="text-gray-500 text-xs dark:text-gray-400">
                      {booking.location}
                    </p>
                  </div>
                </TableCell>

                {/* Date */}
                <TableCell className="py-3 text-center w-28 hidden md:table-cell">
                  <p className="text-gray-800 dark:text-white/90">
                    {formatDate(booking.bookingDate)}
                  </p>
                </TableCell>

                {/* Time */}
                <TableCell className="py-3 text-center w-32 hidden md:table-cell">
                  <div className="text-gray-800 dark:text-white/90">
                    <p>{formatTime(booking.startTime)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">to</p>
                    <p>{formatTime(booking.endTime)}</p>
                  </div>
                </TableCell>

                {/* Amount */}
                <TableCell className="py-3 text-right w-24">
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {formatCurrency(booking.amount)}
                  </p>
                </TableCell>

                {/* Status */}
                <TableCell className="py-3 text-center w-24">
                  <div className="flex justify-center">
                    <Badge
                      size="sm"
                      color={
                        booking.status === "confirmed"
                          ? "success"
                          : booking.status === "cancelled"
                          ? "error"
                          : "warning"
                      }
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </TableCell>

                {/* Payment Status */}
                <TableCell className="py-3 text-center w-28 hidden md:table-cell">
                  <div className="flex justify-center">
                    <Badge
                      size="sm"
                      color={
                        booking.paymentStatus === "paid"
                          ? "success"
                          : booking.paymentStatus === "failed"
                          ? "error"
                          : "warning"
                      }
                    >
                      {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                    </Badge>
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3 text-center w-32">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/booking/view/${booking.id}`}
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
                      title="Cancel"
                      onClick={() => console.log('Cancel booking', booking.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer with pagination */}
      <SmartPagination
        pagination={pagination}
        totalRecords={bookingsData?.total || 0}
        onPaginationChange={(newPagination) => updatePagination(newPagination)}
        className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
      />
    </div>
  );
}