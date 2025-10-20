import React from "react";
import { Transaction } from "@/types/partner-profile";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { formatCoworsId, isValidCoworsId, getIdType } from '@/utils/formatters';

interface PartnerTransactionsProps {
  partnerId: string;
}

export default function PartnerTransactions({ partnerId }: PartnerTransactionsProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _partnerId = partnerId; // Used to suppress eslint warning, will be used in actual implementation
  const transactions: Transaction[] = [
    {
      id: "TXN-2024-001",
      type: "payment",
      description: "Third Wave Coffee - Day Pass Booking",
      amount: "1020.00",
      date: "2024-01-15",
      method: "bank_transfer",
      status: "completed",
      reference: "BK-2024-001"
    },
    {
      id: "TXN-2024-002",
      type: "payout",
      description: "Monthly Earnings Payout - Third Wave Coffee",
      amount: "8450.00",
      date: "2024-01-12",
      method: "bank_transfer",
      status: "completed",
      reference: "PAY-2024-001"
    },
    {
      id: "TXN-2024-003",
      type: "payment",
      description: "Third Wave Coffee - 6 Hour Pass Booking",
      amount: "765.00",
      date: "2024-01-10",
      method: "wallet",
      status: "pending",
      reference: "BK-2024-002"
    },
    {
      id: "TXN-2024-004",
      type: "fee",
      description: "Platform Service Fee",
      amount: "-150.00",
      date: "2024-01-08",
      method: "wallet",
      status: "completed"
    },
    {
      id: "TXN-2024-005",
      type: "payment",
      description: "Third Wave Coffee - Weekend Pass Booking",
      amount: "1700.00",
      date: "2024-01-05",
      method: "bank_transfer",
      status: "failed",
      reference: "BK-2024-005"
    }
  ];



  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payment":
        return "💰";
      case "payout":
        return "💸";
      case "fee":
        return "📋";
      case "commission":
        return "💼";
      case "refund":
        return "↩️";
      default:
        return "💳";
    }
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 shadow-sm sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Transactions
          </h3>
          <p className="text-sm text-gray-500">
            Earnings, payouts and financial activities
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
                Type &amp; Description
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
                          transaction.type === "payment" || transaction.type === "commission"
                            ? "success"
                            : transaction.type === "payout"
                            ? "info"
                            : transaction.type === "fee"
                            ? "warning"
                            : "error"
                        }
                      >
                        {getTypeIcon(transaction.type)} {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-gray-800 text-theme-sm">
                      {transaction.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <span className={`font-semibold text-theme-sm ${
                    parseFloat(transaction.amount) > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    ₹{Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm">
                  {transaction.date}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm">
                  {transaction.method}
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