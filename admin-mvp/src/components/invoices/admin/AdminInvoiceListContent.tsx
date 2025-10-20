'use client';

import React, { useState } from 'react';
import { useListState } from '@/hooks/useListState';
import { 
  useAdminInvoices, 
  useBulkInvoiceOperation, 
  useBulkSendInvoices,
  type AdminInvoice,
  type AdminInvoicesParams 
} from '@/hooks/useAdminInvoices';
import { 
  SearchInput, 
  FilterDropdown, 
  SmartPagination, 
  LoadingState, 
  ErrorState 
} from '@/components/ui';
import { InvoiceStatusBadge } from '@/components/invoices/shared/InvoiceStatusBadge';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Eye, 
  Send, 
  MoreHorizontal, 
  Plus, 
  FileText,
  DollarSign,
  Calendar,
  Users,
  CheckSquare,
  Square
} from 'lucide-react';

interface AdminInvoiceListContentProps {
  onViewInvoice?: (invoice: AdminInvoice) => void;
  onCreateInvoice?: () => void;
}

export default function AdminInvoiceListContent({ 
  onViewInvoice, 
  onCreateInvoice 
}: AdminInvoiceListContentProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const {
    filters,
    pagination,
    sorting,
    updateFilters,
    updatePagination,
    updateSorting,
    clearFilters,
  } = useListState<AdminInvoicesParams>({
    defaultFilters: {
      search: '',
      status: '',
      type: '',
      customerId: '',
      partnerId: '',
      dateFrom: '',
      dateTo: '',
      minAmount: undefined,
      maxAmount: undefined,
    },
    defaultSorting: { sortBy: 'createdAt', sortOrder: 'desc' },
    defaultPagination: { page: 1, limit: 10 },
  });

  const queryParams = {
    ...filters,
    ...pagination,
    ...sorting,
  };

  const { data, isLoading, error } = useAdminInvoices(queryParams);
  const bulkOperationMutation = useBulkInvoiceOperation();
  const bulkSendMutation = useBulkSendInvoices();

  const invoices = data?.invoices || [];
  const total = data?.total || 0;
  const summary = data?.summary;

  // Filter configurations
  const filterFields = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending' },
        { value: 'sent', label: 'Sent' },
        { value: 'viewed', label: 'Viewed' },
        { value: 'paid', label: 'Paid' },
        { value: 'partially_paid', label: 'Partially Paid' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'refunded', label: 'Refunded' },
        { value: 'disputed', label: 'Disputed' },
      ],
      value: filters.status || '',
    },
    {
      key: 'type',
      label: 'Type',
      options: [
        { value: '', label: 'All Types' },
        { value: 'booking', label: 'Booking' },
        { value: 'subscription', label: 'Subscription' },
        { value: 'service', label: 'Service' },
        { value: 'product', label: 'Product' },
        { value: 'commission', label: 'Commission' },
        { value: 'refund', label: 'Refund' },
        { value: 'credit_note', label: 'Credit Note' },
        { value: 'debit_note', label: 'Debit Note' },
      ],
      value: filters.type || '',
    },
  ];

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map(invoice => invoice.id));
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  // Bulk actions
  const handleBulkSend = async () => {
    if (selectedInvoices.length === 0) return;
    
    try {
      await bulkSendMutation.mutateAsync(selectedInvoices);
      setSelectedInvoices([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Failed to send invoices:', error);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedInvoices.length === 0) return;
    
    try {
      await bulkOperationMutation.mutateAsync({
        operation: 'update_status',
        invoiceIds: selectedInvoices,
        operationData: { status }
      });
      setSelectedInvoices([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Failed to update invoice status:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedInvoices.length} invoice(s)?`)) {
      return;
    }
    
    try {
      await bulkOperationMutation.mutateAsync({
        operation: 'delete_invoices',
        invoiceIds: selectedInvoices,
      });
      setSelectedInvoices([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Failed to delete invoices:', error);
    }
  };

  // Sorting handler
  const handleSort = (field: string) => {
    const newOrder = sorting.sortBy === field && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
    updateSorting({ sortBy: field, sortOrder: newOrder });
  };

  if (isLoading) {
    return <LoadingState message="Loading invoices..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load invoices" onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Admin Invoice Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage all invoices across the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedInvoices.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="flex items-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              {selectedInvoices.length} selected
            </Button>
          )}
          {onCreateInvoice && (
            <Button
              onClick={onCreateInvoice}
              className="flex items-center gap-2 bg-[#d4203d] hover:bg-[#b91c3c] text-white"
            >
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(summary.totalAmount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.paidAmount)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(summary.pendingAmount)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.totalCount}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {showBulkActions && selectedInvoices.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Bulk Actions ({selectedInvoices.length} selected):
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkSend}
              disabled={bulkSendMutation.isPending}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Send className="h-4 w-4 mr-1" />
              Send
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusUpdate('paid')}
              disabled={bulkOperationMutation.isPending}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Mark Paid
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusUpdate('cancelled')}
              disabled={bulkOperationMutation.isPending}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDelete}
              disabled={bulkOperationMutation.isPending}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={filters.search || ''}
            onChange={(value) => updateFilters({ search: value })}
            placeholder="Search by invoice number, customer name, or email..."
          />
        </div>
        <FilterDropdown
          filters={filterFields}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
          buttonText="Filters"
          className="shrink-0"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center justify-center w-4 h-4"
                  >
                    {selectedInvoices.length === invoices.length && invoices.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-[#d4203d]" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => handleSort('invoiceNumber')}
                >
                  Invoice #
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => handleSort('customer')}
                >
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => handleSort('totalAmount')}
                >
                  Amount
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => handleSort('createdAt')}
                >
                  Date
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => handleSort('dueDate')}
                >
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleSelectInvoice(invoice.id)}
                      className="flex items-center justify-center w-4 h-4"
                    >
                      {selectedInvoices.includes(invoice.id) ? (
                        <CheckSquare className="h-4 w-4 text-[#d4203d]" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.customer.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {invoice.customer.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="light" color="info">
                      {invoice.type.charAt(0).toUpperCase() + invoice.type.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(invoice.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {invoice.currency}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(invoice.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <InvoiceStatusBadge status={invoice.status as 'pending' | 'paid' | 'overdue' | 'cancelled' | 'draft'} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewInvoice?.(invoice)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSelectInvoice(invoice.id)}
                  className="flex items-center justify-center w-4 h-4"
                >
                  {selectedInvoices.includes(invoice.id) ? (
                    <CheckSquare className="h-4 w-4 text-[#d4203d]" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.invoiceNumber}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(invoice.createdAt)}
                  </div>
                </div>
              </div>
              <InvoiceStatusBadge status={invoice.status as 'pending' | 'paid' | 'overdue' | 'cancelled' | 'draft'} />
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Customer:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {invoice.customer.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                <Badge variant="light" color="info">
                  {invoice.type.charAt(0).toUpperCase() + invoice.type.slice(1)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Due Date:</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewInvoice?.(invoice)}
                className="flex items-center gap-1 flex-1"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {invoices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No invoices found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filters.search || filters.status || filters.type 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first invoice.'
            }
          </p>
          {onCreateInvoice && !filters.search && !filters.status && !filters.type && (
            <div className="mt-6">
              <Button
                onClick={onCreateInvoice}
                className="flex items-center gap-2 bg-[#d4203d] hover:bg-[#b91c3c] text-white"
              >
                <Plus className="h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <SmartPagination
          currentPage={pagination.page}
          totalPages={Math.ceil(total / pagination.limit)}
          totalItems={total}
          itemsPerPage={pagination.limit}
          onPageChange={(page) => updatePagination({ page })}
          onItemsPerPageChange={(limit) => updatePagination({ limit, page: 1 })}
        />
      )}
    </div>
  );
}