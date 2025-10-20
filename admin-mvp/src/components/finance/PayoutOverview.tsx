"use client";
import React from "react";
import { CheckCircleIcon, TimeIcon } from "@/icons";
import { Building2, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import Badge from "../ui/badge/Badge";
import { formatCoworsId, isValidCoworsId, getIdType } from "@/utils/formatters";

interface PayoutData {
  id: string;
  partnerName: string;
  amount: string;
  status: "pending" | "processing" | "completed" | "failed";
  dueDate: string;
  bookingsCount: number;
}

const PayoutOverview: React.FC = () => {
  const pendingPayouts: PayoutData[] = [
    {
      id: "PO001",
      partnerName: "WorkSpace Co.",
      amount: "₹45,750",
      status: "pending",
      dueDate: "2024-01-20",
      bookingsCount: 12
    },
    {
      id: "PO002",
      partnerName: "Tech Hub Solutions",
      amount: "₹32,400",
      status: "processing",
      dueDate: "2024-01-18",
      bookingsCount: 8
    },
    {
      id: "PO003",
      partnerName: "Creative Spaces Ltd.",
      amount: "₹28,900",
      status: "completed",
      dueDate: "2024-01-15",
      bookingsCount: 6
    },
    {
      id: "PO004",
      partnerName: "Business Center Pro",
      amount: "₹67,200",
      status: "pending",
      dueDate: "2024-01-22",
      bookingsCount: 18
    }
  ];

  const getStatusColor = (status: string): "success" | "warning" | "error" | "info" => {
    switch (status) {
      case "completed":
        return "success";
      case "processing":
        return "info";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      default:
        return "warning";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "processing":
        return <TrendingUp className="w-4 h-4" />;
      case "pending":
        return <TimeIcon className="w-4 h-4" />;
      case "failed":
        return <TimeIcon className="w-4 h-4" />;
      default:
        return <TimeIcon className="w-4 h-4" />;
    }
  };

  const totalPendingAmount = pendingPayouts
    .filter(payout => payout.status === "pending")
    .reduce((sum, payout) => sum + parseInt(payout.amount.replace(/[₹,]/g, "")), 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">
          Payout Management
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Partner payouts and commission distributions
        </p>
      </div>
      
      {/* Payout Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <Badge color="warning">Pending</Badge>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            ₹{totalPendingAmount.toLocaleString()}
          </p>
          <p className="text-sm text-orange-600 dark:text-orange-400">Awaiting payout</p>
        </div>
        
        <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <Badge color="info">Processing</Badge>
          </div>
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">₹32,400</p>
          <p className="text-sm text-brand-600 dark:text-brand-400">In progress</p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            <Badge color="success">Completed</Badge>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹2,84,750</p>
          <p className="text-sm text-green-600 dark:text-green-400">This month</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <Badge color="primary">Partners</Badge>
          </div>
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">47</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Active partners</p>
        </div>
      </div>
      
      {/* Payout List */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800 dark:text-white/90 mb-3">
          Recent Payouts
        </h4>
        {pendingPayouts.map((payout) => (
          <div
            key={payout.id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-700 rounded-full">
                <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white/90">
                  {payout.partnerName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {payout.bookingsCount} bookings • Due: {payout.dueDate}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 font-mono flex items-center gap-1">
                  {formatCoworsId(payout.id)}
                  {getIdType(payout.id) === 'uuid' && (
                    <span title="Legacy UUID format">
                      <AlertTriangle className="w-3 h-3 text-yellow-500" />
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-gray-800 dark:text-white/90 mb-1">
                {payout.amount}
              </p>
              <Badge color={getStatusColor(payout.status)}>
                {getStatusIcon(payout.status)}
                <span className="ml-1">{payout.status}</span>
              </Badge>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
        <button className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium text-sm transition-colors duration-200">
          Process All Pending
        </button>
        <button className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium text-sm transition-colors duration-200">
          View All Payouts
        </button>
      </div>
    </div>
  );
};

export default PayoutOverview;