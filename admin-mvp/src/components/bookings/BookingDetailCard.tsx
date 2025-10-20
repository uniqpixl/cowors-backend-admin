"use client";

import React from "react";
import { Calendar, MapPin, Clock, CreditCard, User, Building2, Phone, Mail } from "lucide-react";
import { useBooking } from '@/hooks/useBookings';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCoworsId, isValidCoworsId, formatDate } from '@/utils/formatters';
import { getIdType, formatBookingId } from '@/utils/formatters';

// Helper functions

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

interface BookingDetailCardProps {
  bookingId: string;
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmed' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
    completed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Completed' },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

export function BookingDetailCard({ bookingId }: BookingDetailCardProps) {
  const { data: booking, isLoading, error } = useBooking(bookingId);

  if (isLoading) {
    return (
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="p-6.5">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-6.5">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">Error loading booking details</p>
            <p className="text-sm text-body dark:text-bodydark mt-2">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-6.5">
          <div className="text-center">
            <p className="text-body dark:text-bodydark">Booking not found</p>
          </div>
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
              Booking {booking.orderNumber || formatBookingId(booking.id)}
              {!booking.orderNumber && getIdType(booking.id) === 'uuid' && (
                <span className="ml-1 text-orange-500" title="Legacy UUID format">
                  ⚠️
                </span>
              )}
            </h3>
            <p className="text-sm text-body dark:text-bodydark">
              Created on {formatDate(booking.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(booking.status)}
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              booking.paymentStatus === 'Paid' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {booking.paymentStatus === 'Paid' ? 'Paid' : 'Pending Payment'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6.5">
        {/* Booking Details Grid */}
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
                    <p className="font-semibold text-black dark:text-white">{booking.userName || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Email</p>
                    <p className="font-semibold text-black dark:text-white">{booking.userEmail || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Phone</p>
                    <p className="font-semibold text-black dark:text-white">{booking.user?.phoneNumber || 'N/A'}</p>
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
                    <p className="font-semibold text-black dark:text-white">{booking.partnerName || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Location</p>
                    <p className="font-semibold text-black dark:text-white">{booking.space?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Information */}
        <div className="mt-8">
          <div className="mb-6 border-b border-stroke pb-2 dark:border-strokedark">
            <h4 className="text-lg font-semibold text-black dark:text-white">
              Booking Information
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Date</p>
                  <p className="font-semibold text-black dark:text-white">{formatDate(booking.startTime)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Time</p>
                  <p className="font-semibold text-black dark:text-white">{new Date(booking.startTime).toLocaleTimeString()} - {new Date(booking.endTime).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Service</p>
                  <p className="font-semibold text-black dark:text-white">{booking.bookingType || booking.spaceName || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-body dark:text-bodydark mb-1">Payment</p>
                  <p className="font-semibold text-black dark:text-white">{booking.paymentMethod || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mt-8">
          <div className="mb-6 border-b border-stroke pb-2 dark:border-strokedark">
            <h4 className="text-lg font-semibold text-black dark:text-white">
              Order Summary
            </h4>
          </div>
          <div className="rounded-lg border border-stroke bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:border-strokedark dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">{booking.bookingType || booking.spaceName || 'Booking'}</span>
                <span className="font-semibold text-black dark:text-white">{formatCurrency(booking.totalAmount)}</span>
              </div>
              {booking.amenities && booking.amenities.length > 0 && (
                <div className="space-y-2">
                  {booking.amenities.map((amenity, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-l-2 border-blue-200 pl-4 dark:border-blue-700">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{amenity}</span>
                      <span className="font-semibold text-black dark:text-white">Included</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t-2 border-stroke pt-4 dark:border-strokedark">
                <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm dark:bg-boxdark">
                  <span className="text-xl font-bold text-black dark:text-white">Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(booking.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
              Booking Notes
            </h4>
            <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
              <p className="text-body dark:text-bodydark">{booking.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}