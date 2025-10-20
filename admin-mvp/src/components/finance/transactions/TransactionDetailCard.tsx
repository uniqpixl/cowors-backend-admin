"use client";

import React from "react";
import { Calendar, MapPin, Clock, CreditCard, User, Building2, Phone, Mail, Loader2, AlertTriangle } from "lucide-react";
import { useTransaction } from '@/hooks/useTransactions';
import { toast } from 'sonner';
import { formatCoworsId, isValidCoworsId, formatDate, formatBookingId, getIdType } from '@/utils/formatters';



interface TransactionDetailCardProps {
  transactionId: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};



const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
    failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

export function TransactionDetailCard({ transactionId }: TransactionDetailCardProps) {
  const { data: transaction, isLoading, error } = useTransaction(transactionId);

  if (isLoading) {
    return (
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-body dark:text-bodydark">Loading transaction details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    toast.error('Failed to load transaction details');
    return (
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-center p-20">
          <span className="text-red-500">Failed to load transaction details</span>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-center p-20">
          <span className="text-body dark:text-bodydark">Transaction not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Header */}
      <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-black dark:text-white">
              Transaction {transaction.reference || transaction.id}
            </h3>
            <p className="text-sm text-body dark:text-bodydark">
              Created on {formatDate(transaction.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(transaction.status)}
            <span className="text-xl font-bold text-black dark:text-white">
              {formatCurrency(transaction.amount)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6.5">
        {/* Transaction Details Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-black dark:text-white">
              Customer Details
            </h4>
            <div className="space-y-4">
              <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Customer</p>
                    <p className="font-semibold text-black dark:text-white">N/A</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Email</p>
                    <p className="font-semibold text-black dark:text-white">N/A</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Customer ID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-black dark:text-white">
                        {formatCoworsId(transaction.userId)}
                      </p>
                      {getIdType(transaction.userId) === 'uuid' && (
                        <span title="Legacy UUID format">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Partner Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-black dark:text-white">
              Partner Details
            </h4>
            <div className="space-y-4">
              <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Coworking Space</p>
                    <p className="font-semibold text-black dark:text-white">N/A</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Partner ID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-black dark:text-white">
                        N/A
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Information */}
        <div className="mt-8">
          <div className="mb-6 border-b border-stroke pb-2 dark:border-strokedark">
            <h4 className="text-lg font-semibold text-black dark:text-white">
              Transaction Information
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Date</p>
                  <p className="font-semibold text-black dark:text-white">{formatDate(transaction.createdAt)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Type</p>
                  <p className="font-semibold text-black dark:text-white">{transaction.type}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Category</p>
                  <p className="font-semibold text-black dark:text-white">{transaction.type}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Payment Method</p>
                  <p className="font-semibold text-black dark:text-white">N/A</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="mt-8">
          <div className="mb-6 border-b border-stroke pb-2 dark:border-strokedark">
            <h4 className="text-lg font-semibold text-black dark:text-white">
              Transaction Summary
            </h4>
          </div>
          <div className="rounded-lg border border-stroke bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:border-strokedark dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">Transaction Reference</span>
                <span className="font-semibold text-black dark:text-white">{transaction.reference || transaction.id}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">Date</span>
                <span className="font-semibold text-black dark:text-white">{formatDate(transaction.createdAt)}</span>
              </div>
              {transaction.bookingId && (
                <div className="flex justify-between items-center py-2 border-l-2 border-blue-200 pl-4 dark:border-blue-700">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Booking ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-black dark:text-white">{formatBookingId(transaction.bookingId)}</span>
                    {getIdType(transaction.bookingId) === 'uuid' && (
                      <span title="Legacy UUID format">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="border-t-2 border-stroke pt-4 dark:border-strokedark">
                <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm dark:bg-boxdark">
                  <span className="text-xl font-bold text-black dark:text-white">Amount</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(transaction.amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}