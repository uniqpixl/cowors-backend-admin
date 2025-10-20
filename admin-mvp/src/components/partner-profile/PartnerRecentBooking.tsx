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
import { Booking } from "@/types/partner-profile";
import { isValidCoworsId } from "@/utils/formatters";
import { getIdType, formatBookingId } from "@/utils/formatters";
import { AlertTriangle } from "lucide-react";

interface PartnerRecentBookingProps {
  partnerId: string;
}

const PartnerRecentBooking: React.FC<PartnerRecentBookingProps> = ({ partnerId }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _partnerId = partnerId; // Used to suppress eslint warning, will be used in actual implementation
  const bookings: Booking[] = [
    {
      id: "BK-2024-001",
      service: "Day Pass",
      customer: "John Smith",
      date: "2024-01-15",
      amount: "₹1,200",
      status: "completed",
      duration: "8 hours",
      location: "Third Wave Coffee"
    },
    {
      id: "BK-2024-002",
      service: "6 Hour Pass",
      customer: "Sarah Johnson",
      date: "2024-01-10",
      amount: "₹900",
      status: "completed",
      duration: "6 hours",
      location: "Third Wave Coffee"
    },
    {
      id: "BK-2024-003",
      service: "3 Hour Pass",
      customer: "Mike Chen",
      date: "2024-01-08",
      amount: "₹600",
      status: "cancelled",
      duration: "3 hours",
      location: "Third Wave Coffee"
    },
    {
      id: "BK-2024-004",
      service: "Weekend Pass",
      customer: "Emily Davis",
      date: "2024-01-20",
      amount: "₹2,000",
      status: "pending",
      duration: "2 days",
      location: "Third Wave Coffee"
    },
    {
      id: "BK-2024-005",
      service: "Day Pass + Meal",
      customer: "David Wilson",
      date: "2024-01-25",
      amount: "₹1,500",
      status: "confirmed",
      duration: "8 hours",
      location: "Third Wave Coffee"
    }
  ];

  return (
    <div className="bg-white p-5 border border-gray-200 rounded-2xl lg:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-800">
          Recent Bookings
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
                <span className="text-gray-500">Customer:</span>
                <span className="text-gray-800">{booking.customer}</span>
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
                    Space/Service
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-3 font-medium text-gray-500 text-start text-xs"
                  >
                    Customer
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
                        {booking.customer}
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
  );
};

export default PartnerRecentBooking;