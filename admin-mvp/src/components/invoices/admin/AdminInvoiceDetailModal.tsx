'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import TextArea from '@/components/form/input/TextArea';
import { InvoiceStatusBadge } from '@/components/invoices/shared/InvoiceStatusBadge';
import { 
  useUpdateAdminInvoice, 
  useUpdateAdminInvoiceStatus,
  useSendAdminInvoice,
  useRecordInvoicePayment,
  useProcessInvoiceRefund,
  useDeleteAdminInvoice,
  type AdminInvoice 
} from '@/hooks/useAdminInvoices';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Edit, 
  Send, 
  DollarSign, 
  RefreshCw, 
  Trash2, 
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminInvoiceDetailModalProps {
  invoice: AdminInvoice;
  isOpen: boolean;
  onClose: () => void;
  onInvoiceUpdated?: () => void;
}

export default function AdminInvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
  onInvoiceUpdated
}: AdminInvoiceDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState(invoice);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);

  // Mutations
  const updateInvoiceMutation = useUpdateAdminInvoice();
  const updateStatusMutation = useUpdateAdminInvoiceStatus();
  const sendInvoiceMutation = useSendAdminInvoice();
  const recordPaymentMutation = useRecordInvoicePayment();
  const processRefundMutation = useProcessInvoiceRefund();
  const deleteInvoiceMutation = useDeleteAdminInvoice();

  const handleSave = async () => {
    try {
      await updateInvoiceMutation.mutateAsync({
        id: invoice.id,
        data: {
          customer: editedInvoice.customer,
          lineItems: editedInvoice.lineItems,
          dueDate: editedInvoice.dueDate,
          notes: editedInvoice.notes,
          terms: editedInvoice.terms,
        }
      });
      setIsEditing(false);
      onInvoiceUpdated?.();
      toast.success('Invoice updated successfully');
    } catch {
      toast.error('Failed to update invoice');
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: invoice.id, status });
      onInvoiceUpdated?.();
      toast.success(`Invoice status updated to ${status}`);
    } catch {
      toast.error('Failed to update invoice status');
    }
  };

  const handleSendInvoice = async () => {
    try {
      await sendInvoiceMutation.mutateAsync(invoice.id);
      onInvoiceUpdated?.();
      toast.success('Invoice sent successfully');
    } catch {
      toast.error('Failed to send invoice');
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount))) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      await recordPaymentMutation.mutateAsync({
        id: invoice.id,
        amount: Number(paymentAmount),
        paymentDate: new Date().toISOString(),
        paymentMethod: 'manual',
        reference: `Manual payment recorded by admin`
      });
      setShowPaymentForm(false);
      setPaymentAmount('');
      onInvoiceUpdated?.();
      toast.success('Payment recorded successfully');
    } catch {
      toast.error('Failed to record payment');
    }
  };

  const handleProcessRefund = async () => {
    if (!refundAmount || isNaN(Number(refundAmount))) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    try {
      await processRefundMutation.mutateAsync({
        id: invoice.id,
        amount: Number(refundAmount),
        reason: 'Admin initiated refund'
      });
      setShowRefundForm(false);
      setRefundAmount('');
      onInvoiceUpdated?.();
      toast.success('Refund processed successfully');
    } catch {
      toast.error('Failed to process refund');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteInvoiceMutation.mutateAsync(invoice.id);
      onClose();
      onInvoiceUpdated?.();
      toast.success('Invoice deleted successfully');
    } catch {
      toast.error('Failed to delete invoice');
    }
  };

  const isLoading = updateInvoiceMutation.isPending || 
                   updateStatusMutation.isPending || 
                   sendInvoiceMutation.isPending ||
                   recordPaymentMutation.isPending ||
                   processRefundMutation.isPending ||
                   deleteInvoiceMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Invoice Details
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {invoice.invoiceNumber}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <InvoiceStatusBadge status={invoice.status as 'pending' | 'paid' | 'overdue' | 'cancelled' | 'draft'} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Information */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Invoice Number</Label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                    {invoice.invoiceNumber}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Type</Label>
                  <Badge variant="light" color="info">
                    {invoice.type.charAt(0).toUpperCase() + invoice.type.slice(1)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Issue Date</Label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDate(invoice.issueDate)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Due Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedInvoice.dueDate.split('T')[0]}
                      onChange={(e) => setEditedInvoice({
                        ...editedInvoice,
                        dueDate: e.target.value + 'T00:00:00.000Z'
                      })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDate(invoice.dueDate)}
                    </p>
                  )}
                </div>
                {invoice.paidDate && (
                  <div>
                    <Label className="text-sm text-gray-600 dark:text-gray-400">Paid Date</Label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDate(invoice.paidDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedInvoice.customer.name}
                      onChange={(e) => setEditedInvoice({
                        ...editedInvoice,
                        customer: { ...editedInvoice.customer, name: e.target.value }
                      })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.customer.name}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedInvoice.customer.email}
                      onChange={(e) => setEditedInvoice({
                        ...editedInvoice,
                        customer: { ...editedInvoice.customer, email: e.target.value }
                      })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {invoice.customer.email}
                    </p>
                  )}
                </div>
                {invoice.customer.phone && (
                  <div>
                    <Label className="text-sm text-gray-600 dark:text-gray-400">Phone</Label>
                    <p className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {invoice.customer.phone}
                    </p>
                  </div>
                )}
                {invoice.customer.address && (
                  <div className="md:col-span-2">
                    <Label className="text-sm text-gray-600 dark:text-gray-400">Address</Label>
                    <p className="text-sm text-gray-900 dark:text-white flex items-start gap-1">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span>
                        {invoice.customer.address.street}, {invoice.customer.address.city}, {invoice.customer.address.state} {invoice.customer.address.postalCode}, {invoice.customer.address.country}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Line Items
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Description</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Qty</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Unit Price</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 text-sm text-gray-900 dark:text-white">
                          {item.description}
                        </td>
                        <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                      <td colSpan={3} className="py-2 text-sm font-medium text-gray-900 dark:text-white text-right">
                        Subtotal:
                      </td>
                      <td className="py-2 text-sm font-medium text-gray-900 dark:text-white text-right">
                        {formatCurrency(invoice.subtotal)}
                      </td>
                    </tr>
                    {invoice.discountAmount > 0 && (
                      <tr>
                        <td colSpan={3} className="py-1 text-sm text-gray-600 dark:text-gray-400 text-right">
                          Discount:
                        </td>
                        <td className="py-1 text-sm text-gray-600 dark:text-gray-400 text-right">
                          -{formatCurrency(invoice.discountAmount)}
                        </td>
                      </tr>
                    )}
                    {invoice.taxAmount > 0 && (
                      <tr>
                        <td colSpan={3} className="py-1 text-sm text-gray-600 dark:text-gray-400 text-right">
                          Tax:
                        </td>
                        <td className="py-1 text-sm text-gray-600 dark:text-gray-400 text-right">
                          {formatCurrency(invoice.taxAmount)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-gray-200 dark:border-gray-700">
                      <td colSpan={3} className="py-2 text-lg font-bold text-gray-900 dark:text-white text-right">
                        Total:
                      </td>
                      <td className="py-2 text-lg font-bold text-[#d4203d] text-right">
                        {formatCurrency(invoice.totalAmount)} {invoice.currency}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes and Terms */}
            {(invoice.notes || invoice.terms || isEditing) && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Additional Information
                </h3>
                <div className="space-y-4">
                  {(invoice.notes || isEditing) && (
                    <div>
                      <Label className="text-sm text-gray-600 dark:text-gray-400">Notes</Label>
                      {isEditing ? (
                        <TextArea
                          value={editedInvoice.notes || ''}
                          onChange={(e) => setEditedInvoice({
                            ...editedInvoice,
                            notes: e.target.value
                          })}
                          rows={3}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          {invoice.notes}
                        </p>
                      )}
                    </div>
                  )}
                  {(invoice.terms || isEditing) && (
                    <div>
                      <Label className="text-sm text-gray-600 dark:text-gray-400">Terms</Label>
                      {isEditing ? (
                        <TextArea
                          value={editedInvoice.terms || ''}
                          onChange={(e) => setEditedInvoice({
                            ...editedInvoice,
                            terms: e.target.value
                          })}
                          rows={3}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          {invoice.terms}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {isEditing ? (
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full bg-[#d4203d] hover:bg-[#b91c3c] text-white flex items-center gap-2"
                  >
                    {updateInvoiceMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                ) : (
                  <>
                    {invoice.status === 'draft' && (
                      <Button
                        onClick={handleSendInvoice}
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                      >
                        {sendInvoiceMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Send Invoice
                      </Button>
                    )}
                    
                    {['pending', 'sent', 'viewed', 'overdue'].includes(invoice.status) && (
                      <Button
                        onClick={() => setShowPaymentForm(true)}
                        disabled={isLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        Record Payment
                      </Button>
                    )}
                    
                    {['paid', 'partially_paid'].includes(invoice.status) && (
                      <Button
                        onClick={() => setShowRefundForm(true)}
                        disabled={isLoading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Process Refund
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Status Actions */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Status Actions
              </h3>
              <div className="space-y-2">
                {invoice.status !== 'paid' && (
                  <Button
                    onClick={() => handleStatusUpdate('paid')}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    Mark as Paid
                  </Button>
                )}
                {invoice.status !== 'cancelled' && (
                  <Button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    Cancel Invoice
                  </Button>
                )}
                {invoice.status === 'draft' && (
                  <Button
                    onClick={() => handleStatusUpdate('pending')}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    Mark as Pending
                  </Button>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </h3>
              <Button
                onClick={handleDelete}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="w-full border-red-300 text-red-700 hover:bg-red-100 flex items-center gap-2"
              >
                {deleteInvoiceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Invoice
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Record Payment
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Payment Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Outstanding: {formatCurrency(invoice.totalAmount)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setPaymentAmount('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRecordPayment}
                    disabled={recordPaymentMutation.isPending}
                    className="bg-[#d4203d] hover:bg-[#b91c3c] text-white"
                  >
                    {recordPaymentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Record Payment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refund Form Modal */}
        {showRefundForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Process Refund
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Refund Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: {formatCurrency(invoice.totalAmount)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRefundForm(false);
                      setRefundAmount('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProcessRefund}
                    disabled={processRefundMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {processRefundMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Process Refund
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}