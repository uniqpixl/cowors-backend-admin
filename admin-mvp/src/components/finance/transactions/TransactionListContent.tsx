"use client";
import React, { useMemo } from "react";
import { Eye, Loader2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import SearchInput from "@/components/ui/search/SearchInput";
import FilterDropdown from "@/components/ui/filter/FilterDropdown";
import SmartPagination from "@/components/ui/pagination/SmartPagination";
import { useTransactions } from "@/hooks/useTransactions";
import { useListState } from "@/hooks/useListState";
import { Transaction } from "@/lib/api/types";
import { formatCoworsId, getIdType, formatCurrency, formatDate, getStatusColor } from '@/utils/formatters';

// Helper function to format date and time
const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime);
  return {
    date: date.toLocaleDateString('en-IN'),
    time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  };
};

// Helper function to get transaction type color (avoid blue)
const getTransactionTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'booking':
      return 'text-green-600 dark:text-green-400';
    case 'refund':
      return 'text-orange-600 dark:text-orange-400';
    case 'payout':
      return 'text-purple-600 dark:text-purple-400';
    case 'reward':
      return 'text-amber-600 dark:text-amber-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

// Helper function to get payment method color
const getPaymentMethodColor = (paymentMethod: string) => {
  switch (paymentMethod.toLowerCase()) {
    case 'razorpay':
      return 'text-[#d4203d]';
    case 'stripe':
      return 'text-[#635bff]';
    case 'cashfree':
      return 'text-[#007a3d]';
    case 'wallet':
      return 'text-[#444444]';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

export default function TransactionListContent() {
  // Use centralized list state management
  const { state, actions } = useListState({
    initialFilters: {
      search: "",
      status: "all",
      type: "all",
    }
  });

  // Fetch transactions using the custom hook
  const {
    transactions,
    loading: isLoading,
    error,
    pagination,
    refetch
  } = useTransactions({
    page: state.pagination.currentPage,
    limit: state.pagination.rowsPerPage,
    search: state.filters.search,
    status: state.filters.status !== 'all' ? state.filters.status : undefined,
    type: state.filters.type !== 'all' ? state.filters.type : undefined,
    sortBy: typeof state.sortState.field === 'string' ? state.sortState.field : 'createdAt',
    sortOrder: state.sortState.direction === 'asc' ? 'ASC' : 'DESC'
  });

  const totalRecords = pagination?.total || 0;
  const totalPages = Math.ceil(totalRecords / state.pagination.rowsPerPage);

  // Modal state for receipt
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);
  
  // Additional state for UI
  const [expandedCards, setExpandedCards] = React.useState<string[]>([]);

  // Helper functions
  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  // Filter configuration for FilterDropdown
  const filterConfig = [
    {
      key: 'status',
      label: 'Transaction Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'completed', label: 'Completed' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    {
      key: 'type',
      label: 'Transaction Type',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'booking', label: 'Booking' },
        { value: 'refund', label: 'Refund' },
        { value: 'commission', label: 'Commission' },
        { value: 'payout', label: 'Payout' }
      ]
    }
  ];

  // Check if all items are selected
  const allSelected = transactions && transactions.length > 0 && (state?.selectedItems?.length || 0) === transactions.length;
  const someSelected = (state?.selectedItems?.length || 0) > 0 && (state?.selectedItems?.length || 0) < (transactions?.length || 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Transactions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isLoading ? 'Loading...' : `Showing ${totalRecords} transactions`}
          </p>
        </div>

        {/* Bulk actions - Mobile optimized */}
        {(state?.selectedItems?.length || 0) > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
            <span className="text-sm text-brand-700 dark:text-brand-300 font-medium">
              {state?.selectedItems?.length || 0} transaction{(state?.selectedItems?.length || 0) > 1 ? 's' : ''} selected
            </span>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleCardExpansion('bulk-actions')}
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
              <Dropdown isOpen={expandedCards.includes('bulk-actions')} onClose={() => toggleCardExpansion('bulk-actions')}>
                <DropdownItem onClick={() => console.log('Export selected')}>Export Selected</DropdownItem>
                <DropdownItem onClick={() => console.log('Process refund')}>Process Refund</DropdownItem>
                <DropdownItem onClick={() => console.log('Mark as completed')}>Mark as Completed</DropdownItem>
                <DropdownItem onClick={() => console.log('Delete transactions')}>Delete Transactions</DropdownItem>
              </Dropdown>
            </div>
          </div>
        )}

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <SearchInput
            value={state.filters.search}
            onChange={(value) => actions.updateFilters({ search: value })}
            placeholder="Search transactions by ID, name, or amount..."
            className="w-full sm:w-80"
          />

          {/* Action buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {/* Filter button */}
            <FilterDropdown
              filters={filterConfig.map(config => ({
                ...config,
                value: state.filters[config.key] || 'all'
              }))}
              onFiltersChange={actions.updateFilters}
              onClearFilters={actions.clearFilters}
            />

            {/* Export button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log('Export data')}
              className="h-10 px-3 whitespace-nowrap"
            >
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={() => actions.toggleSelectAll((transactions || []).map(t => t.id))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400"
                  onClick={() => actions.updateSort('id')}
                >
                  Transaction ID
                  {state.sortState.field === 'id' && (
                    <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400"
                  onClick={() => actions.updateSort('type')}
                >
                  Type
                  {state.sortState.field === 'type' && (
                    <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400"
                  onClick={() => actions.updateSort('amount')}
                >
                  Amount
                  {state.sortState.field === 'amount' && (
                    <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400"
                  onClick={() => actions.updateSort('name')}
                >
                  Name
                  {state.sortState.field === 'name' && (
                    <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400"
                  onClick={() => actions.updateSort('status')}
                >
                  Status
                  {state.sortState.field === 'status' && (
                    <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400"
                  onClick={() => actions.updateSort('paymentMethod')}
                >
                  Payment Method
                  {state.sortState.field === 'paymentMethod' && (
                    <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400"
                  onClick={() => actions.updateSort('dateTime')}
                >
                  Date & Time
                  {state.sortState.field === 'dateTime' && (
                    <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 tracking-wider dark:text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                      <span className="text-gray-500 dark:text-gray-400">Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="text-red-500 dark:text-red-400">
                      Error loading transactions: {error}
                      <button 
                        onClick={() => refetch()} 
                        className="ml-2 text-blue-600 hover:text-blue-700 underline"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (transactions?.length || 0) === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <span className="text-gray-500 dark:text-gray-400">No transactions found</span>
                  </td>
                </tr>
              ) : (
                (transactions || []).map((transaction) => {
                  const { date, time } = formatDateTime(transaction.createdAt);
                  return (
                    <tr key={transaction.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={state?.selectedItems?.includes(transaction.id) || false}
                          onChange={() => actions.selectItem(transaction.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                          {formatCoworsId(transaction.id)}
                          {getIdType(transaction.id) === 'uuid' && (
                            <span className="ml-1 text-orange-500" title="Legacy UUID format">
                              ⚠️
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getTransactionTypeColor(transaction.type)}`}>{transaction.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(transaction.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700 dark:text-gray-300">{transaction.userId || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs ${
                            getStatusColor(transaction.status)
                          }`}
                        >
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{transaction.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">{date}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="text-red-600 hover:text-red-700 transition-colors"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowReceiptModal(true);
                          }}
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with pagination */}
        <SmartPagination
          pagination={state.pagination}
          totalRecords={totalRecords}
          onPaginationChange={actions.updatePagination}
          className="mt-6"
        />
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Transaction Receipt
                </h3>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Transaction ID</span>
                      <p className="font-medium text-gray-900 dark:text-white font-mono">
                        {formatCoworsId(selectedTransaction.id)}
                        {getIdType(selectedTransaction.id) === 'uuid' && (
                          <span className="ml-1 text-orange-500" title="Legacy UUID format">
                            ⚠️
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Type</span>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedTransaction.type}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Amount</span>
                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedTransaction.amount)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">User ID</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedTransaction.userId}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Type</span>
                      <p className={`font-medium ${getTransactionTypeColor(selectedTransaction.type)}`}>{selectedTransaction.type}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Date & Time</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {(() => {
                          const { date, time } = formatDateTime(selectedTransaction.createdAt);
                          return `${date} at ${time}`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => console.log('Download receipt', selectedTransaction.id)}
                    className="flex-1 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
                  >
                    Download Receipt
                  </button>
                  <button
                    onClick={() => setShowReceiptModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};