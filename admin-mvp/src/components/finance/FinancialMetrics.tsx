"use client";
import React from "react";
import { DollarLineIcon, ArrowUpIcon, ArrowDownIcon, CalenderIcon } from "@/icons";
import { IndianRupee, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import Badge from "../ui/badge/Badge";

interface FinancialMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ReactNode;
  description: string;
}

const FinancialMetrics: React.FC = () => {
  const financialMetrics: FinancialMetric[] = [
    {
      id: "1",
      title: "Total Revenue",
      value: "₹12,84,750",
      change: "+18.2%",
      changeType: "increase",
      icon: <IndianRupee className="text-green-600 size-6 dark:text-green-400" />,
      description: "Total platform revenue this month"
    },
    {
      id: "2",
      title: "Commission Earned",
      value: "₹1,92,712",
      change: "+15.8%",
      changeType: "increase",
      icon: <DollarLineIcon className="text-success-600 size-6 dark:text-success-400" />,
      description: "Platform commission from bookings"
    },
    {
      id: "3",
      title: "Pending Payouts",
      value: "₹3,45,890",
      change: "+5.2%",
      changeType: "increase",
      icon: <Wallet className="text-orange-600 size-6 dark:text-orange-400" />,
      description: "Amount pending for partner payouts"
    },
    {
      id: "4",
      title: "Transaction Volume",
      value: "2,847",
      change: "+22.1%",
      changeType: "increase",
      icon: <TrendingUp className="text-purple-600 size-6 dark:text-purple-400" />,
      description: "Total transactions processed"
    },
    {
      id: "5",
      title: "Average Transaction",
      value: "₹4,512",
      change: "-2.3%",
      changeType: "decrease",
      icon: <CalenderIcon className="text-gray-600 size-6 dark:text-gray-400" />,
      description: "Average transaction amount"
    },
    {
      id: "6",
      title: "Failed Transactions",
      value: "47",
      change: "-12.5%",
      changeType: "decrease",
      icon: <TrendingDown className="text-red-600 size-6 dark:text-red-400" />,
      description: "Failed payment attempts"
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {financialMetrics.map((metric) => (
        <div
          key={metric.id}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              {metric.icon}
            </div>
            <Badge color={metric.changeType === "increase" ? "success" : "error"}>
              {metric.changeType === "increase" ? (
                <ArrowUpIcon className="w-3 h-3" />
              ) : (
                <ArrowDownIcon className="w-3 h-3" />
              )}
              {metric.change}
            </Badge>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-800 text-lg dark:text-white/90 mb-1">
              {metric.value}
            </h4>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {metric.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {metric.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FinancialMetrics;