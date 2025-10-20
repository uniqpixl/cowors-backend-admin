"use client";
import React from "react";
import { IndianRupee, TrendingUp, Calendar, Users, ArrowUpIcon, ArrowDownIcon, Loader2 } from "lucide-react";
import Badge from "../ui/badge/Badge";
import { useRevenueMetrics } from '@/hooks/useAnalytics';

interface RevenueMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ReactNode;
}

const RevenueMetrics: React.FC = () => {
  const { data: metricsData, isLoading, error } = useRevenueMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <Loader2 className="h-6 w-6 animate-spin text-gray-800 dark:text-white/90" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  --
                </h4>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
        <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <p className="text-center text-gray-500 dark:text-gray-400">Failed to load revenue metrics</p>
        </div>
      </div>
    );
  }

  const revenueMetrics: RevenueMetric[] = [
    {
      id: "1",
      title: "Total Revenue",
      value: metricsData?.totalRevenue || "₹0",
      change: metricsData?.totalRevenueChange || "0%",
      changeType: metricsData?.totalRevenueChange?.startsWith("+") ? "increase" : "decrease",
      icon: <IndianRupee className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "2",
      title: "Monthly Growth",
      value: metricsData?.monthlyGrowth || "₹0",
      change: metricsData?.monthlyGrowthChange || "0%",
      changeType: metricsData?.monthlyGrowthChange?.startsWith("+") ? "increase" : "decrease",
      icon: <TrendingUp className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "3",
      title: "Booking Revenue",
      value: metricsData?.bookingRevenue || "₹0",
      change: metricsData?.bookingRevenueChange || "0%",
      changeType: metricsData?.bookingRevenueChange?.startsWith("+") ? "increase" : "decrease",
      icon: <Calendar className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "4",
      title: "Partner Revenue",
      value: metricsData?.partnerRevenue || "₹0",
      change: metricsData?.partnerRevenueChange || "0%",
      changeType: metricsData?.partnerRevenueChange?.startsWith("+") ? "increase" : "decrease",
      icon: <Users className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "5",
      title: "Average Deal Size",
      value: metricsData?.averageDealSize || "₹0",
      change: metricsData?.averageDealSizeChange || "0%",
      changeType: metricsData?.averageDealSizeChange?.startsWith("+") ? "increase" : "decrease",
      icon: <IndianRupee className="text-gray-800 size-6 dark:text-white/90" />
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
      {revenueMetrics.map((metric) => (
        <div
          key={metric.id}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            {metric.icon}
          </div>

          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {metric.title}
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {metric.value}
              </h4>
            </div>
            <Badge color={metric.changeType === "increase" ? "success" : "error"}>
              {metric.changeType === "increase" ? (
                <ArrowUpIcon className="w-3 h-3" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 text-red-500" />
              )}
              {metric.change}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RevenueMetrics;