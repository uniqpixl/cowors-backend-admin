"use client";

import React, { useState } from 'react';
import { Eye, Download, Printer } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import SearchInput from '@/components/ui/search/SearchInput';
import FilterDropdown from '@/components/ui/filter/FilterDropdown';
import SmartPagination from '@/components/ui/pagination/SmartPagination';
import LoadingState from '@/components/ui/loading/LoadingState';
import ErrorState from '@/components/ui/error/ErrorState';
import { useListState } from '@/hooks/useListState';
import { useUserInvoices, useUpdateUserInvoiceStatus } from '@/hooks/useUserInvoices';
import { formatDate, formatCurrency, getStatusColor } from '@/utils/formatters';

interface UserInvoice {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface InvoiceModalProps {
  invoice: UserInvoice;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Invoice Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Invoice ID
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{invoice.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  User Name
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{invoice.userName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  User Email
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{invoice.userEmail}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{formatCurrency(invoice.amount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Created Date
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{new Date(invoice.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{invoice.description || 'N/A'}</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Download invoice', invoice.id)}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Print invoice', invoice.id)}
                className="flex-1"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function UserInvoiceListContent() {
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<UserInvoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use the shared list state hook
  const { state, actions } = useListState<UserInvoice>({});

  // API hooks
  const { 
    data: invoicesData, 
    isLoading, 
    error, 
    refetch 
  } = useUserInvoices({
    page: state.pagination.currentPage,
    limit: state.pagination.rowsPerPage,
    search: state.searchTerm,
    status: state.filters.status,
    sortBy: state.sortState.field || 'date',
    sortOrder: state.sortState.direction || 'desc'
  });

  const updateStatusMutation = useUpdateUserInvoiceStatus();

  const handleViewInvoice = (invoice: UserInvoice) => {
    setSelectedInvoiceForModal(invoice);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvoiceForModal(null);
  };

  // Extract data from API response
  const invoices = invoicesData?.data || [];
  const totalRecords = invoicesData?.total || 0;

  // Loading and error states
  if (isLoading) {
    return <LoadingState message="Loading invoices..." />;
  }

  if (error) {
    return <ErrorState message="Error loading invoices" error={error.message} />;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 dark:border-gray-800 dark:bg-white/[0.03] px-6 sm:px-6 lg:px-8 pb-6 pt-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">User Invoices</h1>
          {state.selectedItems.length > 0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {state.selectedItems.length} selected
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          {/* Search Bar */}
          <SearchInput
            value={state.searchTerm}
            onChange={actions.setSearchTerm}
            placeholder="Search by invoice number, user, or booking ID..."
            className="w-full lg:w-80"
          />

          {/* Action buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {/* Filter button */}
            <FilterDropdown
              filters={[{
                key: 'status',
                label: 'Status',
                value: state.filters.status || 'all',
                options: [
                  { value: 'all', label: 'All Statuses' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'sent', label: 'Sent' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'overdue', label: 'Overdue' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]
              }]}
              onFiltersChange={(newFilters) => {
                actions.updateFilters(newFilters);
              }}
              onClearFilters={() => actions.clearFilters()}
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

      {/* Responsive Table Container */}
      <div className="w-full">
        {/* Desktop Table */}
        <div className="hidden lg:block">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <tr>
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={state.selectedItems.length === invoices.length && invoices.length > 0}
                      onChange={() => actions.toggleSelectAll(invoices.map(invoice => invoice.id))}
                      className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                    />
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400"
                    onClick={() => actions.updateSort('userId')}
                  >
                    ID
                    {state.sortState.field === 'userId' && (
                      <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400"
                    onClick={() => actions.updateSort('userName')}
                  >
                    Name
                    {state.sortState.field === 'userName' && (
                      <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400"
                    onClick={() => actions.updateSort('id')}
                  >
                    Invoice ID
                    {state.sortState.field === 'id' && (
                      <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400"
                    onClick={() => actions.updateSort('amount')}
                  >
                    Amount
                    {state.sortState.field === 'amount' && (
                      <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400"
                    onClick={() => actions.updateSort('createdAt')}
                  >
                    Created Date
                    {state.sortState.field === 'createdAt' && (
                      <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 tracking-wider dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 tracking-wider dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={state.selectedItems.includes(invoice.id)}
                        onChange={() => actions.selectItem(invoice.id)}
                        className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-gray-800 dark:text-white/90 font-mono font-medium">
                        {invoice.userId}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-800 text-sm dark:text-white/90">
                        {invoice.userName}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {invoice.id}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {formatCurrency(invoice.amount)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-800 dark:text-white/90">
                        {formatDate(invoice.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={state.selectedItems.includes(invoice.id)}
                    onChange={() => actions.selectItem(invoice.id)}
                    className="rounded border-gray-300 text-gray-600 focus:ring-gray-500 mr-3 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                      {invoice.id}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(invoice.createdAt)}
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)} flex-shrink-0 ml-2`}>
                  {invoice.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center min-w-0">
                  <div className="h-6 w-6 mr-2 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {invoice.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">{invoice.userName}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  User ID: {invoice.userId}
                </div>
                <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Amount: {formatCurrency(invoice.amount)}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewInvoice(invoice)}
                  className="flex-1 h-10 text-sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Invoice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Download invoice', invoice.id)}
                  className="flex-1 h-10 text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <SmartPagination
        pagination={{
          currentPage: state.pagination.currentPage,
          rowsPerPage: state.pagination.rowsPerPage
        }}
        totalRecords={totalRecords}
        onPaginationChange={(newPagination) => {
          actions.updatePagination(newPagination);
        }}
      />

      {/* Invoice Modal */}
      {isModalOpen && selectedInvoiceForModal && (
        <InvoiceModal
          invoice={selectedInvoiceForModal}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}