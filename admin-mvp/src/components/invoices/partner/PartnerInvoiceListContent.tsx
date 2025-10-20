'use client';

import React, { useState } from 'react';
import { Eye, Download, X, Printer, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { Dropdown } from '@/components/ui/dropdown/Dropdown';
import { DropdownItem } from '@/components/ui/dropdown/DropdownItem';
import { usePartnerInvoices, useUpdatePartnerInvoiceStatus } from '@/hooks/usePartnerInvoices';
import { toast } from 'sonner';
import { useListState } from '@/hooks/useListState';
import { SearchInput, FilterDropdown, SmartPagination, LoadingState, ErrorState } from '@/components/ui';
import { formatDate, formatCurrency, getStatusColor } from '@/utils/formatters';

interface PartnerInvoice {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  bookingId: string;
  invoiceNumber: string;
  grossBookingValue: number;
  commissionPercentage: number;
  commissionAmount: number;
  gstAmount: number;
  netSettlement: number;
  date: string;
  status: "paid" | "pending" | "overdue" | "cancelled";
  dueDate: string;
  description: string;
  partnerAddress: string;
  paymentReference: string;
}

// Invoice Modal Interface
interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: PartnerInvoice | null;
}

// Invoice Modal Component
const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, invoice }) => {
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  
  if (!isOpen || !invoice) return null;

  const handleDownloadPDF = () => {
    console.log('Downloading PDF for invoice:', invoice.invoiceNumber);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResendEmail = () => {
    console.log('Resending email for invoice:', invoice.invoiceNumber);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-1 sm:m-2 dark:bg-gray-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Invoice Details</h2>
              <p className="text-sm text-gray-600">Cowors Technologies Pvt Ltd</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-2 sm:p-3 md:p-4">
          {/* Invoice Header */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="bg-gray-50 p-3 sm:p-4 md:p-6 rounded-lg border">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">COMMISSION INVOICE</h1>
                  <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-700">#{invoice.invoiceNumber}</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="mb-4">
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Invoice Date</p>
                    <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{formatDate(invoice.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Due Date</p>
                    <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{formatDate(invoice.dueDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parties Section */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Parties Involved</h3>
            <div className="bg-white border rounded-lg p-3 sm:p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* From (Cowors) */}
                <div>
                  <h4 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">From (Service Provider)</h4>
                  <div className="space-y-1 sm:space-y-2">
                    <p className="font-bold text-gray-900 text-sm sm:text-base md:text-lg">Cowors Technologies Pvt Ltd</p>
                    <p className="text-xs sm:text-sm text-gray-700">123 Business District</p>
                    <p className="text-xs sm:text-sm text-gray-700">Mumbai, MH 400001</p>
                    <div className="mt-2 sm:mt-3 pt-2 border-t border-gray-100">
                      <p className="text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">GST Number:</span>
                      </p>
                      <p className="font-mono text-xs sm:text-sm text-gray-900">27ABCDE1234F1Z5</p>
                    </div>
                  </div>
                </div>

                {/* To (Partner) */}
                <div>
                  <h4 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">To (Partner)</h4>
                  <div className="space-y-1 sm:space-y-2">
                    <p className="font-bold text-gray-900 text-sm sm:text-base md:text-lg">{invoice.partnerName}</p>
                    <p className="text-xs sm:text-sm text-gray-700">{invoice.partnerAddress}</p>
                    <div className="mt-2 sm:mt-3 pt-2 border-t border-gray-100">
                      <p className="text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">Partner ID:</span>
                      </p>
                      <p className="font-mono text-xs sm:text-sm text-gray-900">{invoice.partnerId}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Commission Details */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Commission Breakdown</h3>
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking ID
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gross Value
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission %
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        {invoice.description}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-mono text-gray-900">
                        {invoice.bookingId}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(invoice.grossBookingValue)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right">
                        {invoice.commissionPercentage}%
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(invoice.commissionAmount)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td colSpan={4} className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 text-right">
                        Subtotal (Before Tax):
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-gray-900 text-right">
                        {formatCurrency(invoice.commissionAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Financial Summary Card */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Financial Summary</h3>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 p-3 sm:p-4 md:p-6 rounded-lg">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center py-1 sm:py-2">
                  <span className="text-xs sm:text-sm md:text-base text-gray-700 font-medium">Commission Amount:</span>
                  <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{formatCurrency(invoice.commissionAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2">
                  <span className="text-xs sm:text-sm md:text-base text-gray-700 font-medium">GST (18%):</span>
                  <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{formatCurrency(invoice.gstAmount)}</span>
                </div>
                <div className="border-t-2 border-gray-300 pt-3 sm:pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base md:text-xl font-bold text-gray-900">Net Settlement:</span>
                    <span className={`text-lg sm:text-xl md:text-2xl font-bold px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-lg ${
                      invoice.status.toLowerCase() === 'paid' 
                        ? 'text-green-700 bg-green-100 border border-green-300' 
                        : 'text-red-700 bg-red-100 border border-red-300'
                    }`}>
                      {formatCurrency(invoice.netSettlement)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information Card */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Payment Information</h3>
            <div className={`border-2 p-3 sm:p-4 md:p-6 rounded-lg ${
              invoice.status.toLowerCase() === 'paid'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-2 sm:mr-3 ${
                      invoice.status.toLowerCase() === 'paid' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`font-bold text-sm sm:text-base md:text-lg ${
                      invoice.status.toLowerCase() === 'paid' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      Status: {invoice.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Settlement Date</p>
                      <p className={`text-sm sm:text-base font-semibold ${
                        invoice.status.toLowerCase() === 'paid' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {invoice.status.toLowerCase() === 'paid' ? formatDate(invoice.date) : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Payment Mode</p>
                      <p className={`text-sm sm:text-base font-semibold ${
                        invoice.status.toLowerCase() === 'paid' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {invoice.status.toLowerCase() === 'paid' ? 'Bank Transfer' : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Payment Reference</p>
                      <p className={`text-sm sm:text-base font-mono font-semibold ${
                        invoice.status.toLowerCase() === 'paid' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {invoice.paymentReference}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs sm:text-sm mt-2 sm:mt-3 ${
                        invoice.status.toLowerCase() === 'paid' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {invoice.status.toLowerCase() === 'paid' 
                          ? 'Commission settlement processed by Cowors'
                          : 'Payment processing pending'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Notes & Terms */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => setIsNotesExpanded(!isNotesExpanded)}
              className="flex items-center justify-between w-full p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Notes & Terms</h3>
              {isNotesExpanded ? (
                <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              )}
            </button>
            {isNotesExpanded && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg">
                <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-700">
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">Service Description:</h4>
                    <p>This invoice is issued by Cowors Technologies Pvt Ltd for marketplace facilitation services provided to the partner.</p>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">Commission Structure:</h4>
                    <p>Commission is deducted from gross booking value as per the partnership agreement. GST is applicable on commission amount as per Indian tax regulations.</p>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">Payment Terms:</h4>
                    <p>Net settlement amount will be processed within 7-10 business days from invoice generation. Payment will be made via bank transfer to the registered account.</p>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">Compliance:</h4>
                    <p>This invoice complies with GST regulations and serves as a valid tax document for accounting purposes.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 border-t bg-gray-50">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Print</span>
            <span className="sm:hidden">Print</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
          <button
            onClick={handleResendEmail}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Resend Email</span>
            <span className="sm:hidden">Email</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PartnerInvoiceListContent() {
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<PartnerInvoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use the reusable list state hook
  const { state, actions } = useListState<PartnerInvoice>({
    initialFilters: { search: '', status: 'all' },
    initialSort: { field: 'date', direction: 'desc' }
  });

  // API hooks
  const { data: invoicesData, isLoading, error } = usePartnerInvoices({
    page: state.pagination.currentPage,
    limit: state.pagination.rowsPerPage,
    search: state.searchTerm,
    status: state.filters.status !== 'all' ? state.filters.status : undefined,
    sortBy: state.sortState.field,
    sortOrder: state.sortState.direction,
  });

  // Handle view invoice
  const handleViewInvoice = (invoice: PartnerInvoice) => {
    setSelectedInvoiceForModal(invoice);
    setIsModalOpen(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvoiceForModal(null);
  };

  // Extract data from API response
  const invoices = invoicesData?.data || [];
  const totalRecords = invoicesData?.total || 0;

  // Show loading state
  if (isLoading) {
    return <LoadingState message="Loading partner invoices..." />;
  }

  // Show error state
  if (error) {
    return <ErrorState message="Failed to load partner invoices" onRetry={() => window.location.reload()} />;
  }

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const bulkActionOptions = [
    { value: 'export', label: 'Export Selected' },
    { value: 'generate', label: 'Generate Invoices' },
    { value: 'send', label: 'Send Invoices' },
    { value: 'mark_paid', label: 'Mark as Paid' },
    { value: 'cancel', label: 'Cancel Invoices' }
  ];

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} for invoices:`, state.selectedItems);
    // Handle bulk actions here
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 dark:border-gray-800 dark:bg-white/[0.03] px-6 sm:px-6 lg:px-8 pb-6 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Partner Invoices
          </h3>
          <p className="text-base text-gray-500 dark:text-gray-400 mt-2">
            Manage commission invoices issued to workspace partners
          </p>
        </div>

        {/* Bulk actions */}
        {state.selectedItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              {state.selectedItems.length} invoice{state.selectedItems.length > 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        {/* Search and Actions */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <SearchInput
            value={state.searchTerm}
            onChange={actions.setSearchTerm}
            placeholder="Search by invoice number, partner name, or ID..."
            className="w-full lg:w-80"
          />

          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:flex-shrink-0">
            <FilterDropdown
              filters={[{
                key: 'status',
                label: 'Status',
                value: state.filters.status || 'all',
                options: [
                  { value: 'all', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
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

            <Button
              variant="primary"
              size="sm"
              onClick={() => console.log('Generate new invoice')}
              className="h-10 px-3 whitespace-nowrap"
            >
              <span className="text-lg font-bold mr-1">+</span>
              Invoice
            </Button>

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
                    onChange={(e) => actions.toggleSelectAll(invoices.map((i: PartnerInvoice) => i.id))}
                    className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400 min-w-[80px]"
                  onClick={() => actions.updateSort('partnerId')}
                >
                  ID
                  {state.sortState.field === 'partnerId' && (
                    <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400 min-w-[140px]"
                  onClick={() => actions.updateSort('partnerName')}
                >
                  Name
                  {state.sortState.field === 'partnerName' && (
                    <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400 min-w-[120px]"
                  onClick={() => actions.updateSort('invoiceNumber')}
                >
                  Invoice
                  {state.sortState.field === 'invoiceNumber' && (
                    <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400 min-w-[100px]"
                  onClick={() => actions.updateSort('netSettlement')}
                >
                  Amount
                  {state.sortState.field === 'netSettlement' && (
                    <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400 min-w-[100px]"
                  onClick={() => actions.updateSort('date')}
                >
                  Date
                  {state.sortState.field === 'date' && (
                    <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500 tracking-wider cursor-pointer dark:text-gray-400 min-w-[100px]"
                  onClick={() => actions.updateSort('status')}
                >
                  Status
                  {state.sortState.field === 'status' && (
                    <span className="ml-1">{state.sortState.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 tracking-wider dark:text-gray-400 min-w-[60px]">
                  View
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {invoices.map((invoice: PartnerInvoice) => {
                const invoiceDate = formatDate(invoice.date);
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={state.selectedItems.includes(invoice.id)}
                        onChange={(e) => actions.selectItem(invoice.id)}
                        className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-800 dark:text-white/90">{invoice.partnerId}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">{invoice.partnerName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{invoice.partnerEmail}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-800 dark:text-white/90">{invoice.invoiceNumber}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-gray-800 dark:text-white/90">{formatCurrency(invoice.netSettlement)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">{invoiceDate}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 justify-center gap-1 rounded-full font-medium text-xs ${
                          getStatusColor(invoice.status)
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleViewInvoice(invoice)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {invoices.map((invoice: PartnerInvoice) => {
            const invoiceDate = formatDate(invoice.date);
            return (
              <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={state.selectedItems.includes(invoice.id)}
                      onChange={(e) => actions.selectItem(invoice.id)}
                      className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-white/90">{invoice.invoiceNumber}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{invoice.partnerId}</div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 justify-center gap-1 rounded-full font-medium text-xs ${
                      getStatusColor(invoice.status)
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Partner:</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">{invoice.partnerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Amount:</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{formatCurrency(invoice.netSettlement)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Date:</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{invoiceDate}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleViewInvoice(invoice)}
                    className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-xs">View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      <SmartPagination
        pagination={{
          currentPage: state.pagination.currentPage,
          rowsPerPage: state.pagination.rowsPerPage
        }}
        totalRecords={totalRecords}
        onPaginationChange={(newPagination) => actions.updatePagination(newPagination)}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        invoice={selectedInvoiceForModal}
      />
    </div>
  );
}