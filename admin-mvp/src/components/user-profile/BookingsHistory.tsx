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
import { formatCoworsId, isValidCoworsId } from '@/utils/formatters';
import { getIdType, formatBookingId } from '@/utils/formatters';

import { Booking, UserProfileComponentProps } from "@/types/user-profile";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface BookingsHistoryProps extends UserProfileComponentProps {}

const BookingsHistory: React.FC<BookingsHistoryProps> = ({}) => {
  const bookings: Booking[] = [
    {
      id: "BK-2024-001",
      service: "Private Office",
      partner: "WeWork Central",
      date: "2024-01-15",
      amount: "₹150.00",
      status: "completed",
      duration: "8 hours",
      location: "Downtown"
    },
    {
      id: "BK-2024-002",
      service: "Meeting Room B",
      partner: "TechHub Spaces",
      date: "2024-01-10",
      amount: "₹75.00",
      status: "completed",
      duration: "2 hours",
      location: "Midtown"
    },
    {
      id: "BK-2024-003",
      service: "Hot Desk",
      partner: "Innovation Center",
      date: "2024-01-08",
      amount: "₹25.00",
      status: "cancelled",
      duration: "4 hours",
      location: "Business District"
    },
    {
      id: "BK-2024-004",
      service: "Conference Room A",
      partner: "Creative Workspace",
      date: "2024-01-20",
      amount: "₹200.00",
      status: "pending",
      duration: "6 hours",
      location: "Tech Quarter"
    },
    {
      id: "BK-2024-005",
      service: "Event Space",
      partner: "Startup Hub",
      date: "2024-01-25",
      amount: "₹500.00",
      status: "confirmed",
      duration: "12 hours",
      location: "Innovation District"
    }
  ];

  return (
    <div className="bg-white p-5 border border-gray-200 rounded-2xl lg:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-800">
          Bookings History
        </h4>
        <span className="text-sm text-gray-500">
          {bookings.length} total bookings
        </span>
      </div>
      
      {/* Mobile Card Layout */}
      <div className="block lg:hidden space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-medium text-gray-800 text-sm font-mono">
                  {formatBookingId(booking.id)}
                  {getIdType(booking.id) === 'uuid' && (
                    <span className="ml-1 text-orange-500" title="Legacy UUID format">
                      ⚠️
                    </span>
                  )}
                </span>
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
      <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="w-full overflow-x-auto">
          <div className="w-full">
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
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="px-2 py-3 text-start max-w-[100px]">
                      <span className="font-medium text-gray-800 text-sm truncate block font-mono">
                        {formatBookingId(booking.id)}
                        {getIdType(booking.id) === 'uuid' && (
                          <span className="ml-1 text-orange-500" title="Legacy UUID format">
                            ⚠️
                          </span>
                        )}
                      </span>
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
      </div>
    </div>
  );
};

export default BookingsHistory;