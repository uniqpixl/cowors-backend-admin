"use client";

import React, { useState } from "react";
import { Edit, X, RefreshCw, Download, MessageSquare, AlertTriangle } from "lucide-react";

interface BookingActionsProps {
  bookingId: string;
}

export function BookingActions({ bookingId }: BookingActionsProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const handleEdit = () => {
    // Navigate to edit page or open edit modal
    console.log(`Edit booking ${bookingId}`);
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleRefund = () => {
    setShowRefundModal(true);
  };

  const handleDownloadReceipt = () => {
    // Generate and download receipt
    console.log(`Download receipt for ${bookingId}`);
  };

  const handleSendMessage = () => {
    // Open messaging interface
    console.log(`Send message for booking ${bookingId}`);
  };

  const confirmCancel = () => {
    // API call to cancel booking
    console.log(`Cancelling booking ${bookingId}`);
    setShowCancelModal(false);
  };

  const confirmRefund = () => {
    // API call to process refund
    console.log(`Processing refund for ${bookingId}`);
    setShowRefundModal(false);
  };

  return (
    <>
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-lg dark:border-strokedark dark:bg-boxdark">
        <div className="mb-6 border-b border-stroke pb-3 dark:border-strokedark">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            Quick Actions
          </h3>
        </div>
        
        <div className="space-y-4">
          {/* Edit Booking */}
          <button
            onClick={handleEdit}
            className="group flex w-full items-center gap-4 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-100 p-4 text-red-700 transition-all duration-200 hover:from-red-100 hover:to-red-200 hover:shadow-md dark:border-red-700 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-300 dark:hover:from-red-800/40 dark:hover:to-red-700/40"
          >
            <Edit className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform dark:text-red-400" />
            <span className="font-semibold">Edit Booking</span>
          </button>

          {/* Download Receipt */}
          <button
            onClick={handleDownloadReceipt}
            className="group flex w-full items-center gap-4 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-green-100 p-4 text-green-700 transition-all duration-200 hover:from-green-100 hover:to-green-200 hover:shadow-md dark:border-green-700 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-300 dark:hover:from-green-800/40 dark:hover:to-green-700/40"
          >
            <Download className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform dark:text-green-400" />
            <span className="font-semibold">Download Receipt</span>
          </button>

          {/* Send Message */}
          <button
            onClick={handleSendMessage}
            className="group flex w-full items-center gap-4 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100 p-4 text-purple-700 transition-all duration-200 hover:from-purple-100 hover:to-purple-200 hover:shadow-md dark:border-purple-700 dark:from-purple-900/30 dark:to-purple-800/30 dark:text-purple-300 dark:hover:from-purple-800/40 dark:hover:to-purple-700/40"
          >
            <MessageSquare className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform dark:text-purple-400" />
            <span className="font-semibold">Send Message</span>
          </button>

          {/* Process Refund */}
          <button
            onClick={handleRefund}
            className="group flex w-full items-center gap-4 rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 p-4 text-orange-700 transition-all duration-200 hover:from-orange-100 hover:to-orange-200 hover:shadow-md dark:border-orange-700 dark:from-orange-900/30 dark:to-orange-800/30 dark:text-orange-300 dark:hover:from-orange-800/40 dark:hover:to-orange-700/40"
          >
            <RefreshCw className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform dark:text-orange-400" />
            <span className="font-semibold">Process Refund</span>
          </button>

          {/* Cancel Booking */}
          <button
            onClick={handleCancel}
            className="group flex w-full items-center gap-4 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-100 p-4 text-red-700 transition-all duration-200 hover:from-red-100 hover:to-red-200 hover:shadow-md dark:border-red-700 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-300 dark:hover:from-red-800/40 dark:hover:to-red-700/40"
          >
            <X className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform dark:text-red-400" />
            <span className="font-semibold">Cancel Booking</span>
          </button>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Cancel Booking
              </h3>
            </div>
            <p className="mb-6 text-body dark:text-bodydark">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-lg border border-stroke px-4 py-2 text-black transition-colors hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
            <div className="mb-4 flex items-center gap-3">
              <RefreshCw className="h-6 w-6 text-meta-6" />
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Process Refund
              </h3>
            </div>
            <p className="mb-6 text-body dark:text-bodydark">
              Are you sure you want to process a refund for this booking? The amount will be refunded to the customer&apos;s original payment method.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 rounded-lg border border-stroke px-4 py-2 text-black transition-colors hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
              >
                Cancel
              </button>
              <button
                onClick={confirmRefund}
                className="flex-1 rounded-lg bg-meta-6 px-4 py-2 text-white transition-colors hover:bg-opacity-90"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}