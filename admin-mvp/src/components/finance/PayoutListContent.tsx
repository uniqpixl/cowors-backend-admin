"use client";
import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { usePayouts } from "@/hooks/usePayouts";
import { formatCurrency, formatDate, formatTime, formatCoworsId, getIdType } from '@/utils/formatters';
import { useListState } from '@/hooks/useListState';
import { SearchInput, FilterDropdown, SmartPagination, LoadingState, ErrorState } from '@/components/ui';
import { Wallet, Clock, CheckCircle, XCircle, Eye, X, Loader2 } from 'lucide-react';

// Define the TypeScript interface for payout data
interface PartnerPayout {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  requestedAmount: number;
  walletBalance: number;
  status: "pending" | "approved" | "rejected" | "processed";
  payoutGateway: string;
  account: string;
  isAutomated: boolean;
  createdAt: string;
  updatedAt: string;
}

const PayoutListContent: React.FC = () => {
  // Modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<PartnerPayout | null>(null);
  
  // Additional state for bulk actions
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Use centralized list state management
  const { state, actions } = useListState<PartnerPayout>({
    initialFilters: {
      search: "",
      status: "",
    },
    initialSort: { field: 'createdAt', direction: 'desc' }
  });

  // Bulk selection handlers
  const handleSelectPayout = (payoutId: string) => {
    setSelectedPayouts(prev => 
      prev.includes(payoutId) 
        ? prev.filter(id => id !== payoutId)
        : [...prev, payoutId]
    );
  };

  const handleSelectAll = (payoutIds: string[]) => {
    if (selectAll) {
      setSelectedPayouts([]);
      setSelectAll(false);
    } else {
      setSelectedPayouts(payoutIds);
      setSelectAll(true);
    }
  };

  // API data fetching
  const { 
    payouts: payoutsData, 
    totalPayouts: totalPayoutsCount,
    totalPages,
    isLoading, 
    error,
    refetch 
  } = usePayouts({
    page: state.pagination.currentPage,
    limit: state.pagination.rowsPerPage,
    search: state.filters.search,
    status: state.filters.status,
    sortBy: state.sortState.field || 'createdAt',
    sortOrder: state.sortState.direction,
  });

  // Transform and calculate data
  const payouts = useMemo(() => payoutsData || [], [payoutsData]);
  const totalPendingPayouts = payouts.filter(p => p.status === 'pending').length;
  const totalProcessedPayouts = payouts.filter(p => p.status === 'processed').length;

  // Filter options for the filter dropdown
  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'processed', label: 'Processed' }
      ],
      value: state.filters.status || ''
    }
  ];

  // Loading and error states
  if (isLoading) {
    return <LoadingState message="Loading payouts..." />;
  }

  if (error) {
    return <ErrorState message="Error loading payouts" error={error} onRetry={refetch} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Payouts
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and manage all partner payout requests
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg dark:bg-green-900/20">
                <Wallet className="text-green-600 size-5 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Payout Requests
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalPayoutsCount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg dark:bg-purple-900/20">
                <Clock className="text-purple-600 size-5 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Pending Payouts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalPendingPayouts.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg dark:bg-orange-900/20">
                <CheckCircle className="text-orange-600 size-5 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Processed Payouts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalProcessedPayouts.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header with Search and Actions */}
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <SearchInput
              value={state.filters.search}
              onChange={(value) => actions.updateFilters({ search: value })}
              placeholder="Search by partner name, email, or ID..."
              className="flex-1 max-w-sm"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <FilterDropdown
              filters={filterOptions}
              onFiltersChange={actions.updateFilters}
              onClearFilters={actions.clearFilters}
            />
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPayouts.length > 0 && (
          <div className="border-t border-gray-200 bg-orange-50 p-4 dark:border-gray-700 dark:bg-orange-900/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                {selectedPayouts.length} payout(s) selected
              </span>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Approve Selected</span>
                  <span className="sm:hidden">Approve</span>
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                  <XCircle className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Reject Selected</span>
                  <span className="sm:hidden">Reject</span>
                </Button>
                <Button size="sm" variant="outline" className="text-orange-600 border-orange-600 hover:bg-orange-50">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Hold Selected</span>
                  <span className="sm:hidden">Hold</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 dark:border-gray-700">
                <TableCell className="w-12 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={() => handleSelectAll(payouts.map(p => p.id))}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </div>
                </TableCell>
                <TableCell className="w-24 py-3 font-medium text-gray-500 text-left text-theme-xs dark:text-gray-400">
                  <button
                    onClick={() => actions.updateSort('partnerId')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Partner ID
                    {state.sortState.field === 'partnerId' && (
                      <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </TableCell>
                <TableCell className="w-32 py-3 font-medium text-gray-500 text-left text-theme-xs dark:text-gray-400">
                  <button
                    onClick={() => actions.updateSort('partnerName')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Partner Name
                    {state.sortState.field === 'partnerName' && (
                      <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </TableCell>
                <TableCell className="w-24 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 hidden md:table-cell">
                  <button
                    onClick={() => actions.updateSort('requestedAmount')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 mx-auto"
                  >
                    Requested Amount
                    {state.sortState.field === 'requestedAmount' && (
                      <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </TableCell>
                <TableCell className="w-24 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 hidden md:table-cell">
                  <button
                    onClick={() => actions.updateSort('walletBalance')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 mx-auto"
                  >
                    Wallet Balance
                    {state.sortState.field === 'walletBalance' && (
                      <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </TableCell>
                <TableCell className="w-32 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 hidden md:table-cell">
                  <button
                    onClick={() => actions.updateSort('createdAt')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 mx-auto"
                  >
                    Date &amp; Time
                    {state.sortState.field === 'createdAt' && (
                      <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </TableCell>
                <TableCell className="w-28 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 hidden md:table-cell">
                  <button
                    onClick={() => actions.updateSort('status')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 mx-auto"
                  >
                    Status
                    {state.sortState.field === 'status' && (
                      <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </TableCell>
                <TableCell className="w-20 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <span className="text-gray-500 dark:text-gray-400">No payouts found</span>
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((payout) => {
                  const date = formatDate(payout.createdAt);
                  const time = formatTime(payout.createdAt);
                  return (
                    <TableRow key={payout.id} className="">
                      {/* Checkbox */}
                      <TableCell className="py-3 text-left w-12">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedPayouts.includes(payout.id)}
                            onChange={() => handleSelectPayout(payout.id)}
                            className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                      </TableCell>

                      {/* Partner ID */}
                      <TableCell className="py-3 text-left w-24">
                        <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                          {formatCoworsId(payout.partnerId)}
                          {getIdType(payout.partnerId) === 'uuid' && (
                            <span className="ml-1 text-orange-500" title="Legacy UUID format">
                              ⚠️
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Partner Name */}
                      <TableCell className="py-3 text-left w-32">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{payout.partnerName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{payout.partnerEmail}</div>
                      </TableCell>

                      {/* Requested Amount */}
                      <TableCell className="py-3 text-center w-24 hidden md:table-cell">
                        <p className="text-red-600 dark:text-red-400 font-medium">
                          {formatCurrency(payout.requestedAmount)}
                        </p>
                      </TableCell>

                      {/* Wallet Balance */}
                      <TableCell className="py-3 text-center w-24 hidden md:table-cell">
                        <p className="text-green-600 dark:text-green-400 font-medium">
                          {formatCurrency(payout.walletBalance)}
                        </p>
                      </TableCell>

                      {/* Date & Time */}
                      <TableCell className="py-3 text-center w-32 hidden md:table-cell">
                        <div className="text-sm text-gray-900 dark:text-white">{date}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{time}</div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 text-center w-28 hidden md:table-cell">
                        <Badge
                          size="sm"
                          color={
                            payout.status === "processed"
                              ? "success"
                              : payout.status === "approved"
                              ? "success"
                              : payout.status === "pending"
                              ? "warning"
                              : "error"
                          }
                        >
                          {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-center w-20">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPayout(payout);
                            setIsViewModalOpen(true);
                          }}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer with pagination */}
        <SmartPagination
          pagination={state.pagination}
          totalRecords={totalPayoutsCount || 0}
          onPaginationChange={(pagination) => actions.updatePagination(pagination)}
          className="mt-6"
        />
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Payout Details
                </h3>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Partner Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Name:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPayout.partnerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Partner ID:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                        {formatCoworsId(selectedPayout.partnerId)}
                        {getIdType(selectedPayout.partnerId) === 'uuid' && (
                          <span className="ml-1 text-orange-500" title="Legacy UUID format">
                            ⚠️
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPayout.partnerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Payout Gateway:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPayout.payoutGateway}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Account:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPayout.account}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payout Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Request ID:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                        {formatCoworsId(selectedPayout.id)}
                        {getIdType(selectedPayout.id) === 'uuid' && (
                          <span className="ml-1 text-orange-500" title="Legacy UUID format">
                            ⚠️
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Requested Amount:</span>
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(selectedPayout.requestedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Wallet Balance:</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(selectedPayout.walletBalance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                      <Badge
                        color={
                          selectedPayout.status === "processed"
                            ? "success"
                            : selectedPayout.status === "approved"
                            ? "success"
                            : selectedPayout.status === "pending"
                            ? "warning"
                            : "error"
                        }
                      >
                        {selectedPayout.status.charAt(0).toUpperCase() + selectedPayout.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Request Date:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {(() => {
                          const date = formatDate(selectedPayout.createdAt);
                          const time = formatTime(selectedPayout.createdAt);
                          return `${date} at ${time}`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Automated:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedPayout.isAutomated ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => console.log('Approve payout', selectedPayout.id)}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    disabled={selectedPayout.status !== 'pending'}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Payout
                  </Button>
                  <Button
                    onClick={() => console.log('Reject payout', selectedPayout.id)}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    disabled={selectedPayout.status !== 'pending'}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Payout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutListContent;