"use client";

import React from "react";

import { UserProfileComponentProps } from "@/types/user-profile";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { useUserTransactions } from "@/hooks/useUserWallet";
import { Transaction } from "@/lib/api/types";
import { Loader2 } from "lucide-react";
import { formatCoworsId, isValidCoworsId, getIdType, formatDate } from '@/utils/formatters';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UserTransactionsProps extends UserProfileComponentProps {}

export default function UserTransactions({ userId }: UserTransactionsProps) {
  const { data: transactionsData, isLoading, error } = useUserTransactions(userId, { page: 1, limit: 10 });
  
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 shadow-sm sm:px-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading transactions...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 shadow-sm sm:px-6">
        <div className="flex items-center justify-center py-8">
          <span className="text-red-500">Error loading transactions</span>
        </div>
      </div>
    );
  }
  
  const transactions = transactionsData?.transactions || [];
  
  const getPaymentMethod = (type: string) => {
    // Map transaction type to payment method for display
    switch (type) {
      case 'booking':
        return 'credit_card';
      case 'payout':
        return 'bank_transfer';
      case 'refund':
        return 'credit_card';
      case 'fee':
        return 'wallet';
      default:
        return 'wallet';
    }
  };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case "completed":
  //     case "processed":
  //       return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  //     case "pending":
  //       return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  //     case "failed":
  //       return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  //     default:
  //       return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  //   }
  // };

  // const getTypeIcon = (type: string) => {
  //   switch (type) {
  //     case "payment":
  //       return "💳";
  //     case "refund":
  //       return "↩️";
  //     case "fee":
  //       return "📋";
  //     default:
  //       return "💰";
  //   }
  // };
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 shadow-sm sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Transactions
          </h3>
          <p className="text-sm text-gray-500">
            Payment history and financial activities
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800">
            <svg
              className="stroke-current fill-white dark:fill-gray-800"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.29004 5.90393H17.7067"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.7075 14.0961H2.29085"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                fill=""
                stroke=""
                strokeWidth="1.5"
              />
              <path
                d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                fill=""
                stroke=""
                strokeWidth="1.5"
              />
            </svg>
            Filter
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800">
            Export
          </button>
        </div>
      </div>
      
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-gray-100 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs"
              >
                Transaction ID
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs"
              >
                Type & Description
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs"
              >
                Amount
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs"
              >
                Date
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs"
              >
                Method
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100">
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className="">
                <TableCell className="py-3">
                  <span className="font-medium text-gray-800 text-theme-sm font-mono">
                    {formatCoworsId(transaction.id)}
                    {getIdType(transaction.id) === 'uuid' && (
                      <span className="ml-1 text-orange-500" title="Legacy UUID format">
                        ⚠️
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        size="sm"
                        color={
                          transaction.type === "booking"
                            ? "success"
                            : transaction.type === "refund"
                            ? "info"
                            : transaction.type === "fee"
                            ? "warning"
                            : "error"
                        }
                      >
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-gray-800 text-theme-sm">
                      {transaction.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <span className={`font-semibold text-theme-sm ${
                    transaction.amount > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    {transaction.currency} {Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm">
                  {formatDate(transaction.createdAt)}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm">
                  {getPaymentMethod(transaction.type)}
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    size="sm"
                    color={
                      transaction.status === "completed"
                        ? "success"
                        : transaction.status === "pending"
                        ? "warning"
                        : "error"
                    }
                  >
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}