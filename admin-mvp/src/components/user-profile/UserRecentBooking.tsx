"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { formatCoworsId, isValidCoworsId } from "@/utils/formatters";
import { getIdType, formatBookingId } from "@/utils/formatters";
import { AlertTriangle } from "lucide-react";

import { Booking, UserProfileComponentProps } from "@/types/user-profile";
import { useUserBookings } from '@/hooks/useUserBookings';

interface UserRecentBookingProps extends UserProfileComponentProps {
  userId: string;
}

const UserRecentBooking: React.FC<UserRecentBookingProps> = ({ userId }) => {
  const { data: bookingsData, isLoading, error } = useUserBookings({ 
    userId, 
    limit: 5, 
    sortBy: 'createdAt', 
    sortOrder: 'desc' 
  });

  const bookings = bookingsData?.data || [];

  // Map API booking data to component format
  const mapApiBookingToComponent = (apiBooking: any): Booking => {
    return {
      id: apiBooking.id,
      service: apiBooking.space?.name || apiBooking.spaceType || 'Unknown Service',
      partner: apiBooking.space?.partner?.name || 'Unknown Partner',
      date: apiBooking.startDate || apiBooking.createdAt,
      amount: `₹${(apiBooking.totalAmount || 0).toLocaleString('en-IN')}`,
      status: apiBooking.status?.toLowerCase() || 'pending',
      duration: apiBooking.duration ? `${apiBooking.duration} hours` : 'N/A',
      location: apiBooking.space?.location || apiBooking.location || 'N/A'
    };
  };

  const mappedBookings = bookings.map(mapApiBookingToComponent);

  if (isLoading) {
    return (
      <div className="bg-white p-5 border border-gray-200 rounded-2xl lg:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-28 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-5 border border-gray-200 rounded-2xl lg:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-800">
            Recent Bookings
          </h4>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 text-sm">Failed to load bookings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 border border-gray-200 rounded-2xl lg:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-800">
          Recent Bookings
        </h4>
        <span className="text-sm text-gray-500">
          {mappedBookings.length} recent bookings
        </span>
      </div>
      
      {mappedBookings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No bookings found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="block lg:hidden space-y-4">
            {mappedBookings.map((booking) => (
          <div key={booking.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-800 text-sm">
                    {formatBookingId(booking.id)}
                  </span>
                  {getIdType(booking.id) === 'uuid' && (
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(booking.date).toLocaleDateString()}
                </p>
              </div>
              <Badge
                size="sm"
                color={
                  booking.status === "completed"
                    ? "success"
                    : booking.status === "pending"
                    ? "warning"
                    : booking.status === "confirmed"
                    ? "info"
                    : "error"
                }
              >
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
            <div className="space-y-2">
              <div>
                <span className="block font-medium text-gray-800 text-sm">
                  {booking.service}
                </span>
                {booking.location && (
                  <span className="block text-gray-500 text-xs">
                    {booking.location}
                  </span>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Partner:</span>
                <span className="text-gray-800">{booking.partner}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration:</span>
                <span className="text-gray-800">{booking.duration || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-500">Amount:</span>
                <span className="text-gray-800">{booking.amount}</span>
              </div>
            </div>
          </div>
            ))}
          </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <div className="w-full overflow-x-auto">
          <Table>
              {/* Table Header */}
              <TableHeader className="border-b border-gray-100">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-2 py-3 font-medium text-gray-500 text-start text-xs"
                  >
                    Booking ID
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-3 font-medium text-gray-500 text-start text-xs"
                  >
                    Service
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-3 font-medium text-gray-500 text-start text-xs"
                  >
                    Partner
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-3 font-medium text-gray-500 text-start text-xs"
                  >
                    Date
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-3 font-medium text-gray-500 text-start text-xs"
                  >
                    Duration
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-3 font-medium text-gray-500 text-start text-xs"
                  >
                    Amount
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-3 font-medium text-gray-500 text-start text-xs"
                  >
                    Status
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100">
                {mappedBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="px-2 py-3 text-start max-w-[100px]">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-800 text-sm truncate block">
                          {formatBookingId(booking.id)}
                        </span>
                        {getIdType(booking.id) === 'uuid' && (
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-3 text-start max-w-[120px]">
                      <div className="min-w-0">
                        <span className="block font-medium text-gray-800 text-sm truncate">
                          {booking.service}
                        </span>
                        {booking.location && (
                          <span className="block text-gray-500 text-xs truncate">
                            {booking.location}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-3 text-start max-w-[100px]">
                      <span className="text-gray-800 text-sm truncate block">
                        {booking.partner}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-3 text-gray-500 text-start text-sm max-w-[80px]">
                      <span className="truncate block">
                        {new Date(booking.date).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-3 text-gray-500 text-start text-sm max-w-[70px]">
                      <span className="truncate block">
                        {booking.duration || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-3 text-gray-800 font-medium text-start text-sm max-w-[80px]">
                      <span className="truncate block">
                        {booking.amount}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-3 text-start max-w-[90px]">
                      <Badge
                        size="sm"
                        color={
                          booking.status === "completed"
                            ? "success"
                            : booking.status === "pending"
                            ? "warning"
                            : booking.status === "confirmed"
                            ? "info"
                            : "error"
                        }
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
          </Table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default UserRecentBooking;